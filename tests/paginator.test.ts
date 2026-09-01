import { describe, expect, it } from 'vitest'
import { findPageContaining, pageStarts, paginate } from '../src/renderer/src/paginator'
import { charsPerPageFor, nextFontIndex } from '../src/renderer/src/settings'

describe('paginate', () => {
  it('空输入返回一个空页', () => {
    expect(paginate([], 100)).toEqual([[]])
  })

  it('非法每页字数应报错', () => {
    expect(() => paginate(['a'], 0)).toThrow()
    expect(() => paginate(['a'], -5)).toThrow()
    expect(() => paginate(['a'], Number.NaN)).toThrow()
  })

  it('段落完整性：段落在任何分页下都不被拆开、不丢失', () => {
    const paragraphs = ['一'.repeat(30), '二'.repeat(30), '三'.repeat(30), '四'.repeat(30)]
    const pages = paginate(paragraphs, 50)
    expect(pages.flat()).toEqual(paragraphs)
  })

  it('单页容量约束：除超长段落外，每页累计字数不超过限制', () => {
    const paragraphs = ['一'.repeat(30), '二'.repeat(30), '三'.repeat(30), '四'.repeat(30)]
    const pages = paginate(paragraphs, 50)
    for (const page of pages) {
      const total = page.reduce((sum, p) => sum + p.length, 0)
      if (page.length > 1) expect(total).toBeLessThanOrEqual(50)
    }
  })

  it('超长段落单独占一页且内容完整', () => {
    const long = '长'.repeat(200)
    const pages = paginate([long, '短段'], 100)
    expect(pages).toEqual([[long], ['短段']])
  })
})

describe('pageStarts / findPageContaining（段落锚点）', () => {
  const pages = [['a', 'b', 'c'], ['d'], ['e', 'f']]

  it('pageStarts 给出每页首段落的全局下标', () => {
    expect(pageStarts(pages)).toEqual([0, 3, 4])
  })

  it('findPageContaining 定位到包含指定段落的页', () => {
    expect(findPageContaining(pages, 0)).toBe(0)
    expect(findPageContaining(pages, 2)).toBe(0)
    expect(findPageContaining(pages, 3)).toBe(1)
    expect(findPageContaining(pages, 5)).toBe(2)
  })

  it('越界下标与空页回退到第 0 页', () => {
    expect(findPageContaining(pages, 99)).toBe(2)
    expect(findPageContaining([[]], 0)).toBe(0)
    expect(findPageContaining([], 0)).toBe(0)
  })
})

describe('字号档位映射', () => {
  it('charsPerPageFor 按字号平方反比换算', () => {
    expect(charsPerPageFor(0)).toBe(440) // 16px 基准
    expect(charsPerPageFor(1)).toBe(348) // 18px
    expect(charsPerPageFor(2)).toBe(282) // 20px
  })

  it('charsPerPageFor 越界档位截断到有效范围', () => {
    expect(charsPerPageFor(-1)).toBe(440)
    expect(charsPerPageFor(9)).toBe(282)
  })

  it('nextFontIndex 循环切换', () => {
    expect(nextFontIndex(0, -1)).toBe(2)
    expect(nextFontIndex(2, 1)).toBe(0)
    expect(nextFontIndex(1, 1)).toBe(2)
    expect(nextFontIndex(1, -1)).toBe(0)
  })
})
