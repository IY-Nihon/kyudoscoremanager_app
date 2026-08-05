/**
 * 本番の受け入れ検査。反映がすべて終わったあとに通す。
 *
 *   node scripts/verify-prod-acceptance.mjs
 *
 * 読み取りが中心。書き込みは「拒否されるはず」の試行だけで、
 * 万一通ってしまった場合はその場で消す。本番のデータは変えない。
 *
 * 個人IDは控えから取る（第2段階では逆引き表を一覧できないため）。
 */
import fs from 'node:fs';

const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/).filter((l) => l.includes('='))
  .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const PID = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const KEY = env.EXPO_PUBLIC_FIREBASE_API_KEY;
const RTDB = env.EXPO_PUBLIC_FIREBASE_DATABASE_URL;
const B = `https://firestore.googleapis.com/v1/projects/${PID}/databases/(default)/documents`;

const dirs = fs.readdirSync('backup-output', { withFileTypes: true })
  .filter((d) => d.isDirectory()).map((d) => d.name).sort();
const BK = `backup-output/${dirs[dirs.length - 1]}`;

const anon = async () => {
  const j = await (await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }),
  })).json();
  return { token: j.idToken, uid: j.localId };
};
const st = async (p, { token, method = 'GET', body } = {}) => (await fetch(B + p, {
  method, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}),
    ...(body ? { 'Content-Type': 'application/json' } : {}) },
  body: body ? JSON.stringify(body) : undefined })).status;
const all = async (p, token) => { const o = []; let t = '';
  for (;;) { const r = await fetch(`${B}${p}?pageSize=300${t ? `&pageToken=${t}` : ''}`,
      { headers: token ? { Authorization: 'Bearer ' + token } : {} });
    if (!r.ok) return o; const j = await r.json();
    (j.documents || []).forEach((d) => o.push(d)); if (!j.nextPageToken) break; t = j.nextPageToken; } return o; };

const rows = [];
let n = 0;
const 検査 = (分類, 内容, 期待, 実際) => {
  const ok = (Array.isArray(期待) ? 期待 : [期待]).some((e) => String(e) === String(実際));
  rows.push({ '#': ++n, 分類, 確認内容: 内容, 期待: Array.isArray(期待) ? 期待.join('か') : 期待, 実際, 判定: ok ? 'OK' : 'NG' });
};

const MY = '910280', OTHER = '265294';
const a = await anon();

// ── 1. 誰でも読めた穴が閉じているか ──────────────────────────
検査('遮断', '未認証：自団体の記録を読む', 403, await st(`/groups/${MY}/sessions`));
検査('遮断', '未認証：他団体の記録を読む', 403, await st(`/groups/${OTHER}/sessions`));
検査('遮断', '未認証：他団体の名簿を読む', 403, await st(`/groups/${OTHER}/members`));
検査('遮断', '未認証：お問い合わせを読む', 403, await st('/inquiries'));
検査('遮断', '未認証：団体の一覧を取る', 403, await st('/group_accounts'));
検査('遮断', '未認証：記録を書き込む', 403,
  await st(`/groups/${MY}/sessions/zzz-acc-probe`, { method: 'PATCH', body: { fields: { t: { stringValue: 'x' } } } }));

// ── 2. ログインに必要な経路は残っているか ────────────────────
検査('経路', '未認証：団体を1件取る（ログインに必要）', 200, await st(`/group_accounts/${MY}`));

// ── 3. 所属を証明していない部員 ──────────────────────────────
検査('遮断', '所属未証明：自団体の記録', 403, await st(`/groups/${MY}/sessions`, { token: a.token }));
検査('遮断', '所属未証明：自団体の名簿', 403, await st(`/groups/${MY}/members`, { token: a.token }));
検査('遮断', '所属未証明：逆引き表を一覧', 403, await st(`/groups/${MY}/member_lookup`, { token: a.token }));
検査('遮断', '所属未証明：記録を書き込む', 403,
  await st(`/groups/${MY}/sessions/zzz-acc-probe`, { token: a.token, method: 'PATCH', body: { fields: { t: { stringValue: 'x' } } } }));

