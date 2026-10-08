'use strict';

/**
 * 店の操作のうち、「使っている部として、紹介に載せてよいか」の許可を扱うもの（2026-10-09）。
 * 決まりは src/listingConsent.js、札は src/ListingConsentCard.js、設定は SettingsScreen の「紹介への掲載」。
 *
 * 置き場は groups/{団体ID}/config/listing（団体の持ち主だけが書ける。firestore.rules）。
 * 店には 掲載の許可（{ 団体ID, …雲の中身を数の日時にしたもの }）を持ち、端末にも控える。
 * 別の団体に入り直したら、団体ID が違うので無いものとして扱う（ログアウトの道に手を入れない）。
 *
 * 雲に聞くのは、保存のあと（札を出すか決めるとき）と設定を開いたときだけ。どちらも待たせない。
 * 電波が弱いと getDoc が返らないことがあるので、4 秒で諦める（そのときは札を出さない）。
 */
const { Firebaseの器, Firestore } = require('./storeShared');
const 決まり = require('./listingConsent');

const 待つ上限 = 4000;

/** 雲の文書の中身を、店に持つ形に（日時は数に） */
function 店の形(団体ID, 中身) {
  const 元 = 中身 || {};
  const 出 = { 団体ID };
  for (const [鍵, 値] of Object.entries(元)) {
    出[鍵] = /日時$/.test(鍵) ? 決まり.ミリ秒(値) : 値;
  }
  return 出;
}

/** 雲へ送る形に（日時は日時型に。null は null のまま＝消す） */
function 雲の形(中身) {
  const 出 = {};
  for (const [鍵, 値] of Object.entries(中身 || {})) {
    if ('団体ID' === 鍵) continue;
    出[鍵] = /日時$/.test(鍵) && 'number' === typeof 値 ? Firestore.Timestamp.fromMillis(値) : 値;
  }
  return 出;
}

/** 時間を区切って待つ。区切りを過ぎたら null */
const 区切って待つ = (約束) =>
  Promise.race([約束, new Promise((解決) => setTimeout(() => 解決(null), 待つ上限))]).catch(() => null);

