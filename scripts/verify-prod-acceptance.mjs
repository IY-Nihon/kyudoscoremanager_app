/**
 * 受け入れ検査。反映がすべて終わったあとに通す。
 *
 *   node scripts/verify-prod-acceptance.mjs           （検証環境。書き込みの検査もする）
 *   node scripts/verify-prod-acceptance.mjs prod      （本番。読むだけ）
 *
 * ■ 本番は読むだけ（2026-11-02 に決めた）
 * 前は本番でも匿名の口座を作り、所属の証を書き、「断られるはずの書き込み」を試していた（通ったら
 * 残る）。本番では、未認証で読めないこと・ログインに要る 1 件が読めること・RTDB・配信の中身だけを見る。
 * 匿名で入る・書く検査は、検証環境で同じ決まりに当てて確かめる（決まりは同じものを配る）。
 * 検証環境で作った匿名の口座は終わりに消し、通ってしまった書き込みもその場で消す。
 *
 * 本番の団体 ID は倉庫に書かない。本番は PROD_GROUPS="A,B,C,D" の順で渡す（A は自分の団体）。
 * 検証環境は台帳の団体（scripts/stg-fixtures.mjs）を使う。部員の個人ID は持ち主で入って名簿から取る。
 *
 * ■ App Check（2026-11-13 に本番の Firestore と Realtime Database で強制した）
 * 本番は、App Check の印（X-Firebase-AppCheck）の無い通信をすべて断る。この台本は Node から呼ぶので印を持たない。
 *   ・印なしで流す（ふつう） … 「印が無ければ、ログインに要る 1 件も読めない」ことを見る（強制が効いている確かめ）。
 *     決まり（rules）そのものの確かめにはならない（印で先に断られる）。決まりは検証環境で同じものに当てて見る
 *   ・APPCHECK_TOKEN に印を渡して流す … 決まりまで届くので、未認証で読めない・ログインに要る 1 件が読めるを本番で見られる。
 *     印は、本番のアプリを開いたブラウザーの IndexedDB（firebase-app-check-database）にある 1 時間だけ使える値
 * 検証環境は強制していないので、今までどおり。
 */
import fs from 'node:fs';
import { configFor, signIn, signInAnonymously, 検証のパスワード, 検証環境でメールを確認済みにする } from './fb-rest.mjs';
import { 団体たち as 検証の団体たち } from './stg-fixtures.mjs';

const 対象 = process.argv[2] || 'stg';
if (!['stg', 'prod'].includes(対象)) {
  console.error('使い方: node scripts/verify-prod-acceptance.mjs <stg|prod>');
  process.exit(1);
}
const 書いてよい = 対象 === 'stg';
const { apiKey: KEY, projectId: PID, databaseURL: RTDB } = configFor(対象);
const B = `https://firestore.googleapis.com/v1/projects/${PID}/databases/(default)/documents`;
const IDT = 'https://identitytoolkit.googleapis.com/v1/accounts';

