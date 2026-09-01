import type { Book, PickedBookFile } from '../../shared/types'
import { deleteBook, deleteProgress, getProgress, listBooks, putBook } from './db'
import { decode, splitParagraphs } from './encoding'

export function formatDate(timestamp: number): string {
  const d = new Date(timestamp)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 点击书籍进入阅读的回调，由阅读器模块注册 */
let onOpenBook: ((bookId: string) => void) | null = null

export function setOnOpenBook(handler: (bookId: string) => void): void {
  onOpenBook = handler
}

/**
 * 导入一本 TXT：解码编码、切分段落校验非空后入库。
 * 段落为空（无可读文本）返回 null，不写库。
 */
export async function importBookFile(file: PickedBookFile): Promise<Book | null> {
  const { text, encoding } = decode(file.bytes)
  const paragraphs = splitParagraphs(text)
  if (paragraphs.length === 0) return null

  const book: Book = {
    id: crypto.randomUUID(),
    name: file.name,
    bytes: file.bytes,
    encoding,
    importedAt: Date.now()
  }
  await putBook(book)
  return book
}

/** 导入并刷新书架；空文件时提示 */
export async function importFromFileOrAlert(file: PickedBookFile): Promise<boolean> {
  const book = await importBookFile(file)
  if (!book) {
    window.alert('这个文件没有可读的文本内容')
    return false
  }
  await renderShelf()
  return true
}

/** 删除书籍及其进度，带确认 */
async function removeBook(bookId: string, name: string): Promise<void> {
  if (!window.confirm(`确定删除《${name}》吗？删除后阅读进度也会一并清除。`)) return
  await deleteBook(bookId)
  await deleteProgress(bookId)
  await renderShelf()
}

/** 渲染书架列表：书名、阅读进度、导入时间 */
export async function renderShelf(): Promise<void> {
  const books = await listBooks()
  const list = document.getElementById('book-list')
  const emptyHint = document.getElementById('empty-hint')
  if (!list || !emptyHint) return

  list.innerHTML = ''
  emptyHint.hidden = books.length > 0

  for (const book of books) {
    const progress = await getProgress(book.id)
    const percent = progress?.percent ?? 0

    const card = document.createElement('div')
    card.className = 'book-card'
    card.dataset.bookId = book.id

    const title = document.createElement('div')
    title.className = 'book-title'
    title.textContent = book.name

    const bar = document.createElement('div')
    bar.className = 'book-progress-bar'
    const fill = document.createElement('div')
    fill.className = 'fill'
    fill.style.width = `${percent}%`
    bar.appendChild(fill)

    const meta = document.createElement('div')
    meta.className = 'book-meta'
    meta.textContent = percent > 0 ? `已读 ${percent}% · 导入于 ${formatDate(book.importedAt)}` : `未开始 · 导入于 ${formatDate(book.importedAt)}`

    const delBtn = document.createElement('button')
    delBtn.className = 'book-delete'
    delBtn.title = '删除这本书'
    delBtn.textContent = '🗑'
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      void removeBook(book.id, book.name)
    })

    card.addEventListener('click', () => onOpenBook?.(book.id))
    card.append(title, bar, meta, delBtn)
    list.appendChild(card)
  }
}
