/**
 * 団体アカウントのログインと、登録メールアドレスの切り替え。
 *
 * ログインは団体IDとパスワードで行う。Firebase の認証はメールアドレスでしか入れないので、
 * 公開の帳面（group_accounts/{団体ID}）から email を引いてから入る。
 *
 * ■ 登録メールアドレスの切り替え（ログイン画面の「メールアドレスを忘れた」）
 * 利用者は団体IDとパスワードで入り、メールアドレスは打たない。画面では「登録メールアドレス」と呼ぶ
 * 前は updateEmail で即座に替えていた。本番は Firebase の「メール列挙の保護」が有効で、
 * この状態では確かめていないアドレスへの即時の変更が断られる。だから必ず失敗していた
 * （2026-09-24 に本番の設定と Google の文書で確かめた）。いまは次の順にする。
 *
 *   1. 切り替えを頼む … 今のアドレスとパスワードで入り、帳面に切り替え待ち（pendingEmail）を
 *      書き、verifyBeforeUpdateEmail で新しいアドレスへ確認のメールを送る。
 *      確認が済むまでは今のアドレスのまま入れる
 *   2. 確認のリンクを開く … 認証のアドレスが新しいものに替わる（Firebase の画面で済む）
 *   3. 団体で入る … 帳面の email で入れなければ、切り替え待ちのアドレスで入り直す。
 *      入れたら帳面の email を新しいアドレスに書き換え、切り替え待ちを消す。前のアドレス
 *      （previousEmail）と口座の番号（ownerUid）も残す
 *   4. 古いアドレスに届く「元に戻す」のリンクが押されたら … 認証のアドレスが前のものに戻る。
 *      帳面の email（新しいアドレス）では入れないので、前のアドレスで入り直し、帳面を戻す
 *
 * 帳面の書き換えは決まり（firestore.rules）が見張る。持ち主は email を直接変えられない。
 * 3 は確認済み（email_verified）の新しいアドレスの本人、4 は ownerUid と同じ口座にしか通らない
 * （「元に戻す」のあとに確認済みになるかは確かめられなかったので、口座の番号で見る）。
 * 前のアドレスは誰でも読める帳面に置くので、切り替えて 前のアドレスを残す日数 が過ぎたら、
 * 次のログインで消す（切り替えた日時は非公開の private/consent の emailSwitchedAt）。
 *
 * 画面から切り離して、偽の Firestore・認証で検査できるようにしてある（test/groupLogin.test.js）。
 */

// 何度か送る … 雲の返事が戻らない・通信の誤りのときだけ、上限つきで 3 回まで読み直す（招待の窓と同じ）
const { 招待の期限切れか, 何度か送る } = require('./memberInvite');
const { メールを整える } = require('./totonoeru');

/** パスワード違い・口座が無いときの符号。切り替え待ち・前のアドレスで入り直してよいもの */
const 入り直してよい符号 = [
  'auth/invalid-credential',
  'auth/invalid-login-credentials',
  'auth/user-not-found',
  'auth/wrong-password',
];

/**
 * 切り替えたあと、前のアドレスを帳面に残す日数。古いアドレスに届く「元に戻す」のリンクが
 * 押されたとき、前のアドレスで入り直すために要る。リンクの有効期間より長めに取る
 */
const 前のアドレスを残す日数 = 30;

/** 入ってみる。パスワード違い・口座が無いときは null（ほかの誤りはそのまま投げる） */
/**
 * 人が打った ID（団体ID・個人ID・招待の合言葉）が、Firestore の道に入れてよい形か。
 * 英数字と _ - だけ（64 字まで）。「/」が混じると別の文書を指してしまう。決まりが守るので読めはしないが、
 * 雲へ問い合わせる前に断る（匿名の利用者も作らない）
 */
const IDの形か = (値) => typeof 値 === 'string' && /^[0-9A-Za-z_-]{1,64}$/.test(値);

async function 入ってみる(FirebaseAuth, auth, メール, 合言葉) {
  try {
    return await FirebaseAuth.signInWithEmailAndPassword(auth, メール, 合言葉);
  } catch (誤り) {
    if (入り直してよい符号.includes(誤り && 誤り.code)) return null;
    throw 誤り;
  }
}

