// 模拟书籍数据生成器（仅 Demo 使用）
(function (global) {
  const SENTENCES = [
    "夜色像一层薄纱，缓缓笼罩了这座沉睡的小城。",
    "他站在窗前，望着远处若隐若现的灯火，心里泛起一阵说不清的滋味。",
    "风从巷口吹来，带着初秋特有的凉意，也带着桂花若有若无的香气。",
    "她把信折好，放进抽屉最深处，仿佛这样就能把那段时光一并收起来。",
    "雨下了整整一夜，清晨的街道湿漉漉的，映着灰白的天空。",
    "老人眯起眼睛，慢慢地讲起那个流传了很久的故事。",
    "火车穿过隧道的时候，车厢里短暂地暗了下来，孩子们的惊呼声此起彼伏。",
    "他忽然明白，有些路一旦走上，就再也没有回头的余地了。",
    "桌上的茶已经凉透，两个人的对话却才刚刚开始。",
    "山间的雾气渐渐散去，露出层层叠叠的梯田，像大地的指纹。",
    "那一刻，所有的委屈和疲惫都化作了一声轻轻的叹息。",
    "远处的钟声敲了六下，惊起一群归巢的鸽子。",
    "她笑着说没关系，可眼角的泪光出卖了她。",
    "老屋的门轴发出吱呀一声，仿佛在迎接久别的主人。",
    "他数着台阶，一级一级，像在数着过去的日子。",
    "月光洒在河面上，碎成一片晃动的银鳞。",
    "也许人生就是这样，一边告别，一边相遇。",
    "少年攥紧了拳头，在心里默默立下了誓言。",
    "巷子深处传来二胡的声音，如泣如诉。",
    "她翻开泛黄的相册，指尖停在那张黑白照片上。"
  ];

  function randomInt(max) { return Math.floor(Math.random() * max); }

  function makeParagraph() {
    const count = 2 + randomInt(4); // 每段 2~5 句
    const parts = [];
    for (let i = 0; i < count; i++) {
      parts.push(SENTENCES[randomInt(SENTENCES.length)]);
    }
    return parts.join("");
  }

  function makeBook(title, chapterCount) {
    const paragraphs = [];
    for (let c = 1; c <= chapterCount; c++) {
      paragraphs.push(`第${c}章`);
      const n = 8 + randomInt(6); // 每章 8~13 段
      for (let i = 0; i < n; i++) paragraphs.push(makeParagraph());
    }
    return { title, paragraphs };
  }

  // Demo 里「导入」按钮可依次添加的模拟书
  const SAMPLE_BOOKS = [
    { title: "山城旧事", chapterCount: 12 },
    { title: "长夜灯影", chapterCount: 10 },
    { title: "南风吹过小巷", chapterCount: 14 }
  ];

  const api = { makeBook, SAMPLE_BOOKS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.MockData = api;
})(typeof window !== "undefined" ? window : globalThis);
