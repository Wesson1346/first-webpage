# TXT 阅读器

一个轻量的**桌面端 TXT 电子书阅读器**（Electron）。无需注册、无需联网，导入本地 TXT 文件即可舒适地阅读，关闭后再次打开能接着上次的进度继续读。

一句话描述：**能导入一本书，能舒服地读完它，下次打开接着读。**

## 功能（MVP）

- **导入书籍**：系统文件对话框或拖拽 `.txt` 文件进窗口，自动识别 UTF-8 / GBK 编码避免乱码
- **书架**：展示书名、阅读进度（已读 X%）、导入时间；点击进入阅读，支持删除（含确认）
- **阅读器**：分页展示正文；键盘 ←/→、点击正文左右 35% 区域、底部上一页/下一页按钮三种翻页方式
- **进度记忆**：翻页位置 500ms 防抖自动存入 IndexedDB，重新打开自动回到上次位置
- **阅读设置**：字号 3 档（A- / A+ 循环切换，重排时按段落锚点保持位置）；日间 / 夜间主题，重启后保持

## 开发与运行

```bash
npm install        # 安装依赖
npm run dev        # 开发模式启动
npm run test       # Vitest 单元测试
npm run typecheck  # TypeScript 类型检查
npm run build      # 构建产物
npm run dist       # 打包 Windows 安装包（NSIS，输出到 release/）
```

> 打包注意：非管理员 Windows 账户首次打包时，electron-builder 解压 winCodeSign 工具包会因无法创建符号链接而失败（`Cannot create symbolic link: 客户端没有所需的特权`，包内两个 macOS dylib 链接导致）。绕过办法：用 7-Zip（项目自带 `node_modules/7zip-bin/win/x64/7za.exe`）把 `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\` 下已下载的 `.7z` 手工解压到同名的 `winCodeSign-2.6.0/` 目录（忽略那两个符号链接错误），再重跑 `npm run dist` 即可。

## 技术方案

- **形态**：Electron 桌面应用（Windows 优先），electron-vite 构建，TypeScript 全进程
- **进程架构**：主进程只做原生对话框与读文件字节（IPC `book:pick` / `book:read-by-path`）；编码解码、分页、存储全部在渲染进程，保证纯逻辑可单测
- **存储**：渲染进程 IndexedDB（数据库名 `txt-reader`，books / progress / settings 三个 store）
- **编码识别**：Chromium 原生 `TextDecoder`，UTF-8 严格模式优先，失败回退 GBK
- **打包**：electron-builder，Windows NSIS 安装包

详细设计见 [docs/产品设计文档.md](docs/产品设计文档.md) 与 [docs/技术方案.md](docs/技术方案.md)。

## 目录结构

```
src/main/           主进程（窗口、IPC handlers）
src/preload/        contextBridge 暴露 window.api
src/renderer/       渲染进程（书架、阅读器、IndexedDB 封装、编码探测、分页、设置）
src/shared/         进程间共用类型
tests/              Vitest 单元测试（分页、编码、存储、进度计算）
docs/               产品设计文档与技术方案
```