/** 日時（Timestamp・Date・数）をミリ秒に。読めなければ 0 */
const ミリ秒に = (値) =>
  !値
    ? 0
    : typeof 値.toMillis === 'function'
      ? 値.toMillis()
      : 値 instanceof Date
        ? 値.getTime()
        : Number(値) || 0;

/**
 * 団体IDとパスワードで入る。
 *
 * @param {{Firestore: any, FirebaseAuth: any, db: any, auth: any}} 道具
 * @param {string} 団体ID 公開の帳面の番号（整えたもの）
 * @param {string} 合言葉
 * @returns {Promise<{id: string, メール: string}>} id は団体の中身の置き場（groups/{id}）
 */
async function 団体で入る(道具, 団体ID, 合言葉) {
  const { Firestore, FirebaseAuth, db, auth } = 道具;
  if (!IDの形か(団体ID)) throw new Error('団体IDまたはパスワードが正しくありません');
  const 帳面の場所 = Firestore.doc(db, 'group_accounts', 団体ID);
  const 帳面 = await 何度か送る(() => Firestore.getDoc(帳面の場所));
  if (!帳面.exists()) throw new Error('団体IDまたはパスワードが正しくありません');
  const 中身 = 帳面.data() || {};
  // 団体の中身の置き場（groups/{団体の鍵}）。公開の番号と同じはずだが、帳面の id を正とする
  const 団体の鍵 = 中身.id || 団体ID;
  const 非公開の場所 = Firestore.doc(db, 'group_accounts', 団体ID, 'private', 'consent');

  // 書けないまま進むと、決まりが団体の持ち主と認めず、どの画面も読めない。出てから知らせる
  const 帳面を書く = async (値) => {
    try {
      await Firestore.setDoc(帳面の場所, 値);
    } catch (書けない) {
      await FirebaseAuth.signOut(auth).catch(() => {});
      throw new Error(
        'メールアドレスの切り替えを仕上げられませんでした。時間を置いてもう一度ログインしてください',
        { cause: 書けない }
      );
    }
  };

  const 入った = await 入ってみる(FirebaseAuth, auth, 中身.email, 合言葉);
  if (入った) {
    // 前のアドレスの片付けは待たない（ログインを遅らせない。失敗しても次にまた試す）
    前のアドレスを片付ける(道具, 帳面の場所, 非公開の場所, 中身).catch(() => {});
    return { id: 団体の鍵, メール: 中身.email };
  }

  // 3. 確認のリンクが開かれて、認証のアドレスが新しいものに替わっていた
  if (中身.pendingEmail) {
    const 新しいので = await 入ってみる(FirebaseAuth, auth, 中身.pendingEmail, 合言葉);
    if (新しいので) {
      await 帳面を書く({
        id: 団体の鍵,
        email: 中身.pendingEmail,
        previousEmail: 中身.email,
        ownerUid: 新しいので.user.uid,
        // 新しいアドレスは確認のリンクを押して替わった（決まりも確認済みしか通さない）。部員が入れるよう印を残す
        verified: true,
      });
      // 切り替えた日時は非公開の側に。前のアドレスを片付ける目安（書けなくても次のログインで補う）
      await Firestore.setDoc(非公開の場所, { emailSwitchedAt: new Date() }, { merge: true }).catch(() => {});
      return { id: 団体の鍵, メール: 中身.pendingEmail };
    }
  }

  // 4. 古いアドレス宛の「元に戻す」が押されて、認証のアドレスが前のものに戻っていた
  if (中身.previousEmail) {
    const 前ので = await 入ってみる(FirebaseAuth, auth, 中身.previousEmail, 合言葉);
    if (前ので) {
      await 帳面を書く({ id: 団体の鍵, email: 中身.previousEmail });
      return { id: 団体の鍵, メール: 中身.previousEmail };
    }
  }

  // どれでも入れないのはパスワード違い
  throw Object.assign(new Error('団体IDまたはパスワードが正しくありません'), {
    code: 'auth/invalid-credential',
  });
}

