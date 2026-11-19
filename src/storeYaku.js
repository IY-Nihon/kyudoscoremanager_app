'use strict';

/**
 * 店の操作のうち、部員の役（groups/{団体}/config/roles）を書くもの（2026-11-19 本人）。
 * 書けるのは管理者（団体の口座＋管理者の合言葉）だけ（決まりの match /config/roles。運営でもできない）。
 * 手元の 役の設定 を先に変え、雲への送信は待たない（通信できないときに画面が止まらないように）。
 * 断られたら（管理者の印が切れたなど）知らせる。役の見張り（useScoreStore の listenToConfig）が雲の中身に戻す。
 * 中身の決まり（部品・最初の 4 つ・名前の形）は src/yaku.js。
 * 店（useScoreStore.js）が ...役の操作(書く, 状態) で広げる。
 */
const 役の決まり = require('./yaku');
const { Alert, Firebaseの器, Firestore } = require('./storeShared');

const 断りの文 = '団体のアカウントで、管理者モードのときだけ役を決められます';

const 役の操作 = (書く, 状態) => {
  const 置き場 = () => Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/config`, 'roles');
  const 決められない = () =>
    !状態().activeGroupId || !Firebaseの器.db || !役の決まり.できるか(状態(), '役を決める');
  /** 手元の 役の設定 を写して直す */
  const 手元を直す = (直す) => {
    const 今 = 状態().役の設定 || {};
    const 次 = { 役: Object.assign({}, 今.役 || {}), 割り当て: Object.assign({}, 今.割り当て || {}) };
    直す(次);
    書く({ 役の設定: 次 });
  };
  /** 雲へ送る（merge）。待たない。断られたら知らせる */
  const 送る = (中身) => {
    Firestore.setDoc(置き場(), Object.assign({}, 中身, { lastModified: Firestore.serverTimestamp() }), {
      merge: true,
    }).catch((誤り) => {
      console.error('[Store] 役を保存できませんでした:', 誤り);
      Alert.alert(
        '役を保存できませんでした',
        '管理者モードが切れたかもしれません。管理者モードに入り直してから、もう一度お試しください。'
      );
    });
  };

  return {
    /**
     * 役を作る・直す（id が無ければ作る）。名前と部品（src/yaku.js の 部品の鍵 のうち持つもの）
     * @returns {{誤り?: string, id?: string}}
     */
    役を置く: ({ id, 名, 部品 }) => {
      if (決められない()) return { 誤り: 断りの文 };
      const 設定 = 状態().役の設定;
      const 文 = 役の決まり.役の名の形の文(名, 設定, id);
      if (文) return { 誤り: 文 };
      if (!id && 役の決まり.役の一覧(設定).length >= 役の決まり.役の数の上限)
        return { 誤り: `役は ${役の決まり.役の数の上限} 個までです` };
      const 新id = id || 役の決まり.新しい役のid();
      const 中 = {
        名: String(名).trim(),
        // 見るのが要る部品（直す・消す・メンバー・出欠）があれば「全員を見る」も足す（src/yaku.js。11/19 本人）
        部品: 役の決まり.形の良い部品(部品 || []),
      };
      if (!id) 中.作った = Date.now();
      手元を直す((次) => {
        次.役[新id] = Object.assign({}, 次.役[新id] || {}, 中);
      });
      送る({ 役: { [新id]: 中 } });
      return { id: 新id };
    },
    /** 作った役を消す（最初の 4 つは消せない）。その役の人は 部員（自分） に戻る */
    役を消す: (id) => {
      if (決められない()) return { 誤り: 断りの文 };
      if (役の決まり.最初の役.some((役) => 役.id === id)) return { 誤り: '最初からある役は消せません' };
      const 外す人 = Object.keys((状態().役の設定 || {}).割り当て || {}).filter(
        (人) => 状態().役の設定.割り当て[人] === id
      );
      手元を直す((次) => {
        delete 次.役[id];
        外す人.forEach((人) => delete 次.割り当て[人]);
      });
      const 割り当て = {};
      外す人.forEach((人) => (割り当て[人] = Firestore.deleteField()));
      送る(Object.assign({ 役: { [id]: Firestore.deleteField() } }, 外す人.length ? { 割り当て } : {}));
      return {};
    },
    /** メンバーに役を割り当てる。部員（自分） なら割り当てを外す（無い人は 部員（自分）） */
    役を割り当てる: (memberId, 役id) => {
      if (決められない()) return { 誤り: 断りの文 };
      if (!memberId || !役の決まり.役の一覧(状態().役の設定).some((役) => 役.id === 役id))
        return { 誤り: 'その役はありません' };
      const 外す = 役id === 役の決まり.既定の役;
      手元を直す((次) => {
        if (外す) delete 次.割り当て[String(memberId)];
        else 次.割り当て[String(memberId)] = 役id;
      });
      送る({ 割り当て: { [String(memberId)]: 外す ? Firestore.deleteField() : 役id } });
      return {};
    },
  };
};

module.exports = { 役の操作 };