const 掲載の操作 = (書く, 状態) => {
  const 文書 = (団体ID) => Firestore.doc(Firebaseの器.db, `groups/${団体ID}/config`, 'listing');
  /** いまの団体の許可（別の団体のものは無いとみなす） */
  const いまの許可 = () => {
    const 許可 = 状態().掲載の許可;
    return 許可 && 許可.団体ID === 状態().activeGroupId ? 許可 : null;
  };
  /** 雲から読み直して店に置く。読めなければ null（店はそのまま） */
  const 雲から読む = async () => {
    const { activeGroupId, activeRole, isNetworkOnline } = 状態();
    if (!activeGroupId || 'group' !== activeRole || !isNetworkOnline || !Firebaseの器.db) return null;
    const 帳面 = await 区切って待つ(Firestore.getDoc(文書(activeGroupId)));
    if (!帳面) return null;
    const 許可 = 店の形(activeGroupId, 帳面.exists() ? 帳面.data() : {});
    書く({ 掲載の許可: 許可 });
    return 許可;
  };
  /** 雲へ足す（merge）。店も同じ中身にする。送れなければ false */
  const 雲へ足す = async (足すもの) => {
    const { activeGroupId } = 状態();
    if (!activeGroupId || !Firebaseの器.db) return false;
    try {
      await Firestore.setDoc(文書(activeGroupId), 雲の形(足すもの), { merge: true });
    } catch (誤り) {
      console.error('[Store] 掲載の許可を送れませんでした:', 誤り);
      return false;
    }
    書く({ 掲載の許可: Object.assign({}, いまの許可() || { 団体ID: activeGroupId }, 足すもの) });
    return true;
  };

  // 検査から札を開く口（e2e/listingConsent.spec.mjs）。検証環境の団体は記録が 10 件に届かず、保存から
  // 札を出す道を本物で通せないため。開くのは札だけで、答えの保存は本物の道（団体ログインだけ）を通る
  globalThis.__掲載の札を開く = () => 書く({ 掲載の札: true });
  return {
    掲載の許可: null,
    // 札が出ているか（記録画面が見る。端末には控えない）
    掲載の札: false,
    // この起動のあいだに札を出したか（あとで・✕ なら次に開くまで出さない。端末には控えない）
    掲載の札をこの起動で出した: false,
    掲載の札を開く: () => 書く({ 掲載の札: true }),
    掲載の札を閉じる: () => 書く({ 掲載の札: false }),
    いまの掲載の許可: いまの許可,
    掲載の許可を読む: 雲から読む,
    /**
     * 記録を保存した直後に呼ぶ。札を出すなら、聞いた回数と初めて聞いた日時を雲に残してから true。
     * 出したら、この起動のあいだはもう出さない（あとで・✕ のあとは、次に開いたときにまた聞く）。
     * 手元で条件に合わなければ雲には聞かない（ほとんどの保存はここで終わる）。
     * @param {{止める?:boolean}} [場面]
     */
    掲載の札を出すか確かめる: async (場面 = {}) => {
      const 材料 = () => ({
        役割: 状態().activeRole,
        記録たち: 状態().sessions,
        いま: Date.now(),
        止める: !!場面.止める || !状態().isNetworkOnline,
        この起動で聞いた: !!状態().掲載の札をこの起動で出した,
      });
      if (!決まり.札を出すか({ ...材料(), 許可: いまの許可() })) return false;
      // 別の端末で答えているかもしれないので、雲の答えで確かめ直す
      const 雲 = await 雲から読む();
      if (!雲 || !決まり.札を出すか({ ...材料(), 許可: 雲 })) return false;
      書く({ 掲載の札をこの起動で出した: true });
      return 雲へ足す(決まり.聞いた記録(雲, Date.now()));
    },
    /**
     * アプリを開いたときに呼ぶ。一度聞いてまだ答えていない団体なら、雲で確かめてから true（店の札も開く）。
     * 開いた直後はログインの復元が済んでおらず雲を読めないことがあるので、読めなければ 1 回だけ待って読み直す。
     * @param {{止める?:boolean}} [場面]
     */
    掲載の札を開いた時に確かめる: async (場面 = {}) => {
      const 材料 = (許可) => ({
        役割: 状態().activeRole,
        許可,
        止める: !!場面.止める || !状態().isNetworkOnline,
        この起動で聞いた: !!状態().掲載の札をこの起動で出した,
      });
      // 手元で答えていれば雲に聞かない。手元に無い（別の端末で聞いた・控えを消した）ときも、雲で確かめる
      const 手元 = いまの許可();
      if (決まり.答えたか(手元) || !決まり.開いた時に出すか(材料(手元 || { 聞いた回数: 1 }))) return false;
      let 雲 = await 雲から読む();
      if (!雲) {
        await new Promise((解決) => setTimeout(解決, 5000));
        雲 = await 雲から読む();
      }
      if (!雲 || !決まり.開いた時に出すか(材料(雲))) return false;
      書く({ 掲載の札をこの起動で出した: true });
      await 雲へ足す(決まり.聞いた記録(雲, Date.now()));
      書く({ 掲載の札: true });
      return true;
    },
    /**
     * 札か設定で選んだ中身を保存する。
     * @returns {Promise<{誤り?: string}>} 誤りがあれば画面に出す文
     */
    掲載の許可を答える: async (選び) => {
      if ('group' !== 状態().activeRole) return { 誤り: '団体ログインのときだけ選べます' };
      const { 中身, 誤り } = 決まり.答えを整える(選び, Date.now());
      if (誤り) return { 誤り };
      if (!状態().isNetworkOnline) return { 誤り: '電波のあるところで、もう一度お試しください' };
      const 送れた = await 雲へ足す(中身);
      return 送れた ? {} : { 誤り: '保存できませんでした。電波のあるところで、もう一度お試しください' };
    },
  };
};

module.exports = { 掲載の操作, 店の形, 雲の形 };
