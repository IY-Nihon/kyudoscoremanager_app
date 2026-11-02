// コピーの橋（src/clipboard_bridge.js）。web では新しい写し方（navigator.clipboard）を先に使い、
// 断られた・無いときだけ、見えない欄を選ぶ昔の写し方（execCommand）を試す
const test = require('node:test');
const assert = require('node:assert');
const { 写す } = require('../src/clipboard_bridge');

/** 偽の頁。execCommand の返りと、写された字・付け外しされた欄を数える */
function 偽の頁({ 写せる = true } = {}) {
  const 記 = { 写した: [], 残った欄: 0, 焦点を戻した: 0 };
  const 打っていた欄 = { focus: () => 記.焦点を戻した++ };
  const body = {
    子: [],
    appendChild(e) {
      this.子.push(e);
      e.parentNode = this;
    },
    removeChild(e) {
      this.子 = this.子.filter((x) => x !== e);
      e.parentNode = null;
    },
  };
  let 選んだ = null;
  const document = {
    body,
    activeElement: 打っていた欄,
    createElement: () => {
      const 欄 = {
        value: '',
        style: {},
        setAttribute() {},
        select() {
          選んだ = 欄;
        },
        setSelectionRange() {},
      };
      return 欄;
    },
    execCommand: (名) => {
      if (名 !== 'copy' || !写せる) return false;
      記.写した.push(選んだ && 選んだ.value);
      return true;
    },
  };
  記.残り = () => body.子.length;
  return { document, 記 };
}

function 置く(名, 値) {
  const 前 = Object.getOwnPropertyDescriptor(globalThis, 名);
  Object.defineProperty(globalThis, 名, { value: 値, configurable: true, writable: true });
  return () => (前 ? Object.defineProperty(globalThis, 名, 前) : delete globalThis[名]);
}

test('新しい写し方が通れば、昔の写し方は使わない', async () => {
  const { document, 記 } = 偽の頁();
  const 写し先 = [];
  const 戻す = [置く('document', document), 置く('navigator', { clipboard: { writeText: async (s) => 写し先.push(s) } })];
  try {
    assert.strictEqual(await 写す('https://example.com/a'), true);
    assert.deepStrictEqual(写し先, ['https://example.com/a']);
    assert.deepStrictEqual(記.写した, []);
  } finally {
    戻す.forEach((f) => f());
  }
});

test('新しい写し方が断られたら、見えない欄で写す（欄は片付け、打っていた欄へ焦点を戻す）', async () => {
  const { document, 記 } = 偽の頁();
  const 戻す = [
    置く('document', document),
    置く('navigator', { clipboard: { writeText: async () => Promise.reject(new Error('NotAllowedError')) } }),
  ];
  try {
    assert.strictEqual(await 写す('合言葉'), true);
    assert.deepStrictEqual(記.写した, ['合言葉']);
    assert.strictEqual(記.残り(), 0, '欄が残っている');
    assert.strictEqual(記.焦点を戻した, 1);
  } finally {
    戻す.forEach((f) => f());
  }
});

test('新しい写し方が無い頁（http など）でも昔の写し方を試す', async () => {
  const { document, 記 } = 偽の頁();
  const 戻す = [置く('document', document), 置く('navigator', {})];
  try {
    assert.strictEqual(await 写す('x'), true);
    assert.deepStrictEqual(記.写した, ['x']);
  } finally {
    戻す.forEach((f) => f());
  }
});

test('昔の写し方も写せなければ false（呼ぶ側が「長押しで選んで」と案内する）', async () => {
  const { document, 記 } = 偽の頁({ 写せる: false });
  const 戻す = [
    置く('document', document),
    置く('navigator', { clipboard: { writeText: async () => Promise.reject(new Error('x')) } }),
  ];
  try {
    assert.strictEqual(await 写す('x'), false);
    assert.strictEqual(記.残り(), 0);
  } finally {
    戻す.forEach((f) => f());
  }
});

test('空の字は写さない', async () => {
  assert.strictEqual(await 写す(''), false);
  assert.strictEqual(await 写す(null), false);
});
