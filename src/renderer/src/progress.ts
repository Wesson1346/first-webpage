/**
 * 阅读进度百分比换算（纯函数）。
 * 约定：percent = pageIndex / pageCount，第 0 页为 0%；
 * 无页数（空书）时为 0；越界索引截断到 [0, 100]。
 */
export function calcPercent(pageIndex: number, pageCount: number): number {
  if (!Number.isFinite(pageIndex) || !Number.isFinite(pageCount) || pageCount <= 0 || pageIndex <= 0) {
    return 0
  }
  const clamped = Math.min(pageIndex, pageCount)
  return Math.min(100, Math.round((clamped / pageCount) * 100))
}
