import { describe, expect, it } from 'vitest'
import { decode, splitParagraphs } from '../src/renderer/src/encoding'

describe('decode', () => {
  it('解码 UTF-8 字节', () => {
    const bytes = new TextEncoder().encode('你好，世界。第三章')
    const result = decode(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
    expect(result.encoding).toBe('utf-8')
    expect(result.text).toBe('你好，世界。第三章')
  })

  it('解码 GBK 字节（「你好」= C4 E3 BA C3）', () => {
    const bytes = new Uint8Array([0xc4, 0xe3, 0xba, 0xc3])
    const result = decode(bytes.buffer)
    expect(result.encoding).toBe('gbk')
    expect(result.text).toBe('你好')
  })

  it('处理 UTF-8 BOM：不残留 U+FEFF，且判定为 utf-8', () => {
    const body = new TextEncoder().encode('风雨兼程')
    const withBom = new Uint8Array(3 + body.length)
    withBom.set([0xef, 0xbb, 0xbf], 0)
    withBom.set(body, 3)
    const result = decode(withBom.buffer)
    expect(result.encoding).toBe('utf-8')
    expect(result.text).toBe('风雨兼程')
    expect(result.text.includes('\uFEFF')).toBe(false)
  })

  it('非法字节（既非有效 UTF-8 也非有效 GBK）回退 GBK 强解，不抛错', () => {
    const bytes = new Uint8Array([0xff, 0xfe, 0xff, 0xff])
    const result = decode(bytes.buffer)
    expect(result.encoding).toBe('gbk')
    expect(result.text.includes('\uFFFD')).toBe(true)
  })

  it('空字节按 UTF-8 处理，文本为空', () => {
    const result = decode(new ArrayBuffer(0))
    expect(result.encoding).toBe('utf-8')
    expect(result.text).toBe('')
  })
})

describe('splitParagraphs', () => {
  it('按 CRLF / LF / CR 切分并丢弃空行', () => {
    const text = '第一段\r\n\r\n第二段\n第三段\r第四段'
    expect(splitParagraphs(text)).toEqual(['第一段', '第二段', '第三段', '第四段'])
  })

  it('去除行首尾空白（含全角空格）', () => {
    expect(splitParagraphs('  前置空白\n后置空白  \t\n　全角空白　')).toEqual([
      '前置空白',
      '后置空白',
      '全角空白'
    ])
  })

  it('空文本返回空数组', () => {
    expect(splitParagraphs('')).toEqual([])
    expect(splitParagraphs('\n\r\n   \n')).toEqual([])
  })
})
