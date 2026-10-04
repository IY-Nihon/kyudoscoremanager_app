'use strict';

/**
 * 店の操作のうち、ライブ（複数の端末で同じ記録表を共有する）：始める・共有のリンクを配る／で入る・入る・戻る・やめる、
 * 開いているライブの一覧、共有の取り消し。
 * （2026-10-05 に useScoreStore.js から分けた。中身は変えていない。店の名指しは 場.店 にした）
 * 店（useScoreStore.js）が ...ライブの操作(書く, 状態, そのまま書く) で広げる。
 */
const {
  Firebaseの器,
  IS_WEB,
  RTDB,
  restampChangedArchers,
  いまの見当,
  つなげなくなった,
  サーバー時刻,
  ライブの枝,
  ライブの盤面を読み取る,
  ライブへ盤面を送る,
  共,
  共有履歴の場所,
  共有履歴の目印を受け取る,
  写しの場所,
  写しを見るのをやめる,
  印は盤面を正に,
  参加できるライブ,
  団体の枝,
  在席の場所,
  在席を始める,
  在席を終える,
  場,
  射数差を当てる,
  届いた射手に合わせる,
  差分を当てる,
  弾かれたか,
  期限で閉じるか,
  期限の場所,
  期限を控える,
  盤面を射数にそろえる,
  秘,
  移ったら付いていく,
  載っている印を捨てる,
  載っている盤面を控える,
  道しるべたちを拾う,
  道しるべの場所,
  項目差分を当てる,
} = require('./storeShared');

