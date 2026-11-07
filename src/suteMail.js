/**
 * 使い捨てメールアドレスのドメイン（2026-11-03 本人：使い捨てのアドレスでは団体を作れないようにする）。
 * 決まり（firestore.rules の disposableEmail）にも同じ一覧を書く（test/suteMail.test.js が見張る）。
 * 決まりの大きさに上限があるので、よく使われるものだけ。新しい使い捨てのドメインは毎日増えるので、
 * これで全部は止まらない（メールの確認を必須にしたうえで、よく使われる使い捨てを断るところまで）
 */
'use strict';

const 使い捨てのドメイン = [
  '10minutemail.com', '10minutemail.net', '20minutemail.com', '33mail.com', 'anonaddy.me', 'burnermail.io',
  'byom.de', 'deadaddress.com', 'discard.email', 'disposablemail.com', 'dispostable.com', 'dropmail.me',
  'emailondeck.com', 'fakeinbox.com', 'fakemail.net', 'getairmail.com', 'getnada.com', 'guerrillamail.biz',
  'guerrillamail.com', 'guerrillamail.de', 'guerrillamail.info', 'guerrillamail.net', 'guerrillamail.org',
  'guerrillamailblock.com', 'harakirimail.com', 'inboxbear.com', 'incognitomail.org', 'jetable.org',
  'mail-temp.com', 'mail.tm', 'mailcatch.com', 'maildrop.cc', 'mailinator.com', 'mailinator.net',
  'mailnesia.com', 'mailpoof.com', 'mailsac.com', 'mintemail.com', 'mohmal.com', 'moakt.com', 'mytemp.email',
  'mytrashmail.com', 'nada.email', 'sharklasers.com', 'spam4.me', 'spamgourmet.com', 'tempail.com',
  'tempinbox.com', 'tempm.com', 'tempmail.com', 'tempmail.dev', 'tempmail.net', 'tempmailo.com',
  'tempmail.plus', 'temp-mail.io', 'temp-mail.org', 'temporary-mail.net', 'throwawaymail.com',
  'trash-mail.com', 'trashmail.com', 'trashmail.de', 'trashmail.net', 'wegwerfmail.de', 'yopmail.com',
  'yopmail.fr', 'yopmail.net', 'emltmp.com', 'mailto.plus', 'fexpost.com', 'fexbox.org', 'rover.info',
  'inbox.lv', 'linshiyouxiang.net', 'tmpmail.org', 'tmpmail.net', 'tmail.ws', 'email-temp.com',
  '1secmail.com', '1secmail.org', '1secmail.net', 'kzccv.com', 'qiott.com', 'wwjmp.com', 'esiix.com',
  'xojxe.com', 'yoggm.com', 'bheps.com', 'dcctb.com', 'vjuum.com', 'laafd.com', 'txcct.com',
  'eyepaste.com', 'mailforspam.com', 'spambox.us', 'spamfree24.org', 'mailnull.com', 'nowmymail.com',
  'gishpuppy.com', 'mailexpire.com', 'tempr.email', 'discardmail.com', 'trbvm.com', 'xkx.me',
  'sute.jp', 'meruado.uk', 'ma.ezweb.ne.jp.invalid',
].filter((d) => !d.endsWith('.invalid'));

/** 使い捨てのアドレスか（ドメインが一覧にあるか。サブドメインも含む） */
function 使い捨てか(メール) {
  const ドメイン = String(メール || '').toLowerCase().split('@')[1] || '';
  return 使い捨てのドメイン.some((d) => ドメイン === d || ドメイン.endsWith('.' + d));
}

/**
 * 雲の一覧（disposable_domains/{ドメイン}。約 1 万件。運営の台本 scripts/sync-disposable-domains.mjs が入れる）で見る
 * ドメインの候補。アドレスのドメインと、その上の 2 段・3 段（決まりの disposableDomain と同じ）
 */
function 見るドメイン(メール) {
  const 段 = (String(メール || '').toLowerCase().split('@')[1] || '').split('.').filter(Boolean);
  const 候補 = [];
  for (let 始め = 0; 始め <= 2 && 段.length - 始め >= 2; 始め++) 候補.push(段.slice(始め).join('.'));
  return 候補;
}

/**
 * 使い捨てのアドレスか（手元の一覧と雲の一覧の両方）。口座を作る前・切り替えを頼む前に見る（決まりも止める）。
 * 雲を読めないとき（電波が無いなど）は手元の一覧だけで答える（決まりが雲の側で止める）
 */
async function 使い捨てか確かめる(道具, メール) {
  if (使い捨てか(メール)) return true;
  const { Firestore, db } = 道具 || {};
  if (!Firestore || !db) return false;
  const 当たり = await Promise.all(
    見るドメイン(メール).map((ドメイン) =>
      Promise.resolve()
        .then(() => Firestore.getDoc(Firestore.doc(db, 'disposable_domains', ドメイン)))
        .then((帳面) => !!(帳面 && 帳面.exists()))
        .catch(() => false)
    )
  );
  return 当たり.some(Boolean);
}

module.exports = { 使い捨てのドメイン, 使い捨てか, 見るドメイン, 使い捨てか確かめる };
