/**
 * Gemini が返した記録の読み取り（teams）の「マスの中身」を、端末での読み取りに差し替える。
 *
 * ■ なぜ
 * Gemini は名前と並びは読めるが、○に引かれた線の向き（○＼ と ○／）を読めない
 *（実測で25%）。端末の読み取りは本物の板で 97〜98%、紙で 100%。名前は Gemini、マスは端末。
 *
 * ■ 板（1マス2射）と紙（1マス1射）
 *   cellStyle が全部 '2射' なら板、全部 '1射' なら紙として読む。混ざっていたら Gemini のまま。
 *   紙は 1立4射のかたまりが縦に積まれた表（立数 = 射数÷4）。
 *
 * ■ 写真が2枚以上のとき
 *   Gemini は写真をまとめて1つの teams にする。どの板がどの写真かは返らないので、
 *   写真の順に teams を前から割り当てる（指示文で「1枚目の続きが2枚目」と決めている）。
 *   写真ごとに、板を1枚・2枚…と増やしながら読んでみて、列の数が合った割り当てを取る。
 *   最後の写真は残りの板を全部受け持つ。合う割り当てが無ければ Gemini のまま。
 *
 * ■ 差し替えない場合（Gemini のまま）
 *   ・板ごとの列の数が、Gemini の行の数と合わない
 *   ・格子が立たない、表が見つからない、その他の失敗
 * どれも黙って Gemini のまま進む。返り値の 読み取り元 で分かる。
 */
import { 板の印を読む, 紙の印を読む, 大前から並べる } from './yomu.js';

/**
 * @param {object[]} teams Gemini の返した teams（rows[].cells を持つ）
 * @param {{base64:string}[]} images
 * @param {{向き:string, 道具:{画を読む:Function, 回す:Function}, 重み:object, 紙の重み?:object}} 設定
 *   重み … 板の網（omomi-chiisai.json）、紙の重み … 紙の網（kami-omomi.json）
 *   行数（板）と立数（紙）は Gemini の cells の数から決める。設定の射数には縛らない
 *  （射数は写真に合わせる決まり。8射の設定で20射の板を撮ることがある）
 * @returns {Promise<{teams:object[], 読み取り元:'端末'|'AI', 訳?:string}>}
 */
export async function マスを端末で差し替える(teams, images, 設定) {
  const そのまま = (訳) => ({ teams, 読み取り元: 'AI', 訳 });
  if (!Array.isArray(teams) || !teams.length) return そのまま('板が無い');
  if (!Array.isArray(images) || !images.length) return そのまま('写真が無い');
  const 人数たち = teams.map((t) => (Array.isArray(t && t.rows) ? t.rows.length : 0));
  if (人数たち.some((n) => n < 1)) return そのまま('行が無い板がある');
  const 紙 = teams.every((t) => t && t.cellStyle === '1射');
  const 板 = teams.every((t) => !t || t.cellStyle !== '1射');
  if (!紙 && !板) return そのまま('板と紙が混ざっている');

  let 読んだ;
  try {
    読んだ = 紙 ? await 紙を読む(teams, images, 設定) : await 板を読む(teams, images, 設定);
  } catch (e) {
    return そのまま('読めなかった: ' + String((e && e.message) || e));
  }
  if (typeof 読んだ === 'string') return そのまま(読んだ);

  const 新しい = teams.map((t, i) => {
    const 列たち = 大前から並べる(読んだ[i].列たち, 設定.向き, i, teams.length);
    const 確たち = 大前から並べる(読んだ[i].確からしさ, 設定.向き, i, teams.length);
    return {
      ...t,
      cellStyle: 紙 ? '1射' : '2射',
      // 確からしさ は cells と同じ並び。確認画面で迷ったマスに色を付けるのに使う
      rows: t.rows.map((r, j) => ({ ...r, cells: 列たち[j].slice(), 確からしさ: 確たち[j].slice(), marks: undefined })),
    };
  });
  return { teams: 新しい, 読み取り元: '端末' };
}

/** rows の cells の数で、いちばん多いもの（Gemini が行ごとに数を違えても、多数に合わせる） */
function マスの数(rows) {
  const 数え = new Map();
  for (const r of rows) {
    const n = Array.isArray(r && r.cells) ? r.cells.length : 0;
    数え.set(n, (数え.get(n) || 0) + 1);
  }
  let 最多 = 0;
  let 票 = -1;
  for (const [n, c] of 数え) if (c > 票 || (c === 票 && n > 最多)) (最多 = n), (票 = c);
  return 最多;
}