/**
 * 切り替えて 前のアドレスを残す日数 が過ぎたら、前のアドレスと口座の番号を公開の帳面から消す。
 * 切り替えた日時が無ければ（書けなかった・前の版で切り替えた）、いまから数え始める。
 */
async function 前のアドレスを片付ける(道具, 帳面の場所, 非公開の場所, 中身) {
  const { Firestore } = 道具;
  if (!中身.previousEmail && !中身.ownerUid) return;
  const 控え = await Firestore.getDoc(非公開の場所);
  const 切り替えた = ミリ秒に(控え.exists() ? (控え.data() || {}).emailSwitchedAt : 0);
  if (!切り替えた) {
    await Firestore.setDoc(非公開の場所, { emailSwitchedAt: new Date() }, { merge: true });
    return;
  }
  if (Date.now() - 切り替えた < 前のアドレスを残す日数 * 86400000) return;
  await Firestore.updateDoc(帳面の場所, {
    previousEmail: Firestore.deleteField(),
    ownerUid: Firestore.deleteField(),
  });
}

/**
 * 団体ID の欄にメールアドレスが入っていたとき（ブラウザのパスワードの保存が、団体を作るときに控えたメールを
 * 団体ID の欄に入れることがある。A32）。そのメールとパスワードで入り、自分のメールの団体を引いて入る
 * （決まりは、自分のメールの団体だけ一覧で引ける）。
 * @returns {Promise<{id: string, 公開の団体ID: string, メール: string}>}
 */
async function メールで団体に入る(道具, メール, 合言葉) {
  const { Firestore, FirebaseAuth, db, auth } = 道具;
  const 宛先 = メールを整える(メール);
  await FirebaseAuth.signInWithEmailAndPassword(auth, 宛先, 合言葉);
  const 認証のメール = (auth.currentUser && auth.currentUser.email) || 宛先;
  const 返り = await Firestore.getDocs(
    Firestore.query(Firestore.collection(db, 'group_accounts'), Firestore.where('email', '==', 認証のメール))
  );
  const 帳面 = 返り && 返り.docs && 返り.docs[0];
  if (!帳面) {
    await FirebaseAuth.signOut(auth).catch(() => {});
    throw new Error(
      'このメールアドレスの団体が見つかりません。団体ID（6 桁の数字）とパスワードでお入りください'
    );
  }
  const 中身 = 帳面.data() || {};
  return { id: 中身.id || 帳面.id, 公開の団体ID: 帳面.id, メール: 中身.email || 認証のメール };
}

/**
 * 登録メールアドレスの切り替えを頼む。新しいアドレスへ確認のメールが届く。
 * 終わったら出る（ログイン画面から呼ぶ。確認が済むまでは今のアドレスのまま）。
 *
 * @param {{Firestore: any, FirebaseAuth: any, db: any, auth: any}} 道具
 * @param {string} 団体ID
 * @param {string} 合言葉 今のパスワード
 * @param {string} 新しいメール
 */