const 団体の並び =
  対象 === 'prod'
    ? String(process.env.PROD_GROUPS || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
    : ['100001', '100002', '100003', '100007'];
if (団体の並び.length < 4) {
  console.error('PROD_GROUPS に本番の団体 ID を 4 つ（自分の団体を先頭に）, 区切りで渡してください');
  process.exit(1);
}
const [MY, OTHER, 団体C, 団体D] = 団体の並び;

const 印 = String(process.env.APPCHECK_TOKEN || '').trim();
/** 本番で、印を持たずに流しているか（決まりより先に App Check で断られる） */
const 印なしの本番 = 対象 === 'prod' && !印;
const st = async (p, { token, method = 'GET', body, 印を付けない = false } = {}) =>
  (
    await fetch(B + p, {
      method,
      headers: {
        ...(印 && !印を付けない ? { 'X-Firebase-AppCheck': 印 } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  ).status;

const rows = [];
let n = 0;
const 検査 = (分類, 内容, 期待, 実際) => {
  const ok = (Array.isArray(期待) ? 期待 : [期待]).some((e) => String(e) === String(実際));
  rows.push({
    '#': ++n,
    分類,
    確認内容: 内容,
    期待: Array.isArray(期待) ? 期待.join('か') : 期待,
    実際,
    判定: ok ? 'OK' : 'NG',
  });
};

// ── 検証環境だけ：作った匿名の口座と、通ってしまった書き込みの片づけ ──
const 作った口座 = [];
const 匿名 = async () => {
  const { idToken, uid } = await signInAnonymously(KEY);
  作った口座.push(idToken);
  return { token: idToken, uid };
};
/** 断られるはずの書き込み。通ってしまったら（200）、その場で消す */
const 断られるはずの書き込み = async (道, token) => {
  const 状態 = await st(道, { token, method: 'PATCH', body: { fields: { t: { stringValue: 'x' } } } });
  if (状態 === 200) {
    const 消した = await st(道, { token, method: 'DELETE' });
    // 決まりを配った直後は、書けたのに消せないことがある（行き渡る途中）。残ったら持ち主で消す
    if (消した !== 200) console.warn(`！ 試しに書いたものが残りました（持ち主で消してください）: ${道}`);
  }
  return 状態;
};
const 片づける = async () => {
  for (const idToken of 作った口座) {
    await fetch(`${IDT}:delete?key=${KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }).catch(() => {});
  }
};

/** 名簿の 1 人を読む（部員の証で） */
const 名簿の人 = async (g, mid, token) =>
  (await fetch(`${B}/groups/${g}/members/${mid}`, { headers: { Authorization: 'Bearer ' + token } })).json();
/** 名簿の 1 つの項目だけを書く（updateMask で、ほかの項目に触らない） */
const 項目を書く = (g, mid, 項目, 値, token) =>
  st(`/groups/${g}/members/${mid}?updateMask.fieldPaths=${項目}`, {
    token,
    method: 'PATCH',
    body: { fields: { [項目]: 値 } },
  });
/**
 * 部員（個人ログイン）の書き込みは絞る（2026-11-02 決めた。firestore.rules）。
 * 記録を消す・名簿を作る・ゴミ箱・卒業生・練習日は団体だけ。自分の名簿は弓具だけ直せる。
 * 書く値は今の値と同じにする（通っても名簿は変わらない）。名前は変えてみて、通ったら元へ戻す
 */
const 部員の書き込みを試す = async (g, mid, 別のmid, token) => {
  検査(
    '部員',
    `団体${g}：記録を消す`,
    403,
    await st(`/groups/${g}/sessions/zz-kensa`, { token, method: 'DELETE' })
  );
  for (const [名, 道] of [
    ['名簿に人を足す', 'members/zz-kensa'],
    ['ゴミ箱に書く', 'trash/zz-kensa'],
    ['卒業生に書く', 'alumni/zz-kensa'],
    ['練習日を書く', 'officialPracticeDays/2099-01-01'],
  ])
    検査('部員', `団体${g}：${名}`, 403, await 断られるはずの書き込み(`/groups/${g}/${道}`, token));
  const 自分 = await 名簿の人(g, mid, token);
  if (自分.fields && 自分.fields.equipments)
    検査('部員', `団体${g}：自分の弓具を書く`, 200, await 項目を書く(g, mid, 'equipments', 自分.fields.equipments, token));
  else {
    // 弓具の無い人は、空の弓具を書いてから項目ごと外す（名簿は元のまま）
    const 書けた = await 項目を書く(g, mid, 'equipments', { arrayValue: {} }, token);
    検査('部員', `団体${g}：自分の弓具を書く`, 200, 書けた);
    if (書けた === 200) {
      const 外す = await st(`/groups/${g}/members/${mid}?updateMask.fieldPaths=equipments`, {
        token,
        method: 'PATCH',
        body: { fields: {} },
      });
      if (外す !== 200) console.warn(`！ 団体${g} の ${mid} に空の弓具が残りました`);
    }
  }
  const 名前 = (自分.fields && 自分.fields.name) || { stringValue: '' };
  const 名前を変える = await 項目を書く(g, mid, 'name', { stringValue: `${名前.stringValue || ''}（検査）` }, token);
  if (名前を変える === 200) await 項目を書く(g, mid, 'name', 名前, token);
  検査('部員', `団体${g}：自分の名前を変える`, 403, 名前を変える);
  if (別のmid) {
    const 別 = await 名簿の人(g, 別のmid, token);
    検査(
      '部員',
      `団体${g}：ほかの人の弓具を書く`,
      403,
      await 項目を書く(g, 別のmid, 'equipments', (別.fields && 別.fields.equipments) || { arrayValue: {} }, token)
    );
  }
};

/** 団体の持ち主が、メールで団体の帳面を引く（1 つのメールで団体は 1 つ。Google で作るときに使う） */
const メールで引く = async (メール, token) =>
  (
    await fetch(`${B}:runQuery`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'group_accounts' }],
          where: { fieldFilter: { field: { fieldPath: 'email' }, op: 'EQUAL', value: { stringValue: メール } } },
        },
      }),
    })
  ).status;

/** 検証環境の団体の、4 桁の個人ID を持つ部員（持ち主で入って名簿を読む） */
const 個人IDのある部員たち = async (g) => {
  const 台帳 = 検証の団体たち.find((x) => x.id === g);
  const 鍵 = await signIn(KEY, 台帳.email, 検証のパスワード());
  const j = await (
    await fetch(`${B}/groups/${g}/members?pageSize=300`, { headers: { Authorization: 'Bearer ' + 鍵 } })
  ).json();
  return (j.documents || [])
    .filter((d) => /^(\d{4}|[A-HJKMNP-Z2-9]{6})$/.test(d.fields?.personalId?.stringValue || ''))
    .map((d) => ({ pid: d.fields.personalId.stringValue, mid: d.name.split('/').pop() }));
};

try {
  // ── 1. 誰でも読めた穴が閉じているか ──────────────────────────
  検査('遮断', '未認証：自団体の記録を読む', 403, await st(`/groups/${MY}/sessions`));
  検査('遮断', '未認証：他団体の記録を読む', 403, await st(`/groups/${OTHER}/sessions`));
  検査('遮断', '未認証：他団体の名簿を読む', 403, await st(`/groups/${OTHER}/members`));
  検査('遮断', '未認証：お問い合わせを読む', 403, await st('/inquiries'));
  検査('遮断', '未認証：団体の一覧を取る', 403, await st('/group_accounts'));

  // ── 2. ログインに必要な経路は残っているか ────────────────────
  if (印なしの本番) console.log('（印なしで流しています。ログインに要る 1 件が読めるかは、APPCHECK_TOKEN を渡したときだけ見ます）');
  else 検査('経路', '未認証：団体を1件取る（ログインに必要）', 200, await st(`/group_accounts/${MY}`));
  // App Check の強制（本番だけ）。印が無ければ、決まりで読める 1 件も断られる
  if (対象 === 'prod')
    検査('印', '印なし：団体を1件取る（App Check の強制）', 403, await st(`/group_accounts/${MY}`, { 印を付けない: true }));

  if (書いてよい) {
    const a = await 匿名();
    検査(
      '遮断',
      '未認証：記録を書き込む',
      403,
      await 断られるはずの書き込み(`/groups/${MY}/sessions/zzz-acc-probe`)
    );

    // ── 3. 所属を証明していない部員 ──────────────────────────────
    検査('遮断', '所属未証明：自団体の記録', 403, await st(`/groups/${MY}/sessions`, { token: a.token }));
    検査('遮断', '所属未証明：自団体の名簿', 403, await st(`/groups/${MY}/members`, { token: a.token }));
    検査(
      '遮断',
      '所属未証明：逆引き表を一覧',
      403,
      await st(`/groups/${MY}/member_lookup`, { token: a.token })
    );
    検査(
      '遮断',
      '所属未証明：記録を書き込む',
      403,
      await 断られるはずの書き込み(`/groups/${MY}/sessions/zzz-acc-probe`, a.token)
    );

    // ── 4. 部員ログインの経路（3団体） ───────────────────────────
    for (const [g, other] of [
      [MY, OTHER],
      [OTHER, 団体D],
      [団体D, MY],
    ]) {
      const [{ pid, mid }, 別の人] = await 個人IDのある部員たち(g);
      const s = await 匿名();
      const 名乗る = (memberId) =>
        st(`/member_claims/${s.uid}`, {
          token: s.token,
          method: 'PATCH',
          body: {
            fields: {
              groupId: { stringValue: g },
              memberId: { stringValue: memberId },
              personalId: { stringValue: pid },
              claimedAt: { timestampValue: new Date().toISOString() },
            },
          },
        });
      検査(
        '部員',
        `団体${g}：正しい個人IDで1件取る`,
        200,
        await st(`/groups/${g}/member_lookup/${pid}`, { token: s.token })
      );
      検査(
        '部員',
        `団体${g}：でたらめな個人ID`,
        [403, 404],
        await st(`/groups/${g}/member_lookup/0000`, { token: s.token })
      );
      const なりすまし = await 名乗る('zzz-not-mine');
      if (なりすまし === 200) await st(`/member_claims/${s.uid}`, { token: s.token, method: 'DELETE' });
      検査('部員', `団体${g}：別人になりすます`, 403, なりすまし);
      検査('部員', `団体${g}：正しく所属を名乗る`, 200, await 名乗る(mid));
      if (書いてよい) await 部員の書き込みを試す(g, mid, 別の人 && 別の人.mid, s.token);
      検査(
        '部員',
        `団体${g}：証明後に自団体を読む`,
        200,
        await st(`/groups/${g}/sessions`, { token: s.token })
      );
      検査(
        '分離',
        `団体${g}：証明後も他団体(${other})は読めない`,
        403,
        await st(`/groups/${other}/sessions`, { token: s.token })
      );
      検査(
        '部員',
        `団体${g}：ログアウト（クレーム削除）`,
        200,
        await st(`/member_claims/${s.uid}`, { token: s.token, method: 'DELETE' })
      );
    }
  }

  // ── 4b. 1 つのメールで団体は 1 つ（持ち主は自分のメールの団体だけ引ける）。検証環境だけ（入るのにパスワードが要る）
  if (書いてよい) {
    // 100001 の持ち主は管理者（全部の一覧を引ける）なので、管理者でない団体の持ち主で試す
    const 自分の台帳 = 検証の団体たち.find((x) => x.id === OTHER);
    const 別の台帳 = 検証の団体たち.find((x) => x.id === 団体C);
    const 鍵 = await signIn(KEY, 自分の台帳.email, 検証のパスワード());
    検査('一覧', '持ち主：自分のメールの団体を引く', 200, await メールで引く(自分の台帳.email, 鍵));
    検査('一覧', '持ち主：ほかのメールの団体は引けない', 403, await メールで引く(別の台帳.email, 鍵));
    検査('一覧', '未認証：メールで団体を引けない', 403, await メールで引く(自分の台帳.email, null));
  }

  // ── 4c. メールの確認（2026-11-03）。検証環境だけ（口座を作って消す）。猶予のあいだと後で期待が変わる
  if (書いてよい) {
    const 決まり = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
    const 日 = 決まり.match(/function inGracePeriod\(\) \{\s*return request\.time < timestamp\.date\((\d{4}), (\d{1,2}), (\d{1,2})\)/);
    const 猶予中 = !!日 && Date.now() < Date.UTC(Number(日[1]), Number(日[2]) - 1, Number(日[3]));
    const 宛先 = `kakunin-${Date.now()}@example.com`;
    const 番 = String(800000 + Math.floor(Math.random() * 99999));
    const 合 = 検証のパスワード();
    let 鍵 = await signIn(KEY, 宛先, 合, { create: true });
    作った口座.push(鍵);
    const 帳面 = (中身, token) =>
      st(`/group_accounts/${番}`, { token, method: 'PATCH', body: { fields: 中身 } });
    const 字 = (v) => ({ stringValue: v });
    検査('確認', '確認前のメールでは団体を作れない', 403, await 帳面({ id: 字(番), email: 字(宛先) }, 鍵));
    await 検証環境でメールを確認済みにする([宛先], true);
    鍵 = await signIn(KEY, 宛先, 合);
    作った口座.push(鍵);
    検査(
      '確認',
      '確認済みのメールなら団体を作れる',
      200,
      await 帳面({ id: 字(番), email: 字(宛先), verified: { booleanValue: true } }, 鍵)
    );
    検査('確認', '確認済みの持ち主は団体の中身を書ける', 200, await st(`/groups/${番}/members/m1`, { token: 鍵, method: 'PATCH', body: { fields: { name: 字('検査') } } }));
    // 確認の済んでいない持ち主（配信の前からある団体）に戻す。帳面の印も外す
    await 帳面({ id: 字(番), email: 字(宛先) }, 鍵);
    await 検証環境でメールを確認済みにする([宛先], false);
    鍵 = await signIn(KEY, 宛先, 合);
    作った口座.push(鍵);
    検査(
      '確認',
      `確認前の持ち主は${猶予中 ? '猶予のあいだは読める' : '猶予のあとは何もできない'}`,
      猶予中 ? 200 : 403,
      await st(`/groups/${番}/members`, { token: 鍵 })
    );
    // 片付け（確認済みに戻して消す）
    await 検証環境でメールを確認済みにする([宛先], true);
    鍵 = await signIn(KEY, 宛先, 合);
    作った口座.push(鍵);
    await st(`/groups/${番}/members/m1`, { token: 鍵, method: 'DELETE' });
    await st(`/group_accounts/${番}`, { token: 鍵, method: 'DELETE' });
  }

  // ── 5. RTDB ──────────────────────────────────────────────────
  {
    // ライブは団体IDではなく、団体ごとの推測できない合言葉の枝に置く（src/liveSecret.js）。
    // RTDB の決まりは枝の長さしか見ないので、検査は同じ長さの作り物で足りる
    const 検証の枝 = 'verify-live-branch-0000000000';
    const r1 = await fetch(`${RTDB}/live_sessions/${検証の枝}.json`);
    検査('RTDB', '未認証：ライブ記録を読む', 401, r1.status);
    if (書いてよい) {
      const a = await 匿名();
      const r2 = await fetch(`${RTDB}/live_sessions/${検証の枝}.json?auth=${a.token}`);
      検査('RTDB', '認証あり：ライブ記録を読む', 200, r2.status);
      // 団体IDそのままの枝は決まりが長さで弾く。ここが 200 に戻ったら、
      // 総当たりで他団体のライブを覗ける状態に逆戻りしている
      const r4 = await fetch(`${RTDB}/live_sessions/${MY}.json?auth=${a.token}`);
      検査('RTDB', '認証あり：団体IDそのままの枝を読む', 401, r4.status);
      const r3 = await fetch(`${RTDB}/.json?auth=${a.token}`);
      検査('RTDB', '認証あり：全体を列挙する', 401, r3.status);
    }
  }

  // ── 6. データの整合（逆引き表が名簿と合っているか） ─────────────
  if (書いてよい) {
    const s = await 匿名();
    let 総逆引き = 0,
      総名簿 = 0,
      一致 = 0;
    for (const g of [OTHER, 団体C, 団体D, MY]) {
      const 有効 = await 個人IDのある部員たち(g);
      総名簿 += 有効.length;
      for (const { pid, mid } of 有効) {
        const r = await fetch(`${B}/groups/${g}/member_lookup/${pid}`, {
          headers: { Authorization: 'Bearer ' + s.token },
        });
        if (r.status === 200) {
          総逆引き++;
          const j = await r.json();
          if (j.fields?.memberId?.stringValue === mid) 一致++;
        }
      }
    }
    検査('データ', '逆引き表の件数が名簿と一致', 総名簿, 総逆引き);
    検査('データ', '逆引き先がすべて正しい部員を指す', 総名簿, 一致);
  }

  // ── 7. 配信内容 ──────────────────────────────────────────────
  {
    const 宛先 = `https://${PID}.web.app`;
    const html = await (await fetch(`${宛先}/`)).text();
    const bundle = (html.match(/AppEntry-[a-f0-9]+\.js/) || [])[0];
    if (対象 === 'prod') {
      const local = fs.existsSync('dist/_expo/static/js/web')
        ? fs.readdirSync('dist/_expo/static/js/web').find((x) => x.endsWith('.js'))
        : null;
      検査('配信', '本番のバンドルが手元のビルドと同じ', local, bundle);
    }
    // 期待は firebase.json の指定から取る（10/3 に no-store へ強めたとき、ここが古いまま残っていた）
    const 配信の設定 = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
    const HTMLの指定 = 配信の設定.hosting.headers
      .find((x) => x.source === '**/*.html')
      .headers.find((x) => x.key === 'Cache-Control').value;
    const h = await fetch(`${宛先}/index.html`);
    検査('配信', 'index.html が毎回確認される', HTMLの指定, h.headers.get('cache-control'));
    const h2 = await fetch(`${宛先}/_expo/static/js/web/${bundle}`);
    検査(
      '配信',
      'バンドルは長期キャッシュ',
      'public, max-age=31536000, immutable',
      h2.headers.get('cache-control')
    );
  }

  // ── 8. 後始末の確認 ──────────────────────────────────────────
  if (書いてよい) {
    const a = await 匿名();
    検査(
      '片づけ',
      '確認用の記録が残っていない',
      [403, 404],
      await st(`/groups/${MY}/sessions/zzz-acc-probe`, { token: a.token })
    );
  }
} finally {
  await 片づける();
}

console.log(`■ 受け入れ検査（${PID}${書いてよい ? '' : '・読むだけ'}）\n`);
console.table(rows);
if (作った口座.length) console.log(`作った匿名の口座 ${作った口座.length} 件は消しました`);
const ng = rows.filter((r) => r.判定 === 'NG');
console.log(
  ng.length ? `\n不合格 ${ng.length} / ${rows.length}件` : `\n合格：${rows.length}項目すべて想定どおり`
);
if (ng.length) {
  console.table(ng);
  process.exit(1);
}
