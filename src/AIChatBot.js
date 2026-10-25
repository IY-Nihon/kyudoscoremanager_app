'use strict';

const { 色 } = require('./iro.js');
Object.defineProperty(exports, '__esModule', { value: true });

const React = require('react');
const { useState, useRef, useEffect } = React;
const {
  Text,
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Dimensions,
  Animated,
  PanResponder,
} = require('./rn');

const { Ionicons } = require('@expo/vector-icons');
const { AIMascot } = require('./AIMascot');
const 学 = require('./gakunen');
const 区 = require('./kubun');
const { IS_WEB } = require('./IS_WEB');

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { useScoreStore } = require('./useScoreStore');
const { useストアの一部 } = require('./storeSlice');
const { useNavigation } = require('@react-navigation/native');
const 案内 = require('./TutorialGuide');
// 鍵はアプリに無い。中継（Cloudflare Workers）へログインの証を付けて呼ぶ
const 中継 = require('./geminiChukei');
// 初めの案内で AI に届かなかったとき、送った文から部員を読む控えの道（src/chatMemberParse.js）
const { 入力から部員を読み取る } = require('./chatMemberParse');

/**
 * Gemini の SDK の誤りから、状態番号（400・503 など）を取り出す。無ければ 0。
 * SDK の誤りは status を持つことがあり、無いときは文の「[503 Service Unavailable]」から読む
 */
const 誤りの状態番号 = (誤り) => {
  if (誤り && Number.isInteger(誤り.status)) return 誤り.status;
  const 合う = String((誤り && 誤り.message) || '').match(/\[(\d{3})[ \]]/);
  return 合う ? Number(合う[1]) : 0;
};
/**
 * 流し読みが途中で切れた誤りか。返事の途中で回線が切れる・中継や上流が流れを閉じると、
 * SDK は「Failed to parse stream」を投げる（2026-09-24 に本番の便りで 2 通）。上限（429）・
 * 混雑（503）・証（401）などの誤りはここに入れない（別に扱う）
 */
const 流れが切れたか = (誤り) =>
  /Failed to parse stream|Error reading from the stream|network|Failed to fetch|Load failed|terminated|aborted/i.test(
    String((誤り && 誤り.message) || 誤り || '')
  ) && !/\b(4\d\d|5\d\d)\b/.test(String((誤り && 誤り.message) || ''));
// 成績の集計・並べ替え・絞り込みは、模型ではなくここで済ませる。
// 人数ぶんの表を渡して選ばせると取り違えるため（test/chatStats.test.js）
const {
  全員の成績,
  出欠の集計,
  記録をさがす,
  タグで絞る,
  参加回数を数える,
  射位ごとの成績,
  一人の成績,
  矢所の成績,
  期間にする,
  日付の始まり,
  題で絞る,
  記録の要約,
  端末の日付,
  二つの期間で比べる,
  比べる期間を決める,
  射の前後で比べる,
  弓具の前後,
  記録の的中,
  人を絞る,
} = require('./chatStats');
const { 練習日を読む } = require('./practiceDays');
// 「何でも聞いてください」だけでは何を聞けるか分からない。
// その団体の中身に合わせた質問例を出す（test/chatSuggestions.test.js）
const { 質問例のすべて, 打ちかけの候補, 分類ごと } = require('./chatSuggestions');
// 個人ログイン（部員）は、AI に本人の分だけを渡す（chatScope）。指示文・道具・Q&A も個人用にする（chatPersonal）
const { 自分だけに絞る, 他の人 } = require('./chatScope');
const 個人用 = require('./chatPersonal');
const { getShadowStyle } = require('./shadowStyle');

// 指示文と Q&A（systemInstructionBase・qaData・selectQAs）は別のファイル（2026-10-05）
const { systemInstructionBase, selectQAs } = require('./chatKnowledge');
// 見た目の決まりは別のファイル（2026-10-05）
const { styles } = require('./chatStyles');
// 道具（Function Calling）の宣言は別のファイル（2026-10-24）
const { 道具の宣言 } = require('./chatTools');

/**
 * 横へ流せる1行。パソコンでは、上に乗せてホイールを回すと横へ動く。
 *
 * 横に並べた札は、指では流せてもマウスでは動かせない。ホイールは縦にしか
 * 効かないので、乗せている間だけ縦の回転を横へ回す。
 *
 * 流す先が無いとき（札が全部見えているとき）は何もしない。
 * そこで止めてしまうと、画面そのものが縦に動かせなくなる。
 */
function 横に流せる行({ children, style }) {
  const 参照 = React.useRef(null);
  React.useEffect(() => {
    if (!IS_WEB) return;
    const 部品 = 参照.current;
    if (!部品) return;
    const 節 = typeof 部品.getScrollableNode === 'function' ? 部品.getScrollableNode() : 部品;
    if (!節 || typeof 節.addEventListener !== 'function') return;
    const 受け = (出来事) => {
      // 横に回しているときは、そのまま任せる
      if (Math.abs(出来事.deltaY) <= Math.abs(出来事.deltaX)) return;
      // 流す先が無ければ、画面の縦の動きを邪魔しない
      if (節.scrollWidth <= 節.clientWidth) return;
      節.scrollLeft += 出来事.deltaY;
      出来事.preventDefault();
    };
    節.addEventListener('wheel', 受け, { passive: false });
    return () => 節.removeEventListener('wheel', 受け);
  }, []);
  return (
    <ScrollView ref={参照} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={style}>
      {children}
    </ScrollView>
  );
}

const generateMsgId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
const CHAT_HISTORY_KEY = 'aiChatMessages_v1';
const MAX_SAVED_MESSAGES = 50;
const BUTTON_POS_KEY = 'aiButtonPos_v1';

// キャラクターを明るい地（見出し・吹き出し）に置くときの色。体が白だと地に溶けるので青にし、
// 弦は濃い灰色、道着の襟は白にする（浮くボタンの上は、白い体の既定のまま）
const 明るい地のキャラ = { 体: 色.青, 弦: 色.灰, 襟: 色.白, 道着: 色.青_明るい };

// ドラッグで動かした角を覚えておく。無ければ右下から始める
const loadButtonPos = () => {
  try {
    const saved = typeof localStorage !== 'undefined' && localStorage.getItem(BUTTON_POS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if ((parsed.x === 'left' || parsed.x === 'right') && (parsed.y === 'top' || parsed.y === 'bottom')) {
        return parsed;
      }
    }
  } catch {
    /* 読めなければ、右下から始める */
  }
  return null;
};

const saveButtonPos = (pos) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(BUTTON_POS_KEY, JSON.stringify(pos));
    }
  } catch {
    /* 覚えられなくても、この場では動く。次回また右下に戻るだけ */
  }
};

/** 初めの案内（部員登録）で開いたときの挨拶 */
const 部員登録の挨拶 =
  'こんにちは！メンバー登録をお手伝いします。🎯\n例えば「1年の山田 太郎 男子 を追加して」のように入力して送信してみてください。';

/**
 * 会話の控えの置き場。団体はこれまでどおり。個人は本人ごとに分ける（同じ端末で別の人が入っても見えない）。
 * 本人がまだ分からない個人（読み込み中）には、団体の会話を読ませない
 */
/** AI が返す性別（male・female・男子・女子）をアプリの値（男子・女子・未設定）にそろえる */
const 性別にそろえる = (性別) =>
  性別 === 'male' || 性別 === '男子' ? '男子' : 性別 === 'female' || 性別 === '女子' ? '女子' : '未設定';

const 会話の鍵 = (個人, 部員id) => (個人 ? `${CHAT_HISTORY_KEY}_member_${部員id || '-'}` : CHAT_HISTORY_KEY);

const loadChatHistory = (鍵 = CHAT_HISTORY_KEY) => {
  try {
    const saved = typeof localStorage !== 'undefined' && localStorage.getItem(鍵);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((msg) => (msg.id ? msg : { ...msg, id: generateMsgId() }));
      }
    }
  } catch {
    /* 読めなければ、やり取りの控えは無いものとして始める */
  }
  return null;
};

const saveChatHistory = (messages, 鍵 = CHAT_HISTORY_KEY) => {
  try {
    if (typeof localStorage !== 'undefined') {
      const toSave = messages.slice(-MAX_SAVED_MESSAGES);
      localStorage.setItem(鍵, JSON.stringify(toSave));
    }
  } catch {
    /* 控えられなくても、やり取りは続く。端末の空き不足は記録の保存側が知らせる */
  }
};

