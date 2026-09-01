import { describe, expect, it } from 'vitest'
import { calcPercent } from '../src/renderer/src/progress'

describe('calcPercent', () => {
  it('第 0 页为 0%', () => {
    expect(calcPercent(0, 10)).toBe(0)
  })

  it('中间页按比例换算', () => {
    expect(calcPercent(5, 10)).toBe(50)
    expect(calcPercent(1, 3)).toBe(33)
  })

  it('末页不超过 100%', () => {
    expect(calcPercent(9, 10)).toBe(90)
    expect(calcPercent(10, 10)).toBe(100)
    expect(calcPercent(100, 10)).toBe(100)
  })

  it('边界：0 页 / 非法输入返回 0', () => {
    expect(calcPercent(0, 0)).toBe(0)
    expect(calcPercent(5, 0)).toBe(0)
    expect(calcPercent(-1, 10)).toBe(0)
    expect(calcPercent(Number.NaN, 10)).toBe(0)
  })
})
