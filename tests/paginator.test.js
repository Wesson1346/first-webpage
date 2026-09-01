// 分页逻辑单元测试：node tests/paginator.test.js
const assert = require("assert");
const { paginate } = require("../js/paginator.js");
const { makeBook, SAMPLE_BOOKS } = require("../js/mock-data.js");

// 1. 空输入返回一个空页
assert.deepStrictEqual(paginate([], 100), [[]]);
assert.deepStrictEqual(paginate(null, 100), [[]]);

// 2. 非法每页字数应报错
assert.throws(() => paginate(["a"], 0));

// 3. 段落完整性：任何一页里的段落都必须原样来自输入（不被拆开、不丢失）
const paragraphs = ["一".repeat(30), "二".repeat(30), "三".repeat(30), "四".repeat(30)];
const pages = paginate(paragraphs, 50);
const flattened = pages.flat();
assert.strictEqual(flattened.length, paragraphs.length, "段落数量不应变化");
assert.deepStrictEqual(flattened, paragraphs, "段落内容与顺序不应变化");

// 4. 单页容量约束：除超长段落外，每页累计字数不超过限制
for (const page of pages) {
  const total = page.reduce((sum, p) => sum + p.length, 0);
  if (page.length > 1) assert.ok(total <= 50, `页内字数 ${total} 超出限制 50`);
}

// 5. 超长段落单独占一页且内容完整
const long = "长".repeat(200);
const pages2 = paginate([long, "短段"], 100);
assert.strictEqual(pages2.length, 2);
assert.deepStrictEqual(pages2[0], [long]);
assert.deepStrictEqual(pages2[1], ["短段"]);

// 6. 模拟书生成：章节数正确、每章有章标题、段落非空
for (const sample of SAMPLE_BOOKS) {
  const book = makeBook(sample.title, sample.chapterCount);
  const chapterTitles = book.paragraphs.filter((p) => /^第\d+章$/.test(p));
  assert.strictEqual(chapterTitles.length, sample.chapterCount, `${sample.title} 章标题数量不符`);
  assert.ok(book.paragraphs.every((p) => p.length > 0), "不应有空段落");
}

console.log(`All paginator tests passed (${pages.length + pages2.length} pages checked).`);
