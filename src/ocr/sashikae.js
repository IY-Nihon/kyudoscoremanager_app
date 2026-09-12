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
 * @param {{向き:string, shotsPerRound:number, 道具:{画を読む:Function, 回す:Function}, 重み:object, 紙の重み?:object}} 設定
 *   重み … 板の網（omomi-chiisai.json）、紙の重み … 紙の網（kami-omomi.json）
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
    return {
      ...t,
      cellStyle: 紙 ? '1射' : '2射',
      rows: t.rows.map((r, j) => ({ ...r, cells: 列たち[j].slice(), marks: undefined })),
    };
  });
  return { teams: 新しい, 読み取り元: '端末' };
}

/** 板。写真ごとに板を割り当てて読む。合わなければ訳の文字列を返す */
async function 板を読む(teams, images, 設定) {
  const 人数たち = teams.map((t) => t.rows.length);
  const 行数 = Math.round(設定.shotsPerRound / 2);
  if (行数 < 2) return '射数が少なすぎる';
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
        const 外れ = 板たち.findIndex((b, i) => b.列たち.length !== この写真の人数[i]);
        if (板たち.length === n && 外れ < 0) {
          取れた = 板たち;
          break;
        }
        訳 = 外れ >= 0 ? `列の数が合わない（端末${板たち[外れ].列たち.length}、AI${この写真の人数[外れ]}）` : '板の数が合わない';
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
  const 立数 = 設定.shotsPerRound / 立のマス;
  if (!Number.isInteger(立数) || 立数 < 1) return `射数（${設定.shotsPerRound}）が4で割れない`;
  const 出 = [];
  for (let k = 0; k < images.length; k++) {
    const 人数 = teams[k].rows.length;
    const 元 = await 設定.道具.画を読む(images[k].base64);
    出.push(await 紙の印を読む(元, { 人数, 立数, 立のマス, 重み: 設定.紙の重み }));
  }
  return 出;
}
