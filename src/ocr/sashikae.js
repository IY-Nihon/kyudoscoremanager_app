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
 *
 * ■ 板の順を Gemini が逆に返したとき（中身で突き合わせる）
 *   指示文では teams を「写真の左の板から」並べさせているが、守らないことがある（2026-10-09、
 *   日大工科の板 1 枚＝4 人ずつ 2 つの区画で、右の区画を先に返した。端末は左から読むので、右の 4 人の
 *   名前に左の 4 人の ○× が付き、8 人とも別人の記録になった。○×は 160 射すべて正しく読めていた）。
 *   写真 1 枚に板が 2 つ以上なら、Gemini 自身が読んだ cells と端末の読みを、そのままの順と逆の順で
 *   突き合わせ、はっきり合うほうを取る（板の並びを確かめる）。Gemini の線の向きは当てにならないので、
 *   マスごとの的中数（◎=2・丸に線=1・×=0）で比べる。teams の順（記録表の順）は変えない。
 */
import { 板の印を読む, 紙の印を読む, 大前から並べる } from './yomu.js';

/**
 * @param {object[]} teams Gemini の返した teams（rows[].cells を持つ）
 * @param {{base64:string}[]} images
 * @param {{向き:string, 道具:{画を読む:Function, 回す:Function}, 重み:object, 紙の重み?:object, 箱たち?:number[][]}} 設定
 *   重み … 板の網（omomi-chiisai.json）、紙の重み … 紙の網（kami-omomi.json）
 *   箱たち … 板ごとの○×の範囲（Gemini の box_2d）。写真1枚のときだけ。あれば格子は箱の等分で立てる
 *   行数 … 1列のマスの数の指定。無ければ Gemini の cells の数から決める（箱で読むときは
 *          Gemini が段を数え違えるので、帯の数×帯の中の印の数を渡す）
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
  if (組み直せる && 板の数 && teams.length !== 板の数) {
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
  // 写真 1 枚に板が 2 つ以上なら、Gemini の板の順が写真の左からになっているかを中身で確かめる
  const 並び = 板 && images.length === 1 && teams.length >= 2 ? 板の並びを確かめる(teams, 読んだ, 設定) : null;
  const 逆にした = !!(並び && 並び.板の番.some((b, i) => b !== i));
  return {
    teams: 差し替えた(teams, 読んだ, 設定, 紙, 並び && 並び.板の番),
    読み取り元: '端末',
    ...(逆にした ? { 板の順を直した: true } : {}),
  };
}

/** 大前がどちらの端か。板ごとに Gemini が読んだ札（omae）を優先し、無ければ使う人の選んだ向き */
function 板の向き(t, 設定) {
  // 使う人の選んだ向きと板の札が食い違うと（相手校の板に「大前」の字があるのに「板が2つ（外側が大前）」を
  // 選んだ）、Gemini は札のとおり大前から並べ、端末は選んだ向きで並べて、○×が逆さに付いた
  return t && (t.omae === '右' || t.omae === '左') ? (t.omae === '右' ? '右から' : '左から') : 設定.向き;
}

/** マスの記号 → 的中の数（◎=2・丸に線=1・×=0）。Gemini の線の向きは当てにならないので数だけで比べる */
function マスの的中(記号) {
  const s = String(記号 == null ? '' : 記号).trim();
  if (!s) return null;
  if (s === '◎') return 2;
  if (/^[×XxＸ✕✖]$/.test(s)) return 0;
  if (/^[○◯〇]$/.test(s)) return 1;
  // 線だけ（／・＼）は、端末では「1 本目を外し、2 本目はまだ」、Gemini は丸を落とした「丸に線」のことがあり、
  // 意味がそろわないので比べない
  if (/^[\\/／＼]$/.test(s)) return null;
  // 丸に線（○＼・○／）は 1 本の当たり
  if (/[\\/／＼]/.test(s)) return 1;
  return null;
}

/**
 * 板の並びを確かめる。teams の i 番目に、端末の何番目の板（左から）を当てるか（板の番）を返す。
 * そのままの順（i→i）と逆の順（i→n-1-i）で、Gemini の cells と端末の読みのマスごとの的中数の一致を数え、
 * 逆の順が「比べたマスの 2 割以上」多く合うときだけ逆にする。人数の並びが違う板どうしは入れ替えない
 * （入れ替えるなら読み直しが要る。呼ぶ側が読み直してから渡す）。
 * @param {object[]} teams Gemini の teams
 * @param {{列たち:string[][]}[]} 読んだ 端末が左の板から読んだもの
 * @returns {{板の番:number[], 合ったマス:number[], 比べたマス:number}}
 */