async function 切り替えを頼む(道具, 団体ID, 合言葉, 新しいメール) {
  const { Firestore, FirebaseAuth, db, auth } = 道具;
  // 切り替え待ちは、確認が済んだときの認証のメール（小文字）と決まりで比べる。字をそろえて書く
  const 宛先 = メールを整える(新しいメール);
  if (!IDの形か(団体ID)) throw new Error('団体IDまたはパスワードが正しくありません');
  const 帳面の場所 = Firestore.doc(db, 'group_accounts', 団体ID);
  const 帳面 = await 何度か送る(() => Firestore.getDoc(帳面の場所));
  if (!帳面.exists()) throw new Error('入力内容を確認してください');
  const { email } = 帳面.data() || {};
  if (宛先.toLowerCase() === String(email || '').toLowerCase()) {
    throw new Error('今のメールアドレスと同じです');
  }
  // 使い捨てのアドレスへは切り替えられない（決まりも仕上げを止める。確認のメールを送る前に断る）
  if (await require('./suteMail').使い捨てか確かめる(道具, 宛先))
    throw new Error(
      '使い捨てのメールアドレスには切り替えられません。ふだん使うメールアドレスを入れてください'
    );
  const 入った = await FirebaseAuth.signInWithEmailAndPassword(auth, email, 合言葉);
  try {
    // 先に帳面へ書く。確認のリンクが開かれたあと、ログインがこのアドレスで入り直せるように。
    // 頼んだ口座の番号（pendingUid）も添える。切り替えの途中は、決まりがこの口座か確認の済んだ口座しか
    // 持ち主として通さない（空いたアドレスで後から作った口座に乗っ取られないように。firestore.rules の sameOwnerAccount）
    try {
      await Firestore.setDoc(
        帳面の場所,
        { pendingEmail: 宛先, pendingUid: 入った.user.uid },
        { merge: true }
      );
    } catch (書けない) {
      if (String((書けない && 書けない.code) || '').includes('permission-denied'))
        throw new Error(
          'メールアドレスの切り替えの途中です。前に頼んだ新しいアドレスに届いた確認のリンクを押してから、ログインしてください。届いていないときは、設定の「お問い合わせ」かホームページからお知らせください',
          { cause: 書けない }
        );
      throw 書けない;
    }
    try {
      await FirebaseAuth.verifyBeforeUpdateEmail(入った.user, 宛先);
    } catch (誤り) {
      // 送れなかったら、切り替え待ちを残さない
      await Firestore.updateDoc(帳面の場所, {
        pendingEmail: Firestore.deleteField(),
        pendingUid: Firestore.deleteField(),
      }).catch(() => {});
      throw 誤り;
    }
  } finally {
    await FirebaseAuth.signOut(auth).catch(() => {});
  }
  return { 宛先 };
}

/** 12/3 を過ぎた 4 桁の個人ID で入ろうとしたときの知らせ（入る前に形で分かる。英語の権限の誤りを出さない） */
const 四桁は終わりの文 =
  '4桁の個人IDは使えなくなりました。団体の担当者から新しい個人ID（大文字と数字の6字。例 K7MP3X）を受け取って入れてください。';

/**
 * 中継（kyudo-chukei の POST /kojin）で鍵を確かめて、所属の証を書いてもらう（2026-11-04。ログインの総当たりを止める）。
 * 中継が回数を絞ってから、サービスアカウントで逆引き表を引く（決まりは端末に逆引き表を読ませず、証も書かせない）。
 * 中継が無い・古い（/kojin が無く 404）ときは null（前の道 引いて証を書く で入る。決まりを配るまでのつなぎ）
 */
/** 古い中継が、所属の証の無い口座を断るときの文（kyudo-chukei の src/index.mjs） */
const 古い中継の断り = 'この機能は、団体または個人でログインした人だけが使えます';

async function 中継で確かめる(道具, 団体の鍵, 鍵, 見つからないとき, 期限切れのとき) {
  const 中継 = 道具.中継 || require('./geminiChukei');
  if (!中継 || !中継.中継がある()) return null;
  let 返り;
  try {
    返り = await 中継.中継へfetch('/kojin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 団体: 団体の鍵, 鍵 }),
    });
  } catch (誤り) {
    throw new Error('通信できませんでした。電波の良い場所でお試しください', { cause: 誤り });
  }
  if (!返り || 返り.status === 404) return null;
  const 中身 = await Promise.resolve()
    .then(() => 返り.json())
    .catch(() => ({}));
  // 古い中継（/kojin が無い）は、道を見る前に「通してよい人か」で匿名の口座を断る（403 とこの文）。
  // 新しい中継の /kojin はこの文を返さないので、これも古い中継として前の道で入る（検証環境の E2E で落ちた）
  if (返り.status === 403 && 中身 && 中身.error === 古い中継の断り) return null;
  if (返り.status === 429) throw new Error('試した回数が多すぎます。1 分ほど待ってからお試しください');
  if (返り.status === 401 && 中身 && 中身.印 === 'appcheck')
    throw new Error('この端末の確かめに失敗しました。ブラウザを新しくして読み込み直してください');
  if (!返り.ok) throw new Error('いまは確かめられません。少し待ってからお試しください');
  switch (中身 && 中身.結果) {
    case '入れた':
      return { memberId: 中身.memberId, 名前: 中身.名前 || '' };
    case '期限切れ':
      throw new Error(期限切れのとき);
    case '団体がまだ':
      throw new Error(require('./mailKakunin').団体がまだの文);
    case '4桁は終わり':
      throw new Error(四桁は終わりの文);
    default:
      throw new Error(見つからないとき);
  }
}

