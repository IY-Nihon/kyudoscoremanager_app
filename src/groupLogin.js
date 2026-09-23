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
 *      入れたら帳面の email を新しいアドレスに書き換え、切り替え待ちを消す
 *
 * 帳面の書き換えは決まり（firestore.rules）が見張る。持ち主は email を直接変えられず、
 * 3 の書き換えは確認済み（email_verified）の新しいアドレスの本人にしか通らない。
 *
 * 画面から切り離して、偽の Firestore・認証で検査できるようにしてある（test/groupLogin.test.js）。
 */

/** パスワード違い・口座が無いときの符号。切り替え待ちのアドレスで入り直してよいもの */
const 入り直してよい符号 = [
  'auth/invalid-credential',
  'auth/invalid-login-credentials',
  'auth/user-not-found',
  'auth/wrong-password',
];

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
  try {
    await FirebaseAuth.signInWithEmailAndPassword(auth, 中身.email, 合言葉);
    return { id: 団体の鍵, メール: 中身.email };
  } catch (誤り) {
    const 切り替え待ち = 中身.pendingEmail;
    if (!切り替え待ち || !入り直してよい符号.includes(誤り && 誤り.code)) throw 誤り;
    try {
      await FirebaseAuth.signInWithEmailAndPassword(auth, 切り替え待ち, 合言葉);
    } catch {
      // どちらでも入れないのはパスワード違い。最初の誤りを返す
      throw 誤り;
    }
    // 確認のリンクが開かれて、認証のアドレスが替わっていた。帳面を追いつかせる。
    // 書けないまま進むと、決まりが団体の持ち主と認めず、どの画面も読めない
    try {
      await Firestore.setDoc(帳面の場所, { id: 団体の鍵, email: 切り替え待ち });
    } catch (書けない) {
      await FirebaseAuth.signOut(auth).catch(() => {});
      throw new Error(
        'メールアドレスの切り替えを仕上げられませんでした。時間を置いてもう一度ログインしてください',
        { cause: 書けない }
      );
    }
    return { id: 団体の鍵, メール: 切り替え待ち };
  }
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

module.exports = { 団体で入る, 切り替えを頼む, 入り直してよい符号 };
