import type { Progress } from '../../shared/types'
import { getBook, getProgress, getSetting, putProgress } from './db'
import { decode, splitParagraphs } from './encoding'
import { findPageContaining, pageStarts, paginate } from './paginator'
import { calcPercent } from './progress'
import {
  charsPerPageFor,
  DEFAULT_FONT_INDEX,
  FONT_SIZES,
  nextFontIndex,
  saveFontIndex
} from './settings'
import { renderShelf, setOnOpenBook } from './shelf'

const $ = (id: string): HTMLElement => {
  const el = document.getElementById(id)
  if (!el) throw new Error(`缺少元素 #${id}`)
  return el
}

let currentBookId: string | null = null
let currentParagraphs: string[] = []
let pages: string[][] = []
let pageStartIndices: number[] = []
let currentPageIndex = 0
let saveTimer: number | null = null

// 章标题启发式：短小的「第X章」居中加粗展示
function isChapterTitle(p: string): boolean {
  return p.startsWith('第') && p.endsWith('章') && p.length <= 8
}

function applyFontSize(): void {
  const fontIndex = Number(document.documentElement.dataset.fontIndex ?? DEFAULT_FONT_INDEX)
  $('page-content').style.fontSize = `${FONT_SIZES[fontIndex]}px`
}

function renderPage(pageIndex: number): void {
  if (!currentBookId || pages.length === 0) return
  currentPageIndex = Math.max(0, Math.min(pageIndex, pages.length - 1))

  const content = $('page-content')
  content.innerHTML = ''
  const frag = document.createDocumentFragment()
  for (const paragraph of pages[currentPageIndex]) {
    const el = document.createElement('p')
    if (isChapterTitle(paragraph)) el.className = 'chapter-title'
    el.textContent = paragraph
    frag.appendChild(el)
  }
  content.appendChild(frag)
  content.scrollTop = 0

  $('page-indicator').textContent = `${currentPageIndex + 1} / ${pages.length}`
  ;($('prev-btn') as HTMLButtonElement).disabled = currentPageIndex === 0
  ;($('next-btn') as HTMLButtonElement).disabled = currentPageIndex === pages.length - 1

  scheduleSaveProgress()
}

// ---------- 进度记忆：500ms 防抖写入 IndexedDB ----------

function scheduleSaveProgress(): void {
  if (saveTimer !== null) window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    void flushProgress()
  }, 500)
}

async function flushProgress(): Promise<void> {
  if (saveTimer !== null) {
    window.clearTimeout(saveTimer)
    saveTimer = null
  }
  if (!currentBookId || pages.length === 0) return
  const record: Progress = {
    bookId: currentBookId,
    pageIndex: currentPageIndex,
    percent: calcPercent(currentPageIndex, pages.length),
    updatedAt: Date.now()
  }
  await putProgress(record)
}

// ---------- 打开 / 关闭阅读器 ----------

export async function openReader(bookId: string): Promise<void> {
  const book = await getBook(bookId)
  if (!book) return

  currentBookId = bookId
  const { text } = decode(book.bytes)
  currentParagraphs = splitParagraphs(text)
  const fontIndex = await getSetting('fontIndex', DEFAULT_FONT_INDEX)
  document.documentElement.dataset.fontIndex = String(fontIndex)
  applyFontSize()
  pages = paginate(currentParagraphs, charsPerPageFor(fontIndex))
  pageStartIndices = pageStarts(pages)

  const saved = await getProgress(bookId)
  currentPageIndex = saved ? Math.min(saved.pageIndex, pages.length - 1) : 0

  $('shelf-view').hidden = true
  $('reader-view').hidden = false
  $('reader-title').textContent = book.name
  renderPage(currentPageIndex)
}

export async function backToShelf(): Promise<void> {
  await flushProgress()
  currentBookId = null
  currentParagraphs = []
  pages = []
  pageStartIndices = []
  $('reader-view').hidden = true
  $('shelf-view').hidden = false
  await renderShelf()
}

/**
 * 字号变化后重算分页：以当前页首段落为锚点，
 * 重排后跳转到仍包含该段落的页，阅读位置不丢。
 */
export function changeFontSize(delta: number): void {
  if (!currentBookId) return
  const current = Number(document.documentElement.dataset.fontIndex ?? DEFAULT_FONT_INDEX)
  const next = nextFontIndex(current, delta)
  document.documentElement.dataset.fontIndex = String(next)
  void saveFontIndex(next)
  applyFontSize()

  const anchor = pageStartIndices[currentPageIndex] ?? 0
  pages = paginate(currentParagraphs, charsPerPageFor(next))
  pageStartIndices = pageStarts(pages)
  renderPage(findPageContaining(pages, anchor))
}

export function isReaderVisible(): boolean {
  return !$('reader-view').hidden
}

// ---------- 事件绑定 ----------

export function bindReaderEvents(): void {
  $('back-btn').addEventListener('click', () => {
    void backToShelf()
  })
  ;($('prev-btn') as HTMLButtonElement).addEventListener('click', () => renderPage(currentPageIndex - 1))
  ;($('next-btn') as HTMLButtonElement).addEventListener('click', () => renderPage(currentPageIndex + 1))
  $('font-dec').addEventListener('click', () => changeFontSize(-1))
  $('font-inc').addEventListener('click', () => changeFontSize(1))

  // 点击正文左右 35% 区域翻页
  const content = $('page-content')
  content.addEventListener('click', (e) => {
    const rect = content.getBoundingClientRect()
    const x = e.clientX - rect.left
    if (x < rect.width * 0.35) renderPage(currentPageIndex - 1)
    else if (x > rect.width * 0.65) renderPage(currentPageIndex + 1)
  })

  // 键盘方向键翻页
  document.addEventListener('keydown', (e) => {
    if (!isReaderVisible()) return
    if (e.key === 'ArrowLeft') renderPage(currentPageIndex - 1)
    else if (e.key === 'ArrowRight') renderPage(currentPageIndex + 1)
  })
}

/** 注册阅读器入口（书架卡片点击） */
export function registerReaderEntry(): void {
  setOnOpenBook((bookId) => {
    void openReader(bookId)
  })
}
