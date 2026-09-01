import type { Theme } from '../../shared/types'

/** 应用主题：切换 html 的 data-theme（CSS 变量随之切换），并同步两个主题按钮图标 */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  const icon = theme === 'night' ? '☀️' : '🌙'
  for (const id of ['theme-btn-shelf', 'theme-btn-reader']) {
    const btn = document.getElementById(id)
    if (btn) btn.textContent = icon
  }
}

export function toggleTheme(current: Theme): Theme {
  return current === 'night' ? 'day' : 'night'
}
