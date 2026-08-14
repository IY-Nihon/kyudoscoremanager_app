# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tutorial.spec.mjs >> 案内：最後まで踏んでも、行き止まりも画面外もはみ出しも無い
- Location: e2e\tutorial.spec.mjs:146:1

# Error details

```
Error: 21/28：吹き出しが見つからない

expect(received).not.toBeNull()

Received: null
```

# Page snapshot

```yaml
- generic [ref=f2e1]:
  - generic [ref=f2e5]:
    - generic [ref=f2e6]:
      - generic [ref=f2e7]:
        - generic [ref=f2e11]:
          - generic [ref=f2e12]:
            - generic [ref=f2e13]:
              - generic [ref=f2e14] [cursor=pointer]: リセット
              - generic [ref=f2e16]: 
              - generic [ref=f2e18]:
                - generic [ref=f2e19]: 
                - generic [ref=f2e20]: "100005"
            - generic [ref=f2e21]:
              - generic [ref=f2e22] [cursor=pointer]:
                - generic [ref=f2e23]: 
                - generic [ref=f2e24]: ライブ
              - generic [ref=f2e25]:
                - generic [ref=f2e26] [cursor=pointer]: 
                - generic [ref=f2e28] [cursor=pointer]: 
              - generic [ref=f2e30] [cursor=pointer]: 8射
          - generic [ref=f2e33]:
            - generic [ref=f2e36]:
              - generic [ref=f2e39]:
                - generic [ref=f2e40]: 計
                - generic [ref=f2e42]: "8"
                - generic [ref=f2e44]: "7"
                - generic [ref=f2e46]: "6"
                - generic [ref=f2e48]: "5"
                - generic [ref=f2e50]: "4"
                - generic [ref=f2e52]: "3"
                - generic [ref=f2e54]: "2"
                - generic [ref=f2e56]: "1"
              - generic [ref=f2e60]:
                - generic [ref=f2e62]:
                  - generic: "0"
                  - generic [ref=f2e65]:
                    - generic [ref=f2e67] [cursor=pointer]
                    - generic [ref=f2e69] [cursor=pointer]
                    - generic [ref=f2e71] [cursor=pointer]
                    - generic [ref=f2e73] [cursor=pointer]
                    - generic [ref=f2e75] [cursor=pointer]
                    - generic [ref=f2e77] [cursor=pointer]
                    - generic [ref=f2e79] [cursor=pointer]
                    - generic [ref=f2e81] [cursor=pointer]
                - generic [ref=f2e85]:
                  - generic [ref=f2e86]:
                    - generic [ref=f2e87]:
                      - generic [ref=f2e88] [cursor=pointer]
                      - generic [ref=f2e89]: 
                    - generic [ref=f2e91] [cursor=pointer]
                  - generic [ref=f2e94] [cursor=pointer]
                  - generic [ref=f2e97] [cursor=pointer]
                  - generic [ref=f2e100] [cursor=pointer]
                  - generic [ref=f2e101]:
                    - generic [ref=f2e102]:
                      - generic [ref=f2e103] [cursor=pointer]
                      - generic [ref=f2e104]: 
                    - generic [ref=f2e106] [cursor=pointer]
                  - generic [ref=f2e109] [cursor=pointer]
                  - generic [ref=f2e112] [cursor=pointer]
                  - generic [ref=f2e115] [cursor=pointer]
            - generic [ref=f2e116]:
              - generic [ref=f2e117]: 名
              - generic [ref=f2e121]:
                - generic [ref=f2e122]: 選択
                - generic [ref=f2e125]: 
          - generic [ref=f2e128]:
            - generic [ref=f2e129]:
              - generic [ref=f2e130] [cursor=pointer]: 
              - generic: 
            - generic [ref=f2e133]:
              - generic [ref=f2e134] [cursor=pointer]:
                - generic [ref=f2e135]: 
                - generic [ref=f2e136]: 人
              - generic [ref=f2e137] [cursor=pointer]:
                - generic [ref=f2e138]: 
                - generic [ref=f2e139]: 間隔
              - generic [ref=f2e140] [cursor=pointer]:
                - generic [ref=f2e141]: Σ
                - generic [ref=f2e142]: 計
              - generic [ref=f2e143] [cursor=pointer]:
                - generic [ref=f2e144]: 
                - generic [ref=f2e145]: 画像
            - generic [ref=f2e146] [cursor=pointer]: 終了・保存
        - generic [ref=f2e152]:
          - generic [ref=f2e154]:
            - generic [ref=f2e155]: 過去の記録表
            - generic [ref=f2e157]:
              - generic [ref=f2e158] [cursor=pointer]: 編集
              - generic [ref=f2e160] [cursor=pointer]: 
          - generic [ref=f2e163]:
            - generic [ref=f2e164]: 
            - textbox [ref=f2e165]:
              - /placeholder: 日付や内容を検索（全期間対象）
          - generic [ref=f2e166]:
            - generic [ref=f2e167]:
              - generic [ref=f2e168]: タグフィルター
              - generic [ref=f2e169]:
                - generic [ref=f2e170] [cursor=pointer]: すべて含む
                - generic [ref=f2e172] [cursor=pointer]: いずれか含む
            - generic [ref=f2e175]:
              - generic [ref=f2e176] [cursor=pointer]: すべて解除
              - generic [ref=f2e178] [cursor=pointer]: 正規練習
          - generic [ref=f2e181] [cursor=pointer]:
            - generic [ref=f2e182]: 2026年度 (2026/04 - 2027/03)
            - generic [ref=f2e183]: 
          - generic [ref=f2e184]:
            - generic [ref=f2e185] [cursor=pointer]: 04月
            - generic [ref=f2e187] [cursor=pointer]: 05月
            - generic [ref=f2e189] [cursor=pointer]: 06月
            - generic [ref=f2e191] [cursor=pointer]: 07月
            - generic [ref=f2e193] [cursor=pointer]: 08月
          - generic [ref=f2e196]:
            - generic [ref=f2e198] [cursor=pointer]:
              - generic [ref=f2e199]:
                - generic [ref=f2e200]:
                  - generic [ref=f2e201]: 2026/08/12
                  - generic [ref=f2e202]: "[通常練習]"
                  - generic [ref=f2e203]: 
                - generic [ref=f2e204]: "矢数: 4本"
                - generic [ref=f2e205]: 正規練習
              - generic [ref=f2e208]:
                - generic [ref=f2e209]: 3人
                - generic [ref=f2e211]: 
            - generic [ref=f2e214] [cursor=pointer]:
              - generic [ref=f2e215]:
                - generic [ref=f2e216]:
                  - generic [ref=f2e217]: 2026/08/10
                  - generic [ref=f2e218]: "[記録会]"
                  - generic [ref=f2e219]: 
                - generic [ref=f2e220]: "矢数: 4本"
                - generic [ref=f2e221]: 正規練習
              - generic [ref=f2e224]:
                - generic [ref=f2e225]: 3人
                - generic [ref=f2e227]: 
            - generic [ref=f2e230] [cursor=pointer]:
              - generic [ref=f2e231]:
                - generic [ref=f2e232]:
                  - generic [ref=f2e233]: 2026/08/08
                  - generic [ref=f2e234]: "[通常練習]"
                  - generic [ref=f2e235]: 
                - generic [ref=f2e236]: "矢数: 4本"
                - generic [ref=f2e237]: 正規練習
              - generic [ref=f2e240]:
                - generic [ref=f2e241]: 3人
                - generic [ref=f2e243]: 
        - generic [ref=f2e247]:
          - generic [ref=f2e248]: 的中分析
          - generic [ref=f2e251]:
            - generic [ref=f2e252]:
              - generic [ref=f2e253]:
                - generic [ref=f2e254]:
                  - generic [ref=f2e255]: タグフィルター
                  - generic [ref=f2e256]:
                    - generic [ref=f2e257] [cursor=pointer]: すべて含む
                    - generic [ref=f2e259] [cursor=pointer]: いずれか含む
                - generic [ref=f2e262]:
                  - generic [ref=f2e263] [cursor=pointer]: すべて解除
                  - generic [ref=f2e265] [cursor=pointer]: 正規練習
              - generic [ref=f2e269]:
                - generic [ref=f2e270] [cursor=pointer]: 月ごと
                - generic [ref=f2e272] [cursor=pointer]: 年度
                - generic [ref=f2e274] [cursor=pointer]: 期間指定
                - generic [ref=f2e276] [cursor=pointer]: 直近30日
                - generic [ref=f2e278] [cursor=pointer]: すべて
              - generic [ref=f2e280]:
                - generic [ref=f2e281]: ランキング対象の基準 (最多比)
                - generic [ref=f2e282]:
                  - generic [ref=f2e283] [cursor=pointer]: 1/2 (50%)
                  - generic [ref=f2e285] [cursor=pointer]: 1/3 (33%)
                  - generic [ref=f2e287] [cursor=pointer]: 1/4 (25%)
                - generic [ref=f2e289]:
                  - 'textbox "例: 20" [ref=f2e290]'
                  - generic [ref=f2e291]: 射以上
                  - generic [ref=f2e292] [cursor=pointer]: 絞り込む
                - generic [ref=f2e294]: 全メンバーがランキング対象です
              - generic [ref=f2e296]:
                - generic [ref=f2e297]: "性別:"
                - generic [ref=f2e298]:
                  - generic [ref=f2e299] [cursor=pointer]: 全員
                  - generic [ref=f2e301] [cursor=pointer]: 男子
                  - generic [ref=f2e303] [cursor=pointer]: 女子
              - generic [ref=f2e306]:
                - generic [ref=f2e307]: "学年:"
                - generic [ref=f2e308]:
                  - generic [ref=f2e309] [cursor=pointer]: 全学年
                  - generic [ref=f2e311] [cursor=pointer]: 1年
                  - generic [ref=f2e313] [cursor=pointer]: 2年
                  - generic [ref=f2e315] [cursor=pointer]: 3年
                  - generic [ref=f2e317] [cursor=pointer]: 4年
              - generic [ref=f2e320]:
                - generic [ref=f2e321]: 卒業生を表示
                - generic [ref=f2e322] [cursor=pointer]: "OFF"
            - generic [ref=f2e325]:
              - generic [ref=f2e326]: 
              - textbox "メンバー名を検索..." [ref=f2e327]
            - generic [ref=f2e328]:
              - generic [ref=f2e329] [cursor=pointer]:
                - generic [ref=f2e330]:
                  - generic [ref=f2e331]: "1"
                  - generic [ref=f2e333]:
                    - generic [ref=f2e334]: 山田 太郎
                    - generic [ref=f2e335]: 51期 / 3年 / 男子
                - generic [ref=f2e336]:
                  - generic [ref=f2e337]: 75.0%
                  - generic [ref=f2e338]: 21/28
              - generic [ref=f2e339] [cursor=pointer]:
                - generic [ref=f2e340]:
                  - generic [ref=f2e341]: "2"
                  - generic [ref=f2e343]:
                    - generic [ref=f2e344]: 鈴木 花子
                    - generic [ref=f2e345]: 52期 / 2年 / 女子
                - generic [ref=f2e346]:
                  - generic [ref=f2e347]: 64.3%
                  - generic [ref=f2e348]: 18/28
              - generic [ref=f2e349] [cursor=pointer]:
                - generic [ref=f2e350]:
                  - generic [ref=f2e351]: "3"
                  - generic [ref=f2e353]:
                    - generic [ref=f2e354]: 田中 一郎
                    - generic [ref=f2e355]: 53期 / 1年 / 男子
                - generic [ref=f2e356]:
                  - generic [ref=f2e357]: 57.1%
                  - generic [ref=f2e358]: 16/28
        - generic [ref=f2e362]:
          - generic [ref=f2e363]:
            - generic [ref=f2e364]:
              - generic [ref=f2e365]: メンバー管理
              - generic [ref=f2e366]: "団体ID: 100005"
            - generic [ref=f2e368]: 
          - generic [ref=f2e371]:
            - generic [ref=f2e372]: 
            - textbox [ref=f2e373]:
              - /placeholder: メンバーを検索...
          - generic [ref=f2e377] [cursor=pointer]:
            - generic [ref=f2e378]:
              - generic [ref=f2e379]:
                - generic [ref=f2e380]: ●
                - generic [ref=f2e381]: 山田 太郎
              - generic [ref=f2e382]: 2期 / 未設定 / 1年
            - generic [ref=f2e383]:
              - generic [ref=f2e384]: 弓具未登録
              - generic [ref=f2e385]: 
      - generic [ref=f2e388]:
        - generic [ref=f2e389] [cursor=pointer]: 記録
        - generic [ref=f2e392] [cursor=pointer]: 履歴
        - generic [ref=f2e395] [cursor=pointer]: 分析
        - generic [ref=f2e398] [cursor=pointer]: メンバー
        - generic [ref=f2e401] [cursor=pointer]: 出欠
        - generic [ref=f2e404] [cursor=pointer]: 設定
    - generic [ref=f2e407]:
      - generic [ref=f2e408]: 
      - generic [ref=f2e409]: AI
    - generic:
      - generic [ref=f2e411] [cursor=pointer]
      - generic:
        - generic: 
        - generic: 見本です（実際の中身ではありません）
      - generic [ref=f2e415]:
        - generic [ref=f2e416]:
          - generic [ref=f2e417]: 22 / 27
          - generic [ref=f2e418] [cursor=pointer]: スキップ
        - generic [ref=f2e420]: 的中率の高い順に並びます
        - generic [ref=f2e421]:
          - generic [ref=f2e422]: 名前を押すと、その人の的中率の移り変わりが見られます。
          - generic [ref=f2e423]: 性別・学年やタグで絞り込めます。
        - generic [ref=f2e424]: 記録表に触ったぶんは、終わると元に戻ります
        - generic [ref=f2e425]:
          - generic [ref=f2e426] [cursor=pointer]:
            - generic [ref=f2e427]: 
            - generic [ref=f2e428]: 戻る
          - generic [active] [ref=f2e429] [cursor=pointer]: 次へ
  - iframe [ref=f2e431]:
    
```