export function 板の並びを確かめる(teams, 読んだ, 設定) {
  const n = teams.length;
  const そのまま = teams.map((_, i) => i);
  const 逆 = teams.map((_, i) => n - 1 - i);
  const 数える = (板の番) => {
    let 合 = 0;
    let 比べた = 0;
    teams.forEach((t, i) => {
      const 板 = 読んだ[板の番[i]];
      if (!板 || !Array.isArray(板.列たち) || 板.列たち.length !== (t.rows || []).length) return;
      const 列たち = 大前から並べる(板.列たち, 板の向き(t, 設定), 板の番[i], n);
      t.rows.forEach((r, j) => {
        const 端末の列 = 列たち[j] || [];
        (Array.isArray(r.cells) ? r.cells : []).forEach((記号, k) => {
          const g = マスの的中(記号);
          const d = マスの的中(端末の列[k]);
          if (g == null && d == null) return;
          比べた++;
          if (g === d) 合++;
        });
      });
    });
    return { 合, 比べた };
  };
  const 今 = 数える(そのまま);
  if (n < 2) return { 板の番: そのまま, 合ったマス: [今.合], 比べたマス: 今.比べた };
  const 人数が合う = teams.every((t, i) => (t.rows || []).length === (teams[n - 1 - i].rows || []).length);
  if (!人数が合う) return { 板の番: そのまま, 合ったマス: [今.合], 比べたマス: 今.比べた };
  const 返し = 数える(逆);
  const はっきり = 返し.合 - 今.合 >= Math.max(4, 0.2 * Math.max(今.比べた, 返し.比べた));
  return { 板の番: はっきり ? 逆 : そのまま, 合ったマス: [今.合, 返し.合], 比べたマス: Math.max(今.比べた, 返し.比べた) };
}

