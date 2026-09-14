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
 * 列の数が合わなかったときは 列の見当たち（板ごとに端末が数えた射手の列の数）も返す。
 * 呼ぶ側はそれを添えて Gemini にもう一度だけ読ませられる（OCRRecordModal）。
 *
 * ■ 板の数を Gemini が違えたとき（行を組み直す）
 *   写真1枚に板2枚なのに、右の板を「2人・1人・1人」の3つに割って 4 teams で返すことがある
 *  （2026-09-13 の板 B で本番に出た。区切りと計が余計に入り、○×も Gemini のまま＝2射違った）。
 *   行の総数が端末の見当（板ごとの人数）の合計と同じなら、行を前から見当の人数ずつ板に
 *   組み直して、もう一度だけ端末で読む。読めたら組み直した teams を返す（読み取り元 '端末'）。
 *   Gemini は板ごとに前から順に行を返すので、組み直しで並びは崩れない。
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

  // 板の数を Gemini が違えたとき（右の板を 2人・1人・1人 に割るなど）は、行を板に組み直して読む。
  // 「板が2つ」と選んでいるのに 2 より多ければ、Gemini の板のまま読む前に 2 枚として試す。
  // 割られた板のまま読んでも、端末の格子は「頼まれた板の数」に写真を割るので列は合ってしまい、
  // 余計な区切りと計が入った記録表になる（2026-09-13 の板 B で本番に出た）
  const 組み直せる = 板 && images.length === 1;
  const 板の数 = 設定.向き === '左右から' ? 2 : null;
  const 組み直して読む = async (見当たち) => {
    for (const 見当 of 見当たち) {
      const 組み直し = 行を組み直す(teams, 見当);
      if (!組み直し) continue;
      let 二度目;
      try {
        二度目 = await 板を読む(組み直し, images, 設定);
      } catch (e) {
        二度目 = null;
      }
      if (Array.isArray(二度目)) {
        return { teams: 差し替えた(組み直し, 二度目, 設定, 紙), 読み取り元: '端末', 組み直した: 見当 };
      }
    }
    return null;
  };
  if (組み直せる && 板の数 && teams.length > 板の数) {
    const 先に = await 組み直して読む(組み直しの候補(teams, 板の数, null));
    if (先に) return 先に;
  }

  let 読んだ;
  try {
    読んだ = 紙 ? await 紙を読む(teams, images, 設定) : await 板を読む(teams, images, 設定);
  } catch (e) {
    return そのまま('読めなかった: ' + String((e && e.message) || e));
  }
  if (typeof 読んだ === 'string') return そのまま(読んだ);
  if (読んだ && 読んだ.訳) {
    // 読めなかったとき。端末の見当（板ごとの人数）が行の総数と合えば、それで組み直して読み直す
    if (組み直せる) {
      const 後で = await 組み直して読む(組み直しの候補(teams, 板の数, 読んだ.列の見当たち));
      if (後で) return 後で;
    }
    return { teams, 読み取り元: 'AI', 訳: 読んだ.訳, 列の見当たち: 読んだ.列の見当たち };
  }
  return { teams: 差し替えた(teams, 読んだ, 設定, 紙), 読み取り元: '端末' };
}

/** 端末で読んだ列を teams の rows へ入れる */
function 差し替えた(teams, 読んだ, 設定, 紙) {
  return teams.map((t, i) => {
    const 列たち = 大前から並べる(読んだ[i].列たち, 設定.向き, i, teams.length);
    const 確たち = 大前から並べる(読んだ[i].確からしさ, 設定.向き, i, teams.length);
    return {
      ...t,
      cellStyle: 紙 ? '1射' : '2射',
      // 確からしさ は cells と同じ並び。確認画面で迷ったマスに色を付けるのに使う
      rows: t.rows.map((r, j) => ({ ...r, cells: 列たち[j].slice(), 確からしさ: 確たち[j].slice(), marks: undefined })),
    };
  });
}

/**
 * 行を板に組み直す割り方の候補（板ごとの人数）。合いそうな順。
 *   ・端末の見当（列の見当たち）が行の総数と合えば、まずそれ
 *   ・板の数が決まっている（「板が2つ」）なら、Gemini の板の境目で2つに分ける割り方を、
 *     半々に近い順に。Gemini は板の中を割ることはあっても、板をまたいで束ねることは少ない
 * 板の数が Gemini と同じ割り方は含めない（それは読めなかったばかり）
 */
