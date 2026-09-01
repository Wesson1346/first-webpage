import type { Encoding } from '../../shared/types'

/**
 * 编码探测与解码：UTF-8 优先（严格模式），失败回退 GBK。
 * Chromium 的 TextDecoder 原生支持 utf-8 / gbk，无需额外依赖。
 */

export interface DecodedText {
  text: string
  encoding: Encoding
}

export function decode(bytes: ArrayBuffer): DecodedText {
  let view = new Uint8Array(bytes)

  // 手工剥离 UTF-8 BOM：既避免 UTF-8 文本里残留 U+FEFF，
  // 也防止 BOM 字节被误判为无效序列而掉进 GBK 回退分支
  if (view[0] === 0xef && view[1] === 0xbb && view[2] === 0xbf) {
    view = view.subarray(3)
  }

  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(view)
    return { text, encoding: 'utf-8' }
  } catch {
    // GBK 非严格解码，个别无效字节会被替换为 U+FFFD，容忍少量乱码
    const text = new TextDecoder('gbk').decode(view)
    return { text, encoding: 'gbk' }
  }
}

/**
 * 将整本文本切分为段落：按换行（含 CRLF）逐行切分，空行不保留。
 * 行首行尾空白一并去掉，避免影响分页字数统计。
 */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}
