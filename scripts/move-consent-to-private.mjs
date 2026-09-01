/**
 * group_accounts の「誰でも読める帳面」から、団体名・登録日・同意の記録を
 * private/consent へ移す。
 *
 *   node scripts/move-consent-to-private.mjs prod          （数えるだけ）
 *   node scripts/move-consent-to-private.mjs prod 写す      （private へ写す）
 *   node scripts/move-consent-to-private.mjs prod 消す      （公開の帳面から消す）
 *
 * ■ なぜ要るのか
 * group_accounts は `allow get: if true` で誰でも読める。ログインは団体IDで
 * 行うのに Firebase Auth はメールアドレスでしか認証できないので、認証の前に
 * 「団体ID→メールアドレス」を引く必要があるからで、ここは開けるしかない。
 *
 * ところが団体名・登録日・同意の記録まで同じ文書に入れていた。団体IDは6桁で
 * 連番寄りなので、順に試すだけで**学校名とその担当者のメールアドレスが組で**
 * 集められる（2026-09-02 に本番で実際に取得できることを確かめた）。
 * メールアドレス単体なら「どこかの誰か」だが、学校名と組になると「どこの誰か」
 * になる。名寄せを止めるのがこの移送の目的。
 *
 * 決まりは文書の一部だけを隠せない（get は文書ぜんぶを返す）ので、隠したいものは
 * 下の階層へ分けるしかない。
 *
 * ■ 順序（守ること）
 *   1. 決まりを出す（private への書き込みを許す。公開側の hasOnly はまだ締めない）
 *   2. この台本で **写す**
 *   3. アプリを出す（新しい場所を読み書きするようになる）
 *   4. この台本で **消す**、そのあと公開側の hasOnly を締める
 *
 * 逆にすると、写す前に決まりが締まって古い記録を読めなくなる。実害は小さい
 * （記録が無いと判定され、静かに口頭ぶんが private に作られる）が、
 * いつ・どうやって同意を得たかの元の記録は取り残される。
 *
 * 所有者の権限で動くので、決まりを通らずに読み書きできる。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const 対象 = process.argv[2] || 'stg';
const 命令 = process.argv[3] || '';
if (!['stg', 'prod'].includes(対象)) {
  console.error('使い方: node scripts/move-consent-to-private.mjs <stg|prod> [写す|消す]');
  process.exit(1);
}
if (命令 && !['写す', '消す'].includes(命令)) {
  console.error(`知らない命令です: ${命令}（写す か 消す）`);
  process.exit(1);
}
const 企画 = 対象 === 'stg' ? 'kyudoscoremanager-stg' : 'kyudoscoremanager';

/** 公開の帳面に残してよいもの。ログインに要る2つだけ */
const 公開してよい = ['id', 'email'];

// ── 所有者の権限を借りる（firebase login 済みであること）──
const 設定 = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const refresh = fs.existsSync(設定)
  ? JSON.parse(fs.readFileSync(設定, 'utf8')).tokens?.refresh_token
  : null;
