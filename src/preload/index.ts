import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { BookApi } from '../shared/types'

const api: BookApi = {
  pickBook: () => ipcRenderer.invoke('book:pick'),
  readBookByPath: (path: string) => ipcRenderer.invoke('book:read-by-path', path),
  // 拖拽拿到的 File 对象在渲染进程没有路径，须经主进程 webUtils 换取
  getPathForFile: (file: File) => webUtils.getPathForFile(file)
}

contextBridge.exposeInMainWorld('api', api)
