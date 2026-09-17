/**
 * 手元にあるのにクラウドへ届いていない記録を見つけて、送り直す。
 *
 * 使い方:
 *   1. 記録が残っている端末で、アプリに団体アカウントでログインした状態にする
 *   2. インターネットに確実につながる場所で行う
 *   3. このファイルの中身をブラウザの開発者ツールのコンソールに貼り付けて実行
 *
 * パスワードの入力は不要。ログイン済みのセッションをそのまま使う。
 *
 * 既定は下見（何も書かない）。実際に送るには DRY_RUN を false にする。
 *
 * 背景:
 * オフラインで保存すると、記録は手元に「同期済み」として記録されるが、
 * クラウドへの送信は保留のままになる。その状態でアプリを閉じ、かつ
 * オフライン永続化が効いていなかった場合（タブを複数開いていたときなど）、
 * 送信は失われる。手元は「同期済み」なので再送の対象にもならず、
 * その記録はクラウドに永久に届かない。
 */
(async () => {
  const DRY_RUN = true;                 // ← 実際に送るときは false にする

  // ── ログイン済みセッションから、団体IDとトークンを取り出す ──────
  const 状態 = JSON.parse(localStorage.getItem('archery-score-storage') || '{}').state || {};
  const GID = 状態.activeGroupId;
  if (!GID) { console.error('ログインしていません。団体アカウントでログインしてから実行してください。'); return; }
  if (状態.activeRole !== 'group') console.warn('※ 団体アカウントでの実行を推奨します（現在: ' + 状態.activeRole + '）');

  const idb = await new Promise((res, rej) => {
    const r = indexedDB.open('firebaseLocalStorageDb');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  const rows = await new Promise((res, rej) => {
    const tx = idb.transaction('firebaseLocalStorage', 'readonly');
    const q = tx.objectStore('firebaseLocalStorage').getAll();
    q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
  });
  const rec = rows.find((r) => r.value && r.value.stsTokenManager);
  if (!rec) { console.error('認証情報が見つかりません。'); return; }
  const token = rec.value.stsTokenManager.accessToken;

  const PROJECT = 'kyudoscoremanager';
  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
  const H = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };

  // ── クラウドにある記録のIDを集める ────────────────────────────
  const クラウド = new Set();
  let tok = '';
  do {
    const r = await fetch(`${base}/groups/${GID}/sessions?pageSize=300&mask.fieldPaths=id${tok ? `&pageToken=${tok}` : ''}`, { headers: H });
    if (!r.ok) { console.error(`クラウドの記録を取得できません (HTTP ${r.status})`); return; }
    const j = await r.json();
    (j.documents || []).forEach((d) => クラウド.add(d.name.split('/').pop()));
    tok = j.nextPageToken || '';
  } while (tok);

  // ── 手元にあってクラウドに無いものを探す ──────────────────────
  const 手元 = (状態.sessions || []).filter((s) => s && s.id);
  const 届いていない = 手元.filter((s) => !クラウド.has(s.id));

  console.log(`団体 ${GID}｜手元 ${手元.length}件／クラウド ${クラウド.size}件`);
  if (!届いていない.length) { console.log('すべての記録がクラウドに届いています。送り直すものはありません。'); return; }

  console.table(届いていない.map((s) => ({
    練習日: new Date(s.date).toLocaleString('ja-JP'),
    題名: s.title || '(なし)',
    射手: (s.archers || []).length + '名',
    手元の状態: s.syncStatus,
    ID: String(s.id).slice(0, 12) + '…',
  })));

  if (DRY_RUN) { console.log(`\n★ ${届いていない.length} 件が届いていません。送るには DRY_RUN を false にして再実行してください。`); return; }

  // ── 送り直す ──────────────────────────────────────────────────
  // 日時は数値で入れる。入れ物の形にしないこと（同期の判定が働かなくなる）
  const 値 = (v) => {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (typeof v === 'string') return { stringValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(値) } };
    if (typeof v === 'object') {
      if (typeof v.seconds === 'number') return { integerValue: String(v.seconds * 1000) };
      const f = {}; for (const k of Object.keys(v)) f[k] = 値(v[k]);
      return { mapValue: { fields: f } };
    }
    return { stringValue: String(v) };
  };

  let 成功 = 0, 失敗 = 0;
  for (const s of 届いていない) {
    const doc = { ...s, syncStatus: '同期済み', lastModified: Date.now() };
    const fields = {}; for (const k of Object.keys(doc)) if (doc[k] !== undefined) fields[k] = 値(doc[k]);
    const r = await fetch(`${base}/groups/${GID}/sessions/${s.id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ fields }) });
    if (r.ok) { 成功++; console.log(`  送信 ${new Date(s.date).toLocaleString('ja-JP')}（射手${(s.archers || []).length}名）`); }
    else { 失敗++; console.error(`  失敗 ${s.id} HTTP ${r.status} ${(await r.text()).slice(0, 120)}`); }
  }
  console.log(`\n${成功} 件を送りました（失敗 ${失敗} 件）。他の端末で履歴を確認してください。`);
})();
