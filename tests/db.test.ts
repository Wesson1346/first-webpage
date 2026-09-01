import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  deleteBook,
  deleteProgress,
  getBook,
  getProgress,
  getSetting,
  listBooks,
  putBook,
  putProgress,
  setSetting
} from '../src/renderer/src/db'
import type { Book, Progress } from '../src/shared/types'

function makeBook(id: string, name: string): Book {
  return {
    id,
    name,
    bytes: new TextEncoder().encode('正文内容').buffer as ArrayBuffer,
    encoding: 'utf-8',
    importedAt: Date.now()
  }
}

beforeEach(() => {
  // 每个用例使用独立的内存数据库，避免互相污染
  ;(globalThis as { indexedDB: IDBFactory }).indexedDB = new IDBFactory()
})

describe('books store', () => {
  it('putBook + getBook 往返，字节内容不丢失', async () => {
    const book = makeBook('b1', '山城旧事')
    await putBook(book)
    const loaded = await getBook('b1')
    expect(loaded?.name).toBe('山城旧事')
    expect(new TextDecoder().decode(loaded?.bytes).length).toBeGreaterThan(0)
  })

  it('getBook 不存在的 id 返回 undefined', async () => {
    await expect(getBook('missing')).resolves.toBeUndefined()
  })

  it('listBooks 返回全部书籍', async () => {
    await putBook(makeBook('b1', '书一'))
    await putBook(makeBook('b2', '书二'))
    const books = await listBooks()
    expect(books).toHaveLength(2)
    expect(books.map((b) => b.name).sort()).toEqual(['书一', '书二'])
  })

  it('deleteBook 删除后不可再取到', async () => {
    await putBook(makeBook('b1', '书一'))
    await deleteBook('b1')
    await expect(getBook('b1')).resolves.toBeUndefined()
  })

  it('参数校验：空 id / 非 ArrayBuffer 字节应抛错', async () => {
    await expect(putBook(makeBook('', '无 id'))).rejects.toThrow()
    await expect(putBook({ ...makeBook('b1', '坏字节'), bytes: 'not-arraybuffer' as unknown as ArrayBuffer })).rejects.toThrow()
    await expect(getBook('')).rejects.toThrow()
    await expect(deleteBook('')).rejects.toThrow()
  })
})

describe('progress store', () => {
  it('putProgress + getProgress 往返', async () => {
    const progress: Progress = { bookId: 'b1', pageIndex: 3, percent: 30, updatedAt: 12345 }
    await putProgress(progress)
    const loaded = await getProgress('b1')
    expect(loaded).toEqual(progress)
  })

  it('getProgress 无记录返回 undefined；deleteProgress 删除生效', async () => {
    await expect(getProgress('b1')).resolves.toBeUndefined()
    await putProgress({ bookId: 'b1', pageIndex: 0, percent: 0, updatedAt: 1 })
    await deleteProgress('b1')
    await expect(getProgress('b1')).resolves.toBeUndefined()
  })

  it('参数校验：负数 pageIndex / 空 bookId 应抛错', async () => {
    await expect(putProgress({ bookId: 'b1', pageIndex: -1, percent: 0, updatedAt: 1 })).rejects.toThrow()
    await expect(putProgress({ bookId: '', pageIndex: 0, percent: 0, updatedAt: 1 })).rejects.toThrow()
    await expect(getProgress('')).rejects.toThrow()
  })
})

describe('settings store', () => {
  it('无记录时返回默认值', async () => {
    await expect(getSetting('fontIndex', 1)).resolves.toBe(1)
    await expect(getSetting('theme', 'day')).resolves.toBe('day')
  })

  it('setSetting 后可读回，且不影响其他 key', async () => {
    await setSetting('fontIndex', 2)
    await setSetting('theme', 'night')
    await expect(getSetting('fontIndex', 1)).resolves.toBe(2)
    await expect(getSetting('theme', 'day')).resolves.toBe('night')
  })

  it('覆盖写入同一个 key 取最新值', async () => {
    await setSetting('theme', 'night')
    await setSetting('theme', 'day')
    await expect(getSetting('theme', 'night')).resolves.toBe('day')
  })

  it('参数校验：空 key 应抛错', async () => {
    await expect(setSetting('', 1)).rejects.toThrow()
    await expect(getSetting('', 1)).rejects.toThrow()
  })
})
