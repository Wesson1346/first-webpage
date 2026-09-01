/**
 * 分页纯函数：按段落为单位装页，单段不拆分（超长段落独占一页，MVP 接受）。
 * 自旧网页 Demo 的 js/paginator.js 迁移，算法保持一致。
 */

export function paginate(paragraphs: string[], charsPerPage: number): string[][] {
  if (!paragraphs || paragraphs.length === 0) return [[]]
  if (!Number.isFinite(charsPerPage) || charsPerPage <= 0) {
    throw new Error('charsPerPage must be positive')
  }

  const pages: string[][] = []
  let current: string[] = []
  let count = 0

  for (const p of paragraphs) {
    const len = p.length
    // 当前页已有内容且放不下这段，则先翻页（超长段落单独占一页）
    if (current.length > 0 && count + len > charsPerPage) {
      pages.push(current)
      current = []
      count = 0
    }
    current.push(p)
    count += len
  }
  if (current.length > 0) pages.push(current)

  return pages
}

/** 每页首段落的全局下标，用于字号变化时按段落锚点重新定位 */
export function pageStarts(pages: string[][]): number[] {
  const starts: number[] = []
  let acc = 0
  for (const page of pages) {
    starts.push(acc)
    acc += page.length
  }
  return starts
}

/** 返回包含第 paragraphIndex 个段落的页下标 */
export function findPageContaining(pages: string[][], paragraphIndex: number): number {
  if (pages.length === 0) return 0
  const starts = pageStarts(pages)
  for (let i = starts.length - 1; i >= 0; i--) {
    if (paragraphIndex >= starts[i]) return i
  }
  return 0
}
