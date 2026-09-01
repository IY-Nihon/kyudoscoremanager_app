/**
 * Module ID: liveShare
 *
 * ライブをURLで共有する。編集用と閲覧用を分け、合言葉を掛けられる。
 *
 * ■ 団体の合言葉はリンクに載せない
 * ふだんのライブは live_sessions/{団体の合言葉} に置いてある（src/liveSecret.js）。
 * これをリンクに載せると、その1本で**その団体の過去も未来も全部のライブ**へ
 * 入れてしまう。そこで共有するライブは「そのライブ専用の枝」に置き、
 * リンクはその枝だけを指す。漏れても、漏れたのはそのライブ1つで済む。
 *
 * ■ 編集用と閲覧用は別の種から作る
 * 同じ種から両方を作ると、閲覧リンクを持つ人が編集用の枝を計算できてしまい、
 * 「閲覧用」が意味を持たない。種を2つ別々に作り、リンクにはその役の種だけを
 * 載せる。閲覧の人は編集の種を知らないので、編集の枝は出せない。
 *
 * ■ 合言葉は「確かめる」のではなく「道を作る」のに使う
 * 画面で照合するだけなら、URLを持つ人は開発者ツールで素通りできる。
 * ここでは枝の名前そのものを合言葉から導く。合っていなければ道が違うので、
 * 読むものが無い。決まりの側に手を入れずに効く。
 *
 * ■ どのくらい守れるか（正直なところ）
 * 総当たりは「合言葉を1つ試す → 枝を計算 → RTDB へ問い合わせる」の繰り返し。
 * 繰り返し回数（枝の繰り返し）で計算の側を重くしてあるが、本当の律速は
 * 通信で、実測でおおむね毎秒10回程度しか試せない。それでも4桁の数字なら
 * 30分ほどで開く。だから合言葉には最低の長さを設けている（合言葉の最短）。
 * 「桁を増やすほど強くなる」ことは画面でも伝えること。
 *
 * ■ 期限は決まりの側で切る
 * 画面で「期限切れです」と出すだけなら、開発者ツールで素通りできる。
 * そこで期限は live_limits/{枝}/期限 に置き、database.rules.json が
 * その枝ぜんぶの読み書きを止める。改造した端末でも読めない。
 *
 * リンクの荷にも期限を載せるが、そちらは**表示のためだけ**。
 * 荷は誰でも書き換えられるので、荷の期限を信じて通してはいけない。
 *
 * 期限は縮められるが延ばせない（決まりで禁じている）。延ばしたいときは
 * 配り直す。延ばせると、いちど配ったリンクが後からよみがえることになり、
 * 「期限を切った」と思っている人の思い違いを生む。
 *
 * 画面にも Firebase にも触れない純粋な関数なので、そのまま検査できる
 * （test/liveShare.test.js）。
 */
'use strict';

const ハッシュ = require('./sha256');

/** 荷の形の版。読めない版が来たら断るために持つ */
const リンクの版 = 1;

/**
 * 枝を導くときにハッシュを重ねる回数。
 *
 * 減らすと総当たりが速くなる。増やすと参加のたびに待たされる。
 * 実測（node）で5万回=50ミリ秒、古いiPhoneでも1秒前後に収まる見当。
 */
const 枝の繰り返し = 50000;

/** 合言葉の最短の長さ。短いと総当たりで開く（上の説明を参照） */
const 合言葉の最短 = 6;

/** 役。編集できる側と、見るだけの側 */
const 編集 = 'edit';
const 閲覧 = 'view';

/**
 * 期限の選び方。ミリ秒。0 は「期限なし」。
 *
 * 既定を「24時間」にしてある。ふだんの共有は1回の練習ぶんで、
 * 期限なしを既定にすると、ほとんどのリンクが永久に生き続ける。
 * 長く使いたい人が選び直すほうが、事故が少ない。
 *
 * ■ 最短を12時間にしてある理由
 * 期限が切れると、**配った本人も含めて全員**がそのライブから離れる。
 * 配ったライブは専用の枝に置いてあり、決まりがその枝ごと止めるため。
 * だから練習より短い期限を選べるようにすると、練習の途中でライブが
 * 終わる。3時間を選べるようにしていたときは、ちょうどそれが起きうる形
 * だった。弓道の練習で12時間を超えるものは無いので、ここで切る。
 *
 * 切れても手元の記録は残る。失われるのはつながりだけ。
 */
