# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tutorial.spec.mjs >> 案内：最後まで踏んでも、行き止まりも画面外もはみ出しも無い
- Location: e2e\tutorial.spec.mjs:146:1

# Error details

```
Error: 3 / 9：先へ進む道が無い（行き止まり）

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=f1e5]:
  - generic [ref=f1e6]:
    - generic [ref=f1e7]:
      - generic [ref=f1e11]:
        - generic [ref=f1e12]:
          - generic [ref=f1e13]:
            - generic [ref=f1e14] [cursor=pointer]: リセット
            - generic [ref=f1e16]: 
            - generic [ref=f1e18]:
              - generic [ref=f1e19]: 
              - generic [ref=f1e20]: "100005"
          - generic [ref=f1e21]:
            - generic [ref=f1e22] [cursor=pointer]:
              - generic [ref=f1e23]: 
              - generic [ref=f1e24]: ライブ
            - generic [ref=f1e25]:
              - generic [ref=f1e26] [cursor=pointer]: 
              - generic [ref=f1e28] [cursor=pointer]: 
            - generic [ref=f1e30] [cursor=pointer]: 8射
        - generic [ref=f1e32]:
          - generic [ref=f1e33]:
            - generic [ref=f1e39]:
              - generic [ref=f1e40]: 計
              - generic [ref=f1e42]: "8"
              - generic [ref=f1e44]: "7"
              - generic [ref=f1e46]: "6"
              - generic [ref=f1e48]: "5"
              - generic [ref=f1e50]: "4"
              - generic [ref=f1e52]: "3"
              - generic [ref=f1e54]: "2"
              - generic [ref=f1e56]: "1"
            - generic [ref=f1e58]: 名
          - generic [ref=f1e61]:
            - generic [ref=f1e62]: 記録を始めましょう
            - generic [ref=f1e63]: 下の「人」ボタンで射手を追加
        - generic [ref=f1e64]:
          - generic [ref=f1e65]:
            - generic: 
            - generic: 
          - generic [ref=f1e68]:
            - generic [ref=f1e69] [cursor=pointer]:
              - generic [ref=f1e70]: 
              - generic [ref=f1e71]: 人
            - generic [ref=f1e72] [cursor=pointer]:
              - generic [ref=f1e73]: 
              - generic [ref=f1e74]: 間隔
            - generic [ref=f1e75] [cursor=pointer]:
              - generic [ref=f1e76]: Σ
              - generic [ref=f1e77]: 計
            - generic [ref=f1e78] [cursor=pointer]:
              - generic [ref=f1e79]: 
              - generic [ref=f1e80]: 画像
          - generic [ref=f1e81] [cursor=pointer]: 終了・保存
      - generic [ref=f1e86]:
        - generic [ref=f1e87]:
          - generic [ref=f1e88]:
            - generic [ref=f1e89]: メンバー管理
            - generic [ref=f1e90]: "団体ID: 100005"
          - generic [ref=f1e92]: 
        - generic [ref=f1e95]:
          - generic [ref=f1e96]: 
          - textbox "メンバーを検索..." [ref=f1e97]
        - generic [ref=f1e101] [cursor=pointer]:
          - generic [ref=f1e102]:
            - generic [ref=f1e103]:
              - generic [ref=f1e104]: ●
              - generic [ref=f1e105]: 山田 太郎
            - generic [ref=f1e106]: 2期 / 未設定 / 1年
          - generic [ref=f1e107]:
            - generic [ref=f1e108]: 弓具未登録
            - generic [ref=f1e109]: 
    - generic [ref=f1e112]:
      - generic [ref=f1e113] [cursor=pointer]: 記録
      - generic [ref=f1e116] [cursor=pointer]: 履歴
      - generic [ref=f1e119] [cursor=pointer]: 分析
      - generic [ref=f1e122] [cursor=pointer]: メンバー
      - generic [ref=f1e125] [cursor=pointer]: 出欠
      - generic [ref=f1e128] [cursor=pointer]: 設定
  - generic [ref=f1e131]:
    - generic [ref=f1e132]: 
    - generic [ref=f1e133]: AI
```