if (!refresh) {
  console.error('firebase login が済んでいません');
  process.exit(1);
}
const { access_token } = await (
  await fetch('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
      grant_type: 'refresh_token',
      refresh_token: refresh,
    }),
  })
).json();
if (!access_token) {
  console.error('権限を借りられませんでした');
  process.exit(1);
}
const 頭 = { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' };
const 根 = `https://firestore.googleapis.com/v1/projects/${企画}/databases/(default)/documents`;

// ── Firestore の値の形との行き来 ──
const 値へ = (v) => {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number')
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  return { stringValue: String(v) };
};
const 値から = (v) => {
  if (!v || typeof v !== 'object') return undefined;
  if ('nullValue' in v) return null;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('stringValue' in v) return v.stringValue;
  if ('timestampValue' in v) return v.timestampValue;
  return undefined;
};
const 素へ = (fields) =>
  Object.fromEntries(Object.entries(fields || {}).map(([k, v]) => [k, 値から(v)]));

console.log(`${企画} の group_accounts を見ます（${命令 || '数えるだけ'}）\n`);

// ── 団体を全部拾う ──
const 一覧 = [];
let 続き = '';
for (;;) {
  const r = await fetch(`${根}/group_accounts?pageSize=300${続き}`, { headers: 頭 });
  if (!r.ok) {
    console.error(`読めません（HTTP ${r.status}）`);
    process.exit(1);
  }
  const j = await r.json();
  for (const d of j.documents || []) 一覧.push({ id: d.name.split('/').pop(), 中身: 素へ(d.fields) });
  if (!j.nextPageToken) break;
  続き = `&pageToken=${j.nextPageToken}`;
}
console.log(`団体 ${一覧.length} 件\n`);

let 写した = 0;
let 消した = 0;
let 何もしない = 0;

for (const { id, 中身 } of 一覧) {
  const 移すもの = Object.fromEntries(
    Object.entries(中身).filter(([k]) => !公開してよい.includes(k))
  );
  const 鍵たち = Object.keys(移すもの);

  if (!鍵たち.length) {
    console.log(`  ${id} … 公開の帳面はすでに ${公開してよい.join('・')} だけ`);
    何もしない++;
    continue;
  }
  console.log(`  ${id} … 移すもの: ${鍵たち.join('・')}`);

  if (命令 === '写す') {
    // すでに private に記録があれば上書きしない。あとから押した同意を
    // 古い記録で潰さないため
    const 先 = `${根}/group_accounts/${id}/private/consent`;
    const 既存 = await fetch(先, { headers: 頭 });
    if (既存.ok) {
      console.log('      すでに private にあるので触りません');
      continue;
    }
    const w = await fetch(先, {
      method: 'PATCH',
      headers: 頭,
      body: JSON.stringify({ fields: Object.fromEntries(鍵たち.map((k) => [k, 値へ(移すもの[k])])) }),
    });
    if (w.ok) {
      console.log('      private へ写しました');
      写した++;
    } else {
      console.log(`      ★写せません（HTTP ${w.status}）`);
    }
  }

  if (命令 === '消す') {
    // private に写っていることを確かめてからでないと消さない
    const 先 = `${根}/group_accounts/${id}/private/consent`;
    const 既存 = await fetch(先, { headers: 頭 });
    if (!既存.ok) {
      console.log('      ★private にまだ写っていないので消しません（先に 写す）');
      continue;
    }
    const 写り = 素へ((await 既存.json()).fields);
    const 足りない = 鍵たち.filter((k) => !(k in 写り));
    if (足りない.length) {
      console.log(`      ★private に ${足りない.join('・')} が無いので消しません`);
      continue;
    }
    // updateMask には**消したい鍵**を並べ、本文からはそれを省く。
    // Firestore は「網に載っていて本文に無い鍵」を消す。
    // 残したい鍵を網に並べると「そこだけ更新して他は触らない」になり、
    // 消したつもりで何も消えない（実際それで空振りした）
    // 項目の道は、英数字と _ だけの名前でなければ逆引用符で囲む決まり。
    // 囲まずに送ると、その項目だけ黙って消えない（「消しました」と返るのに
    // 残る。実際、日本語の名前の項目だけが残って気づいた）
    const 道にする = (k) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(k) ? k : '`' + k.replace(/`/g, '\`') + '`');
    const 網 = 鍵たち
      .map((k) => `updateMask.fieldPaths=${encodeURIComponent(道にする(k))}`)
      .join('&');
    const w = await fetch(`${根}/group_accounts/${id}?${網}`, {
      method: 'PATCH',
      headers: 頭,
      body: JSON.stringify({ fields: {} }),
    });
    if (w.ok) {
      console.log('      公開の帳面から消しました');
      消した++;
    } else {
      console.log(`      ★消せません（HTTP ${w.status}）`);
    }
  }
}

console.log('');
if (!命令) {
  console.log('数えただけです。写すには末尾に 写す、消すには 消す を付けてください。');
} else {
  console.log(`写した: ${写した} 件 / 消した: ${消した} 件 / 触っていない: ${何もしない} 件`);
}