/**
 * メンバーとして入る。個人ID でも招待リンクの合言葉でも同じ道を通る（鍵が違うだけ）。
 *
 * 匿名で入り、中継（POST /kojin）に鍵を確かめて所属の証（member_claims/{uid}）を書いてもらう（中継で確かめる）。
 * 中継が古いときだけ、前の道：逆引き表（groups/{団体}/member_lookup/{鍵}）から memberId を引き、証を自分で書く
 * （決まりが証の memberId と逆引き表を突き合わせる。新しい決まりを配ったあとは通らない）。
 *
 * @param {{Firestore: any, FirebaseAuth: any, db: any, auth: any}} 道具
 * @param {string} 団体の鍵 groups/{団体の鍵}
 * @param {string} 鍵 個人ID か招待の合言葉
 * @param {string} [見つからないとき] 鍵が引けないときの知らせ
 * @param {string} [期限切れのとき] 招待リンクの期限が切れているときの知らせ
 * @returns {Promise<{memberId: string, 名前: string}>}
 */
async function 部員として入る(
  道具,
  団体の鍵,
  鍵,
  見つからないとき = '団体IDまたは個人IDが正しくありません',
  期限切れのとき = 見つからないとき
) {
  const { FirebaseAuth, auth } = 道具;
  if (!IDの形か(団体の鍵) || !IDの形か(鍵)) throw new Error(見つからないとき);
  // 12/3 を過ぎた 4 桁は、雲に問い合わせる前に分かる言葉で断る（前は英語の「Missing or insufficient permissions.」）
  const 個 = require('./kojinId');
  if (個.古い形.test(鍵) && !個.古い形を使えるか(道具.今)) throw new Error(四桁は終わりの文);
  // 登録メールアドレスの確認が済んでいない団体には入れない（決まりも止める。2026-11-03）。
  // 匿名の利用者を作る前に、理由を言って断る（帳面は誰でも読める。読めないときは進めて、決まりに任せる）
  const 確 = require('./mailKakunin');
  // 今ある団体は猶予のあいだ入れる（決まりも同じ）
  if ((await 確.団体の確認は済んだか(道具, 団体の鍵)) === false && !確.猶予中か(道具.今))
    throw new Error(確.団体がまだの文);
  // すでに匿名で入っている端末（入り直しの窓）では、signInAnonymously は今の口座をそのまま返す
  const 前の人 = auth.currentUser;
  await FirebaseAuth.signInAnonymously(auth);
  const 入った人 = auth.currentUser;
  try {
    const 中継の答え = await 中継で確かめる(道具, 団体の鍵, 鍵, 見つからないとき, 期限切れのとき);
    if (中継の答え) return 中継の答え;
    return await 引いて証を書く(道具, 団体の鍵, 鍵, 見つからないとき, 期限切れのとき);
  } catch (誤り) {
    // 入れなかった匿名の利用者を残さない（個人IDを打ち間違えるたびに 1 人ずつ溜まっていた）。
    // 消すのは今ここで作った匿名の人だけ。前から使っていた口座は消さない（入り直しの窓で 1 回打ち間違えると、
    // まだ使えていた部員の口座を消して、正しい ID で入り直すまで何も送れなくなっていた）。消せなければ出るだけにする
    const 新しく作った = !前の人 || !入った人 || 前の人.uid !== 入った人.uid;
    if (新しく作った && 入った人 && 入った人.isAnonymous && auth.currentUser === 入った人) {
      try {
        await FirebaseAuth.deleteUser(入った人);
      } catch {
        await Promise.resolve()
          .then(() => FirebaseAuth.signOut(auth))
          .catch(() => {});
      }
    }
    throw 誤り;
  }
}