const 期限の選択肢 = [
  { 値: 12 * 60 * 60 * 1000, 名: '12時間' },
  { 値: 24 * 60 * 60 * 1000, 名: '24時間', 既定: !0 },
  { 値: 7 * 24 * 60 * 60 * 1000, 名: '7日間' },
  { 値: 0, 名: '期限なし' },
];

/** 練習の長さの見当。これより短い期限は、練習の途中で切れうる */
const 練習の長さ = 12 * 60 * 60 * 1000;

/** 既定の持ち（ミリ秒） */
const 期限の既定 = (期限の選択肢.find((x) => x.既定) || { 値: 0 }).値;

/**
 * 期限の時刻を出す。持ちが0や読めない値なら null（期限なし）。
 *
 * @param {number} 持ち ミリ秒
 * @param {number} [今]
 * @returns {number|null}
 */
function 期限の時刻(持ち, 今) {
  const m = 'number' == typeof 持ち && isFinite(持ち) && 持ち > 0 ? 持ち : 0;
  if (!m) return null;
  const t = 'number' == typeof 今 ? 今 : Date.now();
  return t + m;
}

/**
 * もう切れているか。期限が無ければ切れていない。
 *
 * これは**表示のため**の判定。通してよいかの判断に使わないこと
 * （荷の期限は書き換えられる。本当の判断は決まりの側でしている）。
 *
 * @param {number|null|undefined} 期限
 * @param {number} [今]
 * @returns {boolean}
 */
function 期限切れか(期限, 今) {
  if ('number' != typeof 期限 || !isFinite(期限) || 期限 <= 0) return !1;
  return ('number' == typeof 今 ? 今 : Date.now()) >= 期限;
}

/**
 * 期限を人の言葉にする。期限が無ければ null。
 *
 * @param {number|null|undefined} 期限
 * @param {number} [今]
 * @returns {string|null}
 */
/**
 * 帯に出すのは、期限がこれより近いときだけ（ミリ秒）。1時間。
 *
 * ずっと出していると場所を取るだけで読まれなくなる。
 * 逆に切れる直前まで黙っていると、記録の途中で全員が落ちる。
 * 1時間あれば、区切りのいいところで配り直せる。
 */
const 帯に出す残り = 60 * 60 * 1000;

/**
 * 帯に出す短い文言。「あと30分」だけを返す。
 *
 * 帯は1行（height 24）に、ライブ名・接続台数・配るボタンが同居している。
 * 「あと30分で期限切れ」まで入れると細い画面でライブ名が潰れるので、
 * ここでは数だけにして、意味は色（警告色）で持たせる。
 *
 * 遠いとき・期限が無いとき・すでに切れているときは null。
 * 切れているときに出さないのは、そのとき帯そのものが消えるため。
 *
 * @param {number|null|undefined} 期限
 * @param {number} [今]
 * @returns {string|null}
 */
function 期限の短い文言(期限, 今) {
  if ('number' != typeof 期限 || !isFinite(期限) || 期限 <= 0) return null;
  const t = 'number' == typeof 今 ? 今 : Date.now();
  const 残り = 期限 - t;
  if (残り <= 0 || 残り > 帯に出す残り) return null;
  const 分 = Math.ceil(残り / 60000);
  return `あと${分}分`;
}

/**
 * 帯の残りを、次にいつ数え直せばよいか（ミリ秒）。要らないときは null。
 *
 * ずっと30秒ごとに数え直すと、24時間もたせたリンクでは23時間ぶん
 * 無駄に描き直すことになる。記録画面は重く、ライブ中は○×のたびに
 * 保存も走るので、そこで足を引っ張りたくない。
 *
 * ・帯に出るころまでは、出る直前に一度だけ起きる
 * ・出てからは30秒ごと（分の表示なので、これより細かくしても字は変わらない）
 * ・切れたら数え直さない（帯そのものが消えるため）
 *
 * @param {number|null|undefined} 期限
 * @param {number} [今]
 * @returns {number|null}
 */