# Test source

```ts
  101 |       if (!名.includes(t)) continue;
  102 |       const 的 = e.closest('[role="button"]') || e.parentElement;
  103 |       const r = 的.getBoundingClientRect();
  104 |       if (r.width === 0) continue;
  105 |       出.push({ 文字: t, 幅: Math.round(r.width), 高さ: Math.round(r.height) });
  106 |     }
  107 |     return 出;
  108 |   });
  109 | }
  110 | 
  111 | /**
  112 |  * 指す先のうち、吹き出しに覆われずに残っている割合。
  113 |  *
  114 |  * 「重なりゼロ」にはできない。記録表そのものを指す手順では、指す先が画面より
  115 |  * 高く、吹き出しをどこに置いても必ず一部に重なる。
  116 |  * 大事なのは押せるぶんが残っているかなので、残った割合で見る。
  117 |  */
  118 | function 残っている割合(先, 箱) {
  119 |   if (!先 || !箱) return 1;
  120 |   const 横 = Math.max(0, Math.min(先.x + 先.w, 箱.x + 箱.w) - Math.max(先.x, 箱.x));
  121 |   const 縦 = Math.max(0, Math.min(先.y + 先.h, 箱.y + 箱.h) - Math.max(先.y, 箱.y));
  122 |   const 面積 = 先.w * 先.h;
  123 |   if (面積 <= 0) return 0;
  124 |   return 1 - (横 * 縦) / 面積;
  125 | }
  126 | 
  127 | test.beforeEach(async ({ page }) => {
  128 |   await page.goto('/');
  129 |   // すでに入っていれば、そのまま。入っていなければ団体でログインする
  130 |   const 団体ID欄 = page.getByPlaceholder('例: 123456');
  131 |   if (await 団体ID欄.isVisible().catch(() => false)) {
  132 |     await 団体ID欄.fill(団体);
  133 |     await page.locator('input[type="password"]').fill(合言葉);
  134 |     await page.getByText('ログイン', { exact: true }).click();
  135 |     await expect(page.getByText('記録を始めましょう')).toBeVisible({ timeout: 20_000 });
  136 |   }
  137 |   // 初めて使う人と同じ状態にしてから開き直す
  138 |   await page.evaluate(() => {
  139 |     localStorage.removeItem('tutorialDoneVersion');
  140 |     localStorage.removeItem('tutorialBoardSnapshot');
  141 |   });
  142 |   await page.reload();
  143 |   await expect(page.locator('text=ようこそ')).toBeVisible({ timeout: 20_000 });
  144 | });
  145 | 
  146 | test('案内：最後まで踏んでも、行き止まりも画面外もはみ出しも無い', async ({ page }) => {
  147 |   const 通った = [];
  148 | 
  149 |   for (let i = 0; i < 60; i++) {
  150 |     const 札 = await いまの手順(page);
  151 |     if (!札) break; // 終わった
  152 |     通った.push(札);
  153 | 
  154 |     const 画面 = page.viewportSize();
  155 |     const 箱 = await 吹き出しの枠(page);
  156 |     expect(箱, `${札}：吹き出しが見つからない`).not.toBeNull();
  157 | 
  158 |     // 1. 画面の外へ出ていないこと（矢所の手順で起きた不具合）
  159 |     expect(箱.y, `${札}：吹き出しが画面の上に出ている`).toBeGreaterThanOrEqual(-1);
  160 |     expect(
  161 |       箱.y + 箱.h,
  162 |       `${札}「${await 手順の題(page)}」：吹き出しが画面の下に出ている` +
  163 |         `（吹き出し y=${Math.round(箱.y)} 高さ=${Math.round(箱.h)} / 画面 ${画面.height}）`
  164 |     ).toBeLessThanOrEqual(画面.height + 1);
  165 |     expect(箱.x, `${札}：吹き出しが画面の左に出ている`).toBeGreaterThanOrEqual(-1);
  166 |     expect(箱.x + 箱.w, `${札}：吹き出しが画面の右に出ている`).toBeLessThanOrEqual(画面.width + 1);
  167 | 
  168 |     // 2. 押してもらう手順では、押せるぶんが残っていること
  169 |     const 触ってもらう = await page
  170 |       .getByText('してみましょう', { exact: false })
  171 |       .first()
  172 |       .isVisible()
  173 |       .catch(() => false);
  174 |     if (触ってもらう) {
  175 |       const 先 = await 指す先の枠(page);
  176 |       if (先) {
  177 |         const 残り = 残っている割合(先, 箱);
  178 |         expect(
  179 |           残り,
  180 |           `${札}：吹き出しが押してほしい場所をほとんど覆っている（残り ${Math.round(残り * 100)}%）`
  181 |         ).toBeGreaterThan(0.4);
  182 |       }
  183 |     }
  184 | 
  185 |     // 3. 指で押せる大きさがあること
  186 |     for (const b of await 押せるところ(page)) {
  187 |       expect(b.高さ, `${札}：「${b.文字}」が低すぎる（${b.幅}×${b.高さ}）`).toBeGreaterThanOrEqual(指の目安);
  188 |     }
  189 | 
  190 |     // 4. 先へ進む道があること（無ければ行き止まり）
  191 |     const 進む手 = ['とばす', '次へ', '続きを見る', '始める'];
  192 |     let 進めた = false;
  193 |     for (const 文字 of 進む手) {
  194 |       const b = page.getByText(文字, { exact: true }).first();
  195 |       if (await b.isVisible().catch(() => false)) {
  196 |         await b.click();
  197 |         進めた = true;
  198 |         break;
  199 |       }
  200 |     }
> 201 |     expect(進めた, `${札}：先へ進む道が無い（行き止まり）`).toBe(true);
      |                                         ^ Error: 3 / 9：先へ進む道が無い（行き止まり）
  202 |     await page.waitForTimeout(700);
  203 |   }
  204 | 
  205 |   // 途中で止まらず、最後まで行ったこと
  206 |   expect(通った.length, '案内が途中で止まっている').toBeGreaterThan(5);
  207 |   expect(await いまの手順(page), '最後まで行っても案内が消えない').toBeNull();
  208 | });
  209 | 
  210 | test('案内：終わると記録表が元に戻り、控えも残らない', async ({ page }) => {
  211 |   const 前 = await page.evaluate(() => {
  212 |     const o = JSON.parse(localStorage.getItem('archery-score-storage') || '{}');
  213 |     return ((o.state || o).archers || []).length;
  214 |   });
  215 | 
  216 |   // 最後まで飛ばす
  217 |   for (let i = 0; i < 60; i++) {
  218 |     if (!(await いまの手順(page))) break;
  219 |     const b = page.getByText('スキップ', { exact: true }).first();
  220 |     if (await b.isVisible().catch(() => false)) {
  221 |       await b.click();
  222 |       break;
  223 |     }
  224 |   }
  225 |   await page.waitForTimeout(1000);
  226 | 
  227 |   const 後 = await page.evaluate(() => {
  228 |     const o = JSON.parse(localStorage.getItem('archery-score-storage') || '{}');
  229 |     return {
  230 |       列: ((o.state || o).archers || []).length,
  231 |       控え: localStorage.getItem('tutorialBoardSnapshot'),
  232 |     };
  233 |   });
  234 |   expect(後.列, '案内で足した列が記録表に残っている').toBe(前);
  235 |   expect(後.控え, '控えが片付いていない').toBeNull();
  236 | });
  237 | 
```