# Test source

```ts
  56  |       (e) => e.children.length === 0 && /^\d+\s*\/\s*\d+$/.test((e.textContent || '').trim())
  57  |     );
  58  |     if (!札) return null;
  59  |     // 影だけを目印にすると、見本の画面に並ぶカードを掴んでしまう。
  60  |     // 「番号札」と「スキップ」の両方を含み、位置指定された箱を吹き出しとみなす
  61  |     let n = 札;
  62  |     for (let i = 0; i < 10 && n.parentElement; i++) {
  63  |       n = n.parentElement;
  64  |       const s = getComputedStyle(n);
  65  |       const 中身 = n.textContent || '';
  66  |       if (s.position === 'absolute' && 中身.includes('スキップ')) {
  67  |         const r = n.getBoundingClientRect();
  68  |         return { x: r.x, y: r.y, w: r.width, h: r.height };
  69  |       }
  70  |     }
  71  |     return null;
  72  |   });
  73  | }
  74  | 
  75  | /** 青い枠（指す先）の位置。無ければ null */
  76  | async function 指す先の枠(page) {
  77  |   return page.evaluate(() => {
  78  |     const 枠 = [...document.querySelectorAll('div')].find((e) => {
  79  |       const s = getComputedStyle(e);
  80  |       return (
  81  |         s.position === 'absolute' &&
  82  |         s.borderStyle === 'solid' &&
  83  |         parseFloat(s.borderTopWidth) >= 2 &&
  84  |         /rgb\(0,\s*122,\s*255\)/.test(s.borderTopColor)
  85  |       );
  86  |     });
  87  |     if (!枠) return null;
  88  |     const r = 枠.getBoundingClientRect();
  89  |     return { x: r.x, y: r.y, w: r.width, h: r.height };
  90  |   });
  91  | }
  92  | 
  93  | /** 案内の押せるところを測る */
  94  | async function 押せるところ(page) {
  95  |   return page.evaluate(() => {
  96  |     const 名 = ['スキップ', '次へ', 'とばす', '戻る', 'あとで', '続きを見る', '始める'];
  97  |     const 出 = [];
  98  |     for (const e of document.querySelectorAll('div,span')) {
  99  |       if (e.children.length) continue;
  100 |       const t = (e.textContent || '').trim();
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
> 156 |     expect(箱, `${札}：吹き出しが見つからない`).not.toBeNull();
      |                                       ^ Error: 21/28：吹き出しが見つからない
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
  201 |     expect(進めた, `${札}：先へ進む道が無い（行き止まり）`).toBe(true);
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