function 次に数え直すまで(期限, 今) {
  if ('number' != typeof 期限 || !isFinite(期限) || 期限 <= 0) return null;
  const t = 'number' == typeof 今 ? 今 : Date.now();
  const 残り = 期限 - t;
  if (残り <= 0) return null;
  // 出る少しあとに起きる（ちょうどだと、起きた時点でまだ出ない見当になる）
  if (残り > 帯に出す残り) return 残り - 帯に出す残り + 1000;
  return 30000;
}

function 期限の文言(期限, 今) {
  if ('number' != typeof 期限 || !isFinite(期限) || 期限 <= 0) return null;
  const t = 'number' == typeof 今 ? 今 : Date.now();
  if (t >= 期限) return '期限切れ';
  const 残り = 期限 - t;
  const 時 = Math.floor(残り / 3600000);
  if (時 < 1) return `あと${Math.max(1, Math.floor(残り / 60000))}分で期限切れ`;
  if (時 < 24) return `あと${時}時間で期限切れ`;
  return `あと${Math.floor(時 / 24)}日で期限切れ`;
}

/** 種を作る。役ごとに別々に作ること（上の説明を参照） */
function 共有の種を作る(乱数源) {
  const c = 乱数源 || (typeof globalThis !== 'undefined' ? globalThis.crypto : undefined);
  if (c && typeof c.randomUUID === 'function') return c.randomUUID().replace(/-/g, '');
  if (c && typeof c.getRandomValues === 'function') {
    const 桶 = new Uint8Array(16);
    c.getRandomValues(桶);
    return [...桶].map((x) => x.toString(16).padStart(2, '0')).join('');
  }
  let s = '';
  while (s.length < 32) s += Math.random().toString(36).slice(2);
  return s.slice(0, 32);
}

/**
 * 種と合言葉から、ライブを置く枝の名前を導く。
 *
 * 合言葉が空でも導ける（合言葉なしの共有）。そのときはURLを知る人が
 * そのまま入れる、という約束になる。
 */
/**
 * @param {string} 種
 * @param {string|null|undefined} 合言葉
 * @returns {string} 十六進64文字
 */
function 枝を導く(種, 合言葉) {
  const 元 = String(種 == null ? '' : 種) + '\n' + String(合言葉 == null ? '' : 合言葉);
  let b = ハッシュ.要約のバイト列(元);
  for (let i = 1; i < 枝の繰り返し; i++) b = ハッシュ.バイト列から(b);
  return ハッシュ.十六進(b);
}

/** 合言葉として受け付けられるか。null なら差し支えなし、文字列なら断る理由 */
function 合言葉の難点(合言葉) {
  const s = String(合言葉 == null ? '' : 合言葉);
  if (s.length === 0) return '合言葉を入力してください。';
  if (s.length < 合言葉の最短) return `合言葉は${合言葉の最短}文字以上にしてください。`;
  return null;
}

// ── 荷の詰め方（base64url）─────────────────────────────
// Buffer も atob も無い環境があるので自前で持つ
const 字 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function 詰める(バイト) {
  let 出 = '';
  for (let i = 0; i < バイト.length; i += 3) {
    const a = バイト[i];
    const b = i + 1 < バイト.length ? バイト[i + 1] : -1;
    const c = i + 2 < バイト.length ? バイト[i + 2] : -1;
    出 += 字[a >> 2];
    出 += 字[((a & 3) << 4) | (b < 0 ? 0 : b >> 4)];
    if (b < 0) break;
    出 += 字[((b & 15) << 2) | (c < 0 ? 0 : c >> 6)];
    if (c < 0) break;
    出 += 字[c & 63];
  }
  return 出;
}

function ほどく(文字列) {
  const s = String(文字列 || '');
  const 出 = [];
  let 溜め = 0;
  let 桁 = 0;
  for (const ch of s) {
    const v = 字.indexOf(ch);
    if (v < 0) return null; // 知らない字が混じっていたら、荷ではない
    ((溜め = (溜め << 6) | v), (桁 += 6));
    if (桁 >= 8) ((桁 -= 8), 出.push((溜め >> 桁) & 255));
  }
  return 出;
}

