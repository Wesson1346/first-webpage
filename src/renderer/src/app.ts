import './style.css'
import { bindReaderEvents, registerReaderEntry } from './reader'
import { importFromFileOrAlert, renderShelf } from './shelf'

const $ = (id: string): HTMLElement | null => document.getElementById(id)

async function importViaDialog(): Promise<void> {
  const btn = $('import-btn') as HTMLButtonElement | null
  if (!btn) return
  btn.disabled = true
  try {
    const file = await window.api.pickBook()
    if (file) await importFromFileOrAlert(file)
  } finally {
    btn.disabled = false
  }
}

/** 拖拽 TXT 进窗口导入：悬停显示遮罩提示，松开经主进程读取 */
function bindDragImport(): void {
  const showOverlay = (): void => {
    if (document.querySelector('.drop-overlay')) return
    const overlay = document.createElement('div')
    overlay.className = 'drop-overlay'
    overlay.textContent = '松开以导入 TXT 文件'
    document.body.appendChild(overlay)
  }
  const hideOverlay = (): void => document.querySelector('.drop-overlay')?.remove()

  document.addEventListener('dragover', (e) => {
    e.preventDefault()
    if (e.dataTransfer?.types.includes('Files')) showOverlay()
  })
  document.addEventListener('dragleave', (e) => {
    if (e.relatedTarget === null) hideOverlay()
  })
  document.addEventListener('drop', async (e) => {
    e.preventDefault()
    hideOverlay()
    const file = e.dataTransfer?.files[0]
    if (!file) return
    if (!/\.txt$/i.test(file.name)) {
      window.alert('目前仅支持导入 .txt 文件')
      return
    }
    const path = window.api.getPathForFile(file)
    const picked = await window.api.readBookByPath(path)
    if (picked) await importFromFileOrAlert(picked)
  })
}

async function main(): Promise<void> {
  registerReaderEntry()
  bindReaderEvents()
  $('import-btn')?.addEventListener('click', importViaDialog)
  bindDragImport()
  await renderShelf()
}

document.addEventListener('DOMContentLoaded', main)