/** 端末で読んだ列を teams の rows へ入れる。板の番 … teams の i 番目に当てる端末の板（無ければ i） */
function 差し替えた(teams, 読んだ, 設定, 紙, 板の番) {
  return teams.map((t, i) => {
    const b = Array.isArray(板の番) ? 板の番[i] : i;
    const 向き = 板の向き(t, 設定);
    const 列たち = 大前から並べる(読んだ[b].列たち, 向き, b, teams.length);
    const 確たち = 大前から並べる(読んだ[b].確からしさ, 向き, b, teams.length);
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
  // 板 2 枚を 1 つの teams にまとめて返してきたとき（Gemini はときどきそうする）は、半々に分ける。
  // 指示文の並び（左の板を左から、右の板を右から）で 1 つに並べてあれば、半々で板ごとの順になる
  if (板の数 === 2 && teams.length === 1 && 総 >= 4) 足す([Math.ceil(総 / 2), Math.floor(総 / 2)]);
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
  const 行数 = Number(設定.行数) >= 2 ? Number(設定.行数) : Math.max(...teams.map((t) => マスの数(t.rows)));
  if (!(行数 >= 2)) return `1列のマスの数が少なすぎる（${行数}）`;
  // Gemini は cells を並べるとき段を数え違えることがある（9/6 の板は 10 段なのに 8 マスで返し、端末も 8 段の格子を
  // 当てて見張りを通り、上の 2 段を読まずに 16 射の記録になった。3 回とも同じ）。帯の数 × 帯の中のマスの数は
  // 相手校の板の箱の問い合わせで 5 回とも正しかったので、cells の数と食い違えば、まずそちらの段数で読む。
  // 見張りを通らなければ、今までどおり cells の数で読む
  if (!(Number(設定.行数) >= 2)) {
    const 帯の段たち = teams.map((t) => (Number(t && t.bands) > 0 && Number(t && t.marks_per_band) > 0 ? Number(t.bands) * Number(t.marks_per_band) : 0));
    const 帯の段 = 帯の段たち.every((n) => n >= 2) ? Math.max(...帯の段たち) : 0;
    if (帯の段 && 帯の段 !== 行数) {
      const 帯で = await 板を読む(teams, images, { ...設定, 行数: 帯の段 });
      if (Array.isArray(帯で)) return 帯で;
    }
    // 途中の板（書いた段が板によって違う）は、Gemini が空の段を cells に入れたり入れなかったりで、
    // cells の数も帯の数も当てにならない（10/4 の日大工科の途中の板：左 4 段・右 6 段なのに cells は 7 と 8、
    // 帯は 2）。中身の入ったマスがいちばん多い人の数（書いた段の数）でも読んでみる。書いていない上の段は、
    // 端末が空として読む（板ごとの格子の 名札の行を外して上へ）
    const 書いた段 = Math.max(...teams.flatMap((t) => t.rows.map((r) => (Array.isArray(r.cells) ? r.cells.filter((c) => String(c || '').trim()).length : 0))));
    if (書いた段 >= 2 && 書いた段 !== 行数 && 書いた段 !== 帯の段) {
      const 書いた段で = await 板を読む(teams, images, { ...設定, 行数: 書いた段 });
      if (Array.isArray(書いた段で)) return 書いた段で;
    }
  }
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
        const 板たち = await 板の印を読む(元, {
          板の人数たち: この写真の人数,
          行数,
          回す: 設定.道具.回す,
          重み: 設定.重み,
          // 箱は写真1枚・板の数が合うときだけ渡す（板ごとの格子 が数を見て使う）。
          // teams は写真の左の板から順（指示文で決めている）なので、箱も左から順にそろえる
          箱たち:
            images.length === 1 && Array.isArray(設定.箱たち) && 設定.箱たち.length === n
              ? 設定.箱たち.slice().sort((a, b) => a[1] - b[1])
              : undefined,
          // 帯（太い横線で区切られた立）の数。箱の中の行を、帯の線で決めるのに使う
          帯の数: Number(設定.帯の数) >= 1 ? Number(設定.帯の数) : undefined,
        });
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
        // 二段のマス（1マスの切り抜きに印が縦に2つ）が板のマスの 25% 以上＝段の数が少なすぎる。
        // 印が 10 段並ぶ板を Gemini が 5 段と数えると、1行が2段ぶんになる（本物で 35〜70%。
        // 段が合っていれば 10% 以下）。行の欠けでは見つからない（どの行にも印が乗る）
        const 段が少ない = (b) => b.格子 && b.格子.二段のマス != null && b.格子.二段のマス >= b.列たち.length * 行数 * 0.25;
        // 行の欠けは、読んだマスでも確かめる。印がマスいっぱいで太い罫線に触れる板（9/20 の SNS の白板）では、
        // 格子が印を半分ほどの行でしか数えられず「空の行が 4 つ」と出るのに、マスを読むとどの段にも印があり
        // 正しく読めていた（96/96）。行の欠けを信じて箱の道へ回し、そちらで崩れていた。
        // 読んだ結果でも、埋まった段より下に、列の 8 割以上が空の段が 2 つ以上あるときだけ行の欠けとみなす
        const 読みの欠け = (b) => {
          const 段の数 = b.列たち.length ? b.列たち[0].length : 0;
          let 始まった = false;
          let 欠け = 0;
          for (let r = 0; r < 段の数; r++) {
            const 空 = b.列たち.filter((列) => !列[r]).length >= b.列たち.length * 0.8;
            if (!空) 始まった = true;
            else if (始まった) 欠け++;
          }
          return 欠け;
        };
        // 行と行の間に印が 2 割以上ある＝段の数が少なすぎて行の間隔が倍になっている（6 段の板を 4 段で）
        const 間に印 = (b) => b.格子 && b.格子.間の印 != null && b.格子.間の印 >= Math.max(3, (b.格子.範囲の印 || 0) * 0.2);
        const 行が違う = (b) => b.格子 && ((b.格子.行の欠け != null && b.格子.行の欠け >= 2 && 読みの欠け(b) >= 2) || b.格子.上の字の行 >= 1 || 段が少ない(b) || 間に印(b));
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
              ? 段が少ない(板たち[外れ])
                ? `段の数が少なすぎる（AI${行数}段で当てはめると、印が縦に2つ入るマスが${板たち[外れ].格子.二段のマス}/${板たち[外れ].列たち.length * 行数}）`
                : `行の数が合わない（AI${行数}段で当てはめると、埋まった行より下に空の行が${板たち[外れ].格子.行の欠け}つ、上に字の行が${板たち[外れ].格子.上の字の行 || 0}つ）`
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