/** バイト列を UTF-8 の文字列として読む */
function 文字列にする(バイト) {
  let 出 = '';
  for (let i = 0; i < バイト.length; ) {
    const b = バイト[i];
    if (b < 0x80) ((出 += String.fromCharCode(b)), i++);
    else if (b < 0xe0) ((出 += String.fromCharCode(((b & 31) << 6) | (バイト[i + 1] & 63))), (i += 2));
    else if (b < 0xf0)
      ((出 += String.fromCharCode(
        ((b & 15) << 12) | ((バイト[i + 1] & 63) << 6) | (バイト[i + 2] & 63)
      )),
        (i += 3));
    else {
      const c =
        ((b & 7) << 18) |
        ((バイト[i + 1] & 63) << 12) |
        ((バイト[i + 2] & 63) << 6) |
        (バイト[i + 3] & 63);
      const x = c - 0x10000;
      ((出 += String.fromCharCode(0xd800 + (x >> 10), 0xdc00 + (x & 1023))), (i += 4));
    }
  }
  return 出;
}

/**
 * 荷を組む。URLの「#」の後ろに載せる。
 *
 * 「#」より後ろはサーバーへ送られないので、配り元の記録に残らない。
 * 合言葉そのものは載せない。載せたらリンク1本で入れてしまう
 */
/**
 * @param {{種:string, 名前:string, 役:string, 鍵が要るか:boolean, 期限?:number|null}} 中身
 * @returns {string}
 */
function 共有の荷を組む({ 種, 名前, 役, 鍵が要るか, 期限 }) {
  const 中身 = {
    v: リンクの版,
    s: String(種 || ''),
    n: String(名前 || ''),
    r: 役 === 閲覧 ? 閲覧 : 編集,
    k: 鍵が要るか ? 1 : 0,
  };
  // 期限は表示のためだけに載せる。無いときは鍵ごと置かない
  // （古い読み手が「期限0＝即切れ」と読むのを避ける）
  if ('number' == typeof 期限 && isFinite(期限) && 期限 > 0) 中身.e = 期限;
  return 詰める(ハッシュ.バイト列にする(JSON.stringify(中身)));
}

/** 荷を解く。読めなければ null */
/**
 * @param {string|null|undefined} 文字列
 * @returns {{種:string, 名前:string, 役:string, 鍵が要るか:boolean, 期限:number|null}|null}
 */
function 共有の荷を解く(文字列) {
  const バイト = ほどく(文字列);
  if (!バイト || !バイト.length) return null;
  let 中身;
  try {
    中身 = JSON.parse(文字列にする(バイト));
  } catch {
    return null;
  }
  if (!中身 || 中身.v !== リンクの版) return null;
  if (!中身.s || !中身.n) return null;
  return {
    種: String(中身.s),
    名前: String(中身.n),
    役: 中身.r === 閲覧 ? 閲覧 : 編集,
    鍵が要るか: !!中身.k,
    // 表示のためだけ。通してよいかの判断に使わないこと
    期限: 'number' == typeof 中身.e && isFinite(中身.e) && 中身.e > 0 ? 中身.e : null,
  };
}

/** 共有リンクを組み立てる */
function リンクを作る(配り元, 荷) {
  const 元 = String(配り元 || '').replace(/\/+$/, '');
  return `${元}/record#共有=${荷}`;
}

/** URL から荷の文字列を取り出す。無ければ null */
function URLから荷を取る(URL文字列) {
  const s = String(URL文字列 || '');
  const 場所 = s.indexOf('#');
  if (場所 < 0) return null;
  for (const 組 of s.slice(場所 + 1).split('&')) {
    const 等 = 組.indexOf('=');
    if (等 < 0) continue;
    // encodeURIComponent された「共有」も受ける
    const 鍵 = decodeURIComponent(組.slice(0, 等));
    if (鍵 === '共有') return 組.slice(等 + 1);
  }
  return null;
}

module.exports = {
  リンクの版,
  枝の繰り返し,
  合言葉の最短,
  編集,
  閲覧,
  期限の選択肢,
  練習の長さ,
  期限の既定,
  期限の時刻,
  期限切れか,
  期限の文言,
  帯に出す残り,
  期限の短い文言,
  次に数え直すまで,
  共有の種を作る,
  枝を導く,
  合言葉の難点,
  共有の荷を組む,
  共有の荷を解く,
  リンクを作る,
  URLから荷を取る,
};
