/**
 * 団体アカウントのログインと、ログインに使うメールアドレスの切り替え。
 *
 * ログインは団体IDとパスワードで行う。Firebase の認証はメールアドレスでしか入れないので、
 * 公開の帳面（group_accounts/{団体ID}）から email を引いてから入る。
 *
 * ■ メールアドレスの切り替え（ログイン画面の「メールアドレスを忘れた」）
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
  const 帳面の場所 = Firestore.doc(db, 'group_accounts', 団体ID);
  const 帳面 = await Firestore.getDoc(帳面の場所);
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
 * ログインに使うメールアドレスの切り替えを頼む。新しいアドレスへ確認のメールが届く。
 * 終わったら出る（ログイン画面から呼ぶ。確認が済むまでは今のアドレスのまま）。
 *
 * @param {{Firestore: any, FirebaseAuth: any, db: any, auth: any}} 道具
 * @param {string} 団体ID
 * @param {string} 合言葉 今のパスワード
 * @param {string} 新しいメール
 */
async function 切り替えを頼む(道具, 団体ID, 合言葉, 新しいメール) {
  const { Firestore, FirebaseAuth, db, auth } = 道具;
  const 宛先 = String(新しいメール || '').trim();
  const 帳面の場所 = Firestore.doc(db, 'group_accounts', 団体ID);
  const 帳面 = await Firestore.getDoc(帳面の場所);
  if (!帳面.exists()) throw new Error('入力内容を確認してください');
  const { email } = 帳面.data() || {};
  if (宛先.toLowerCase() === String(email || '').toLowerCase()) {
    throw new Error('今のメールアドレスと同じです');
  }
  const 入った = await FirebaseAuth.signInWithEmailAndPassword(auth, email, 合言葉);
  try {
    // 先に帳面へ書く。確認のリンクが開かれたあと、ログインがこのアドレスで入り直せるように
    await Firestore.setDoc(帳面の場所, { pendingEmail: 宛先 }, { merge: true });
    try {
      await FirebaseAuth.verifyBeforeUpdateEmail(入った.user, 宛先);
    } catch (誤り) {
      // 送れなかったら、切り替え待ちを残さない
      await Firestore.updateDoc(帳面の場所, { pendingEmail: Firestore.deleteField() }).catch(() => {});
      throw 誤り;
    }
  } finally {
    await FirebaseAuth.signOut(auth).catch(() => {});
  }
  return { 宛先 };
}

module.exports = { 団体で入る, 切り替えを頼む, 入り直してよい符号, 前のアドレスを残す日数 };
