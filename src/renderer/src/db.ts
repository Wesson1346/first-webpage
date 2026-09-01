import type { Book, Progress } from '../../shared/types'

/**
 * IndexedDB 薄封装。数据库名 txt-reader，版本 1，三个 object store：
 * - books:    keyPath id      整本书的原始字节
 * - progress: keyPath bookId  阅读进度
 * - settings: keyPath key     字号档位、主题等全局设置
 */

const DB_NAME = 'txt-reader'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('books')) {
        db.createObjectStore('books', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('progress')) {
        db.createObjectStore('progress', { keyPath: 'bookId' })
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('打开 IndexedDB 失败'))
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB 请求失败'))
  })
}

async function withStore<T>(
  name: 'books' | 'progress' | 'settings',
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T | undefined> {
  const db = await openDb()
  try {
    const tx = db.transaction(name, mode)
    const store = tx.objectStore(name)
    const request = fn(store)
    const result = request ? await requestToPromise(request) : undefined
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB 事务失败'))
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB 事务中止'))
    })
    return result
  } finally {
    db.close()
  }
}

function assertNonEmptyString(value: unknown, label: string): void {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} 必须是非空字符串`)
  }
}

// ---------- books ----------

export async function putBook(book: Book): Promise<void> {
  if (!book || typeof book !== 'object') throw new Error('book 参数无效')
  assertNonEmptyString(book.id, 'book.id')
  assertNonEmptyString(book.name, 'book.name')
  if (!(book.bytes instanceof ArrayBuffer)) throw new Error('book.bytes 必须是 ArrayBuffer')
  await withStore('books', 'readwrite', (store) => {
    store.put(book)
  })
}

export async function getBook(id: string): Promise<Book | undefined> {
  assertNonEmptyString(id, 'id')
  return (await withStore('books', 'readonly', (store) => store.get(id))) as Book | undefined
}

export async function listBooks(): Promise<Book[]> {
  return (await withStore('books', 'readonly', (store) => store.getAll())) as Book[]
}

export async function deleteBook(id: string): Promise<void> {
  assertNonEmptyString(id, 'id')
  await withStore('books', 'readwrite', (store) => {
    store.delete(id)
  })
}

// ---------- progress ----------

export async function putProgress(progress: Progress): Promise<void> {
  if (!progress || typeof progress !== 'object') throw new Error('progress 参数无效')
  assertNonEmptyString(progress.bookId, 'progress.bookId')
  if (!Number.isInteger(progress.pageIndex) || progress.pageIndex < 0) {
    throw new Error('progress.pageIndex 必须是非负整数')
  }
  await withStore('progress', 'readwrite', (store) => {
    store.put(progress)
  })
}

export async function getProgress(bookId: string): Promise<Progress | undefined> {
  assertNonEmptyString(bookId, 'bookId')
  return (await withStore('progress', 'readonly', (store) =>
    store.get(bookId)
  )) as Progress | undefined
}

export async function deleteProgress(bookId: string): Promise<void> {
  assertNonEmptyString(bookId, 'bookId')
  await withStore('progress', 'readwrite', (store) => {
    store.delete(bookId)
  })
}

// ---------- settings ----------

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  assertNonEmptyString(key, 'key')
  const record = (await withStore('settings', 'readonly', (store) =>
    store.get(key)
  )) as { key: string; value: T } | undefined
  return record === undefined ? fallback : record.value
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  assertNonEmptyString(key, 'key')
  await withStore('settings', 'readwrite', (store) => {
    store.put({ key, value })
  })
}
