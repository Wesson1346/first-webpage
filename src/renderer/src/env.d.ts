import type { BookApi } from '../../shared/types'

declare global {
  interface Window {
    api: BookApi
  }
}

export {}
