import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron'
import { readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import type { PickedBookFile } from '../shared/types'

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 720,
    minHeight: 520,
    title: 'TXT 阅读器',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 窗口标题固定，避免跟随页面 title 变化
  win.on('page-title-updated', (e) => e.preventDefault())
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  // 拖拽文件到窗口时阻止默认导航，由渲染进程走 IPC 读取
  win.webContents.on('will-navigate', (e) => e.preventDefault())

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

function isTxtPath(filePath: string): boolean {
  return /\.txt$/i.test(filePath)
}

/** 读取 TXT 原始字节，返回 { name, bytes }；编码解码留给渲染进程 */
async function readBookFile(filePath: string): Promise<PickedBookFile | null> {
  const buf = await readFile(filePath)
  const bytes = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
  return { name: basename(filePath).replace(/\.txt$/i, ''), bytes }
}

function registerIpcHandlers(): void {
  // 系统文件对话框选择 TXT；取消返回 null
  ipcMain.handle('book:pick', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      title: '选择要导入的 TXT 文件',
      filters: [{ name: '文本文档 (*.txt)', extensions: ['txt'] }],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const filePath = result.filePaths[0]
    if (!isTxtPath(filePath)) return null
    try {
      return await readBookFile(filePath)
    } catch {
      return null
    }
  })

  // 拖拽文件路径读取；非法路径或读取失败返回 null
  ipcMain.handle('book:read-by-path', async (_event, filePath: unknown) => {
    if (typeof filePath !== 'string' || !isTxtPath(filePath)) return null
    try {
      return await readBookFile(filePath)
    } catch {
      return null
    }
  })
}

app.whenReady().then(() => {
  if (app.isPackaged) Menu.setApplicationMenu(null)
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