const AIChatBot = () => {
  const {
    activeRole,
    members: 全部の部員 = [],
    sessions: 全部の記録 = [],
    currentRouteName,
    myMemberId,
    myMemberName,
    historyViewMode,
    selectedHistorySessionId,
  } = useストアの一部([
    'activeRole',
    'members',
    'sessions',
    'currentRouteName',
    'myMemberId',
    'myMemberName',
    'historyViewMode',
    'selectedHistorySessionId',
  ]);
  // 個人ログインの端末には団体ぜんぶの部員・記録が入っている。AI に渡す前に、本人の分だけに絞る。
  // 以降の members・sessions は、個人なら絞ったあとのもの（道具も質問例も、他の人には届かない）
  const 個人 = activeRole === 'member';
  const 見える = React.useMemo(
    () =>
      個人
        ? 自分だけに絞る({ members: 全部の部員, sessions: 全部の記録, myMemberId, myMemberName })
        : { members: 全部の部員, sessions: 全部の記録 },
    [個人, 全部の部員, 全部の記録, myMemberId, myMemberName]
  );
  const members = 見える.members;
  const sessions = 見える.sessions;
  const 保存の鍵 = 会話の鍵(個人, myMemberId);
  const addMember = useScoreStore((state) => state.addMember);
  const navigation = useNavigation();
  const チュートリアル部員登録中 = 案内.useチュートリアル部員登録中();
  const 案内のAIボタン = 案内.useTutorialTarget('AI.ボタン');
  const [modalVisible, setModalVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const autoCloseTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    案内.AI開く(modalVisible);
  }, [modalVisible]);

  // 質問例の元（その団体の中身に合わせたもの全部）。画面には分類ごとに全部出し（下の 分類たち）、
  // 打ちかけの続きもここから探す
  const 候補の元 = React.useMemo(() => {
    const もと = 質問例のすべて({ 人たち: members, 記録たち: sessions, いま: new Date(), 個人 });
    if (チュートリアル部員登録中) {
      return [{ 分類: '操作', 文: '1年の山田 太郎 男子 を追加して' }, ...もと];
    }
    return もと;
  }, [members, sessions, 個人, チュートリアル部員登録中]);
  // 質問例は分類ごとに束ねて、全部出す。
  //
  // 前は分類ごとに1件ずつ・5件だけ出していた。11件あるうちの5件なので、
  // 「成績のことは1つしか聞けない」ように見えていた。
  // 分類を左に置いて、その行を横へ流せば、縦は5行のままで全部に届く
  const 分類たち = React.useMemo(() => 分類ごと(候補の元), [候補の元]);
  // 打ちかけの続き。入力欄の中に薄く重ねて見せる1件だけ。
  // 「打った文字で始まるもの」に限る。途中に含むだけのものを重ねると、
  // 見えている字と重ならず読めなくなる
  const 続きの候補 = React.useMemo(() => {
    const 打った = inputText;
    if (!打った.trim()) return '';
    const 当たり = 打ちかけの候補(打った, 候補の元, 8).find((候補) => 候補.文.startsWith(打った));
    return 当たり && 当たり.文 !== 打った ? 当たり.文 : '';
  }, [inputText, 候補の元]);
  const defaultMessages = [
    {
      id: 'default-msg',
      role: 'model',
      text: チュートリアル部員登録中
        ? 部員登録の挨拶
        : 個人
          ? 個人用.個人の挨拶
          : 'こんにちは！弓道部的中ノートのAIアシスタントです。選手選びの相談や、的中傾向の分析、アプリの使い方など、何でも聞いてください。',
    },
  ];
  const [messages, setMessages] = useState(() => loadChatHistory(保存の鍵) || defaultMessages);
  // チュートリアルで開いたときは、必ず部員登録の案内を出す
  useEffect(() => {
    if (チュートリアル部員登録中 && modalVisible) {
      const 案内文あり = messages.some((m) => m.text && m.text.includes('メンバー登録をお手伝いします'));
      if (!案内文あり) setMessages([{ id: 'tutorial-welcome-msg', role: 'model', text: 部員登録の挨拶 }]);
    }
  }, [チュートリアル部員登録中, modalVisible]);
  // いま持っている会話（messages）が、どの鍵のものか。入っている人が変わったとき（本人の id が
  // 後から分かった、ログインし直した）は、その人の会話に入れ替える。入れ替わるまでの 1 回は、
  // 前の人の会話を新しい鍵へ書かず、画面にも出さない
  const [会話の持ち主, set会話の持ち主] = useState(保存の鍵);
  const 入れ替え中 = 会話の持ち主 !== 保存の鍵;
  useEffect(() => {
    if (!入れ替え中) return;
    setMessages(loadChatHistory(保存の鍵) || defaultMessages);
    set会話の持ち主(保存の鍵);
  }, [入れ替え中, 保存の鍵]);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);

  useEffect(() => {
    if (入れ替え中) return;
    saveChatHistory(messages, 保存の鍵);
  }, [messages, 保存の鍵, 入れ替え中]);
  const scrollViewRef = useRef(null);
  // 末尾の近くを見ているか。流し読みの間は文字が来るたびに中身の高さが変わるので、
  // そのたびに末尾へ送ると、上へ戻って読み返している人を毎回引き戻してしまう。
  // 末尾の近くにいるときだけ追いかけ、自分で送ったときは末尾へ戻す
  const 末尾の近く = useRef(true);

  const [layoutWidth, setLayoutWidth] = useState(Dimensions.get('window').width);
  const [layoutHeight, setLayoutHeight] = useState(Dimensions.get('window').height);
  // 引く仕掛け（PanResponder）は一度しか作らないので、中から state を読むと
  // 最初の描画の値（窓の幅）で固まる。パソコンで窓が広いとアプリの枠（最大幅）より
  // 窓が広く、左へ引くとその差のぶん枠の外へ飛び出して消えた。枠の実測は ref で渡す
  const layoutRef = useRef({ width: layoutWidth, height: layoutHeight });

  const onLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    layoutRef.current = { width, height };
    setLayoutWidth(width);
    setLayoutHeight(height);
  };

  // --- ドラッグ移動用のステート ＆ 追従ロジック ---
  const pan = useRef(new Animated.ValueXY()).current;
  const currentPos = useRef({ x: 0, y: 0 });
  const [savedButtonPos] = useState(loadButtonPos);
  const snapXRef = useRef(savedButtonPos?.x || 'right');
  const snapYRef = useRef(savedButtonPos?.y || 'bottom');
  const isDragging = useRef(false);

  // 画面リサイズ時に現在のスナップ状態を維持したまま正しい位置へ追従
  useEffect(() => {
    const initX = layoutWidth - 20 - 60;
    const initY = layoutHeight - 20 - 60;

    const targetX = snapXRef.current === 'left' ? 20 - initX : 0;
    const targetY = snapYRef.current === 'top' ? 60 - initY : 0;

    currentPos.current = { x: targetX, y: targetY };
    pan.setValue({ x: targetX, y: targetY });
  }, [layoutWidth, layoutHeight]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, 動き) => Math.abs(動き.dx) > 2 || Math.abs(動き.dy) > 2,
      // パソコンで引くと、字の上を通ったときに字の選択が始まり、react-native-web の
      // responder が選択の合図（selectionchange）で責任を取り上げてボタンが止まる。
      // 取り上げは断る（記録表の取っ手と同じ。始まった選択は下で解く）
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        isDragging.current = false;
        pan.setOffset({ x: currentPos.current.x, y: currentPos.current.y });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, 動き) => {
        if (Math.abs(動き.dx) > 2 || Math.abs(動き.dy) > 2) {
          isDragging.current = true;
        }
        if (typeof window !== 'undefined' && window.getSelection) {
          try {
            const 選択 = window.getSelection();
            if (選択 && !選択.isCollapsed) 選択.removeAllRanges();
          } catch {
            /* 解けなくても引く動きは続く */
          }
        }

        const initX = layoutRef.current.width - 20 - 60;
        const initY = layoutRef.current.height - 20 - 60;

        const offsetX = currentPos.current.x;
        const offsetY = currentPos.current.y;

        let absX = initX + offsetX + 動き.dx;
        let absY = initY + offsetY + 動き.dy;

        const minAbsX = 20;
        const maxAbsX = layoutRef.current.width - 20 - 60;
        const minAbsY = 60;
        const maxAbsY = layoutRef.current.height - 20 - 60;

        if (absX < minAbsX) absX = minAbsX;
        if (absX > maxAbsX) absX = maxAbsX;
        if (absY < minAbsY) absY = minAbsY;
        if (absY > maxAbsY) absY = maxAbsY;

        const nextX = absX - initX - offsetX;
        const nextY = absY - initY - offsetY;

        pan.setValue({ x: nextX, y: nextY });
        currentPos.current = { x: offsetX + nextX, y: offsetY + nextY };
      },
      onPanResponderRelease: (_, 動き) => {
        pan.flattenOffset();
        if (!isDragging.current) {
          setModalVisible(true);
        } else {
          const initX = layoutRef.current.width - 20 - 60;
          const initY = layoutRef.current.height - 20 - 60;

          const isLeft = Math.abs(動き.vx) > 0.2 ? 動き.vx < 0 : 動き.dx < 0;
          const isTop = Math.abs(動き.vy) > 0.2 ? 動き.vy < 0 : 動き.dy < 0;

          snapXRef.current = isLeft ? 'left' : 'right';
          snapYRef.current = isTop ? 'top' : 'bottom';
          saveButtonPos({ x: snapXRef.current, y: snapYRef.current });

          const snapTopY = 60;

          const targetX = isLeft ? 20 - initX : 0;
          const targetY = isTop ? snapTopY - initY : 0;

          currentPos.current = { x: targetX, y: targetY };

          Animated.spring(pan, { toValue: { x: targetX, y: targetY }, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  if ((activeRole !== 'group' && !(個人 && myMemberId)) || currentRouteName === '記録' || 入れ替え中) {
    return null;
  }

  /** カード1枚ぶんの部員を追加する。追加できたら名前を返す（団体ログインでなければ null） */
  const カードの人を追加する = (card) => {
    const { name, grade, gender } = card.args;
    const finalGender = 性別にそろえる(gender);
    // 部員の追加は団体ログインのときだけ通る（ストア側で止めている）。
    // 確かめずに「追加しました」と出していたため、個人で入っている人には
    // 権限エラーの帯と「追加しました」が同時に出ていた
    if (activeRole !== 'group') return null;
    // 学年 0 はその他（コーチ・ゲスト）。数でなければ 1 年として足す
    const 学年 = Number(grade);
    addMember(name, finalGender, Number.isFinite(学年) && grade !== null && grade !== '' ? 学年 : 1);
    return name;
  };

  /** 初めの案内の部員登録が済んだら、少しして窓を閉じる（案内の次の段へ進む） */
  const 少ししたら閉じる = () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    autoCloseTimerRef.current = setTimeout(() => setModalVisible(false), 1200);
  };

  const handleActionResponse = (msgId, isApproved) => {
    const targetMsgIndex = messages.findIndex((文) => 文.id === msgId);
    if (targetMsgIndex === -1) return;
    const targetMsg = messages[targetMsgIndex];
    if (!targetMsg || targetMsg.status !== 'pending') return;

    const updatedMessages = [...messages];
    updatedMessages[targetMsgIndex] = { ...targetMsg, status: isApproved ? 'approved' : 'rejected' };

    if (isApproved) {
      if (targetMsg.actionType === 'addMember') {
        const 名 = カードの人を追加する(targetMsg);
        updatedMessages.push({
          id: generateMsgId(),
          role: 'model',
          text: 名
            ? チュートリアル部員登録中
              ? `${名}さんをメンバーに追加しました！登録が完了しました。`
              : `${名}さんをメンバーに追加しました。`
            : 'メンバーの追加は団体ログインのときだけできます。追加していません。',
        });
        if (名 && チュートリアル部員登録中) 少ししたら閉じる();
      }
    } else {
      updatedMessages.push({ id: generateMsgId(), role: 'model', text: `操作をキャンセルしました。` });
    }

    setMessages(updatedMessages);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  /** 待っているカードを全部まとめて承認する／キャンセルする（部員を何人も頼んだとき） */
  const handleAllPending = (isApproved) => {
    const 待ち = messages.filter((文) => 文.role === 'actionCard' && 文.status === 'pending');
    if (!待ち.length) return;
    const 追加した = [];
    let 断られた = false;
    const updatedMessages = messages.map((文) => {
      if (文.role !== 'actionCard' || 文.status !== 'pending') return 文;
      if (isApproved && 文.actionType === 'addMember') {
        const 名 = カードの人を追加する(文);
        if (名) 追加した.push(名);
        else 断られた = true;
      }
      return { ...文, status: isApproved ? 'approved' : 'rejected' };
    });
    updatedMessages.push({
      id: generateMsgId(),
      role: 'model',
      text: !isApproved
        ? `${待ち.length}件の操作をキャンセルしました。`
        : 断られた
          ? 'メンバーの追加は団体ログインのときだけできます。追加していません。'
          : チュートリアル部員登録中
            ? `${追加した.length}人をメンバーに追加しました！登録が完了しました：${追加した.join('、')}`
            : `${追加した.length}人をメンバーに追加しました：${追加した.join('、')}`,
    });
    if (isApproved && 追加した.length > 0 && チュートリアル部員登録中) 少ししたら閉じる();
    setMessages(updatedMessages);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };
  const 待っているカードの数 = messages.filter(
    (文) => 文.role === 'actionCard' && 文.status === 'pending'
  ).length;

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    const userMsg = inputText.trim();
    setInputText('');

    const newMessages = [...messages, { id: generateMsgId(), role: 'user', text: userMsg }];
    setMessages(newMessages);
    末尾の近く.current = true; // 自分で聞いたのだから、返事は追いかける
    setIsLoading(true);

    let attempt = 0;
    const MAX_RETRY = 1;
    // アプリの改善のための保存に添える、使った道具の名前（src/improvementLog.js）
    const 使った道具 = [];
    // かかった時間（ミリ秒）。遅いときに、最初の字が出るまでか・Gemini の何回目かを後から見る
    const 始めた時刻 = Date.now();
    let 最初の字の時刻 = 0;
    const Geminiの時間 = [];
    const 改善のために = (中身) => {
      const 秒 = (ms) => Math.round(ms / 100) / 10;
      require('./improvementLog').改善のために取っておく(
        'チャット',
        Object.assign(
          {
            質問: userMsg,
            道具: 使った道具,
            模型: 'gemini-3.6-flash',
            秒: {
              全部: 秒(Date.now() - 始めた時刻),
              最初の字まで: 最初の字の時刻 ? 秒(最初の字の時刻 - 始めた時刻) : null,
              Gemini: Geminiの時間.map(秒),
            },
          },
          中身
        )
      );
    };

    // 秒数を画面に数えながら待つ（送り直す前）
    const 数えながら待つ = async (秒) => {
      let 残り = 秒;
      setRetryCountdown(残り);
      const 時計 = setInterval(() => {
        残り--;
        setRetryCountdown((前) => Math.max(0, 前 - 1));
        if (残り <= 0) clearInterval(時計);
      }, 1000);
      await new Promise((解く) => setTimeout(解く, 秒 * 1000));
      clearInterval(時計);
      setRetryCountdown(0);
    };

    while (attempt <= MAX_RETRY) {
      try {
        // 部員一覧のみ渡す（トークン節約）。詳細成績はgetDetailedMemberStatsで取得
        // 名前（学年・区分）。学年の無い団体では学年の代わりに「会員」と出る
        const 区分たち = useScoreStore.getState().divisions || [];
        const memberList = members
          .map((member) => {
            const 区分の名前 = 区.人の区分の名前(member, 区分たち);
            return `${member.name}(${学.学年の名前(member)}${区分の名前 ? '・' + 区分の名前 : ''})`;
          })
          .join(', ');
        // 団体の種類・呼び方・区分。大学（4 年）で区分の無い団体（これまでの形）には足さない
        const 団体の案内 = () => {
          const 決 = 学.今の決まりを見る();
          const 区分 = 区.区分たち(区分たち).map((一つ) => 一つ.name);
          if (!決.学年なし && 学.既定の種類 === 決.種類 && !区分.length) return '';
          const 呼 = 決.呼び方;
          return (
            `\n\n[この団体]\n- 種類: ${学.種類の説明(決)}` +
            (決.学年なし
              ? `\n- 学年・期・進級・卒業はありません。メンバーは「${呼.部員}」、性別は「${呼.男子}・${呼.女子}」、抜けた人は「${呼.退部}した人」と呼んでください（道具が返す性別の値は男子・女子のまま）`
              : '') +
            (区分.length ? `\n- 区分: ${区分.join('・')}（団体が作った分け方。一人にいくつでも付く）` : '')
          );
        };

        // 日付の目安（年-月-日。端末の日付で切る）。日の 0 は前の月の末日
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const todayStr = 端末の日付(now);
        const yesterdayStr = 端末の日付(new Date(y, m, now.getDate() - 1));
        const thisMonthStart = 端末の日付(new Date(y, m, 1));
        const thisMonthEnd = 端末の日付(new Date(y, m + 1, 0));
        const lastMonthStart = 端末の日付(new Date(y, m - 1, 1));
        const lastMonthEnd = 端末の日付(new Date(y, m, 0));
        // 今年度（団体の年度の始まりの月から。既定は 4月1日〜翌3月31日。src/gakunen.js）
        const 年度の範囲 = 学.年度の範囲(学.年度(now));
        const fiscalYearStart = 端末の日付(年度の範囲.始め);
        const fiscalYearEnd = 端末の日付(年度の範囲.終わり);

        // 履歴で開いている記録。「この記録」「この試合」と聞かれたときに、どれを指すか分かるように渡す
        //（AI のボタンは記録の画面では出さないので、開いている記録は履歴の詳細だけ）
        const 開いている記録の案内 = () => {
          if (currentRouteName !== '履歴' || historyViewMode !== 'detail' || !selectedHistorySessionId)
            return '';
          const 記録 = sessions.find((記録1件) => 記録1件 && 記録1件.id === selectedHistorySessionId);
          if (!記録) return '';
          const 日付 = new Date(記録.date || 0);
          return `\n\n[いま開いている記録]\n- 日付: ${日付.getFullYear()}-${日付.getMonth() + 1}-${日付.getDate()} / 題: ${記録.title || '無題'} / id: ${記録.id}\n- 「この記録」「この試合」「今見ている記録」など、どの記録か言わずに聞かれたら、この記録のことです。getSessionsByDate の sessionId にこの id を渡して読んでください。`;
        };
        const relevantQA = selectQAs(userMsg, 個人);
        const qaSection = relevantQA ? `\n\n【アプリ操作・仕様Q&A（関連する項目のみ）】\n${relevantQA}` : '';
        // 基本の指示（systemInstructionBase）に、その日・その団体でしか
        // 決まらないものだけを足す。決まりごとを二重に書くと、食い違ったときに
        // どちらが効いているか分からなくなる
        const fullInstruction =
          (個人 ? 個人用.個人用の指示文(systemInstructionBase, members[0]) : systemInstructionBase) +
          qaSection +
          `\n\n[日付の目安 (YYYY-MM-DD)]\n- 今日: ${todayStr} / 昨日: ${yesterdayStr}\n- 今月: ${thisMonthStart} 〜 ${thisMonthEnd}\n- 先月: ${lastMonthStart} 〜 ${lastMonthEnd}\n- 今年度: ${fiscalYearStart} 〜 ${fiscalYearEnd}` +
          開いている記録の案内() +
          団体の案内() +
          (個人
            ? `\n[話し相手（本人）: ${memberList}]`
            : `\n[部員一覧（計${members.length}名）]\n${memberList}`);

        // 鍵の引数は飾り。中継が本物の鍵に付け替える（baseUrl と Authorization は SDKの設定 が足す）
        const genAI = new GoogleGenerativeAI('chukei');
        const 中継の設定 = await 中継.SDKの設定();

        /**
         * 分析画面のランキングの基準（射数の下限）。設定は期間の種類ごと（'すべて'・'期間指定' など）で、
         * 「最多比」なら期間でいちばん引いた人の射数 × 割合、「N 射以上」なら N
         */
        const 分析の順位の基準 = (期間, 期間の種類) => {
          const 設定 = (useScoreStore.getState().analysisRankingSettings || {})[期間の種類] || {
            type: 'ratio',
            value: 0,
          };
          if (設定.type === 'count') return Math.max(1, Number(設定.value) || 0);
          const 下見 = 全員の成績(members, sessions, { 期間, 最小射数: 0 });
          const 最多 = Math.max(0, ...下見.一覧.map((人) => 人.射数));
          return Math.max(1, Math.floor(最多 * (Number(設定.value) || 0)));
        };

        // タグで絞った成績。tags を渡されたときだけ絞る。当たる記録が無いときは、使えるタグを添えて返す
        // （模型がタグの名前を選び直せるように）。成績の 3 つの道具が共通で使う
        const タグで絞った記録 = (タグたち) => {
          const 絞り = タグで絞る(sessions, タグたち);
          const 表示 = 絞り.絞った
            ? {
                タグ: 絞り.タグ,
                当たった記録の件数: 絞り.当たった件数,
                ...(絞り.当たった件数 === 0
                  ? { 使えるタグ: 絞り.使えるタグ }
                  : { 当たったタグ: 絞り.当たったタグ }),
              }
            : null;
          const 添え書き = 絞り.絞った
            ? 絞り.当たった件数 === 0
              ? 'そのタグが付いた記録はありません。使えるタグの中から選び直すか、その旨を伝えてください。'
              : `タグ「${絞り.タグ.join('」「')}」に当たる記録 ${絞り.当たった件数} 件だけで集計しています（当たったタグ：${絞り.当たったタグ.join('・')}）。「タグで絞った数字」であることと、どのタグで数えたかを答えに添えてください。`
            : '';
          return { 記録たち: 絞り.記録たち, 表示, 添え書き };
        };

        // 道具の宣言（src/chatTools.js）
        const tools = 道具の宣言(学.今の決まりを見る().在籍の学年.length);
        // 個人ログインには、全員の成績・出欠・部員の追加の道具は出さない。本人の分だけの道具にする
        if (個人) tools[0].functionDeclarations = 個人用.個人向けの道具(tools[0].functionDeclarations);

        const model = genAI.getGenerativeModel(
          {
            // flash-lite は最も軽い層で、道具の使い忘れや数字の取り違えが起きやすい。
            // flash に上げると質問の取り違えが減る。そのぶん無料枠の消費は速く、
            // 上限（429）に当たりやすくなるので、当たったときの待ちの作りはそのまま残す
            // 2026-09-13 に 3.6-flash へ。2.5-flash は新しい鍵では使えず、無料枠も模型ごとなので、
            // 写真の読み取りと同じ模型にそろえる（道具の呼び出しは検証環境で確かめた）
            model: 'gemini-3.6-flash',
            systemInstruction: fullInstruction,
            tools,
          },
          中継の設定
        );

        // 会話の中身（contents）は自分で持ち、SDK の startChat は使わない。
        //   ・履歴は「いま送る発言の手前まで」。newMessages には送る発言も入っているので、
        //     slice(1) だと同じ発言が履歴と送信で二重になり、模型が「はたはまはたはま」と
        //     名前を二重に読んだ（3.6-flash で実際に）。先頭のあいさつも外す
        //   ・SDK 0.24 の startChat は、流し読みのときに模型の返事から thoughtSignature を
        //     落とし（空の text にして「返事が無効」扱い→履歴に積まない）、道具の返事を
        //     role:'function' で送る。3.x の模型はどちらも受けず、道具を使う質問が
        //     「Role 'function' is not supported」「function response turn comes immediately
        //     after a function call turn」の 400 になった（2026-09-14、本番で）
        const 会話 = newMessages.slice(1, -1).map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [
            { text: msg.role === 'actionCard' ? `[システムのデータ追加提案: ${msg.status}]` : msg.text },
          ],
        }));

        // 流しながら出す。全文ができるまで待たせると、道具を使う質問では
        // 数秒から十数秒、砂時計だけを見せることになる。
        // 道具を呼ぶときは文字が来ないので、その回は何も出ないだけで済む
        const 途中の札 = generateMsgId();
        let 途中の文 = '';
        // 直前の返事で、模型が呼んできた道具。SDK の response.functionCalls() は使わない。
        // 流れてきた 1 つのかけらに道具の呼び出しが 2 つ以上あると、SDK は最後の 1 つを
        // 人数ぶん返す（集約で部品を使い回す不具合。@google/generative-ai 0.24.1）。
        // 同じ道具を繰り返し動かし、返りの名前も食い違ってしまう。積んだ部品（模型の部品）から取る
        let 呼ばれた道具 = [];
        const 道具の呼び出しを取る = (部品たち) =>
          部品たち.filter((一つ) => 一つ && 一つ.functionCall).map((一つ) => 一つ.functionCall);
        // 直前の返事の文も、同じ理由で積んだ部品から取る。response.text() は、文と署名だけの空の部品など
        // 2 つ以上が 1 つのかけらに来ると、同じ文を重ねたり（答えです答えです）、途中の文を落としたりする
        let 返事の文 = '';
        const 文を取る = (部品たち) =>
          部品たち
            .filter((一つ) => 一つ && typeof 一つ.text === 'string')
            .map((一つ) => 一つ.text)
            .join('');
        // 最後に送った中身。答えの文が空だったとき、同じ内容で 1 回だけ送り直すために取っておく
        let 最後に送った中身 = null;
        const 送る = async (中身) => {
          最後に送った中身 = 中身;
          途中の文 = '';
          呼ばれた道具 = [];
          返事の文 = '';
          会話.push({ role: 'user', parts: 中身 });
          // 模型の返事の部品は、かけらのまま（thoughtSignature ごと）積む。次の送信で
          // そのまま返さないと「Function call is missing a thought_signature」になる
          const 模型の部品 = [];
          let 返り;
          const 送った時刻 = Date.now();
          try {
            返り = await model.generateContentStream({ contents: 会話 });
            // 流れが途中で切れると、返事全体の約束（response）も失敗する。ここで受け止めないと
            // 誰も待っていない約束の失敗として便りに届く（本番で 2 通）。失敗そのものは
            // 下の for await が投げるので、そちらで扱う
            返り.response.catch(() => {});
            await 流しながら出す(返り, 模型の部品);
          } catch (誤り) {
            if (!流れが切れたか(誤り)) throw 誤り;
            // 流し読みが途中で切れたら、もう 1 回だけ流し読みで送り直す。途中まで出した文は消して出し直す。
            // 前は流さずに（generateContent で）送り直していたが、流さない道は答え全部ができるまで
            // 1 字も届かず、中継も写真用の並び（1 つ 45 秒まで待つ）を通る。2026-10-20・21 に本番で
            // 70〜100 秒無言のまま iPhone の Safari に切られ（Load failed）、3 回とも答えが出なかった
            console.warn(
              '[AIChatBot] 流し読みが切れたので、もう一度流し読みで送り直します',
              誤り && 誤り.message
            );
            模型の部品.length = 0;
            途中の文 = '';
            返り = await model.generateContentStream({ contents: 会話 });
            返り.response.catch(() => {});
            await 流しながら出す(返り, 模型の部品);
          }
          if (模型の部品.length) 会話.push({ role: 'model', parts: 模型の部品 });
          呼ばれた道具 = 道具の呼び出しを取る(模型の部品);
          返事の文 = 文を取る(模型の部品);
          Geminiの時間.push(Date.now() - 送った時刻);
          return 返り;
        };
        // 流れてきたかけらを積み、文字があれば途中の札に出す
        const 流しながら出す = async (返り, 模型の部品) => {
          for await (const かけら of 返り.stream) {
            const 部品 =
              (かけら.candidates &&
                かけら.candidates[0] &&
                かけら.candidates[0].content &&
                かけら.candidates[0].content.parts) ||
              [];
            for (const 一つ of 部品) 模型の部品.push(一つ);
            let 文 = '';
            try {
              文 = かけら.text() || '';
            } catch {
              // 道具の呼び出しだけのかけらは文字を持たない（text() が投げる）
            }
            if (!文) continue;
            if (!最初の字の時刻) 最初の字の時刻 = Date.now();
            途中の文 += 文;
            const いま = 途中の文;
            setMessages((前) => {
              const 最後 = 前[前.length - 1];
              const 札付き = { id: 途中の札, role: 'model', text: いま };
              return 最後 && 最後.id === 途中の札 ? [...前.slice(0, -1), 札付き] : [...前, 札付き];
            });
          }
        };

        console.log('[AIChatBot] Sending message with Function Calling enabled...');
        let result = await 送る([{ text: userMsg }]);
        let response = await result.response;

        // Function Calling の処理ループ
        let calls = 呼ばれた道具;
        let loopCount = 0;

        while (calls && calls.length > 0 && loopCount < 5) {
          loopCount++;
          const functionResponses = [];
          let hasPendingAction = false;
          const pendingActionCards = [];

          for (const call of calls) {
            // 引数の中身には部員の氏名が入る。共用端末で読まれるので、
            // どの引数が来たかだけにする（不具合を追うにはこれで足りる）
            console.log('[AIChatBot] Function Called:', call.name, Object.keys(call.args || {}));
            if (call.name && !使った道具.includes(call.name)) 使った道具.push(call.name);

            // 個人ログインは、出していない道具を模型が呼んできても動かさない。
            // 「本人の分だけ」を、指示文の断りだけに頼らず、道具の側でも止める
            if (個人 && !個人用.個人が使える道具.includes(call.name)) {
              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: {
                    success: false,
                    message: '個人で入っているときは使えない操作です。団体の担当者に頼むよう伝えてください。',
                  },
                },
              });
              continue;
            }

            if (call.name === 'makeBalancedTeams') {
              // 組分けは src/chatTeams.js で済ませる（10/17 に AI が自分で組んで、人を外し・数え違え・ばらついた）
              const { 組を均等に分ける } = require('./chatTeams');
              // 「男子だけで」は、絞った人だけで組む（前は絞れず、余りの聞き返しになっていた。10/20 の AI のログ）
              const 絞り = { 性別: call.args.gender, 学年: call.args.grade };
              const 結果 = 組を均等に分ける(人を絞る(members, 絞り), タグで絞った記録().記録たち, {
                期間: 期間にする(call.args.dateFrom, call.args.dateTo),
                一組の人数: call.args.teamSize,
                外す: Array.isArray(call.args.excludeNames) ? call.args.excludeNames : [],
                余り: call.args.remainder,
              });
              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: {
                    ...結果,
                    ...(絞り.性別 || 絞り.学年 ? { 絞り込み: 絞り } : {}),
                    message:
                      '組分けは計算済みです。組の順番・顔ぶれ・数字をそのまま伝え、自分で組み替えたり計算し直したりしないでください。' +
                      `組の数は 組の人数の内訳（${結果.組の人数の内訳}）のとおりに伝えてください（「3人ずつ5組」のように内訳と違う言い方をしない）。` +
                      (絞り.性別 || 絞り.学年
                        ? '絞り込み の人だけで組んでいます。そのことを添えてください。'
                        : '') +
                      '「見込みの的中率」は、次に組で立ったときの組の的中率の見込み（一人ひとりの期間の的中率を、射数が少ないほど部全体の的中率に寄せたものの平均）で、組どうしの差が 組の見込みの開き です。' +
                      (結果.見積もった人.length
                        ? '見積もった人 には、期間に記録が無いので期間の外の記録から見込んだことを必ず添えてください。'
                        : '') +
                      (結果.見つからない名前.length
                        ? '見つからない名前 は外せていません。利用者に名前を確かめてください。'
                        : '') +
                      (結果.同じ名前が複数.length
                        ? '同じ名前が複数 の人は外せていません。どの人か利用者に聞いてください。'
                        : '') +
                      (結果.余った人.length
                        ? '余った人 は組に入れていません。そのことを伝えてください。'
                        : ''),
                  },
                },
              });
              continue;
            }

            if (call.name === 'getAllMembersStats') {
              const { dateFrom, dateTo, sortBy, limit, minShots, gender, grade } = call.args;

              // 数える・並べる・絞るは、すべてここで済ませる。
              // 人数ぶんの表を渡して模型に選ばせると取り違えるため。
              // 期間の日付は端末の時刻で読む（期間にする。世界標準時で読むと月初の朝練が落ちる）
              const 期間 = 期間にする(dateFrom, dateTo);
              // 最小射数を模型が渡さないときは、分析画面のランキングの基準（設定の「最多比」か「N 射以上」）
              // をそのまま使う。前は 1 射から順位に入れていて、画面のランキングに出ない人が
              // チャットでは首位になった
              const 基準 = 分析の順位の基準(期間, dateFrom || dateTo ? '期間指定' : 'すべて');
              const 最小射数 = Number.isFinite(minShots) ? minShots : 基準;
              const タグ絞り = タグで絞った記録(call.args.tags);
              // 題・覚え書きの言葉でも絞る（「リーグ戦に出た選手」など。タグに無く題にだけある）
              const 題絞り = 題で絞る(タグ絞り.記録たち, call.args.keyword);
              const 結果 = 全員の成績(members, 題絞り.記録たち, {
                期間,
                並び: sortBy,
                件数: limit,
                最小射数,
                性別: gender,
                学年: grade,
              });

              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: {
                    並び: 結果.並び,
                    数えた記録の件数: 結果.数えた記録,
                    順位を付けた人数: 結果.人数,
                    射数が足りず外した人数: 結果.射数が足りず外した人数,
                    順位の基準の射数: 最小射数,
                    団体全体: 結果.全体,
                    順位: 結果.一覧,
                    ...(結果.絞り込み ? { 絞り込み: 結果.絞り込み } : {}),
                    ...(結果.並び === '安定'
                      ? { 散らばりを出せず外した人数: 結果.散らばりを出せず外した人数 }
                      : {}),
                    ...(タグ絞り.表示 ? { タグでの絞り込み: タグ絞り.表示 } : {}),
                    ...(題絞り.絞った
                      ? { 題での絞り込み: { 言葉: 題絞り.言葉, 当たった記録の件数: 題絞り.当たった件数 } }
                      : {}),
                    message:
                      タグ絞り.添え書き +
                      (題絞り.絞った
                        ? 題絞り.当たった件数 === 0
                          ? `題や覚え書きに「${題絞り.言葉}」を含む記録はありません。searchSessions で記録の題を確かめるか、その旨を伝えてください。`
                          : `題や覚え書きに「${題絞り.言葉}」を含む記録 ${題絞り.当たった件数} 件だけで集計しています。そのことを答えに添えてください。`
                        : '') +
                      (Number.isFinite(minShots)
                        ? `${最小射数} 射に満たない人は順位から外しました。`
                        : 最小射数 > 1
                          ? `分析画面のランキングと同じ基準で、${最小射数} 射に満たない人は順位から外しました（外した人数は 射数が足りず外した人数）。`
                          : '') +
                      (結果.絞り込み
                        ? '絞り込み の人だけで数えて順位を付けました（団体全体 もその人たちの合計です）。'
                        : '') +
                      (結果.並び === '安定'
                        ? `記録ごとの散らばり は、4 射以上引いた記録ごとの的中率の標準偏差（ポイント）で、小さいほど安定しています。4 射以上の記録が 3 件に満たない人は並べていません（散らばりを出せず外した人数）。`
                        : '') +
                      '順位・並べ替え・絞り込みは集計済みです。返した順番と数字をそのまま使い、' +
                      '自分で並べ替えたり計算したりしないでください。的中率は百分率です。',
                  },
                },
              });
            } else if (call.name === 'getAttendanceStats') {
              const { dateFrom, dateTo, sortBy, limit, gender, grade } = call.args;
              // 出欠画面と同じ決まりで数えるため、正規練習日を読む（読めなければ記録の出欠の印で数える）
              let 練習日 = {};
              try {
                練習日 = await 練習日を読む(useScoreStore.getState().activeGroupId);
              } catch (誤り) {
                console.warn('[AIChatBot] 練習日を読めませんでした:', 誤り);
              }
              const 結果 = 出欠の集計(members, sessions, {
                期間: 期間にする(dateFrom, dateTo),
                練習日,
                並び: sortBy,
                件数: limit,
                性別: gender,
                学年: grade,
              });
              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: Object.assign({}, 結果, {
                    message:
                      (結果.一度も来ていない人.length
                        ? `期間に一度も来ていない ${結果.一度も来ていない人.length} 人は順位に入れず「一度も来ていない人」に分けました。答えでも順位とは分けて伝えてください。`
                        : '') +
                      (結果.数え方 === '練習日'
                        ? `正規練習日 ${結果.練習日数} 日について、記録に出ていれば「来た」、記録が無ければ「欠席」と数えました（出欠画面と同じ数え方。出席率＝来た回数÷今日までの練習日数）。`
                        : '正規練習日が登録されていないので、記録に付いた出欠の印を数えました。出欠を付けずに保存された記録は数に入れていません。') +
                      '遅刻・早退は「来た」に数えています。順位と数字はそのまま使ってください。',
                  }),
                },
              });
            } else if (call.name === 'searchSessions') {
              const { keyword, dateFrom, dateTo, limit } = call.args;
              const 結果 = 記録をさがす(sessions, {
                言葉: keyword,
                期間: 期間にする(dateFrom, dateTo),
                件数: limit,
              });
              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: Object.assign({}, 結果, {
                    message:
                      '新しい順に返しています。見つかった件数より少なく返している場合は、その旨を伝えてください。',
                  }),
                },
              });
            } else if (call.name === 'countSessionParticipation') {
              const { keyword, dateFrom, dateTo, limit } = call.args;
              const 結果 = 参加回数を数える(members, sessions, {
                言葉: keyword,
                期間: 期間にする(dateFrom, dateTo),
                件数: limit,
              });
              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: Object.assign({}, 結果, {
                    message:
                      '同じ記録に何度出ても1回と数えています。ゲストと、部員に結び付いていない人は数えていません。順位と回数はそのまま使ってください。',
                  }),
                },
              });
            } else if (call.name === 'getPositionStats') {
              const { dateFrom, dateTo, memberNames, minShots } = call.args;
              const タグ絞り = タグで絞った記録(call.args.tags);
              const 結果 = 射位ごとの成績(
                人を絞る(members, { 性別: call.args.gender, 学年: call.args.grade }),
                タグ絞り.記録たち,
                {
                  期間: 期間にする(dateFrom, dateTo),
                  名前たち: memberNames,
                  最小射数: minShots,
                }
              );
              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: Object.assign(
                    {},
                    結果,
                    タグ絞り.表示 ? { タグでの絞り込み: タグ絞り.表示 } : {},
                    {
                      message:
                        タグ絞り.添え書き +
                        '射位ごとの的中率です。射数の少ない射位は数字が揺れるので、率だけでなく射数も添えて伝えてください。' +
                        'ある射位に誰が向いているかを比べて並べるときは、的中率ではなく「見込みの的中率」の高い順にしてください（射数の少ない射位の率を、本人の全体の率へ寄せた数字です）。' +
                        '誰をどこに置くかは決めていません。数字を根拠に提案してください。',
                    }
                  ),
                },
              });
            } else if (call.name === 'compareMemberStats') {
              // 2 つの期間の比べ（「最近的中率が落ちている人」）。差と並べ替えは chatStats の 二つの期間で比べる
              const 期間 = 比べる期間を決める(call.args);
              const タグ絞り = タグで絞った記録(call.args.tags);
              const 結果 = 二つの期間で比べる(members, タグ絞り.記録たち, {
                ...期間,
                並び: call.args.sortBy,
                最小射数: call.args.minShots,
                件数: call.args.limit,
                性別: call.args.gender,
                学年: call.args.grade,
              });
              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: Object.assign(
                    {},
                    結果,
                    タグ絞り.表示 ? { タグでの絞り込み: タグ絞り.表示 } : {},
                    {
                      message:
                        タグ絞り.添え書き +
                        `差は 今の期間 − 前の期間 の的中率（ポイント）です。両方の期間で ${結果.最小射数} 射以上の人だけを比べました（足りない人は 射数が足りず比べなかった人数）。` +
                        'どの 2 つの期間を比べたかを日付で添えてください。差と順番は計算済みなので、そのまま使ってください。',
                    }
                  ),
                },
              });
            } else if (call.name === 'compareShotRanges') {
              // 1 本の列の前の射と後の射の比べ（「最初の 4 射と後半の 4 射」）
              const タグ絞り = タグで絞った記録(call.args.tags);
              const 結果 = 射の前後で比べる(members, タグ絞り.記録たち, {
                期間: 期間にする(call.args.dateFrom, call.args.dateTo),
                前: { から: call.args.firstFrom, まで: call.args.firstTo },
                後: { から: call.args.secondFrom, まで: call.args.secondTo },
                並び: call.args.sortBy,
                最小射数: call.args.minShots,
                件数: call.args.limit,
                性別: call.args.gender,
                学年: call.args.grade,
              });
              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: Object.assign(
                    {},
                    結果,
                    タグ絞り.表示 ? { タグでの絞り込み: タグ絞り.表示 } : {},
                    {
                      message:
                        タグ絞り.添え書き +
                        `各記録の列の ${結果.前の射の範囲} と ${結果.後の射の範囲} を比べました。差は 後 − 前 の的中率（ポイント）で、'差が小さい' の順は前と後がそろっている（安定している）順です。` +
                        `前・後それぞれ ${結果.最小射数} 射以上の人だけを比べました。差と順番はそのまま使ってください。`,
                    }
                  ),
                },
              });
            } else if (call.name === 'aggregateStats') {
              // 万能の集計（src/chatAggregate.js）。絞り込みと切り口を模型が組み、数えて並べるのは端末
              const { 集計する } = require('./chatAggregate');
              const 引数 = call.args;
              const タグ絞り = タグで絞った記録(引数.tags);
              const 題絞り = 題で絞る(タグ絞り.記録たち, 引数.keyword);
              const 結果 = 集計する(members, 題絞り.記録たち, {
                切り口: 引数.groupBy,
                期間: 期間にする(引数.dateFrom, 引数.dateTo),
                性別: 引数.gender,
                学年: 引数.grade,
                名前たち: 引数.memberNames,
                射目: { から: 引数.shotFrom, まで: 引数.shotTo },
                射位たち: 引数.positions,
                曜日たち: 引数.weekdays,
                並び: 引数.sortBy,
                向き: 引数.order,
                最小射数: 引数.minShots,
                件数: 引数.limit,
                区分たち: useScoreStore.getState().divisions || [],
              });
              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: Object.assign(
                    {},
                    結果,
                    タグ絞り.表示 ? { タグでの絞り込み: タグ絞り.表示 } : {},
                    題絞り.絞った
                      ? { 題での絞り込み: { 言葉: 題絞り.言葉, 当たった記録の件数: 題絞り.当たった件数 } }
                      : {},
                    {
                      message:
                        タグ絞り.添え書き +
                        (題絞り.絞った
                          ? `題や覚え書きに「${題絞り.言葉}」を含む記録だけで数えました。`
                          : '') +
                        '数字と並びは集計済みです。そのまま使い、自分で足したり並べ替えたりしないでください（計算が要るときは calculate）。' +
                        '条件 にある絞り込みと、部員でない人（ゲスト）の射は数えていないことを、必要に応じて答えに添えてください。' +
                        (結果.返していない数
                          ? `まとまりは ${結果.まとまりの数} 件で、${結果.一覧.length} 件だけ返しました。そのことを伝えてください。`
                          : ''),
                    }
                  ),
                },
              });
            } else if (call.name === 'listMembers') {
              const { 名簿を数える } = require('./chatAggregate');
              const 状態 = useScoreStore.getState();
              const 結果 = 名簿を数える(members, {
                性別: call.args.gender,
                学年: call.args.grade,
                区分: call.args.division,
                名前に: call.args.nameIncludes,
                期を出す: !!状態.useTerm,
                区分たち: 状態.divisions || [],
                卒業生: 状態.alumni || [],
                卒業生も: !!call.args.includeAlumni,
              });
              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: Object.assign({}, 結果, {
                    message: '人数と内訳は数え済みです。そのまま使ってください。',
                  }),
                },
              });
            } else if (call.name === 'calculate') {
              // 計算（src/chatCalc.js）。eval は使わない
              const { 計算する } = require('./chatCalc');
              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: 計算する(call.args.expression, call.args.digits),
                },
              });
            } else if (call.name === 'getEquipmentTrend') {
              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: 弓具の前後(members, sessions, String(call.args.memberName || '')),
                },
              });
            } else if (call.name === 'getDetailedMemberStats') {
              // 中身は chatStats の 一人の成績（検査できる形にした。射位は区切りと計を除いた並びで見る）
              const タグ絞り = タグで絞った記録(call.args.tags);
              const statsData = 一人の成績(
                members,
                タグ絞り.記録たち,
                String(call.args.memberName || ''),
                期間にする(call.args.dateFrom, call.args.dateTo)
              );
              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: タグ絞り.表示
                    ? Object.assign({}, statsData, {
                        タグでの絞り込み: タグ絞り.表示,
                        message: タグ絞り.添え書き,
                      })
                    : statsData,
                },
              });
            } else if (call.name === 'getArrowLocationStats') {
              const { memberName, dateFrom, dateTo, targetType, tags } = call.args;
              const タグ絞り = タグで絞った記録(tags);
              const statsData = 矢所の成績(members, タグ絞り.記録たち, String(memberName || ''), {
                dateFrom,
                dateTo,
                targetType,
                tags,
              });
              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: タグ絞り.表示
                    ? Object.assign({}, statsData, {
                        タグでの絞り込み: タグ絞り.表示,
                        message:
                          (statsData.message || '') + (タグ絞り.添え書き ? ' ' + タグ絞り.添え書き : ''),
                      })
                    : statsData,
                },
              });
            } else if (call.name === 'getSessionsByDate') {
              const { date, dateFrom, dateTo, recentCount, keyword, sessionId, sortBy } = call.args;

              // 記録が無い・壊れているものを先に外す。archers が無い記録が1件でも
              // 混ざると、この道具ごと落ちて「エラー」しか返せなくなる
              let filtered = sessions
                .filter((記録) => 記録 && Array.isArray(記録.archers))
                .sort((甲, 乙) => (乙.date || 0) - (甲.date || 0));
              if (sessionId) filtered = filtered.filter((記録) => String(記録.id) === String(sessionId));
              if (keyword) {
                // 題・覚え書き・目印の当たり方は searchSessions と同じにする
                const 当たり = new Set(
                  記録をさがす(filtered, { 言葉: keyword, 件数: filtered.length }).一覧.map((記録) => 記録.id)
                );
                filtered = filtered.filter((記録) => 当たり.has(記録.id));
              }

              if (recentCount) {
                filtered = filtered.slice(0, recentCount);
              } else if (date) {
                const target = new Date(日付の始まり(date) || NaN);
                filtered = filtered.filter((記録) => {
                  const 日付 = new Date(記録.date || 0);
                  return (
                    日付.getFullYear() === target.getFullYear() &&
                    日付.getMonth() === target.getMonth() &&
                    日付.getDate() === target.getDate()
                  );
                });
              } else if (dateFrom || dateTo) {
                const { 始め, 終わり } = 期間にする(dateFrom, dateTo);
                filtered = filtered.filter((記録) => (記録.date || 0) >= 始め && (記録.date || 0) <= 終わり);
              }

              // 的中で並べる（「今月いちばん当たった日」）。上限で切る前に並べないと、いちばんの記録が落ちる
              if (sortBy === '的中率' || sortBy === '的中数') {
                const 鍵 = sortBy === '的中率' ? '的中率' : '的中';
                const 数 = new Map(filtered.map((記録) => [記録, 記録の的中(記録)]));
                filtered = filtered
                  .filter((記録) => 数.get(記録).射数 > 0)
                  .sort(
                    (甲, 乙) =>
                      (数.get(乙)[鍵] || 0) - (数.get(甲)[鍵] || 0) || (乙.date || 0) - (甲.date || 0)
                  );
              }

              // 上限を置く。引数なしで呼ばれると全記録を人ごとの内訳付きで返し、
              // 返す量が膨れて遅くなるうえ、模型が読み切れず数字を取り違える
              const 上限 = 30;
              const 当たった件数 = filtered.length;
              filtered = filtered.slice(0, 上限);

              // 個人ログインでは、交代の相手（他の人）の分は空にしてあるので載せず、
              // 他の人の列が空なのでチームごとの的中も載せない
              const sessionData = filtered.map((記録) =>
                記録の要約(記録, { 載せない名前: 個人 ? 他の人 : null, チームも: !個人 })
              );

              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: {
                    count: sessionData.length,
                    並び: sortBy === '的中率' || sortBy === '的中数' ? sortBy + 'の高い順' : '新しい順',
                    当たった件数,
                    返していない件数: Math.max(0, 当たった件数 - sessionData.length),
                    sessions: sessionData,
                    message:
                      sessionData.length === 0
                        ? '該当する記録が見つかりませんでした。'
                        : 当たった件数 > sessionData.length
                          ? `${当たった件数}件のうち、新しい順に${sessionData.length}件だけ返しました。全部を数えたいときは getAllMembersStats を期間付きで使ってください。返していない記録があることを利用者に伝えてください。`
                          : `${sessionData.length}件の記録を取得しました。` +
                            (sessionData.some((記録) => 記録.チームごと)
                              ? 'チームごと はチーム（区切り）ごとに数えた的中数・射数・的中率です。「何中対何中」「どちらが勝ったか」はこの数字で答えてください（的中数の多いほうが上。同数のときや、競射などで決めた勝敗は記録に無いので決めつけない）。'
                              : ''),
                  },
                },
              });
            } else if (call.name === 'navigateToScreen') {
              // 行けない画面を渡されたら success: false で返す。前は何を渡しても success を返していたため、
              // 移動していないのに「移動しました」と答えていた。
              // 個人で開けるのは 記録・履歴・分析・メンバー・設定。出欠だけが団体の画面（MainNavigator と同じ）
              const 団体だけの画面 = ['出欠'];
              const 行ける画面 = 個人
                ? 個人用.個人が行ける画面
                : ['記録', '履歴', '分析', 'メンバー', '出欠', '設定'];
              const target = String(call.args.screenName || '');
              const 行けるか = 行ける画面.includes(target);

              if (行けるか) {
                setTimeout(() => {
                  try {
                    navigation.navigate(target);
                    setModalVisible(false);
                  } catch (誤り) {
                    console.warn('Navigation failed', 誤り);
                  }
                }, 500);
              }

              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: 行けるか
                    ? { success: true, message: `${target}画面へ移動します。` }
                    : {
                        success: false,
                        行ける画面,
                        message:
                          団体だけの画面.includes(target) && 個人
                            ? `${target}画面は団体ログインのときだけ開けます。移動していません。その旨を伝えてください。`
                            : `${target}という画面はありません。移動していません。行ける画面の中から選び直してください。`,
                      },
                },
              });
            } else if (call.name === 'startTutorial') {
              let 開始結果 = '';
              try {
                開始結果 = 案内.startTutorial();
              } catch (誤り) {
                console.warn('[AIChatBot] startTutorial failed', 誤り);
              }
              const ライブ中 = 開始結果 === 'ライブ中';
              if (!ライブ中) {
                setTimeout(() => {
                  setModalVisible(false);
                }, 500);
              }
              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: ライブ中
                    ? {
                        success: false,
                        message:
                          'ライブ記録中は、使い方の案内を始められません。ライブを止めてからお試しください。',
                      }
                    : {
                        success: true,
                        message:
                          '使い方の案内（チュートリアル）を開始します。チャットを閉じて画面の案内をご覧ください。',
                      },
                },
              });
            } else if (call.name === 'addMember' || call.name === 'addMembers') {
              // addMembers は人ごとにカードにする（1枚ずつ見て、まとめて承認できる）
              const 人たち =
                call.name === 'addMembers'
                  ? Array.isArray(call.args && call.args.members)
                    ? call.args.members
                    : []
                  : [call.args];
              for (const 人 of 人たち) {
                if (!人 || !String(人.name || '').trim()) continue;
                pendingActionCards.push({
                  id: generateMsgId(),
                  role: 'actionCard',
                  actionType: 'addMember',
                  args: 人,
                  status: 'pending',
                  callName: call.name,
                });
                hasPendingAction = true;
              }
            }
          }

          // 複数の addMember カードをまとめて追加
          if (hasPendingAction) {
            // 流しながら出していた途中の札は捨てる。道具を呼ぶ前に少しだけ
            // 文字が来ることがあり、そのままだと言いかけの文が残る
            setMessages((prev) => [...prev.filter((文) => 文.id !== 途中の札), ...pendingActionCards]);
            setIsLoading(false);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
            return;
          }

          if (functionResponses.length > 0) {
            // 関数実行結果をモデルに返す
            result = await 送る(functionResponses);
            response = await result.response;
            calls = 呼ばれた道具;
          } else {
            break;
          }
        }

        // 道具を呼べる回数（5 回）を使い切っても、模型がまだ道具を呼ぼうとして答えの文が無いとき。
        // そのまま抜けると答えが空になり「回答を生成できませんでした」と出ていた（本番の控えで 90 件中 3 件。
        // どれも記録を何度も探す質問で、使う人は「再開して」と打ち直していた。2026-10-16 に控えで確かめた）。
        // 呼ぼうとした道具には「これ以上は呼べない」と返し、ここまでの結果で答えてもらう
        if (calls && calls.length > 0 && !返事の文.trim()) {
          console.warn('[AIChatBot] 道具を呼べる回数を使い切りました。ここまでの結果で答えてもらいます');
          result = await 送る(
            calls.map((call) => ({
              functionResponse: {
                name: call.name,
                response: {
                  success: false,
                  message:
                    '道具を呼べる回数を使い切りました。これ以上は道具を呼ばず、ここまでに受け取った結果だけで答えてください。足りないところは、足りないと正直に伝えてください。',
                },
              },
            }))
          );
          response = await result.response;
        }

        // 答えの文が空で、止められたのでもないとき（空の返事が来ることがある。2026-10-02 に本番で 1 回）は、
        // 同じ内容で 1 回だけ送り直す。使う人に「もう一度お試しください」と押させない。
        // 空の返事は会話に積んでいないので、会話の最後は送ったもの。送り直しがまた道具を呼んだときは動かさない
        const 止められた = (返り) => {
          const 候補 = 返り && 返り.candidates && 返り.candidates[0];
          return !!(
            候補 && /SAFETY|PROHIBITED|BLOCKLIST|SPII|RECITATION/i.test(String(候補.finishReason || ''))
          );
        };
        if (
          !返事の文.trim() &&
          !(呼ばれた道具 && 呼ばれた道具.length) &&
          !止められた(response) &&
          最後に送った中身 &&
          会話.length &&
          会話[会話.length - 1].role === 'user'
        ) {
          console.warn('[AIChatBot] 答えの文が空だったので、もう一度送ります');
          const 中身 = 最後に送った中身;
          会話.pop();
          result = await 送る(中身);
          response = await result.response;
        }

        // 答えの文は、積んだ部品から取る（response.text() は使わない。理由は 返事の文 のところ）
        let responseText = 返事の文;
        if (!responseText) {
          // 止められた（安全の判定など）ときも空になる。理由を追えるよう、終わりの印だけ残す
          const 候補 = response && response.candidates && response.candidates[0];
          console.warn('[AIChatBot] 答えの文が空です。終わりの印:', 候補 && 候補.finishReason);
        }

        if (!responseText || responseText.trim() === '') {
          responseText = '（回答を生成できませんでした。もう一度お試しください）';
        }

        // 途中に出していた札は捨て、確定した1件だけを残す。
        // 残したままだと、同じ答えが2つ並ぶ
        setMessages([...newMessages, { id: generateMsgId(), role: 'model', text: responseText }]);
        改善のために({ 答え: responseText, 結果: '答えた' });
        break; // 成功
      } catch (error) {
        // 初めの案内の部員登録で AI に届かなかったときだけ、送った文から読んで確認のカードを出す。
        // AI が文で答えたとき（学年や性別を聞き返したなど）は、その答えを優先する
        if (チュートリアル部員登録中) {
          const 抽出 = 入力から部員を読み取る(userMsg);
          if (抽出) {
            const fallbackCard = {
              id: generateMsgId(),
              role: 'actionCard',
              actionType: 'addMember',
              args: 抽出,
              status: 'pending',
            };
            setMessages([...newMessages, fallbackCard]);
            setIsLoading(false);
            setRetryCountdown(0);
            return;
          }
        }

        const is429 = error.message?.includes('429');
        const isPerDay = error.message?.includes('PerDayPerProject');
        const isPerMinute = is429 && !isPerDay;
        // 一時的な誤り（500・502・503・504）。503 は模型が混んでいる、502 は中継から Gemini に
        // つながらなかった、500・504 は上流の一時の不具合
        const 状態番号 = 誤りの状態番号(error);
        const is503 = 状態番号 === 503 || error.message?.includes('503');
        const 一時の誤りか = is503 || [500, 502, 504].includes(状態番号);

        if (一時の誤りか && attempt < MAX_RETRY) {
          // 混んでいる（503）などの一時の誤り。中継がすでに 503 は 2・4・8 秒待って送り直しているが、
          // 山が長いことがある。利用者に送り直させる前に、もう少し待ってこちらで 1 回だけ送り直す
          await 数えながら待つ(10);
          attempt++;
          continue;
        }

        if (isPerMinute && attempt < MAX_RETRY) {
          // 1 分あたりの上限（429）。上流が言う待ち時間（なければ 35 秒）数えてから、こちらで 1 回だけ送り直す
          const match = error.message.match(/"retryDelay":"(\d+)s"/);
          await 数えながら待つ(match ? parseInt(match[1]) + 2 : 35);
          attempt++;
          continue;
        }

        console.error('AIChatBot Send Error:', error);
        // 画面で受け止めた誤りも、種類だけを便りに送る（質問や答えの中身は送らない。
        // 誤りの文言だけ）。送らないと、使う人に何が多く出ているのか運用側から見えない
        try {
          require('./errorReporter').不具合を送る('AIチャット', error);
        } catch {
          // 便りの仕組みが転んでも、チャットの知らせは出す
        }
        let errorMsg;
        if (error.message?.includes('503')) {
          errorMsg = 'ただいまAIが混み合っています。しばらく待ってからもう一度送信してください。';
        } else if (is429) {
          if (isPerDay) {
            errorMsg = '本日のAI利用上限に達しました。明日0時以降に再度お試しください。';
          } else {
            errorMsg = 'AIの利用制限（クォータ）に達しました。しばらく時間をおいてから再度お試しください。';
          }
        } else if (error.message?.includes('404')) {
          errorMsg =
            'AI につながりませんでした（404）。続くときは、設定タブの「お問い合わせ」から知らせてください。';
        } else if (error.message?.includes('403')) {
          errorMsg = 'この出どころからは AI 機能を使えません。';
        } else if (error.message?.includes('401') || error.message?.includes('ログインしていない')) {
          errorMsg = 'ログインの証が確かめられませんでした。ログインし直してからもう一度送信してください。';
        } else if (流れが切れたか(error)) {
          errorMsg = '通信が途中で切れました。電波の良い場所でもう一度送信してください。';
        } else if (一時の誤りか) {
          errorMsg = 'AI の返事が届きませんでした。少し待ってからもう一度送信してください。';
        } else if (状態番号 === 400) {
          errorMsg =
            '送った内容を AI が受け付けませんでした。もう一度送信してください。続くときは、チャットを閉じて開き直してください。';
        } else {
          // 英語の原文は出さない（読めないうえ、どうすればよいか分からない）。原文は記録と便りに残す
          errorMsg = `AI からの返事を受け取れませんでした${状態番号 ? `（${状態番号}）` : ''}。もう一度送信してください。`;
        }
        setMessages([...newMessages, { id: generateMsgId(), role: 'model', text: errorMsg }]);
        改善のために({
          答え: errorMsg,
          結果: '失敗',
          誤り: String((error && error.message) || error).slice(0, 300),
        });
        break;
      }
    } // end while

    setIsLoading(false);
    setRetryCountdown(0);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const modalW = Math.min(0.9 * layoutWidth, 450);
  const modalH = Math.min(0.8 * layoutHeight, 600);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" onLayout={onLayout}>
      <Animated.View
        ref={案内のAIボタン}
        style={[
          styles.floatingButton,
          getShadowStyle({ shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }),
          { transform: pan.getTranslateTransform() },
        ]}
        {...panResponder.panHandlers}
        testID="AIを開く"
        accessibilityRole="button"
        accessibilityLabel="AIアシスタントを開く"
        aria-label="AIアシスタントを開く"
      >
        {/* 絵（48×42px）は丸いボタン（60px）にいっぱいに近い。袴の裾（左下）が縁に付かないよう、1.5px 右へ寄せる。
            倍率で縮めると、マスの継ぎ目に細い線が出て顔が割れて見えるので、整数のマスのまま置く */}
        <View style={{ marginLeft: 3 }}>
          <AIMascot マス={3} 動く 考え中={isLoading} />
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>AI</Text>
        </View>
      </Animated.View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView behavior="height" style={styles.modalOverlay}>
          <View
            style={[
              styles.chatContainer,
              { width: modalW, height: modalH },
              getShadowStyle({ shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 }),
            ]}
          >
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <AIMascot マス={2} {...明るい地のキャラ} 動く />
                <Text style={styles.headerTitle}>AIアシスタント</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    setMessages(defaultMessages);
                    saveChatHistory(defaultMessages, 保存の鍵);
                  }}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="会話履歴を消去"
                  aria-label="会話履歴を消去"
                  style={{ padding: 4 }}
                >
                  <Ionicons name="trash-outline" size={20} color={色.灰} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="閉じる"
                  aria-label="閉じる"
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={24} color={色.灰} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.messageArea}
              contentContainerStyle={{ padding: 16 }}
              scrollEventThrottle={100}
              onScroll={({ nativeEvent: { contentOffset, contentSize, layoutMeasurement } }) => {
                末尾の近く.current = contentSize.height - (contentOffset.y + layoutMeasurement.height) < 80;
              }}
              onContentSizeChange={() => {
                // まだ何も聞いていないときは送らない。送ると挨拶と質問例の
                // 見出しが上へ流れ、いきなり一覧の途中から始まる。
                // 上へ戻って読み返しているときも送らない。流し読み中は文字が来るたびに
                // ここが呼ばれるので、動きも付けない（付けると動きが積み重なる）
                if (messages.length > 1 && 末尾の近く.current)
                  scrollViewRef.current?.scrollToEnd({ animated: false });
              }}
            >
              {messages.map((msg, idx) =>
                msg.role === 'actionCard' ? (
                  <View
                    key={msg.id || idx}
                    style={[styles.messageBubble, styles.modelBubble, { minWidth: 200 }]}
                  >
                    <Text style={[styles.modelText, { fontWeight: 'bold', marginBottom: 8 }]}>
                      データの追加提案
                    </Text>
                    <Text style={styles.modelText}>
                      名前: {msg.args.name}
                      {'\n'}
                      学年: {学.学年の値の名前(msg.args.grade)}
                      {'\n'}
                      性別: {学.性別の名前(性別にそろえる(msg.args.gender))}
                    </Text>
                    {msg.status === 'pending' ? (
                      <View
                        style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}
                      >
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: 色.赤 }]}
                          onPress={() => handleActionResponse(msg.id, false)}
                        >
                          <Text style={styles.actionBtnText}>キャンセル</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: 色.緑 }]}
                          onPress={() => handleActionResponse(msg.id, true)}
                        >
                          <Text style={styles.actionBtnText}>承認</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ marginTop: 12 }}>
                        <Text
                          style={[
                            styles.modelText,
                            {
                              color: msg.status === 'approved' ? 色.緑 : 色.赤,
                              fontWeight: 'bold',
                              textAlign: 'right',
                            },
                          ]}
                        >
                          {msg.status === 'approved' ? '✓ 承認済み' : 'キャンセル済み'}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View key={msg.id || idx} style={msg.role === 'user' ? undefined : styles.答えの行}>
                    {msg.role !== 'user' && (
                      <View style={styles.答えの絵}>
                        <AIMascot マス={2} {...明るい地のキャラ} />
                      </View>
                    )}
                    <View
                      style={[
                        styles.messageBubble,
                        msg.role === 'user' ? styles.userBubble : [styles.modelBubble, styles.答えの吹き出し],
                      ]}
                    >
                      <Text
                        style={[styles.messageText, msg.role === 'user' ? styles.userText : styles.modelText]}
                      >
                        {msg.text}
                      </Text>
                    </View>
                  </View>
                )
              )}
              {/*
                まだ一度も聞いていないときだけ、質問例を出す。
                話し始めたあとも出し続けると、会話の流れを遮る
              */}
              {messages.length <= 1 && !isLoading && (
                <View style={styles.例の枠}>
                  <Text style={styles.例の前置き}>こんなことが聞けます</Text>
                  {/*
                    分類ごとに1行。その行を横へ流して選ぶ。
                    縦に全部並べると、初めて開いたときに11行が挨拶を押し出す。
                    文は折り返して2行まで出す。1行で切ると、長い例
                    （「2026年8月いちばん練習に来ているのは誰？」）の末尾が
                    見えず、何を聞けるのかが伝わらない
                  */}
                  {分類たち.map((束) => (
                    <View key={束.分類} style={styles.例の段}>
                      <Text style={styles.例の分類}>{束.分類}</Text>
                      <横に流せる行 style={styles.例の並び}>
                        {束.文たち.map((文) => (
                          <TouchableOpacity
                            key={文}
                            style={styles.例の行}
                            onPress={() => setInputText(文)}
                            disabled={isLoading}
                            accessibilityRole="button"
                            accessibilityLabel={`${束.分類}の質問例：${文}`}
                            aria-label={`${束.分類}の質問例：${文}`}
                          >
                            <Text style={styles.例の字} numberOfLines={1}>
                              {文}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </横に流せる行>
                    </View>
                  ))}
                  <Text style={styles.例の断り}>
                    押すと入力欄に入ります。直してから送れます。
                    横に流すと続きがあります（パソコンは、上に乗せてホイールを回してください）。
                  </Text>
                </View>
              )}
              {isLoading && (
                <View
                  style={[
                    styles.messageBubble,
                    styles.modelBubble,
                    { flexDirection: 'row', alignItems: 'center' },
                  ]}
                >
                  <View style={{ marginRight: 10, marginTop: 4 }}>
                    <AIMascot マス={2} {...明るい地のキャラ} 考え中 />
                  </View>
                  <Text style={styles.modelText}>
                    {retryCountdown > 0
                      ? `少し待っています... ${retryCountdown}秒後にもう一度送ります`
                      : '考え中...'}
                  </Text>
                </View>
              )}
            </ScrollView>

            {待っているカードの数 >= 2 && (
              <View style={styles.まとめて承認の段} testID="chat-bulk-approve">
                <Text style={styles.まとめて承認の文}>{待っているカードの数}件の追加が待っています</Text>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: 色.赤 }]}
                  onPress={() => handleAllPending(false)}
                >
                  <Text style={styles.actionBtnText}>すべてキャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: 色.緑 }]}
                  onPress={() => handleAllPending(true)}
                >
                  <Text style={styles.actionBtnText}>すべて承認</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputArea}>
              {/*
                打ちかけの続きを、入力欄の中に薄く重ねて見せる。
                一覧を上に出すと会話が押し上げられて落ち着かないので、
                打っている場所にそのまま出す。押すか Tab で取り込める
              */}
              <View style={styles.入力の枠}>
                {続きの候補 ? (
                  <View style={styles.続きの層} pointerEvents="none">
                    <Text style={styles.続きの字} numberOfLines={1}>
                      <Text style={{ color: 'transparent' }}>{inputText}</Text>
                      {続きの候補.slice(inputText.length)}
                    </Text>
                  </View>
                ) : null}
                <TextInput
                  aria-label="AIへの質問"
                  style={styles.input}
                  onKeyPress={(出来事) => {
                    // Tab か → で続きを取り込む（Claude Code と同じ操作）
                    const 鍵 = 出来事.nativeEvent?.key;
                    if (続きの候補 && (鍵 === 'Tab' || 鍵 === 'ArrowRight')) {
                      if (出来事.preventDefault) {
                        出来事.preventDefault();
                      }
                      setInputText(続きの候補);
                    }
                  }}
                  placeholder="メッセージを入力..."
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                />
              </View>
              <TouchableOpacity
                style={[styles.sendBtn, (!inputText.trim() || isLoading) && { opacity: 0.5 }]}
                testID="AIに送る"
                accessibilityLabel="送信"
                onPress={handleSend}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons name="send" size={20} color={色.白} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

exports.AIChatBot = AIChatBot;
