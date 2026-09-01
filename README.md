# TXT 阅读器（Demo）

一个网页版 TXT 电子书阅读器的 MVP Demo。纯前端实现，无后端、无依赖，书籍数据为模拟数据。

## 运行

直接用浏览器打开 `index.html` 即可；或起一个本地静态服务器：

```bash
npx serve .
```

## 功能

- 书架：导入模拟书籍（点击「导入书籍」依次添加 3 本 Demo 书）、展示阅读进度、删除书籍
- 阅读器：分页阅读，键盘 ←/→ 或点击正文左右两侧翻页
- 字号调整（A- / A+）、日间 / 夜间主题
- 阅读进度自动保存在浏览器 localStorage，关闭后重新打开可接着读

## 测试

```bash
node tests/paginator.test.js
```

## 目录结构

```
index.html          页面入口
css/style.css       样式（含日间/夜间主题变量）
js/app.js           界面与状态逻辑
js/paginator.js     分页纯函数（可单测）
js/mock-data.js     模拟书籍数据生成
tests/              单元测试
docs/               产品设计文档
```
