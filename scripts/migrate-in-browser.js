/**
 * ブラウザのログイン済みセッションから逆引き表を作る移行スクリプト。
 *
 * 使い方:
 *   1. 団体アカウントでアプリにログインした状態にする
 *   2. このファイルの中身をブラウザの開発者ツールのコンソールに貼り付けて実行
 *
 * パスワードの入力は不要。すでにログインしているセッションをそのまま使う。
 *
 * 前提: 第1段階のルール（または適用前の状態）であること。
 * 第2段階を先に入れると他団体へ書けなくなり、途中で止まる。
 *
 * 既存データは変更しない。member_lookup コレクションを足すだけ。
 * 何度実行しても結果は同じ（冪等）。
 */
(async () => {
  const PROJECT = 'kyudoscoremanager';
  const DRY_RUN = true;                             // ← 実行するときは false にする
  // 団体は group_accounts から取る。書き並べると、あとから増えた団体を取りこぼす。

  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

  // ログイン済みセッションの ID トークンを取り出す
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open('firebaseLocalStorageDb');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  const rows = await new Promise((res, rej) => {
    const tx = db.transaction('firebaseLocalStorage', 'readonly');
    const q = tx.objectStore('firebaseLocalStorage').getAll();
    q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
  });
  const rec = rows.find((r) => r.value && r.value.stsTokenManager);
  if (!rec) { console.error('ログインしていません。団体アカウントでログインしてから実行してください。'); return; }
  const token = rec.value.stsTokenManager.accessToken;
  console.log(`ログイン中: ${rec.value.email || '(匿名)'}`);
  if (rec.value.isAnonymous) { console.error('部員ログインでは実行できません。団体アカウントでログインしてください。'); return; }

  const call = async (path, opt = {}) => {
    const r = await fetch(base + path, {
      method: opt.method || 'GET',
      headers: { Authorization: 'Bearer ' + token, ...(opt.body ? { 'Content-Type': 'application/json' } : {}) },
      body: opt.body ? JSON.stringify(opt.body) : undefined,
    });
    return { status: r.status, json: await r.json().catch(() => null) };
  };
  const listAll = async (path, mask) => {
    const out = []; let pageToken = '';
    do {
      const q = new URLSearchParams({ pageSize: '300' });
      if (pageToken) q.set('pageToken', pageToken);
      (mask || []).forEach((f) => q.append('mask.fieldPaths', f));
      const { status, json } = await call(`${path}?${q}`);
      if (status !== 200) throw new Error(`${path} の取得に失敗 (HTTP ${status})`);
      (json.documents || []).forEach((d) => out.push({ id: d.name.split('/').pop(), data: d.fields || {} }));
      pageToken = json.nextPageToken || '';
    } while (pageToken);
    return out;
  };

  const summary = [];
  let blocked = false;
  let written = 0;

  // 団体の一覧を取る。第1段階のルールでは list が管理者のみなので、
  // 取れない場合は groups の親ドキュメントから拾う。
  let GROUPS;
  try {
    GROUPS = (await listAll('/group_accounts', ['id'])).map((d) => d.id);
  } catch {
    console.warn('group_accounts の一覧を取得できませんでした。groups から拾います。');
    GROUPS = (await listAll('/groups', [])).map((d) => d.id);
  }
  if (!GROUPS.length) { console.error('団体が1件も見つかりません。中断します。'); return; }
  console.log(`対象の団体（${GROUPS.length}件）: ${GROUPS.join(', ')}`);

  for (const gid of GROUPS) {
    const members = await listAll(`/groups/${gid}/members`, ['personalId']);
    const valid = [], invalid = [], dup = [];
    const seen = new Map();
    for (const m of members) {
      const pid = m.data.personalId?.stringValue;
      if (!/^\d{4}$/.test(pid || '')) { invalid.push(m.id); continue; }
      if (seen.has(pid)) { dup.push(pid); continue; }
      seen.set(pid, m.id);
      valid.push({ personalId: pid, memberId: m.id });
    }
    if (dup.length) { console.error(`団体 ${gid}: 個人IDの重複 ${dup.join(', ')}`); blocked = true; }
    if (invalid.length) console.warn(`団体 ${gid}: 4桁でない個人ID ${invalid.length} 件（スキップ）`);

    if (!DRY_RUN && !dup.length) {
      // 168件で30秒ほどかかる。途中経過を出して、止まっていないことが分かるようにする
      console.log(`団体 ${gid}: ${valid.length} 件を書き込みます…`);
      let n = 0;
      for (const v of valid) {
        const r = await call(`/groups/${gid}/member_lookup/${v.personalId}`, {
          method: 'PATCH',
          body: { fields: { memberId: { stringValue: v.memberId }, updatedAt: { integerValue: String(Date.now()) } } },
        });
        if (r.status !== 200) { console.error(`団体 ${gid} / 個人ID ${v.personalId} 失敗 (HTTP ${r.status})`); blocked = true; }
        else { written++; n++; if (n % 25 === 0) console.log(`  ${n} / ${valid.length}`); }
      }
    }

    let lookupCount = '-';
    if (!DRY_RUN) {
      lookupCount = (await listAll(`/groups/${gid}/member_lookup`, ['memberId'])).length;
      if (lookupCount !== valid.length) {
        console.error(`団体 ${gid}: 件数不一致 members(有効)=${valid.length} / member_lookup=${lookupCount}`);
        blocked = true;
      }
    }
    summary.push({ 団体: gid, メンバー: members.length, 有効な4桁ID: valid.length, 不正: invalid.length, 重複: dup.length, 逆引き表: lookupCount });
  }

  console.table(summary);
  if (DRY_RUN) console.log('確認のみで終了しました。実行するには DRY_RUN を false にしてください。');
  else if (blocked) console.error('不合格：上記を解消してから再実行してください。');
  else console.log(`合格：${written} 件を書き込み、全団体で件数が一致しました。`);
})();
