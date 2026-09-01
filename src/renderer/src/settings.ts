/**
 * 阅读设置：字号档位（3 档：小/中/大）、每页字数映射与设置的读写。
 * 换主题不换行宽，翻页结果不受字号以外的设置影响。
 */

import type { ReaderSettings, Theme } from '../../shared/types'
import { getSetting, setSetting } from './db'

export const FONT_SIZES = [16, 18, 20] as const

export const DEFAULT_FONT_INDEX = 1

/** 字号 16px 时每页约 440 字，保证一屏内显示完 */
export const BASE_CHARS_PER_PAGE = 440

export const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'day',
  fontIndex: DEFAULT_FONT_INDEX
}

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

/** 启动时读取全局设置（字号档位、主题） */
export async function loadSettings(): Promise<ReaderSettings> {
  return {
    theme: await getSetting<Theme>('theme', DEFAULT_SETTINGS.theme),
    fontIndex: await getSetting('fontIndex', DEFAULT_SETTINGS.fontIndex)
  }
}

export async function saveTheme(theme: Theme): Promise<void> {
  await setSetting('theme', theme)
}

export async function saveFontIndex(fontIndex: number): Promise<void> {
  await setSetting('fontIndex', fontIndex)
}
