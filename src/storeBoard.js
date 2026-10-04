'use strict';

/**
 * 店の操作のうち、記録表（盤面）を動かすもの：射手・区切り・計の列を足す／消す／並べ替える、○×と矢所を入れる、
 * 鍵（誤タップ防止）、射手に部員・ゲスト・弓力・性別を当てる、取り消しとやり直し。
 * （2026-10-05 に useScoreStore.js から分けた。中身は変えていない。店の名指しは 場.店 にした）
 * 店（useScoreStore.js）が ...盤面の操作(書く, 状態, そのまま書く) で広げる。
 */
const {
  Alert,
  generateUUID,
  restampChangedArchers,
  ライブへ1射を送る,
  ライブへ盤面を送る,
  履歴の一手,
  控えの射数,
  盤面を射数にそろえる,
} = require('./storeShared');

const 盤面の操作 = (書く, 状態, そのまま書く) => ({
  addArcher: (位置, 性別) => {
    if (状態().書き換えを止めるか()) return;
    const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
    const 新しい射手 = {
      id: generateUUID(),
      name: '',
      marks: Array(状態().shotsPerRound || 8).fill(''),
      arrowLocations: Array(状態().shotsPerRound || 8).fill(null),
      gender: 性別 || '未設定',
      grade: 1,
      isGuest: false,
      isSeparator: false,
      isTotalCalculator: false,
      lockedBlocks: {},
      lastModified: Date.now(),
    };
    const 直した = 'number' != typeof 位置 || isNaN(位置) ? [...元, 新しい射手] : [...元];
    if ('number' == typeof 位置 && !isNaN(位置)) {
      const 差し込む場所 = Math.max(0, Math.min(位置, 直した.length));
      直した.splice(差し込む場所, 0, 新しい射手);
    }
    書く({
      archers: 直した,
      historyStack: [...状態().historyStack, 元],
      redoStack: [],
      lastLocalChange: Date.now(),
    });
    const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
    if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 直した, shotsPerRound);
  },
  addSeparator: (位置) => {
    if (状態().書き換えを止めるか()) return;
    const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
    const 区切り = {
      id: 'sep-' + generateUUID(),
      name: '---',
      marks: [],
      isSeparator: true,
      gender: '未設定',
      grade: 0,
      isGuest: false,
      isTotalCalculator: false,
      lockedBlocks: {},
      lastModified: Date.now(),
    };
    const 直した = 'number' == typeof 位置 ? [...元] : [...元, 区切り];
    if ('number' == typeof 位置) 直した.splice(位置, 0, 区切り);
    書く({
      archers: 直した,
      historyStack: [...状態().historyStack, 元],
      redoStack: [],
      lastLocalChange: Date.now(),
    });
    const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
    if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 直した, shotsPerRound);
  },
  /**
   * 区切りにチーム名を付ける（リーグで大学名を出すため）。
   *
   * 区切りから右が、そのチームになる。次の区切りまで続く。
   * 区切りを1つ置いて名前を入れるだけで複数人にまとめて付くので、
   * 射手を一人ずつ設定しなくてよい。
   * 空文字にすると名前が外れ、ただの間隔に戻る。
   */
  setSeparatorTeam: (区切りのid, 名前) => {
    if (状態().書き換えを止めるか()) return;
    const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
    const 整えた = String(名前 == null ? '' : 名前)
      .trim()
      .slice(0, 20);
    let 触った = false;
    const 直した = 元.map((列) => {
      if (!列 || 列.id !== 区切りのid || !列.isSeparator) return 列;
      触った = true;
      return Object.assign({}, 列, {
        teamName: 整えた,
        // 名前が付いた区切りは、ただの隙間ではなく見出しになる。
        // 画面はこの name を出すので、外したら元の '---' に戻す
        name: 整えた || '---',
        lastModified: Date.now(),
      });
    });
    if (!触った) return;
    書く({
      archers: 直した,
      historyStack: [...状態().historyStack, 元],
      redoStack: [],
      lastLocalChange: Date.now(),
    });
    const { isLiveActive: ライブ中, liveSessionName: ライブ名, shotsPerRound: 本数 } = 状態();
    if (ライブ中 && ライブ名) ライブへ盤面を送る(ライブ名, 直した, 本数);
  },
  /**
   * 合計の列が数える範囲を切り替える。
   *
   * 「計」（この立ちだけ・区切りで止まる）と
   * 「総計」（区切りをまたいで端まで）を行き来する。
   *
   * ボタンを増やしたり長押しを覚えてもらう代わりに、入れた列を押して
   * 切り替える。交代の内訳と合算を押して切り替えるのと同じ流儀
   */
  toggleTotalScope: (列のid) => {
    if (状態().書き換えを止めるか()) return;
    const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
    let 触った = false;
    const 直した = 元.map((列) => {
      if (!列 || 列.id !== 列のid || !列.isTotalCalculator) return 列;
      触った = true;
      const 次 = !列.またぐ合計;
      return Object.assign({}, 列, {
        またぐ合計: 次,
        name: 次 ? '総計' : '計',
        lastModified: Date.now(),
      });
    });
    if (!触った) return;
    書く({
      archers: 直した,
      historyStack: [...状態().historyStack, 元],
      redoStack: [],
      lastLocalChange: Date.now(),
    });
    const { isLiveActive: ライブ中, liveSessionName: ライブ名, shotsPerRound: 本数 } = 状態();
    if (ライブ中 && ライブ名) ライブへ盤面を送る(ライブ名, 直した, 本数);
  },
  /**
   * 立ち順を入れ替える。押した列を、並びで1つ前か後ろへ動かす。
   *
   * 画面の言葉（左・右）では受け取らない。縦の表は右から左へ並び
   * （row-reverse）、横の表は上から下へ積むので、同じ「並びの後ろへ」が
   * 縦では左、横では下になる。画面の言葉で受け取ると、並べ方を変えた
   * とたんにボタンの字と動く向きが食い違う（実際そうなった）。
   * 字をどう出すかは、並べ方を知っている画面側が決める。
   *
   * 隣が区切りでも合計でも、そのまま入れ替える。またいで射手だけを
   * 選ぶ作りにすると、押しても何も動かないことがあって分かりにくい。
   *
   * ○×・矢所・鍵は列そのものが持っているので、列ごと動かせば付いていく。
   *
   * @param {string} 列のid 動かす列
   * @param {'前'|'後'} 向き 並びの向き（前＝大前寄り／後＝落寄り）
   */
  列を動かす: (列のid, 向き) => {
    if (状態().書き換えを止めるか()) return;
    const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
    const いま = 元.findIndex((列) => 列 && 列.id === 列のid);
    if (いま < 0) return;
    const 先 = '後' === 向き ? いま + 1 : いま - 1;
    if (先 < 0 || 先 >= 元.length) return;
    const 直した = [...元];
    直した[いま] = 元[先];
    直した[先] = 元[いま];
    書く({
      archers: 直した,
      historyStack: [...状態().historyStack, 元],
      redoStack: [],
      lastLocalChange: Date.now(),
    });
    const { isLiveActive: ライブ中, liveSessionName: ライブ名, shotsPerRound: 本数 } = 状態();
    if (ライブ中 && ライブ名) ライブへ盤面を送る(ライブ名, 直した, 本数);
  },
  /**
   * 立ち順を入れ替える。掴んだ列を、指した場所へ移す。
   *
   * 指で滑らせて動かすとき（ドラッグ）に、離した所で1回だけ呼ぶ。
   * 途中経過は書かないので、1回動かす＝取り消し1回で戻る。
   *
   * 場所は「いまの並び」での番号。抜いてから差し込むので、離した先に
   * 居た列の場所へそのまま入る。
   *
   * @param {string} 列のid     動かす列
   * @param {number} 新しい位置 いまの並びでの番号
   */
  列を並べ替える: (列のid, 新しい位置) => {
    if (状態().書き換えを止めるか()) return;
    const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
    const いま = 元.findIndex((列) => 列 && 列.id === 列のid);
    if (いま < 0) return;
    const 数 = Number(新しい位置);
    if (!Number.isFinite(数)) return;
    const 先 = Math.max(0, Math.min(Math.trunc(数), 元.length - 1));
    if (先 === いま) return;
    const 直した = [...元];
    const 取り出した = 直した.splice(いま, 1)[0];
    直した.splice(先, 0, 取り出した);
    書く({
      archers: 直した,
      historyStack: [...状態().historyStack, 元],
      redoStack: [],
      lastLocalChange: Date.now(),
    });
    const { isLiveActive: ライブ中, liveSessionName: ライブ名, shotsPerRound: 本数 } = 状態();
    if (ライブ中 && ライブ名) ライブへ盤面を送る(ライブ名, 直した, 本数);
  },
  /**
   * 合計の列を足す。
   *
   * @param {number} [位置] 差し込む場所。省くと末尾
   * @param {boolean} [またぐ] 手前の計もまとめて数えるか（間隔では止まる）
   *
   * ふつうの「計」は隣から左へ数え、区切りに当たると止まる（1立ぶん）。
   * またぐ合計は区切りで止まらず、端まで数える（複数立ちの合計）。
   * 前の立ちと後ろの立ちを区切りで分けているとき、両方を足せる
   */
  addTotalCalculator: (位置, またぐ) => {
    if (状態().書き換えを止めるか()) return;
    const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
    const 合計の列 = {
      id: 'total-' + generateUUID(),
      name: またぐ ? '総計' : '計',
      marks: Array(状態().shotsPerRound || 8).fill(''),
      arrowLocations: Array(状態().shotsPerRound || 8).fill(null),
      isTotalCalculator: true,
      // 手前の計もまとめて数える印。ふつうの「計」と混ぜないよう別に持つ
      またぐ合計: !!またぐ,
      gender: '未設定',
      grade: 0,
      isGuest: false,
      isSeparator: false,
      lockedBlocks: {},
      lastModified: Date.now(),
    };
    const 直した = 'number' == typeof 位置 ? [...元] : [...元, 合計の列];
    if ('number' == typeof 位置) 直した.splice(位置, 0, 合計の列);
    書く({
      archers: 直した,
      historyStack: [...状態().historyStack, 元],
      redoStack: [],
      lastLocalChange: Date.now(),
    });
    const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
    if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 直した, shotsPerRound);
  },
  deleteArcher: (射手ID) => {
    if (状態().書き換えを止めるか()) return;
    const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
    const 残り = 元.filter((射手) => 射手 && 射手.id !== 射手ID);
    const 今 = Date.now();
    書く({
      historyStack: [...状態().historyStack, 元],
      redoStack: [],
      archers: 残り,
      lastLocalChange: 今,
    });
    const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
    if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 残り, shotsPerRound);
  },
  applyOCRResult: (読み取った射手) => {
    if (状態().書き換えを止めるか()) return; // 閲覧用では画像から読み取った結果の取り込みも止める
    const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
    const 今 = Date.now();
    書く({
      archers: 読み取った射手,
      historyStack: [...状態().historyStack, 元],
      redoStack: [],
      lastLocalChange: 今,
    });
    const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
    if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 読み取った射手, shotsPerRound);
  },
  set自動ロックする: (値) => 書く({ 自動ロックする: 値, 入れた時刻: {} }),
  set保存時に出欠を確認する: (値) => 書く({ 保存時に出欠を確認する: 値 }),
  set横に並べる: (値) => 書く({ 横に並べる: !!値 }),
  set帯を畳む: (値) => 書く({ 帯を畳む: !!値 }),
  set帯の取っ手は左: (値) => 書く({ 帯の取っ手は左: !!値 }),
  setライブは見るだけ: (値) => 書く({ ライブは見るだけ: !!値 }),
  // 見るだけで入っているあいだは盤面を触らせない。
  // 画面側の isReadOnly は鍵ボタンしか止めないので、根元で止める
  書き換えを止めるか: () => !!(状態().isLiveActive && 状態().ライブは見るだけ),
  /**
   * 保存を止めるか。
   *
   * よその団体のライブに共有リンクで入っているときは保存しない。
   * 保存すると、その練習が自分の団体の記録として残り、分析にも混ざる。
   * 記録そのものは主催者の側で保存されるので、失われはしない
   */
  保存を止めるか: () => !!(状態().isLiveActive && 状態().よその団体のライブ),
  /**
   * その人の弓具を扱ってよいか。見るのも直すのも、この一つで判定する。
   *
   * 団体アカウント … 全員ぶん
   * 個人ログイン   … 自分のぶんだけ（他人の弓具は見せない）
   *
   * 画面側でも隠すが、隠すだけでは道が増えたときに漏れる。根元で止める
   */
  弓具を触れるか: (memberId, 黙って) => {
    const { activeGroupId: 団体, activeRole: 役, myMemberId: 自分 } = 状態();
    if (!団体) return false;
    if ('group' === 役) return true;
    if ('member' === 役 && 自分 && String(自分) === String(memberId)) return true;
    if (!黙って) Alert.alert('権限エラー', '弓具を扱えるのは、団体アカウントか、本人だけです。');
    return false;
  },
  // まとめて入った○×に「いま入れた」印を付ける。
  // 画像からの反映は toggleMark を通らないので印が付かず、
  // そのままだと「読み込み直したもの」と見なして初めから閉じてしまう。
  // 読み取りの直しが全部長押しになるのを防ぐ
  入れた印をまとめて付ける: (一覧) =>
    状態().書き換えを止めるか()
      ? undefined
      : 書く((前) => {
          const 印 = Object.assign({}, 前.入れた時刻);
          const いま = Date.now();
          (Array.isArray(一覧) ? 一覧 : []).forEach((射手) => {
            if (!射手 || !射手.id || !Array.isArray(射手.marks)) return;
            射手.marks.forEach((一つ, 番) => {
              if (一つ) 印[射手.id + ':' + 番] = いま;
            });
          });
          return { 入れた時刻: 印 };
        }),
  // 長押しで、そのますだけ開ける。
  // 数え直しにしてある。開けたあと、また少し経てば閉じる。
  //
  // 開けたことを画面に知らせる。灰色が戻るだけでは、押さえが届いたのか
  // 分かりにくい。知らせは記録画面が拾って短く出す（リセットと同じ作り）
  // 閉じたますが押されたことを伝える。盤面は変えないので、
  // 見るだけで入っている人でも知らせは出す（開け方は同じだから）
  // 閲覧用のときは知らせない。閲覧用は ますを開ける も止めてあるので、
  // 「長押しで開きます」と言うと、開かないことをやらせることになる。
  // 閲覧用の知らせは記録画面が別に出す
  閉じたますが押された: () => {
    // 閲覧用は ますを開ける も止めてあるので「長押しで開きます」とは
    // 言えない。閲覧用だと伝える側へ回す
    if (状態().書き換えを止めるか()) return void 書く({ 閲覧でますを押した時刻: Date.now() });
    書く({ 閉じたますを押した時刻: Date.now() });
  },
  ますを開ける: (射手, 番) =>
    状態().書き換えを止めるか()
      ? undefined
      : 書く((前) => ({
          入れた時刻: Object.assign({}, 前.入れた時刻, { [射手 + ':' + 番]: Date.now() }),
          鍵を開けた時刻: Date.now(),
        })),
  setEnableArrowLocation: (値) => 書く({ enableArrowLocation: 値 }),
  set矢所の行: (値) => 書く({ 矢所の行: 値 }),
  set矢所の窓を自動で開く: (値) => 書く({ 矢所の窓を自動で開く: !!値 }),
  set矢所ノート: (値) => 書く({ 矢所ノート: !!値 }),
  // 矢所ノート：的を押した位置と○×を、取り消し 1 回で戻せるよう一度に書く（ライブ中は盤面ごと送る）
  矢所を置いて印を入れる: (射手ID, 番, 印, 矢所) => {
    if (状態().書き換えを止めるか()) return void 書く({ 閲覧でますを押した時刻: Date.now() });
    const { archers: 元, isLiveActive, liveSessionName, shotsPerRound } = 状態();
    const 今 = Date.now();
    const 直した = (元 || []).map((射手) => {
      if (射手.id !== 射手ID) return 射手;
      const 印たち = [...(射手.marks || [])];
      const 矢所たち = [...(射手.arrowLocations || [])];
      印たち[番] = 印;
      矢所たち[番] = 矢所;
      return Object.assign({}, 射手, { marks: 印たち, arrowLocations: 矢所たち, lastModified: 今 });
    });
    書く({
      archers: 直した,
      historyStack: [...状態().historyStack, 元],
      redoStack: [],
      lastLocalChange: 今,
      入れた時刻: Object.assign({}, 状態().入れた時刻, { [射手ID + ':' + 番]: 今 }),
    });
    if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 直した, shotsPerRound);
  },
  setArrowTargetType: (値) => 書く({ arrowTargetType: 値 }),
  setActiveArrowLocationEdit: (値) => 書く({ activeArrowLocationEdit: 値 }),
  updateArrowLocation: (射手ID, 番, 矢所) => {
    if (状態().書き換えを止めるか()) return; // 閲覧用では矢所（ライブにも送られる）も止める
    const { archers } = 状態();
    const 今 = Date.now();
    const 直した = (archers || []).map((射手) => {
      if (射手.id === 射手ID) {
        const 列 = [...(射手.arrowLocations || [])];
        return ((列[番] = 矢所), Object.assign({}, 射手, { arrowLocations: 列, lastModified: 今 }));
      }
      return 射手;
    });
    書く({
      archers: 直した,
      historyStack: [...状態().historyStack, archers],
      redoStack: [],
      lastLocalChange: 今,
    });
    // ライブ中は矢所も送る。送らないと相手の画面に出ないうえ、
    // 相手からの更新で手元の矢所が消えていた
    const { isLiveActive: ライブ中, liveSessionName: ライブ名, shotsPerRound: 本数 } = 状態();
    if (ライブ中 && ライブ名) ライブへ盤面を送る(ライブ名, 直した, 本数);
  },
  updateMark: (射手ID, 番, 印) => {
    if (状態().書き換えを止めるか()) return; // 閲覧用では○×の直接の書き換えも止める
    const { archers: 元, isLiveActive, liveSessionName } = 状態();
    const 今 = Date.now();
    const 直した = (元 || []).map((射手) => {
      if (射手.id === 射手ID) {
        const 列 = [...(射手.marks || [])];
        return ((列[番] = 印), Object.assign({}, 射手, { marks: 列, lastModified: 今 }));
      }
      return 射手;
    });
    書く({
      archers: 直した,
      historyStack: [...状態().historyStack, 元],
      redoStack: [],
      lastLocalChange: 今,
    });
    if (isLiveActive && liveSessionName) ライブへ1射を送る(liveSessionName, 射手ID, 番, 印, 今);
  },
  toggleMark: (射手ID, 番) => {
    // 閲覧用は黙って何も起きないと、壊れたと思わせる
    if (状態().書き換えを止めるか()) return void 書く({ 閲覧でますを押した時刻: Date.now() });
    const { archers: 元, isLiveActive, liveSessionName } = 状態();
    const 今 = Date.now();
    let 新しい印 = '';
    const 直した = (元 || []).map((射手) => {
      if (射手.id === 射手ID) {
        const 列 = [...(射手.marks || [])];
        const 前の印 = 列[番];
        const 次の印 = '' === 前の印 ? '○' : '○' === 前の印 ? '\xd7' : '';
        return (
          (列[番] = 次の印),
          (新しい印 = 次の印),
          Object.assign({}, 射手, { marks: 列, lastModified: 今 })
        );
      }
      return 射手;
    });
    const 鍵 = 射手ID + ':' + 番;
    書く({
      archers: 直した,
      historyStack: [...状態().historyStack, 元],
      redoStack: [],
      lastLocalChange: 今,
      // 入れ直したますは、また少し経ってから閉じる
      入れた時刻: Object.assign({}, 状態().入れた時刻, { [鍵]: 今 }),
    });
    if (isLiveActive && liveSessionName) ライブへ1射を送る(liveSessionName, 射手ID, 番, 新しい印, 今);
  },
  clearArcherMarks: (射手ID) => {
    if (状態().書き換えを止めるか()) return; // 閲覧用ではその人の○×の消去も止める
    const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
    const 今 = Date.now();
    const 直した = 元.map((射手) =>
      射手 && 射手.id === 射手ID
        ? Object.assign({}, 射手, { marks: Array(状態().shotsPerRound).fill(''), lastModified: 今 })
        : 射手
    );
    書く({
      historyStack: [...状態().historyStack, 元],
      redoStack: [],
      lastLocalChange: 今,
      archers: 直した,
    });
    const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
    if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 直した, shotsPerRound);
  },
  // 1立が全部埋まって少し経つと、画面側からここが呼ばれる。
  // toggleLock と違って必ず「閉じる」側に倒す。
  // 取り消しの控えには積まない（押した覚えのない操作が戻ると分かりにくい）
  立を閉じる: (射手ID, 塊) => {
    if (状態().書き換えを止めるか()) return;
    const { archers } = 状態();
    const 元 = Array.isArray(archers) ? archers : [];
    const 押した列 = 元.findIndex((射手) => 射手 && 射手.id === 射手ID);
    if (-1 === 押した列) return;
    if (元[押した列].lockedBlocks?.[塊]) return;
    let 塊の頭 = 押した列;
    for (; 塊の頭 > 0 && 元[塊の頭 - 1] && !元[塊の頭 - 1].isSeparator && !元[塊の頭 - 1].isTotalCalculator;)
      塊の頭--;
    const 今 = Date.now();
    const 直した = 元.map((射手, 番) => {
      if (射手 && 番 >= 塊の頭 && 番 <= 押した列) {
        const 鍵の表 = Object.assign({}, 射手.lockedBlocks || {});
        return ((鍵の表[塊] = true), Object.assign({}, 射手, { lockedBlocks: 鍵の表, lastModified: 今 }));
      }
      return 射手;
    });
    書く({ archers: 直した, lastLocalChange: 今 });
    const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
    if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 直した, shotsPerRound);
  },
  toggleLock: (射手ID, 塊) => {
    const { archers } = 状態();
    const 元 = Array.isArray(archers) ? archers : [];
    const 押した列 = 元.findIndex((射手) => 射手 && 射手.id === 射手ID);
    if (-1 === 押した列) return;
    const その射手 = 元[押した列];
    const 掛ける = !その射手.lockedBlocks?.[塊];
    let 塊の頭 = 押した列;
    for (; 塊の頭 > 0 && 元[塊の頭 - 1] && !元[塊の頭 - 1].isSeparator && !元[塊の頭 - 1].isTotalCalculator;)
      塊の頭--;
    const 今 = Date.now();
    const 直した = 元.map((射手, 番) => {
      if (射手 && 番 >= 塊の頭 && 番 <= 押した列) {
        const 鍵の表 = Object.assign({}, 射手.lockedBlocks || {});
        return ((鍵の表[塊] = 掛ける), Object.assign({}, 射手, { lockedBlocks: 鍵の表, lastModified: 今 }));
      }
      return 射手;
    });
    書く({
      historyStack: [...状態().historyStack, 元],
      redoStack: [],
      lastLocalChange: 今,
      archers: 直した,
    });
    const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
    if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 直した, shotsPerRound);
  },
  setArcherMember: (射手ID, 部員) => {
    if (状態().書き換えを止めるか()) return;
    const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
    const 弓力 = 部員?.equipments?.length
      ? [...部員.equipments].sort((甲, 乙) => 乙.date - 甲.date)[0]?.weight
      : undefined;
    const 直した = 元.map((射手) =>
      射手 && 射手.id === 射手ID
        ? Object.assign({}, 射手, {
            name: 部員 ? 部員.name : '',
            gender: 部員 ? 部員.gender : '未設定',
            grade: 部員 ? 部員.grade : 1,
            memberId: 部員 ? 部員.id : undefined,
            isGuest: false,
            bowWeight: 弓力 || 射手.bowWeight,
            lastModified: Date.now(),
          })
        : 射手
    );
    書く({
      historyStack: [...状態().historyStack, 元],
      redoStack: [],
      lastLocalChange: Date.now(),
      archers: 直した,
    });
    const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
    if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 直した, shotsPerRound);
  },
  setArcherBowWeight: (射手ID, 弓力) => {
    if (状態().書き換えを止めるか()) return; // 閲覧用では弓力も止める
    const 直した = (Array.isArray(状態().archers) ? 状態().archers : []).map((射手) =>
      射手 && 射手.id === 射手ID
        ? Object.assign({}, 射手, { bowWeight: 弓力, lastModified: Date.now() })
        : 射手
    );
    書く({ lastLocalChange: Date.now(), archers: 直した });
    const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
    if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 状態().archers, shotsPerRound);
  },
  setArcherGuestName: (射手ID, 名前) => {
    if (状態().書き換えを止めるか()) return;
    const 直した = (Array.isArray(状態().archers) ? 状態().archers : []).map((射手) =>
      射手 && 射手.id === 射手ID
        ? Object.assign({}, 射手, {
            name: 名前,
            isGuest: true,
            gender: '未設定',
            memberId: undefined,
            lastModified: Date.now(),
          })
        : 射手
    );
    書く({
      historyStack: [...状態().historyStack, Array.isArray(状態().archers) ? 状態().archers : []],
      redoStack: [],
      lastLocalChange: Date.now(),
      archers: 直した,
    });
    const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
    if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 状態().archers, shotsPerRound);
  },
  setArcherGender: (射手ID, 性別) => {
    if (状態().書き換えを止めるか()) return; // 閲覧用では性別も止める
    const 直した = (Array.isArray(状態().archers) ? 状態().archers : []).map((射手) =>
      射手 && 射手.id === 射手ID ? Object.assign({}, 射手, { gender: 性別, lastModified: Date.now() }) : 射手
    );
    書く({ lastLocalChange: Date.now(), archers: 直した });
    const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
    if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 状態().archers, shotsPerRound);
  },
  // ライブ中は全員で1本の履歴を使う。誰が押しても「最後の1手」が戻る
  undo: () => {
    if (状態().書き換えを止めるか()) return;
    if (状態().isLiveActive && 状態().liveSessionName) return void 状態().sharedUndo(-1);
    const { historyStack, archers: 今の射手 } = 状態();
    if (0 === historyStack.length) return;
    // 中身が変わった射手には新しい日時を打ち直す。打たないと、ライブ中の
    // 取り消しが相手に届かず、主催者の画面だけ戻る食い違いになる
    const 戻す元 = 履歴の一手(historyStack[historyStack.length - 1]);
    // 射数の変更も一手なので、控えが持っていた射数へ戻す
    const 射数 = 控えの射数(戻す元) ?? 状態().shotsPerRound;
    const 戻した = restampChangedArchers(盤面を射数にそろえる(戻す元, 射数), 今の射手, Date.now());
    書く({
      historyStack: historyStack.slice(0, -1),
      redoStack: [...状態().redoStack, 今の射手],
      archers: 戻した,
      shotsPerRound: 射数,
      lastLocalChange: Date.now(),
    });
    const { isLiveActive, liveSessionName } = 状態();
    if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 状態().archers, 射数);
  },
  redo: () => {
    if (状態().書き換えを止めるか()) return;
    if (状態().isLiveActive && 状態().liveSessionName) return void 状態().sharedUndo(1);
    const { redoStack, archers: 今の射手 } = 状態();
    if (0 === redoStack.length) return;
    // 取り消しと同じ理由で日時を打ち直す。射数を戻すのも同じ
    const 戻す元 = 履歴の一手(redoStack[redoStack.length - 1]);
    const 射数 = 控えの射数(戻す元) ?? 状態().shotsPerRound;
    const 進めた = restampChangedArchers(盤面を射数にそろえる(戻す元, 射数), 今の射手, Date.now());
    書く({
      redoStack: redoStack.slice(0, -1),
      historyStack: [...状態().historyStack, 今の射手],
      archers: 進めた,
      shotsPerRound: 射数,
      lastLocalChange: Date.now(),
    });
    const { isLiveActive, liveSessionName } = 状態();
    if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 状態().archers, 射数);
  },
});

module.exports = { 盤面の操作 };
