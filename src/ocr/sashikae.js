/**
 * Gemini が返した板の読み取り（teams）の「マスの中身」を、端末での読み取りに差し替える。
 *
 * ■ なぜ
 * Gemini は名前と並びは読めるが、○に引かれた線の向き（○＼ と ○／）を読めない
 *（実測で25%）。端末の読み取りは本物の板で 97〜98%。名前は Gemini、マスは端末。
 *
 * ■ 差し替えない場合（Gemini のまま）
 *   ・写真が1枚でない（板と写真の対応が取れない）
 *   ・1マス1射の紙（端末の読み取りは板の形式だけ。紙は表の位置を探す仕組みがまだ無い）
 *   ・板ごとの列の数が、Gemini の行の数と合わない
 *   ・格子が立たない、その他の失敗
 * どれも黙って Gemini のまま進む。返り値の 読み取り元 で分かる。
 */
import { 板の印を読む, 大前から並べる } from './yomu.js';

/**
 * @param {object[]} teams Gemini の返した teams（rows[].cells を持つ）
 * @param {{base64:string}[]} images
 * @param {{向き:string, shotsPerRound:number, 道具:{画を読む:Function, 回す:Function}, 重み:object}} 設定
 * @returns {Promise<{teams:object[], 読み取り元:'端末'|'AI', 訳?:string}>}
 */
export async function マスを端末で差し替える(teams, images, 設定) {
  const そのまま = (訳) => ({ teams, 読み取り元: 'AI', 訳 });
  if (!Array.isArray(teams) || !teams.length) return そのまま('板が無い');
  if (!Array.isArray(images) || images.length !== 1) return そのまま('写真が1枚でない');
  if (teams.some((t) => t && t.cellStyle === '1射')) return そのまま('1マス1射の紙');
  const 人数たち = teams.map((t) => (Array.isArray(t && t.rows) ? t.rows.length : 0));
  if (人数たち.some((n) => n < 1)) return そのまま('行が無い板がある');
  const 行数 = Math.round(設定.shotsPerRound / 2);
  if (行数 < 2) return そのまま('射数が少なすぎる');

  let 板たち;
  try {
    const 元 = await 設定.道具.画を読む(images[0].base64);
    板たち = await 板の印を読む(元, { 板の人数たち: 人数たち, 行数, 回す: 設定.道具.回す, 重み: 設定.重み });
  } catch (e) {
    return そのまま('読めなかった: ' + String((e && e.message) || e));
  }
  if (板たち.length !== teams.length) return そのまま('板の数が合わない');
  for (let i = 0; i < teams.length; i++) {
    if (板たち[i].列たち.length !== 人数たち[i]) return そのまま(`${i + 1}枚目の列の数が合わない（端末${板たち[i].列たち.length}、AI${人数たち[i]}）`);
  }
  const 新しい = teams.map((t, i) => {
    const 列たち = 大前から並べる(板たち[i].列たち, 設定.向き, i, teams.length);
    return {
      ...t,
      cellStyle: '2射',
      rows: t.rows.map((r, j) => ({ ...r, cells: 列たち[j].slice(), marks: undefined })),
    };
  });
  return { teams: 新しい, 読み取り元: '端末' };
}