// ── 4. 部員ログインの経路（3団体） ───────────────────────────
for (const [g, other] of [[MY, OTHER], [OTHER, '897977'], ['897977', MY]]) {
  const ms = JSON.parse(fs.readFileSync(`${BK}/firestore/groups__${g}__members.json`, 'utf8')).documents || [];
  const m = ms.find((d) => /^\d{4}$/.test(d.fields?.personalId?.stringValue || ''));
  const pid = m.fields.personalId.stringValue, mid = m.name.split('/').pop();
  const s = await anon();
  検査('部員', `団体${g}：正しい個人IDで1件取る`, 200, await st(`/groups/${g}/member_lookup/${pid}`, { token: s.token }));
  検査('部員', `団体${g}：でたらめな個人ID`, [403, 404], await st(`/groups/${g}/member_lookup/0000`, { token: s.token }));
  検査('部員', `団体${g}：別人になりすます`, 403, await st(`/member_claims/${s.uid}`, { token: s.token, method: 'PATCH',
    body: { fields: { groupId: { stringValue: g }, memberId: { stringValue: 'zzz-not-mine' },
      personalId: { stringValue: pid }, claimedAt: { integerValue: String(Date.now()) } } } }));
  検査('部員', `団体${g}：正しく所属を名乗る`, 200, await st(`/member_claims/${s.uid}`, { token: s.token, method: 'PATCH',
    body: { fields: { groupId: { stringValue: g }, memberId: { stringValue: mid },
      personalId: { stringValue: pid }, claimedAt: { integerValue: String(Date.now()) } } } }));
  検査('部員', `団体${g}：証明後に自団体を読む`, 200, await st(`/groups/${g}/sessions`, { token: s.token }));
  検査('分離', `団体${g}：証明後も他団体(${other})は読めない`, 403, await st(`/groups/${other}/sessions`, { token: s.token }));
  検査('部員', `団体${g}：ログアウト（クレーム削除）`, 200, await st(`/member_claims/${s.uid}`, { token: s.token, method: 'DELETE' }));
}

// ── 5. RTDB ──────────────────────────────────────────────────
{
  const r1 = await fetch(`${RTDB}/live_sessions/${MY}.json`);
  検査('RTDB', '未認証：ライブ記録を読む', 401, r1.status);
  const r2 = await fetch(`${RTDB}/live_sessions/${MY}.json?auth=${a.token}`);
  検査('RTDB', '認証あり：ライブ記録を読む', 200, r2.status);
  const r3 = await fetch(`${RTDB}/.json?auth=${a.token}`);
  検査('RTDB', '認証あり：全体を列挙する', 401, r3.status);
}

// ── 6. データの整合 ──────────────────────────────────────────
{
  const s = await anon();
  // 団体本人でないと名簿は読めないので、控えと逆引き表（get）で照合する
  let 総逆引き = 0, 総名簿 = 0, 一致 = 0;
  for (const g of ['265294', '698098', '897977', '910280']) {
    const ms = JSON.parse(fs.readFileSync(`${BK}/firestore/groups__${g}__members.json`, 'utf8')).documents || [];
    const 有効 = ms.filter((d) => /^\d{4}$/.test(d.fields?.personalId?.stringValue || ''));
    総名簿 += 有効.length;
    for (const m of 有効) {
      const pid = m.fields.personalId.stringValue;
      const r = await fetch(`${B}/groups/${g}/member_lookup/${pid}`, { headers: { Authorization: 'Bearer ' + s.token } });
      if (r.status === 200) { 総逆引き++;
        const j = await r.json();
        if (j.fields?.memberId?.stringValue === m.name.split('/').pop()) 一致++; }
    }
  }
  検査('データ', '逆引き表の件数が名簿と一致', 総名簿, 総逆引き);
  検査('データ', '逆引き先がすべて正しい部員を指す', 総名簿, 一致);
}

// ── 7. 配信内容 ──────────────────────────────────────────────
{
  const html = await (await fetch('https://kyudoscoremanager.web.app/')).text();
  const bundle = (html.match(/AppEntry-[a-f0-9]+\.js/) || [])[0];
  const local = fs.existsSync('dist/_expo/static/js/web')
    ? fs.readdirSync('dist/_expo/static/js/web').find((x) => x.endsWith('.js')) : null;
  検査('配信', '本番のバンドルが手元のビルドと同じ', local, bundle);
  const h = await fetch('https://kyudoscoremanager.web.app/index.html');
  検査('配信', 'index.html が毎回確認される', 'no-cache', h.headers.get('cache-control'));
  const h2 = await fetch(`https://kyudoscoremanager.web.app/_expo/static/js/web/${bundle}`);
  検査('配信', 'バンドルは長期キャッシュ', 'public, max-age=31536000, immutable', h2.headers.get('cache-control'));
}

// ── 8. 後始末の確認 ──────────────────────────────────────────
検査('片づけ', '確認用の記録が残っていない', [403, 404], await st(`/groups/${MY}/sessions/zzz-acc-probe`, { token: a.token }));

console.log(`■ 本番の受け入れ検査（${PID}）\n`);
console.table(rows);
const ng = rows.filter((r) => r.判定 === 'NG');
console.log(ng.length ? `\n不合格 ${ng.length} / ${rows.length}件` : `\n合格：${rows.length}項目すべて想定どおり`);
if (ng.length) { console.table(ng); process.exit(1); }
