// 分页逻辑（纯函数，浏览器与 Node 测试共用）
// 将段落列表按每页最大字数分页，保证单个段落不被拆开
(function (global) {
  function paginate(paragraphs, charsPerPage) {
    if (!paragraphs || paragraphs.length === 0) return [[]];
    if (charsPerPage <= 0) throw new Error("charsPerPage must be positive");

    const pages = [];
    let current = [];
    let count = 0;

    for (const p of paragraphs) {
      const len = p.length;
      // 当前页已有内容且放不下这段，则先翻页（超长段落单独占一页，Demo 可接受）
      if (current.length > 0 && count + len > charsPerPage) {
        pages.push(current);
        current = [];
        count = 0;
      }
      current.push(p);
      count += len;
    }
    if (current.length > 0) pages.push(current);

    return pages;
  }

  const api = { paginate };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.Paginator = api;
})(typeof window !== "undefined" ? window : globalThis);