async function 引いて証を書く(道具, 団体の鍵, 鍵, 見つからないとき, 期限切れのとき) {
  const { Firestore, db, auth } = 道具;
  // 1 件だけ直接引く。一覧（list）は使わないので、他団体の名簿は引けない。
  // 読みだけ送り直す（サインインは包まない。WebKit では 12 秒を超えることがあり、切ると入れなくなる）
  const 逆引き = await 何度か送る(() =>
    Firestore.getDoc(Firestore.doc(db, `groups/${団体の鍵}/member_lookup`, 鍵))
  );
  // 消した印の行（src/kojinId.js の 消した行）は無いものとして扱う
  if (!逆引き.exists() || !require('./kojinId').生きている行か(逆引き.data()))
    throw new Error(見つからないとき);
  // 招待リンクの期限（決まりでも止めるが、先に分かる理由で知らせる）
  if (招待の期限切れか(逆引き.data())) throw new Error(期限切れのとき);
  const { memberId } = 逆引き.data();
  // 所属を宣言する。決まりが逆引き表と突き合わせる
  await Firestore.setDoc(Firestore.doc(db, 'member_claims', auth.currentUser.uid), {
    groupId: 団体の鍵,
    memberId,
    personalId: 鍵,
    claimedAt: new Date(),
  });
  const 部員の帳面 = await 何度か送る(() =>
    Firestore.getDoc(Firestore.doc(db, `groups/${団体の鍵}/members`, memberId))
  );
  return { memberId, 名前: (部員の帳面.data() || {}).name || '' };
}

/**
 * 出る（設定のログアウト・確認の画面の「ログアウト」）。部員は所属の証と匿名の口座を消してから出る
 * （口座を残すと、誰のものでもない口座が認証に溜まる。2026-09-24 に本番で 164 人）。
 *
 * 電波が無いと、証の削除（Firestore の書き込み）は届くまで返らない。前は待ちきってから出ていたので、
 * 電波の無い所でログアウトを押しても何も起きなかった。待つのは 待つ時間 まで。消せなかった証は、
 * 口座が消えれば使えない（決まりは口座の番号で見る）。口座も消せなければ（入ってから日が経つと
 * requires-recent-login で断られる）出るだけにする。
 *
 * @param {{Firestore: any, FirebaseAuth: any, db: any, auth: any}} 道具
 * @param {string|null} 役割 'group' | 'member'
 */
async function 団体から出る(道具, 役割, 待つ時間 = 3000) {
  const { Firestore, FirebaseAuth, db, auth } = 道具;
  const 待つ = (手) =>
    Promise.race([
      Promise.resolve()
        .then(手)
        .catch(() => {}),
      new Promise((解く) => setTimeout(解く, 待つ時間)),
    ]);
  const 人 = auth && auth.currentUser;
  if (役割 === 'member' && 人) {
    await 待つ(() => Firestore.deleteDoc(Firestore.doc(db, 'member_claims', 人.uid)));
    if (人.isAnonymous && auth.currentUser === 人) await 待つ(() => FirebaseAuth.deleteUser(人));
  }
  if (auth && auth.currentUser) await 待つ(() => FirebaseAuth.signOut(auth));
}

/**
 * 部員の認証方式の版。上げると、古い方式でログインしている部員は次に開いたときにログアウトされる（App.js）。
 * ログイン画面・招待のリンク・入り直しの窓で部員として入れたときに、この版を店に書く。ここ 1 か所だけで決める。
 * 2 … 所属のクレームを使う方式に切り替えたとき（古い端末はログアウトさせ、個人IDで入り直してもらう）
 */
const 部員のログインの版 = 2;

module.exports = {
  IDの形か,
  団体で入る,
  メールで団体に入る,
  切り替えを頼む,
  部員として入る,
  四桁は終わりの文,
  団体から出る,
  入り直してよい符号,
  前のアドレスを残す日数,
  部員のログインの版,
};