/** 板。写真ごとに板を割り当てて読む。合わなければ訳の文字列を返す */
async function 板を読む(teams, images, 設定) {
  const 人数たち = teams.map((t) => t.rows.length);
  // 行数（1列のマスの数）は Gemini の cells の数から。板ごとに違えば多いほうに合わせる
  //（同じ写真の板は同じ段数のはずで、違うのは読み違え。少ないほうに合わせると
  // 下の段が落ちる）
  const 行数 = Math.max(...teams.map((t) => マスの数(t.rows)));
  if (!(行数 >= 2)) return `1列のマスの数が少なすぎる（${行数}）`;
  if (images.length > teams.length) return `写真（${images.length}枚）が板（${teams.length}枚）より多い`;

  const 出 = [];
  let 次の板 = 0;
  for (let k = 0; k < images.length; k++) {
    const 残り = teams.length - 次の板;
    const 残りの写真 = images.length - k - 1;
    const 元 = await 設定.道具.画を読む(images[k].base64);
    // この写真に何枚の板があるか。最後の写真は残り全部。それ以外は 1 枚から増やす
    //（残りの写真に 1 枚ずつは残す）。列の数が合った最初の割り当てを取る
    const 試す = 残りの写真 === 0 ? [残り] : [];
    for (let n = 1; 残りの写真 > 0 && n <= 残り - 残りの写真; n++) 試す.push(n);
    let 取れた = null;
    let 訳 = '';
    for (const n of 試す) {
      const この写真の人数 = 人数たち.slice(次の板, 次の板 + n);
      try {
        const 板たち = await 板の印を読む(元, { 板の人数たち: この写真の人数, 行数, 回す: 設定.道具.回す, 重み: 設定.重み });
        // 格子は頼まれた人数ぶんの列を必ず返すので、列の数そのものは合ってしまう。
        // 人数を当てにしない「列の見当」で、Gemini の行の数が板と違っていないかを見る
        //（違うのに人数ぶん取ると、小計の列まで射手にして印が黙ってずれる）。
        // 見当が人数より少ない＝明らかな外れの列を射手にしている。
        // 外した強い列がある＝射手の列らしいのに取っていない（人数が少なすぎる）。
        // 小計の列と薄い印の列は見分けられないので、人数より1つ多い程度の読み違えは通る
        // 行の欠け（埋まった行より下に空の行）が2つ以上＝行数が板と違う。板は下から書くので、
        // まだ書いていない行は上に固まる。1つは薄い印の行の見落としとして許す
        const 行が違う = (b) => b.格子 && b.格子.行の欠け != null && b.格子.行の欠け >= 2;
        const 合わない = (b, n) =>
          b.列たち.length !== n ||
          (b.格子 && b.格子.列の見当 != null && b.格子.列の見当 < n) ||
          (b.格子 && b.格子.外した強い列 > 0) ||
          行が違う(b);
        const 外れ = 板たち.findIndex((b, i) => 合わない(b, この写真の人数[i]));
        if (板たち.length === n && 外れ < 0) {
          取れた = 板たち;
          break;
        }
        訳 =
          外れ >= 0
            ? 行が違う(板たち[外れ])
              ? `行の数が合わない（AI${行数}段で当てはめると、埋まった行より下に空の行が${板たち[外れ].格子.行の欠け}つ）`
              : `列の数が合わない（端末${板たち[外れ].格子 ? 板たち[外れ].格子.列の見当 : 板たち[外れ].列たち.length}、AI${この写真の人数[外れ]}）`
            : '板の数が合わない';
      } catch (e) {
        訳 = String((e && e.message) || e);
      }
    }
    if (!取れた) return `${k + 1}枚目の写真: ${訳}`;
    出.push(...取れた);
    次の板 += 取れた.length;
  }
  return 出;
}

/** 紙。写真1枚に表1つ。teams が1つなら1枚目、写真と teams が同数なら順に */
async function 紙を読む(teams, images, 設定) {
  if (!設定.紙の重み) return '紙の網が無い';
  if (images.length !== teams.length) return `写真（${images.length}枚）と表（${teams.length}つ）の数が合わない`;
  const 立のマス = 4;
  const 出 = [];
  for (let k = 0; k < images.length; k++) {
    const 人数 = teams[k].rows.length;
    // 立数は Gemini の cells の数（1マス1射）から。4で割れなければ表の形が違う
    const マス数 = マスの数(teams[k].rows);
    const 立数 = マス数 / 立のマス;
    if (!Number.isInteger(立数) || 立数 < 1) return `マスの数（${マス数}）が4で割れない`;
    const 元 = await 設定.道具.画を読む(images[k].base64);
    出.push(await 紙の印を読む(元, { 人数, 立数, 立のマス, 重み: 設定.紙の重み }));
  }
  return 出;
}
