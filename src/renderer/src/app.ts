import './style.css'

// 脚手架阶段：先保证窗口可以启动并显示书架骨架，后续逐步接入存储与阅读器
function main(): void {
  const importBtn = document.getElementById('import-btn')
  importBtn?.addEventListener('click', () => {
    window.alert('导入功能开发中')
  })
}

document.addEventListener('DOMContentLoaded', main)