export function 組み直しの候補(teams, 板の数, 見当) {
  const 人数たち = teams.map((t) => t.rows.length);
  const 総 = 人数たち.reduce((a, b) => a + b, 0);
  const 出 = [];
  const 足す = (割り方) => {
    if (割り方.length === teams.length) return;
    if (割り方.some((n) => !(Number.isInteger(n) && n >= 1))) return;
    if (割り方.reduce((a, b) => a + b, 0) !== 総) return;
    if (出.some((x) => x.length === 割り方.length && x.every((n, i) => n === 割り方[i]))) return;
    出.push(割り方);
  };
  if (Array.isArray(見当)) 足す(見当);
  if (板の数 === 2 && teams.length > 2) {
    const 境目 = [];
    let 積 = 0;
    for (let i = 0; i < 人数たち.length - 1; i++) {
      積 += 人数たち[i];
      境目.push(積);
    }
    境目.sort((a, b) => Math.abs(a - 総 / 2) - Math.abs(b - 総 / 2));
    for (const b of 境目) 足す([b, 総 - b]);
  }
  return 出;
}

/**
 * Gemini の teams の行を、端末の見当（板ごとの人数）で板に組み直す。
 * 板の数が違い、行の総数が見当の合計と同じときだけ。それ以外は null。
 *
 * 立の人数（tachiPeople）は、いちばん行の多い元の板のものを使う（割られた小さな板は
 * 「2人」「1人」と言ってくることがある）。それが無ければ見当の人数
 */
export function 行を組み直す(teams, 見当) {
  if (!Array.isArray(見当) || !見当.length || 見当.length === teams.length) return null;
  if (!見当.every((n) => Number.isInteger(n) && n >= 1)) return null;
  const 行たち = teams.flatMap((t) => (Array.isArray(t && t.rows) ? t.rows : []));
  if (見当.reduce((a, b) => a + b, 0) !== 行たち.length) return null;
  const 大きい = teams.reduce((a, t) => (t.rows.length > a.rows.length ? t : a), teams[0]);
  const 立 = Number(大きい.tachiPeople) > 0 ? Number(大きい.tachiPeople) : 0;
  let i = 0;
  return 見当.map((n) => {
    const rows = 行たち.slice(i, i + n);
    i += n;
    // 名前・向きなどは、この板の最初の行が入っていた元の板から
    const 元 = teams.find((t) => t.rows.includes(rows[0])) || 大きい;
    return { ...元, rows, tachiPeople: 立 > 0 && 立 <= n ? 立 : n };
  });
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
    let 列の見当たち = null;
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
        // 上の字の行（埋まった行より上に、字や数字の行が乗っている）が1つでも＝行が板の外に
        // はみ出している（10段の板に14段。余りは上に置かれ、的中数の数字の行を読んでいた）
        const 行が違う = (b) => b.格子 && ((b.格子.行の欠け != null && b.格子.行の欠け >= 2) || b.格子.上の字の行 >= 1);
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
        // 列の数が合わないときの、端末の見当（板ごと）。全部の板に見当があるときだけ返す
        if (外れ >= 0 && !行が違う(板たち[外れ]) && 板たち.every((b) => b.格子 && b.格子.並びの人数 != null)) {
          列の見当たち = 板たち.map((b) => b.格子.並びの人数);
        }
        訳 =
          外れ >= 0
            ? 行が違う(板たち[外れ])
              ? `行の数が合わない（AI${行数}段で当てはめると、埋まった行より下に空の行が${板たち[外れ].格子.行の欠け}つ、上に字の行が${板たち[外れ].格子.上の字の行 || 0}つ）`
              : `列の数が合わない（端末${板たち[外れ].格子 ? 板たち[外れ].格子.列の見当 : 板たち[外れ].列たち.length}、AI${この写真の人数[外れ]}）`
            : '板の数が合わない';
      } catch (e) {
        訳 = String((e && e.message) || e);
      }
    }
    if (!取れた) {
      return {
        訳: `${k + 1}枚目の写真: ${訳}`,
        列の見当たち: 列の見当たち && 列の見当たち.some((n, i) => n !== 人数たち[次の板 + i]) ? 列の見当たち : null,
      };
    }
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
