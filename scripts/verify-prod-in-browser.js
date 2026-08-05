/**
 * 本番のセキュリティルールを、ログイン済みのブラウザから実測する。
 *
 * 使い方:
 *   1. 団体アカウントで本番アプリにログインした状態にする
 *   2. 下の STAGE を、いま適用したルールの段階に合わせる（1 または 2）
 *   3. このファイルの中身をブラウザの開発者ツールのコンソールに貼り付けて実行
 *
 * パスワードの入力は不要。ログイン済みのセッションをそのまま使う。
 *
 * 本番のデータは変更しない。書き込みの確認は、拒否されることを期待する
 * 試行のみで、万一通ってしまった場合はその場で消す。
 */
(async () => {
  const STAGE = 1;                                  // ← 1 か 2 に変える
  const PROJECT = 'kyudoscoremanager';
  const MY_GROUP = '910280';                        // ← 自分がログインしている団体
  const OTHER_GROUP = '265294';                     // ← 他団体（読めてはいけない）

  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

  // ── ログイン済みセッションの ID トークンを取り出す ──────────────
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
  if (!rec) return console.error('ログインしていません。団体アカウントでログインしてから実行してください。');
  if (rec.value.isAnonymous) return console.error('部員ログインでは実行できません。団体アカウントでログインしてください。');
  const groupToken = rec.value.stsTokenManager.accessToken;
  console.log(`ログイン中: ${rec.value.email}（団体 ${MY_GROUP} として確認します）`);

  // ── 匿名トークンを1つ用意する（部員セッションの再現） ──────────
  // API キーは認証レコードの中に入っている（公開値なので秘密ではない）
  let anonToken = null, anonUid = null;
  try {
    const apiKey = rec.value.apiKey
      || (rec.fbase_key || '').split(':')[2];
    if (!apiKey) throw new Error('API キーが見つかりません');
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true }),
    });
    const j = await r.json();
    if (!j.idToken) throw new Error(j.error?.message || '匿名サインインに失敗');
    anonToken = j.idToken; anonUid = j.localId;
  } catch (e) {
    console.warn('匿名トークンを用意できませんでした。部員側の確認は飛ばします:', e.message);
  }

  const call = async (path, { token, method = 'GET', body } = {}) => {
    const r = await fetch(base + path, {
      method,
      headers: {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return r.status;
  };

  // 自団体の有効な個人IDを1つ拾っておく（第2段階の確認に使う）
  let samplePid = null;
  try {
    const r = await fetch(`${base}/groups/${MY_GROUP}/member_lookup?pageSize=1`, {
      headers: { Authorization: 'Bearer ' + groupToken },
    });
    const j = await r.json();
    samplePid = (j.documents || [])[0]?.name.split('/').pop() || null;
  } catch { /* 逆引き表がまだ無い場合は null のまま */ }

  // ── 確認する項目 ──────────────────────────────────────────────
  const 未認証 = { token: null }, 団体 = { token: groupToken }, 匿名 = { token: anonToken };

  const cases = [
    // どちらの段階でも同じであるべきもの
    { name: '未認証：自団体の記録を読む', ...未認証, path: `/groups/${MY_GROUP}/sessions`, expect: [403] },
    { name: '未認証：他団体の記録を読む', ...未認証, path: `/groups/${OTHER_GROUP}/sessions`, expect: [403] },
    { name: '未認証：他団体の名簿を読む', ...未認証, path: `/groups/${OTHER_GROUP}/members`, expect: [403] },
    { name: '未認証：お問い合わせを読む', ...未認証, path: '/inquiries', expect: [403] },
    { name: '未認証：団体の一覧を取る', ...未認証, path: '/group_accounts', expect: [403] },
    { name: '未認証：団体を1件取る（ログインに必要）', ...未認証, path: `/group_accounts/${MY_GROUP}`, expect: [200] },
    { name: '団体：自団体の記録を読む', ...団体, path: `/groups/${MY_GROUP}/sessions`, expect: [200] },
    { name: '団体：自団体の名簿を読む', ...団体, path: `/groups/${MY_GROUP}/members`, expect: [200] },
    { name: '団体：自団体の設定を読む', ...団体, path: `/groups/${MY_GROUP}/config/app_settings`, expect: [200] },

    // 段階によって期待値が変わるもの
    { name: '団体：他団体の記録を読む', ...団体, path: `/groups/${OTHER_GROUP}/sessions`,
      expect: STAGE === 1 ? [200] : [403], note: STAGE === 1 ? '第1段階では通る（移行に必要）' : '第2段階では遮断' },
    { name: '団体：団体の一覧を取る', ...団体, path: '/groups', expect: STAGE === 1 ? [200] : [403],
      note: STAGE === 1 ? '第1段階では通る' : '団体の存在を数えられないようにする' },
    { name: '部員(所属未証明)：自団体の記録を読む', ...匿名, path: `/groups/${MY_GROUP}/sessions`,
      expect: STAGE === 1 ? [200] : [403] },
    { name: '部員(所属未証明)：名簿を読む', ...匿名, path: `/groups/${MY_GROUP}/members`,
      expect: STAGE === 1 ? [200] : [403] },
    { name: '部員：逆引き表を一覧で取る', ...匿名, path: `/groups/${MY_GROUP}/member_lookup`,
      expect: STAGE === 1 ? [200] : [403], note: '一覧が取れると個人IDを総当たりされる' },
  ];

  if (samplePid) {
    cases.push({ name: '部員：正しい個人IDで1件取る', ...匿名,
      path: `/groups/${MY_GROUP}/member_lookup/${samplePid}`, expect: [200], note: 'ログインに必要' });
    cases.push({ name: '部員：でたらめな個人IDで1件取る', ...匿名,
      path: `/groups/${MY_GROUP}/member_lookup/0000`, expect: [403, 404] });
  } else {
    console.warn('逆引き表がまだ空のため、個人IDまわりの確認は飛ばします（手順2を実施してから再実行してください）');
  }

  // ── 実行 ──────────────────────────────────────────────────────
  // 測れなかったものは飛ばさずに「未測定」として残す。
  // 黙って飛ばすと、部員側を1項目も見ていないのに合格と表示されてしまう。
  const results = [];
  for (const c of cases) {
    if (c.token === null && c.name.startsWith('部員')) {
      results.push({
        確認内容: c.name, 期待: c.expect.join(' か '), 実際: '-',
        判定: '未測定', 備考: '匿名トークンを用意できませんでした',
      });
      continue;
    }
    const status = await call(c.path, { token: c.token });
    results.push({
      確認内容: c.name,
      期待: c.expect.join(' か '),
      実際: status,
      判定: c.expect.includes(status) ? 'OK' : 'NG',
      備考: c.note || '',
    });
  }

  // ── 書き込みの確認（拒否されるはずのものだけ。通ったら消す） ────
  // 書き込み先の名前を __ で囲まないこと。Firestore の予約名にあたり、
  // ルールを評価する前に 400 で弾かれて確認にならない。
  if (STAGE === 2 && !anonToken) {
    results.push({ 確認内容: '部員(所属未証明)：記録を書き込む', 期待: '403', 実際: '-',
      判定: '未測定', 備考: '匿名トークンを用意できませんでした' });
    results.push({ 確認内容: '部員：別人の memberId で所属を名乗る', 期待: '403', 実際: '-',
      判定: '未測定', 備考: '匿名トークンを用意できませんでした' });
  }
  if (STAGE === 2 && anonToken) {
    const probe = `/groups/${MY_GROUP}/sessions/zzz-verify-probe`;
    const st = await call(probe, {
      token: anonToken, method: 'PATCH',
      body: { fields: { title: { stringValue: 'verify' } } },
    });
    results.push({
      確認内容: '部員(所属未証明)：記録を書き込む',
      期待: '403', 実際: st, 判定: st === 403 ? 'OK' : 'NG',
      備考: st === 200 ? '通ってしまったため削除しました' : '',
    });
    if (st === 200) await call(probe, { token: groupToken, method: 'DELETE' });

    // 正しい個人IDを知っていても、別人の memberId では所属を名乗れないこと
    if (samplePid && anonUid) {
      const claim = `/member_claims/${anonUid}`;
      const st2 = await call(claim, {
        token: anonToken, method: 'PATCH',
        body: { fields: {
          groupId: { stringValue: MY_GROUP },
          memberId: { stringValue: 'zzz-not-my-member-id' },
          personalId: { stringValue: samplePid },
          claimedAt: { integerValue: String(Date.now()) },
        } },
      });
      results.push({
        確認内容: '部員：別人の memberId で所属を名乗る',
        期待: '403', 実際: st2, 判定: st2 === 403 ? 'OK' : 'NG',
        備考: st2 === 200 ? '通ってしまったため削除しました' : 'なりすまし防止',
      });
      if (st2 === 200) await call(claim, { token: anonToken, method: 'DELETE' });
    }
  }

  console.table(results);
  const ng = results.filter((r) => r.判定 === 'NG');
  const 未測定 = results.filter((r) => r.判定 === '未測定');
  if (ng.length) { console.error(`不合格：${ng.length} 項目が想定と違います`); console.table(ng); }
  if (未測定.length) {
    console.error(`測れなかった項目が ${未測定.length} 件あります。合格とは言えません。`);
    console.table(未測定);
  }
  if (!ng.length && !未測定.length) {
    console.log(`合格：${results.length} 項目すべて想定どおりです（第${STAGE}段階）`);
  }
})();
