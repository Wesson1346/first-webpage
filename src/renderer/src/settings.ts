/**
 * 阅读设置：字号档位（3 档：小/中/大）与每页字数的映射。
 * 换主题不换行宽，翻页结果不受字号以外的设置影响。
 */

export const FONT_SIZES = [16, 18, 20] as const

export const DEFAULT_FONT_INDEX = 1

/** 字号 16px 时每页约 440 字，保证一屏内显示完 */
export const BASE_CHARS_PER_PAGE = 440

export function charsPerPageFor(fontIndex: number): number {
  const i = Math.min(FONT_SIZES.length - 1, Math.max(0, Math.round(fontIndex)))
  const size = FONT_SIZES[i]
  return Math.round((BASE_CHARS_PER_PAGE * 16 * 16) / (size * size))
}

/** A- / A+ 循环切换字号档位 */
export function nextFontIndex(current: number, delta: number): number {
  const n = FONT_SIZES.length
  return (((current + delta) % n) + n) % n
}