const ライブの操作 = (書く, 状態, そのまま書く) => ({
  /**
   * ライブ中の取り消し（向き -1）・やり直し（向き +1）。
   *
   * 全員で1本の履歴を使う。誰が押しても「最後の1手」が戻り、結果は
   * 盤面としてライブへ流れるので全員の画面が揃う。
   * 同時に押された場合は重なることがあるが、盤面は必ず一致する。
   */
  sharedUndo: async (向き) => {
    // 閲覧用はライブ全体を巻き戻せない。1人が見ているだけのつもりで
    // 押しても、全員の○×が戻ってしまう
    if (状態().書き換えを止めるか()) return;
    const { liveSessionName: 名前 } = 状態();
    const 枝 = ライブの枝();
    if (!Firebaseの器.rtdb || !枝 || !名前) return;
    const 根 = `live_sessions/${枝}/${名前}`;
    try {
      // 目印は state から配られてくる。手元の控えより新しいことがある
      const 届いた状態 = await RTDB.get(RTDB.ref(Firebaseの器.rtdb, `${根}/state`));
      const 盤面の値 = 届いた状態.exists() ? 届いた状態.val() || {} : {};
      const 位置 =
        'number' == typeof 盤面の値.history_len ? 盤面の値.history_len : 状態().historySharedLen || 0;
      const 上限 =
        'number' == typeof 盤面の値.history_max ? 盤面の値.history_max : 状態().historySharedMax || 0;
      const 読む番号 = 向き < 0 ? 位置 - 1 : 位置;
      if (向き < 0 ? 位置 <= 0 : 位置 >= 上限) return; // これ以上は戻せない／進めない
      const 手の場所 = RTDB.ref(Firebaseの器.rtdb, `${共有履歴の場所(枝, 名前)}/${読む番号}`);
      let 手 = await RTDB.get(手の場所);
      // 番号は取れているのに、中身がまだ雲に着いていないことがある。積むときは
      // 番号を runTransaction で取ってから中身を書くので、2 台以上が同時に入れた
      // 直後はその間だけ番号の先が空になる。空のまま帰ると、押した取り消しが
      // 何も起こさずに消える（2026-09-26 に 3 台の e2e で 4 回に 1 回）。少し待って読み直す
      for (let 回 = 0; !手.exists() && 回 < 10; 回++) {
        await new Promise((r) => setTimeout(r, 200));
        手 = await RTDB.get(手の場所);
      }
      if (!手.exists()) return;
      const 中身 = 手.val() || {};
      const 次 = 位置 + 向き;
      const 知らせ時刻 = Date.now();
      // 「変えたます」の控えがあれば、そこだけ戻す。盤面まるごと戻すと、
      // 2台が同時に入れたとき、控えの前に相手の入力が入っていないため
      // 相手の○×まで消える。古い版が積んだ控えには差分が無いので、
      // そのときは従来どおり盤面で戻す
      const 差分 = Array.isArray(中身.差分) ? 中身.差分 : null;
      const 項目 = Array.isArray(中身.項目) ? 中身.項目 : null;
      // 射数の控えは射手ごとの表を持つので、配列ではなく object
      const 射数 = !差分 && !項目 && 中身.射数 && 'number' == typeof 中身.射数.前 ? 中身.射数 : null;
      const 盤面 = 差分
        ? {
            archers: 差分を当てる(状態().archers, 差分, 向き).archers,
            shotsPerRound: 状態().shotsPerRound,
          }
        : 項目
          ? {
              archers: 項目差分を当てる(状態().archers, 項目, 向き).archers,
              shotsPerRound: 状態().shotsPerRound,
            }
          : 射数
            ? (() => {
                const 出 = 射数差を当てる(状態().archers, 射数, 向き);
                return { archers: 出.archers, shotsPerRound: 出.本数 };
              })()
            : ライブの盤面を読み取る({
                archers: 向き < 0 ? 中身.前 : 中身.後,
                shotsPerRound: 中身.本数,
              });
      // 戻した内容が相手に届くよう、変わった射手の日時を打ち直す
      const 戻す = restampChangedArchers(盤面.archers, 状態().archers, 知らせ時刻);
      // ここでの書き換えは履歴に積まない（積むと際限がなくなる）
      場.履歴を積まない = true;
      try {
        書く({
          archers: 戻す,
          shotsPerRound: 盤面.shotsPerRound,
          historySharedLen: 次,
          historySharedMax: 上限,
          // 押した本人にも知らせる。返りの history_at は historyHandledAt と同じなので
          // 返りでは知らせが出ない。ここで立てないと本人にだけ知らせが出ない。
          // （同じ値にしておくので、返りが届いても二重に出ない）
          historyHandledAt: 知らせ時刻,
          historyNoticeAt: 知らせ時刻,
          historyNoticeKind: 向き < 0 ? '取り消し' : 'やり直し',
          lastLocalChange: 知らせ時刻,
        });
      } finally {
        場.履歴を積まない = false;
      }
      // 盤面を全員へ流し、あわせて「取り消された」ことを知らせる
      ライブへ盤面を送る(名前, 戻す, 盤面.shotsPerRound);
      RTDB.update(RTDB.ref(Firebaseの器.rtdb, `${根}/state`), {
        history_len: 次,
        history_max: 上限,
        history_at: 知らせ時刻,
        history_kind: 向き < 0 ? '取り消し' : 'やり直し',
      }).catch(() => {});
    } catch (誤り) {
      console.error('[Store] 共有の取り消しに失敗:', 誤り);
    }
  },

  // 戻り値は '開始した' / '同名あり' / '確認できない' の3つ。
  // 元は真偽値で、画面はどちらの理由でも「既に使用されています」と出していた。
  /**
   * ライブを始める。
   *
   * 共有 に { 編集の枝, 閲覧の枝 } を渡すと、そのライブだけを専用の枝に置く
   * （URLで配るため。src/liveShare.js）。渡さなければ団体の枝に置く。
   * 名前が空いているかは、どちらの場合も団体の枝で見る。参加一覧に出る
   * 名前はそちらで、共有の枝は毎回作りたてなので必ず空いている
   */
  startLiveSync: async (名前, 共有) => {
    // ライブを移ったら控えは捨てる。前のライブで載せた○×を覚えたままだと、
    // 次のライブで「前と同じ」と見なして送らず、相手の画面に出ない
    載っている印を捨てる();
    if (!Firebaseの器.rtdb) return '確認できない';
    // ライブを置く枝は団体ごとの合言葉。まだ手元に無ければ取りにいく。
    // ここで取れないまま団体IDで始めると、他団体から丸見えになる
    const 団 = 団体の枝() || (await 状態().ライブの合言葉を用意する());
    if (!秘.枝として使えるか(団)) return '確認できない';
    const 枝 = 共有 && 秘.枝として使えるか(共有.編集の枝) ? String(共有.編集の枝) : 団;
    // いま自分が主催しているライブを共有へ切り替えるときは、同名でよい。
    // 団体の枝にある自分の節点を、道しるべへ置き換えるだけだから
    const 自分のを置き換える = !!(共有 && 状態().isHost && 状態().liveSessionName === 名前);
    try {
      const 節点 = RTDB.ref(Firebaseの器.rtdb, `live_sessions/${団}/${名前}`);
      if (!自分のを置き換える && (await RTDB.get(節点)).exists()) return '同名あり';
    } catch (誤り) {
      // 確かめられないまま作ると、進行中の同名ライブを上書きして潰す。
      // 元はここで握りつぶして、そのまま作成へ進んでいた
      return (console.error('Session Name Check Error:', 誤り), '確認できない');
    }
    状態().stopLiveSync(true);
    書く({
      // 共有のライブなら、そのライブ専用の枝を据える。
      // stopLiveSync より後に置くこと。先に置くと、その中で消される
      いまのライブの枝: 共有 ? 枝 : null,
      // 自分で始めたライブなので、よそではない
      よその団体のライブ: false,
      いまのライブの閲覧枝: 共有 ? 共有.閲覧の枝 || null : null,
      写しを見ているか: false,
      isLiveActive: true,
      isHost: true,
      // 主催者は必ず記録する側
      ライブは見るだけ: false,
      liveSessionName: 名前,
      isIncomingLiveSync: false,
      lastLocalChange: Date.now(),
      // 共有履歴はライブごとに別物。前のライブの目印を持ち越すと、
      // 新しいライブでいきなり取り消しが押せて、無い手を読みにいく。
      // 主催者は同名のライブを作れないので必ず新品。参加者と違って
      // 「これまでの結果」が届くことがなく、初回を飛ばす目印は要らない
      historySharedLen: 0,
      historySharedMax: 0,
      historyHandledAt: 0,
      historyIsFirstSnapshot: false,
      // 同じ名前で始め直したとき、前回の片付けが節点に残っていることがある。
      // 最初の1通ぶんは知らせない
      resetIsFirstSnapshot: true,
      // アプリを閉じて戻ったときに、このライブへ戻るための控え（端末に残す）
      ライブの続き: {
        名前,
        枝: 共有 ? 枝 : null,
        閲覧枝: 共有 ? 共有.閲覧の枝 || null : null,
        主催: true,
        見るだけ: false,
        よそ: false,
        団体: 状態().activeGroupId || null,
      },
    });
    const いま = 状態();
    if (!Firebaseの器.rtdb) return '確認できない';
    const 盤面の場所 = RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${名前}/state`);
    const 射手たち = Array.isArray(いま.archers) ? いま.archers : [];
    try {
      return (
        ライブへ盤面を送る(名前, 射手たち, いま.shotsPerRound),
        // 閲覧用の枝を、共有の枝の state にも載せておく。
        // リンクで入った記録係も写しへ流せるようにするため。
        // 載せないと、その人の○×だけ見ている人に出ない。
        // ここを読めるのは編集の枝を知っている人だけなので、閲覧の人には見えない
        共有 &&
          RTDB.update(RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${名前}/state`), {
            閲覧の枝: 共有.閲覧の枝 || null,
          }).catch(() => {}),
        // 共有のライブは別の枝にあるので、参加一覧に出すための道しるべを
        // 団体の枝へ置く。部員はこれを辿って共有の枝へ入る
        共有 &&
          RTDB.set(RTDB.ref(Firebaseの器.rtdb, 道しるべの場所(団, 名前)), {
            共有の枝: 枝,
            閲覧の枝: 共有.閲覧の枝 || null,
            status: 'active',
            timestamp: Date.now(),
            updated_at: RTDB.serverTimestamp(),
          }).catch((誤り) => console.error('[Store] 道しるべを置けませんでした', 誤り)),
        在席を始める(名前, 書く),
        IS_WEB && console.log('ライブを開始しました: ' + 名前),
        RTDB.onValue(盤面の場所, (返り) => {
          if (場.自分の送信中) return;
          const 届いた = 返り.val();
          載っている盤面を控える(届いた);
          if (!届いた) {
            const 今の名前 = 状態().liveSessionName;
            return (
              今の名前 &&
                Firebaseの器.rtdb &&
                RTDB.off(RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${今の名前}/state`)),
              在席を終える(書く),
              写しを見るのをやめる(),
              void 書く({
                isLiveActive: false,
                ライブの続き: null,
                isHost: false,
                liveSessionName: null,
              })
            );
          }
          // 期限は枝分かれの前に控える。下の「他人の書き込み」の枝だけに
          // 置くと、自分で配った主催者は自分の返りしか受けないので
          // 一度も拾えない（カウントダウンが出なかった）
          期限を控える(届いた, 書く, 状態);
          // 自分の送信の返りも、ほかの通知と同じに扱う。前は timestamp で返りを見分けて
          // ○× だけを取り込んでいた。自分のまだ雲へ届いていない書き込みがあると、届く値の
          // timestamp は自分のものに見えるので、同じ通知に載った相手の射数や人の選択を
          // 捨て、そのあと通知が来ずに食い違ったまま残った（2026-09-26 に 2 台の e2e で再現）
          {
            if ('finished' === 届いた.status) {
              const 今の名前 = 状態().liveSessionName;
              return (
                今の名前 &&
                  Firebaseの器.rtdb &&
                  RTDB.off(RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${今の名前}/state`)),
                在席を終える(書く),
                写しを見るのをやめる(),
                void 書く({
                  isLiveActive: false,
                  ライブの続き: null,
                  isHost: false,
                  liveSessionName: null,
                })
              );
            }
            // 誰かが配ったら、その枝へ付いていく
            // 期限より先に見る。切れているのに付いていくと、行った先でも切れている
            if (期限で閉じるか(届いた, 書く, 状態)) return;
            if (移ったら付いていく(届いた, 書く, 状態)) return;
            共有履歴の目印を受け取る(届いた, 書く, 状態);
            // 参加者側と同じ。始め直したとき、節点に前回の片付けが
            // 残っていることがあるので、最初の1通ぶんは知らせない
            const 主のリセット初回 = 状態().resetIsFirstSnapshot;
            if (主のリセット初回) 書く({ resetIsFirstSnapshot: false });
            if (届いた.reset_at && 届いた.reset_at > (状態().lastResetHandled || 0))
              return (
                書く({ lastResetHandled: 届いた.reset_at }),
                主のリセット初回 && 書く({ lastPushedTimestamp: 届いた.timestamp || 0 }),
                // 送信はしない。受け取ったリセットを送り返すと、相手の画面に
                // 「リセットしました」が二度出るうえ、無駄な書き込みが増える
                void 状態().resetCurrentSession(false)
              );
            if (届いた.archers || Array.isArray(届いた.archers)) {
              // 突き合わせは 届いた射手に合わせる（○× 以外）と 印は盤面を正に（○×）。
              // 主催者側と参加者側で同じ処理が二重に書かれていたため
              const { archers: 受信, shotsPerRound: 本数 } = ライブの盤面を読み取る(届いた);
              const 結果 = 印は盤面を正に(
                届いた射手に合わせる(状態().archers, 受信, 状態().shotsPerRound, 本数),
                届いた,
                本数
              );
              // 受け取りの正規化は短い○×を伸ばすだけで、長いほうは切らない。
              // 相手が射数を減らしたとき、手元の射手のほうが新しいと
              // 射数だけ減って○×が伸びたまま残る（画面に出ないますの○が
              // 的中数に入る）。射数が変わればここは必ず通る
              if (結果.changed)
                書く({ archers: 盤面を射数にそろえる(結果.archers, 本数), shotsPerRound: 本数 });
            }
          }
        }),
        '開始した'
      );
    } catch (誤り) {
      return (console.error('Start Live Sync Error:', 誤り), '確認できない');
    }
  },
  /**
   * いま入っているライブを、URLで配れるようにする。主催者だけができる。
   *
   * 団体の合言葉は配らない。配ると、その1本で団体の全部のライブに
   * 入られてしまう。そのライブ専用の枝を作ってそちらへ移し、リンクは
   * その枝だけを指す（src/liveShare.js）。
   *
   * 編集用と閲覧用は別々の種から作る。閲覧リンクを持っていても、
   * 編集用の枝は計算できない。
   *
   * 戻り値は { 編集の荷, 閲覧の荷, 合言葉が要るか }。失敗したら null。
   * 盤面は手元に残っているので、移っても○×は消えない
   */
  /**
   * いま入っているライブを、URLで配れるようにする。
   *
   * 主催者でなくてもよい。ただし共有は「ライブを専用の枝へ移す」操作なので、
   * 参加者が勝手に移すと主催者が元の枝に取り残されて分裂する。そこで
   * 元の枝に「移った先」を書き、ほかの台はそれを見て付いてくる。
   *
   * すでに配られているライブなら、そのときの種から同じリンクを作り直す。
   * 種は共有の枝の state に置いてあり、編集の枝を知っている人だけが読める。
   * 合言葉は要らない（リンクを組むのに種しか使わないため）。
   * これで、配った本人でなくても同じリンクを渡せる。
   */
  ライブを共有する: async (合言葉, 持ち) => {
    const { liveSessionName: 名前 } = 状態();
    if (!Firebaseの器.rtdb || !名前) return null;
    // 見るだけの人は配れない。写しの枝しか知らないので、
    // 配っても記録できるリンクにはならない
    if (状態().写しを見ているか) return null;
    const 今の枝 = ライブの枝();
    if (!今の枝) return null;
    const 状態の道 = `live_sessions/${今の枝}/${名前}/state`;
    let 今の中身 = {};
    try {
      const 返り = await RTDB.get(RTDB.ref(Firebaseの器.rtdb, 状態の道));
      今の中身 = 返り.exists() ? 返り.val() || {} : {};
    } catch (誤り) {
      return (console.error('[Store] ライブを読めませんでした', 誤り), null);
    }
    // すでに配られている
    const 種 = 今の中身.種;
    if (種 && 種.編集 && 種.閲覧) {
      // 期限は配ったときのものを引き継ぐ。ここで付け直すと期限が延び、
      // 決まりの側（延ばせない）と食い違って、画面だけが嘘をつく
      const 元の期限 = 'number' == typeof 今の中身.期限 ? 今の中身.期限 : null;
      return {
        編集の荷: 共.共有の荷を組む({
          種: 種.編集,
          名前,
          役: 共.編集,
          鍵が要るか: !!今の中身.鍵が要るか,
          期限: 元の期限,
        }),
        閲覧の荷: 共.共有の荷を組む({
          種: 種.閲覧,
          名前,
          役: 共.閲覧,
          鍵が要るか: !!今の中身.鍵が要るか,
          期限: 元の期限,
        }),
        合言葉が要るか: !!今の中身.鍵が要るか,
        期限: 元の期限,
        すでに配られていた: true,
      };
    }
    // ここから、まだ配られていないライブを専用の枝へ移す
    const 鍵 = String(合言葉 == null ? '' : 合言葉);
    const 編集の種 = 共.共有の種を作る();
    const 閲覧の種 = 共.共有の種を作る();
    const 編集の枝 = 共.枝を導く(編集の種, 鍵);
    const 閲覧の枝 = 共.枝を導く(閲覧の種, 鍵);
    const 団 = 団体の枝() || (await 状態().ライブの合言葉を用意する());
    if (!秘.枝として使えるか(団)) return null;
    // 期限はサーバーの時計で決める。手元の時計が進んでいると、
    // 配った瞬間に切れているリンクを渡してしまう
    const 期限 = 共.期限の時刻('number' == typeof 持ち ? 持ち : 共.期限の既定, await サーバー時刻());
    try {
      // 期限は盤面より先に置く。あとにすると、途中で失敗したときに
      // 「期限の無いリンク」が残る。逆なら残るのは読むもののない期限だけ
      if (期限)
        await Promise.all([
          RTDB.set(RTDB.ref(Firebaseの器.rtdb, 期限の場所(編集の枝)), 期限),
          RTDB.set(RTDB.ref(Firebaseの器.rtdb, 期限の場所(閲覧の枝)), 期限),
        ]);
      // 盤面をそのまま新しい枝へ写す。種もここに置く（編集の枝を知る人だけが読める）
      await RTDB.set(
        RTDB.ref(Firebaseの器.rtdb, `live_sessions/${編集の枝}/${名前}/state`),
        Object.assign({}, 今の中身, {
          閲覧の枝,
          種: { 編集: 編集の種, 閲覧: 閲覧の種 },
          鍵が要るか: !!鍵,
          期限,
          移った先: null,
          timestamp: Date.now(),
          updated_at: RTDB.serverTimestamp(),
        })
      );
      // 閲覧用の写しも、ここで一度作っておく。作らないと、配った直後に
      // 閲覧リンクを開いた人が「見つからない」になる。
      // 種と閲覧の枝は写しに入れないこと。閲覧の人に編集側の手がかりを渡さない
      const 写しの中身 = Object.assign({}, 今の中身, { 期限 });
      delete 写しの中身.種;
      delete 写しの中身.閲覧の枝;
      delete 写しの中身.移った先;
      delete 写しの中身.移った先の閲覧枝;
      await RTDB.set(
        RTDB.ref(Firebaseの器.rtdb, 写しの場所(閲覧の枝, 名前)),
        Object.assign(写しの中身, { timestamp: Date.now(), updated_at: RTDB.serverTimestamp() })
      );
      // 共有履歴も引き継ぐ。取り消しの目印は state に載っているので、
      // 中身を移さないと押した瞬間に無い手を読みにいく
      const 元の履歴 = await RTDB.get(RTDB.ref(Firebaseの器.rtdb, 共有履歴の場所(今の枝, 名前)));
      if (元の履歴.exists())
        await RTDB.set(RTDB.ref(Firebaseの器.rtdb, 共有履歴の場所(編集の枝, 名前)), 元の履歴.val());
      // 参加一覧に出すための道しるべ
      await RTDB.set(RTDB.ref(Firebaseの器.rtdb, 道しるべの場所(団, 名前)), {
        共有の枝: 編集の枝,
        閲覧の枝,
        // 参加一覧が、期限の切れたライブを外すのに使う
        // （src/syncRules.js の 参加できるライブ）
        期限: 期限 || null,
        status: 'active',
        timestamp: Date.now(),
        updated_at: RTDB.serverTimestamp(),
      });
      // 元の枝に道しるべを置く。ほかの台はこれを見て付いてくる。
      // 置かないと、配った人だけが新しい枝へ移ってライブが分裂する
      if (今の枝 !== 団)
        await RTDB.update(RTDB.ref(Firebaseの器.rtdb, 状態の道), {
          移った先: 編集の枝,
          移った先の閲覧枝: 閲覧の枝,
          updated_at: RTDB.serverTimestamp(),
        });
    } catch (誤り) {
      return (console.error('[Store] ライブを配れませんでした', 誤り), null);
    }
    // 自分も新しい枝へ移る。主催者かどうかは変えない
    const 主催だった = 状態().isHost;
    状態().joinLiveSync(名前, false, { 枝: 編集の枝, 閲覧枝: 閲覧の枝 });
    書く({ isHost: 主催だった, よその団体のライブ: false });
    return {
      編集の荷: 共.共有の荷を組む({ 種: 編集の種, 名前, 役: 共.編集, 鍵が要るか: !!鍵, 期限 }),
      閲覧の荷: 共.共有の荷を組む({ 種: 閲覧の種, 名前, 役: 共.閲覧, 鍵が要るか: !!鍵, 期限 }),
      合言葉が要るか: !!鍵,
      期限,
      すでに配られていた: false,
    };
  },
  /**
   * 共有リンクから入る。団体に入っていなくても使える。
   *
   * 合言葉は照らし合わせない。枝の名前そのものを合言葉から導くので、
   * 違っていれば別の枝を見にいき、そこには何も無い。だから
   * 「合っていない」ことは「盤面が来ない」という形で分かる。
   *
   * 戻り値は '入った' / '見つからない' / '期限切れ' / '確認できない'
   *
   * '見つからない' は合言葉違いと終了の両方を指す。枝の名前を合言葉から導くので、
   * 違えば別の枝を見にいくだけで、どちらなのかは区別できない
   */
  共有リンクで入る: async (荷, 合言葉) => {
    if (!Firebaseの器.rtdb) return '確認できない';
    const 中身 = 共.共有の荷を解く(荷);
    if (!中身) return '確認できない';
    const 枝 = 共.枝を導く(中身.種, String(合言葉 == null ? '' : 合言葉));
    if (!秘.枝として使えるか(枝)) return '確認できない';
    const 見るだけ = 中身.役 === 共.閲覧;
    const 道 = 見るだけ ? 写しの場所(枝, 中身.名前) : `live_sessions/${枝}/${中身.名前}/state`;
    // 記録する側は、写しを流す先も受け取る。受け取らないと、
    // この人が入れた○×だけが見ている人に出ない
    let 写す先 = null;
    try {
      // 合言葉が違えば別の枝になるので、ここで「無い」と分かる
      const 有 = await RTDB.get(RTDB.ref(Firebaseの器.rtdb, 道));
      if (!有.exists()) return '見つからない';
      if (!見るだけ) {
        const 中 = 有.val() || {};
        if (秘.枝として使えるか(中.閲覧の枝)) 写す先 = String(中.閲覧の枝);
      }
    } catch (誤り) {
      // 決まりに弾かれたときだけ、期限を見に行く。
      //
      // 先に期限を確かめる作りにしていたが、それだと期限の無いリンクでも
      // 参加のたびに問い合わせが1回増える（実測でおよそ230ミリ秒）。
      // 弾かれるのは稀なので、そのときだけ調べれば足りる。
      //
      // 荷に載っている期限は誰でも書き換えられるので、そちらは見ない。
      // ここで見るのは「期限切れです」と言い切るためだけで、
      // 切れた枝に入れないことは決まりの側が保証している
      if (弾かれたか(誤り))
        try {
          const 限 = await RTDB.get(RTDB.ref(Firebaseの器.rtdb, 期限の場所(枝)));
          const 期限の値 = 限.exists() ? 限.val() : null;
          if ('number' == typeof 期限の値 && (await サーバー時刻()) >= 期限の値) return '期限切れ';
        } catch (e2) {
          /* 期限も読めない。理由が分からないので、下の「確認できない」に落とす */
        }
      return (console.error('[Store] 共有リンクの確認に失敗:', 誤り), '確認できない');
    }
    // 自分の団体のライブか、よその団体のライブかを見分ける。
    //
    // 自分の団体の枝に、この枝を指す道しるべがあれば自分たちの練習。
    // 部員が共有リンクを開いただけ、という筋がこれに当たる。
    // 見分けられなかったときは「よそ」として扱う。取り違えて
    // よその練習を自分の団体の記録に残すほうが困る
    let よそ = true;
    const 団 = 団体の枝();
    if (団) {
      try {
        const 印 = await RTDB.get(RTDB.ref(Firebaseの器.rtdb, 道しるべの場所(団, 中身.名前)));
        const 道しるべの値 = 印.exists() ? 印.val() || {} : {};
        if (道しるべの値.共有の枝 === 枝 || 道しるべの値.閲覧の枝 === 枝) よそ = false;
      } catch (誤り) {
        console.warn('[Store] 自分の団体のライブか確かめられませんでした', 誤り);
      }
    }
    // 団体に入っていない人は「来客」。App.js がこれを見て画面を出す
    書く({ 共有の来客: !状態().activeGroupId });
    if (!見るだけ) {
      // 記録する側は、部員が参加するのと同じ道を通す。受け取りの取り込みは
      // 「自分の送信の返りを無視する」「同じ通知に載った相手の印は取り込む」と
      // 込み入っていて、ここに別に書くと必ずずれる。実際、別に書いていたときは
      // 入れた○×が次の受信で消えていた
      載っている印を捨てる();
      写しを見るのをやめる();
      状態().joinLiveSync(中身.名前, false, { 枝, 閲覧枝: 写す先 });
      // joinLiveSync が偽に戻すので、そのあとで据える
      書く({ よその団体のライブ: よそ });
      return '入った';
    }
    // 見るだけの側。写しを読むだけで、何も送り返さない
    載っている印を捨てる();
    写しを見るのをやめる();
    状態().stopLiveSync(true);
    書く({
      いまのライブの枝: null,
      いまのライブの閲覧枝: 枝,
      写しを見ているか: true,
      よその団体のライブ: よそ,
      isLiveActive: true,
      isHost: false,
      ライブは見るだけ: true,
      liveSessionName: 中身.名前,
      isIncomingLiveSync: false,
      lastLocalChange: 0,
      lastPushedTimestamp: 0,
      historySharedLen: 0,
      historySharedMax: 0,
      historyIsFirstSnapshot: true,
      resetIsFirstSnapshot: true,
    });
    場.写しの片付け = RTDB.onValue(
      RTDB.ref(Firebaseの器.rtdb, 道),
      (返り) => {
        const 届いた = 返り.val();
        if (!届いた) return;
        if ('finished' === 届いた.status)
          return void 書く({
            isLiveActive: false,
            ライブの続き: null,
            isHost: false,
            liveSessionName: null,
            いまのライブの期限: null,
          });
        if (期限で閉じるか(届いた, 書く, 状態)) return;
        if (!届いた.archers && !Array.isArray(届いた.archers)) return;
        // 部員が参加するときと同じ突き合わせを通す。
        //
        // ライブの archers に○×は入っていない（○×は marks_by_id で別に送る）。
        // ここで archers をそのまま入れていたころは、○×がいつまでも出なかった。
        // w() で組み直し、届いた射手に合わせる で突き合わせる
        const { archers: 受信, shotsPerRound: 本数 } = ライブの盤面を読み取る(届いた);
        const 結果 = 印は盤面を正に(
          届いた射手に合わせる(状態().archers, 受信, 状態().shotsPerRound, 本数),
          届いた,
          本数
        );
        if (結果.changed)
          書く({
            archers: 盤面を射数にそろえる(結果.archers, 本数),
            shotsPerRound: 本数,
            isIncomingLiveSync: true,
          });
      },
      (誤り) => つなげなくなった(誤り, 書く, 状態)
    );
    if (IS_WEB) console.log('共有リンクで入りました（見るだけ）: ' + 中身.名前);
    return '入った';
  },
  /**
   * ライブに参加する。
   *
   * 共有 に { 枝, 閲覧枝 } を渡すと、その枝へ入る（共有リンクで来た人）。
   * 渡さなければ、参加一覧の道しるべか団体の枝から決める。
   * リンクで来た人もここを通す。受け取りの取り込みは、自分の送信の返りを
   * 見分けたり相手の印を混ぜたりと込み入っていて、別に書くと必ずずれる
   */
  joinLiveSync: (名前, 見るだけ, 共有) => {
    // ライブを移ったら控えは捨てる。前のライブで載せた○×を覚えたままだと、
    // 次のライブで「前と同じ」と見なして送らず、相手の画面に出ない
    載っている印を捨てる();
    // 共有のライブは団体の枝に盤面を置いていない。道しるべを辿って、
    // そのライブ専用の枝へ入る。辿らないと空の節点を見て何も出ない
    const 道しるべ = (状態().共有のライブたち || {})[名前] || null;
    const 差し込み = 共有 && 秘.枝として使えるか(共有.枝) ? String(共有.枝) : null;
    // 一覧は合言葉が取れてからしか出ないので、ここへ来る時点で普通は在る。
    // 無いまま進むと「参加中」の表示だけ出て何も届かないので、先に止める
    const 枝 = 差し込み || (道しるべ ? 道しるべ.共有の枝 : 団体の枝());
    if (!枝) return;
    if (
      (状態().stopLiveSync(true),
      書く({
        // 共有のライブに入るときは、そのライブ専用の枝を据える
        いまのライブの枝: 差し込み || 道しるべ ? 枝 : null,
        // 参加一覧から入ったのなら自分の団体のライブ。
        // 共有リンクから来たときは、呼ぶ側があとで決め直す
        よその団体のライブ: false,
        いまのライブの閲覧枝: 差し込み ? (共有 && 共有.閲覧枝) || null : 道しるべ ? 道しるべ.閲覧の枝 : null,
        写しを見ているか: false,
        isLiveActive: true,
        isHost: false,
        ライブは見るだけ: !!見るだけ,
        liveSessionName: 名前,
        isIncomingLiveSync: false,
        lastLocalChange: 0,
        // 参加して最初に届く1通は必ず取り込む。
        // 自分の送信の返りを無視する判定（timestamp の一致）は、
        // 最後に書き込んだのが自分自身だと1通目にも当たってしまう。
        // 当たると盤面が空のまま、誰かが次に何かするまで何も出ない
        lastPushedTimestamp: 0,
        // 主催者側と同じ理由。目印は参加したライブのものを受け取り直す
        historySharedLen: 0,
        historySharedMax: 0,
        historyIsFirstSnapshot: true,
        resetIsFirstSnapshot: true,
        // アプリを閉じて戻ったときに、このライブへ戻るための控え（端末に残す）。
        // 主催・よその団体は、呼ぶ側があとで据え直すことがある（ライブに戻る で拾う）
        ライブの続き: {
          名前,
          枝: 差し込み || 道しるべ ? 枝 : null,
          閲覧枝: 差し込み ? (共有 && 共有.閲覧枝) || null : 道しるべ ? 道しるべ.閲覧の枝 : null,
          主催: false,
          見るだけ: !!見るだけ,
          よそ: false,
          団体: 状態().activeGroupId || null,
        },
      }),
      !Firebaseの器.rtdb)
    )
      return;
    const 盤面の場所 = RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${名前}/state`);
    RTDB.onValue(
      盤面の場所,
      (返り) => {
        if (場.自分の送信中) return;
        const 届いた = 返り.val();
        載っている盤面を控える(届いた);
        if (!届いた) {
          const 今の名前 = 状態().liveSessionName;
          return (
            今の名前 &&
              Firebaseの器.rtdb &&
              RTDB.off(RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${今の名前}/state`)),
            在席を終える(書く),
            写しを見るのをやめる(),
            void 書く({ isLiveActive: false, ライブの続き: null, isHost: false, liveSessionName: null })
          );
        }
        // 自分の送信の返りも、ほかの通知と同じに扱う（主催者側の説明を参照）。
        // 矢所は、届いた射手が持っていなければ手元を残す（届いた射手に合わせる）
        if ('finished' === 届いた.status) {
          const 今の名前 = 状態().liveSessionName;
          return (
            今の名前 &&
              Firebaseの器.rtdb &&
              RTDB.off(RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${今の名前}/state`)),
            在席を終える(書く),
            写しを見るのをやめる(),
            // 送信しない。ここで送ると、主催者が2秒後に消す節点を書き戻してしまい、
            // 届くのが遅れた場合は「終わったはずのライブ」が一覧に残り続ける
            状態().resetCurrentSession(false),
            void 書く({ isLiveActive: false, ライブの続き: null, isHost: false, liveSessionName: null })
          );
        }
        // 誰かが配ったら、その枝へ付いていく
        // 期限より先に見る。切れているのに付いていくと、行った先でも切れている
        if (期限で閉じるか(届いた, 書く, 状態)) return;
        if (移ったら付いていく(届いた, 書く, 状態)) return;
        共有履歴の目印を受け取る(届いた, 書く, 状態);
        // 入って最初の1通かどうかを先に控える（下で旗を倒すため）
        const リセットの初回 = 状態().resetIsFirstSnapshot;
        if (リセットの初回) 書く({ resetIsFirstSnapshot: false });
        if (届いた.reset_at && 届いた.reset_at > (状態().lastResetHandled || 0)) {
          書く({ lastResetHandled: 届いた.reset_at });
          if (リセットの初回) 書く({ lastPushedTimestamp: 届いた.timestamp || 0 });
          状態().resetCurrentSession(false);
        }
        if (届いた.archers || Array.isArray(届いた.archers)) {
          // 主催者側（startLiveSync）と同じ関数を使う
          const { archers: 受信, shotsPerRound: 本数 } = ライブの盤面を読み取る(届いた);
          const 結果 = 印は盤面を正に(
            届いた射手に合わせる(状態().archers, 受信, 状態().shotsPerRound, 本数),
            届いた,
            本数
          );
          // 主催者側と同じ理由で、いまの射数にそろえる
          if (結果.changed) 書く({ archers: 盤面を射数にそろえる(結果.archers, 本数), shotsPerRound: 本数 });
        }
      },
      // 決まりに弾かれたら知らせる。渡さないと、盤面が空のまま
      // 「ライブ中」の表示だけが残る
      (誤り) => つなげなくなった(誤り, 書く, 状態)
    );
    在席を始める(名前, 書く);
    if (IS_WEB) console.log('ライブに参加しました: ' + 名前);
  },
  // 抜けるのは手元だけで、ライブそのものは残す。主催者と参加者で
  // 振る舞いを分けないための作りで、どちらが抜けても残った人は
  // そのまま続けられる。ライブを終わらせるのは「終了・保存」か、
  // 参加一覧から消したときだけ
  /** 共有リンクの来客をやめる。リンクで来た人が閉じるときに使う */
  共有の来客をやめる: () => {
    状態().stopLiveSync(true);
    書く({ 共有の来客: false });
  },
  /**
   * アプリを閉じて戻ったとき、続けていたライブへ戻る。
   *
   * ライブの状態（isLiveActive など）は端末に残さないので、閉じて開き直すと
   * ライブから抜けた形になり、記録表にはライブを始めた時点の○×だけが残っていた。
   * 端末に残した ライブの続き を見て、
   *   ・まだ続いているライブなら、同じ立場（主催／参加・見るだけ）で入り直す
   *   ・終わっている（節点が無い・finished）なら、記録表を片付けて控えを捨てる
   *   ・確かめられない（つながらない）なら、何もしない（次に開いたときにまた見る）
   */
  ライブに戻る: async () => {
    const 続き = 状態().ライブの続き;
    if (!続き || !続き.名前 || 状態().isLiveActive) return '無い';
    if (続き.団体 && 続き.団体 !== 状態().activeGroupId) return void 書く({ ライブの続き: null });
    if (!Firebaseの器.rtdb) return '確認できない';
    let 枝 = 秘.枝として使えるか(続き.枝) ? String(続き.枝) : 団体の枝();
    if (!枝) {
      try {
        枝 = 秘.ライブの枝(await 状態().ライブの合言葉を用意する());
      } catch (誤り) {
        枝 = null;
      }
    }
    if (!秘.枝として使えるか(枝)) return '確認できない';
    let 届いた状態;
    try {
      届いた状態 = (
        await RTDB.get(RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${続き.名前}/state`))
      ).val();
    } catch (誤り) {
      return '確認できない';
    }
    if (状態().isLiveActive) return '無い';
    const 切れた =
      届いた状態 &&
      'number' === typeof 届いた状態.期限 &&
      届いた状態.期限 > 0 &&
      いまの見当() >= 届いた状態.期限;
    if (!届いた状態 || 'finished' === 届いた状態.status || 切れた) {
      // 終わっていた。ライブを始めた時点の○×が記録表に残っているので片付ける
      状態().resetCurrentSession(false);
      書く({ ライブの続き: null });
      return '終わっていた';
    }
    状態().joinLiveSync(
      続き.名前,
      !!続き.見るだけ,
      秘.枝として使えるか(続き.枝) ? { 枝: String(続き.枝), 閲覧枝: 続き.閲覧枝 || null } : undefined
    );
    // joinLiveSync は参加者として入る。主催だったなら主催に戻す（移ったら付いていく と同じ）
    if (状態().liveSessionName === 続き.名前) 書く({ isHost: !!続き.主催, よその団体のライブ: !!続き.よそ });
    return '戻った';
  },
  stopLiveSync: (記録を残す = false) => {
    // ライブを移ったら控えは捨てる。前のライブで載せた○×を覚えたままだと、
    // 次のライブで「前と同じ」と見なして送らず、相手の画面に出ない
    載っている印を捨てる();
    const いま = 状態();
    const 枝 = ライブの枝();
    if (いま.liveSessionName && Firebaseの器.rtdb && 枝)
      RTDB.off(RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${いま.liveSessionName}/state`));
    在席を終える(書く);
    写しを見るのをやめる();
    if (!記録を残す) 状態().resetCurrentSession(false);
    書く({ isLiveActive: false, ライブの続き: null, isHost: false, liveSessionName: null });
  },
  // 参加一覧を取り直す。ここでだけ、古いライブの片付けもする。
  // 購読側（listenToLiveSessions）は変化のたびに呼ばれるので、
  // 消す処理は明示的に取りにいくこちらへ寄せてある
  fetchActiveLiveSessions: async () => {
    if (!Firebaseの器.rtdb) return;
    // 一覧を出すのは団体の枝から。共有のライブに入っている最中でも、
    // 一覧に出すのは団体のライブなので、そちらを見る
    const 枝 = 団体の枝() || (await 状態().ライブの合言葉を用意する());
    if (!秘.枝として使えるか(枝)) return;
    const 一覧の場所 = RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}`);
    try {
      const 返り = await RTDB.get(一覧の場所);
      const 節点 = 返り.exists() ? 返り.val() : null;
      const { 出す, 古い } = 参加できるライブ(節点, await サーバー時刻());
      書く({ liveSessionsList: 出す, 共有のライブたち: 道しるべたちを拾う(節点) });
      // 最終更新から日が経ったものは、一覧から外したうえで消す。
      // 共有履歴は別の枝にあるので、そちらも一緒に消す。
      //
      // 消すのはサーバーの時計に合わせられたときだけ。合っていないときは
      // 一覧から外すに留める。外すだけなら、時計が合えば次で戻ってくる。
      // 消してしまうと戻らない
      const 道しるべたち = 道しるべたちを拾う(節点);
      (場.時差が取れた ? 古い : []).forEach((名) => {
        // 共有していたライブは、団体の枝にあるのは道しるべだけ。
        // 道しるべを消しても、そのライブ専用の枝と閲覧用の写しは残る。
        // 消さないと、誰も辿り着けないまま的中・氏名・立ち順が残り続ける
        const 印 = 道しるべたち[名];
        // 期限の切れた枝は、決まりの側が「枝ごと消す」ときしか書かせない
        // （中の1件だけ消すのは通らない）。共有の枝はライブ1つ専用なので、
        // 枝ごと消すのが正しい。消し終えてから期限そのものを片付ける
        const 消す = async () => {
          const 落とす = (道) => RTDB.remove(RTDB.ref(Firebaseの器.rtdb, 道)).catch(() => {});
          await Promise.all([
            落とす(`live_sessions/${枝}/${名}`),
            落とす(共有履歴の場所(枝, 名)),
            落とす(在席の場所(枝, 名)),
          ]);
          if (!印) return;
          const 編 = 印.共有の枝;
          const 閲 = 印.閲覧の枝;
          if (秘.枝として使えるか(編))
            await Promise.all([
              落とす(`live_sessions/${編}`),
              落とす(`live_history/${編}`),
              落とす(`live_presence/${編}`),
            ]);
          if (秘.枝として使えるか(閲)) await 落とす(`live_view/${閲}`);
          // 期限は最後。データが残っているうちは決まりが消させない
          // （消せると、期限を外してリンクをよみがえらせられてしまう）
          await Promise.all([
            秘.枝として使えるか(編) ? 落とす(期限の場所(編)) : null,
            秘.枝として使えるか(閲) ? 落とす(期限の場所(閲)) : null,
          ]);
        };
        消す();
        console.log(`[Store] 使われなくなったライブを片付けました: ${名}`);
      });
    } catch (誤り) {
      console.error('Fetch live sessions error:', 誤り);
    }
  },
  listenToLiveSessions: () => {
    if (!Firebaseの器.rtdb) return () => {};
    // 合言葉は起動の直後にはまだ無いことがある（Firestore が繋がる前）。
    // 無いからと見張らずに帰ると、画面を開き直すまで一覧が空のままになる。
    // 届いてから見張り始め、やめる係は先に返しておく
    let 止める = null;
    let やめた = false;
    Promise.resolve(団体の枝() || 状態().ライブの合言葉を用意する())
      .then((合) => {
        const 枝 = 秘.ライブの枝(合);
        if (やめた || !枝 || !Firebaseの器.rtdb) return;
        const 一覧の場所 = RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}`);
        止める = RTDB.onValue(
          一覧の場所,
          (返り) => {
            // ここは消さないので、時計の補正は控えの値で足りる
            const 節点 = 返り.exists() ? 返り.val() : null;
            書く({
              liveSessionsList: 参加できるライブ(節点, Date.now() + 場.サーバーとの時差).出す,
              共有のライブたち: 道しるべたちを拾う(節点),
            });
          },
          (誤り) => {
            console.error('Listen to live sessions error:', 誤り);
          }
        );
      })
      .catch((誤り) => console.error('Listen to live sessions error:', 誤り));
    return () => {
      やめた = true;
      if (止める) 止める();
    };
  },
  deleteLiveSession: async (名前) => {
    if (Firebaseの器.rtdb)
      try {
        // 一覧から消すのは団体のライブ。共有の枝ではなく団体の枝を見る
        const 枝 = 団体の枝();
        if (!枝) return;
        const 節点 = RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${名前}`);
        await RTDB.set(節点, null);
        // 共有履歴と在席は別の枝にあるので、そちらも消す
        RTDB.remove(RTDB.ref(Firebaseの器.rtdb, 共有履歴の場所(枝, 名前))).catch(() => {});
        RTDB.remove(RTDB.ref(Firebaseの器.rtdb, 在席の場所(枝, 名前))).catch(() => {});
        書く({ liveSessionsList: 状態().liveSessionsList.filter((名) => 名 !== 名前) });
      } catch (誤り) {
        console.error('Delete live session error:', 誤り);
      }
  },
});

module.exports = { ライブの操作 };
