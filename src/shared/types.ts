export type Encoding = 'utf-8' | 'gbk'

export type Theme = 'day' | 'night'

/** 通过 IPC 从主进程取到的 TXT 文件（原始字节，编码由渲染进程解码） */
export interface PickedBookFile {
  name: string
  bytes: ArrayBuffer
}

/** 一本书：原始字节存 IndexedDB，阅读时按需解码 */
export interface Book {
  id: string
  name: string
  bytes: ArrayBuffer
  encoding: Encoding
  importedAt: number
}

/** 阅读进度，keyPath 为 bookId */
export interface Progress {
  bookId: string
  pageIndex: number
  percent: number
  updatedAt: number
}

/** 全局阅读设置（settings store 中按 key 分存） */
export interface ReaderSettings {
  theme: Theme
  fontIndex: number
}

/** preload 暴露给渲染进程的 API 契约 */
export interface BookApi {
  pickBook(): Promise<PickedBookFile | null>
  readBookByPath(path: string): Promise<PickedBookFile | null>
  getPathForFile(file: File): string
}
