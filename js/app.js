// TXT 阅读器 Demo 主逻辑
(function () {
  "use strict";

  const STORAGE_KEY = "txt-reader-demo";
  const FONT_SIZES = [16, 18, 20, 24];
  const BASE_CHARS_PER_PAGE = 440; // 字号 16px 时每页约 440 字，保证一屏内显示完

  // ---------- 状态与持久化 ----------
  const state = {
    books: [],      // [{id, title, paragraphs, addedAt}]
    progress: {},   // {bookId: pageIndex}
    settings: { theme: "day", fontIndex: 1 },
    currentBookId: null,
    pages: [],
  };

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved) return;
      state.books = saved.books || [];
      state.progress = saved.progress || {};
      if (saved.settings) Object.assign(state.settings, saved.settings);
    } catch (e) {
      console.warn("读取本地数据失败，使用初始状态", e);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      books: state.books,
      progress: state.progress,
      settings: state.settings,
    }));
  }

  // ---------- 工具 ----------
  const $ = (id) => document.getElementById(id);

  function charsPerPage() {
    const size = FONT_SIZES[state.settings.fontIndex];
    return Math.round(BASE_CHARS_PER_PAGE * (16 * 16) / (size * size));
  }

  // ---------- 主题 ----------
  function applyTheme() {
    document.body.classList.toggle("night", state.settings.theme === "night");
    const icon = state.settings.theme === "night" ? "☀️" : "🌙";
    $("theme-btn-shelf").textContent = icon;
    $("theme-btn-reader").textContent = icon;
  }

  function toggleTheme() {
    state.settings.theme = state.settings.theme === "night" ? "day" : "night";
    applyTheme();
    saveState();
  }

  // ---------- 书架 ----------
  function renderShelf() {
    const list = $("book-list");
    list.innerHTML = "";
    $("empty-hint").hidden = state.books.length > 0;

    for (const book of state.books) {
      const pages = Paginator.paginate(book.paragraphs, charsPerPage());
      const hasProgress = book.id in state.progress;
      const pageIndex = state.progress[book.id] || 0;
      const percent = hasProgress
        ? Math.min(100, Math.round(((pageIndex + 1) / pages.length) * 100))
        : 0;

      const card = document.createElement("div");
      card.className = "book-card";
      card.innerHTML = `
        <div class="book-title">${escapeHtml(book.title)}</div>
        <div class="book-progress-bar"><div class="fill" style="width:${percent}%"></div></div>
        <div class="book-meta">已读 ${percent}% · 共 ${pages.length} 页</div>
        <button class="book-delete" title="删除这本书">🗑</button>
      `;
      card.addEventListener("click", () => openReader(book.id));
      card.querySelector(".book-delete").addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm(`确定删除《${book.title}》吗？`)) {
          state.books = state.books.filter((b) => b.id !== book.id);
          delete state.progress[book.id];
          saveState();
          renderShelf();
        }
      });
      list.appendChild(card);
    }
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  let importIndex = 0;

  function importBook() {
    const btn = $("import-btn");
    if (importIndex >= MockData.SAMPLE_BOOKS.length) {
      alert("Demo 书库已全部导入完毕");
      return;
    }
    const sample = MockData.SAMPLE_BOOKS[importIndex++];
    btn.disabled = true;
    btn.textContent = "导入中…";
    // 模拟导入耗时
    setTimeout(() => {
      state.books.push({ id: "book-" + Date.now(), ...MockData.makeBook(sample.title, sample.chapterCount), addedAt: Date.now() });
      saveState();
      renderShelf();
      btn.disabled = false;
      btn.textContent = "＋ 导入书籍";
    }, 400);
  }

  // ---------- 阅读器 ----------
  function openReader(bookId) {
    const book = state.books.find((b) => b.id === bookId);
    if (!book) return;
    state.currentBookId = bookId;
    state.pages = Paginator.paginate(book.paragraphs, charsPerPage());

    $("shelf-view").hidden = true;
    $("reader-view").hidden = false;
    $("reader-title").textContent = book.title;

    const pageIndex = Math.min(state.progress[bookId] || 0, state.pages.length - 1);
    renderPage(pageIndex);
  }

  function renderPage(pageIndex) {
    pageIndex = Math.max(0, Math.min(pageIndex, state.pages.length - 1));
    state.progress[state.currentBookId] = pageIndex;

    const content = $("page-content");
    content.innerHTML = state.pages[pageIndex]
      .map((p) => p.startsWith("第") && p.endsWith("章") && p.length <= 8
        ? `<p class="chapter-title">${escapeHtml(p)}</p>`
        : `<p>${escapeHtml(p)}</p>`)
      .join("");
    content.scrollTop = 0;

    $("page-indicator").textContent = `${pageIndex + 1} / ${state.pages.length}`;
    $("prev-btn").disabled = pageIndex === 0;
    $("next-btn").disabled = pageIndex === state.pages.length - 1;

    saveState();
  }

  function currentPage() { return state.progress[state.currentBookId] || 0; }
  function nextPage() { renderPage(currentPage() + 1); }
  function prevPage() { renderPage(currentPage() - 1); }

  function backToShelf() {
    state.currentBookId = null;
    $("reader-view").hidden = true;
    $("shelf-view").hidden = false;
    renderShelf();
  }

  function changeFontSize(delta) {
    const next = state.settings.fontIndex + delta;
    if (next < 0 || next >= FONT_SIZES.length) return;
    const before = currentPage() / Math.max(1, state.pages.length); // 按比例保持在文中的位置
    state.settings.fontIndex = next;
    saveState();

    const book = state.books.find((b) => b.id === state.currentBookId);
    state.pages = Paginator.paginate(book.paragraphs, charsPerPage());
    renderPage(Math.round(before * state.pages.length));
  }

  // ---------- 事件绑定 ----------
  function bindEvents() {
    $("import-btn").addEventListener("click", importBook);
    $("back-btn").addEventListener("click", backToShelf);
    $("theme-btn-shelf").addEventListener("click", toggleTheme);
    $("theme-btn-reader").addEventListener("click", toggleTheme);

    $("prev-btn").addEventListener("click", prevPage);
    $("next-btn").addEventListener("click", nextPage);
    $("font-dec").addEventListener("click", () => changeFontSize(-1));
    $("font-inc").addEventListener("click", () => changeFontSize(1));

    // 点击正文左右两侧翻页
    $("page-content").addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
      if (x < e.currentTarget.clientWidth / 3) prevPage();
      else if (x > (e.currentTarget.clientWidth * 2) / 3) nextPage();
    });

    // 键盘翻页
    document.addEventListener("keydown", (e) => {
      if ($("reader-view").hidden) return;
      if (e.key === "ArrowLeft") prevPage();
      if (e.key === "ArrowRight") nextPage();
    });
  }

  // ---------- 启动 ----------
  loadState();
  applyTheme();
  bindEvents();
  renderShelf();
})();
