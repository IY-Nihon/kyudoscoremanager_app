'use strict';

Object.defineProperty(exports, '__esModule', { value: true });
exports.AIChatBot = undefined;

const React = require('react');
const { useState, useRef, useEffect } = React;
const { Text, StyleSheet, TextInput, View, TouchableOpacity, Modal, ScrollView, KeyboardAvoidingView, Dimensions, Animated, PanResponder, Platform } = require('./rn');

const { Ionicons } = require('@expo/vector-icons');
const { AIMascot } = require('./AIMascot');
const IS_WEB = Platform.OS === 'web';

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
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { useScoreStore } = require('./useScoreStore');
const { useストアの一部 } = require('./storeSlice');
const { useNavigation } = require('@react-navigation/native');
// 鍵はアプリに無い。中継（Cloudflare Workers）へログインの証を付けて呼ぶ
const 中継 = require('./geminiChukei');

/**
 * 流し読みが途中で切れた誤りか。返事の途中で回線が切れる・中継や上流が流れを閉じると、
 * SDK は「Failed to parse stream」を投げる（2026-09-24 に本番の便りで 2 通）。上限（429）・
 * 混雑（503）・証（401）などの誤りはここに入れない（別に扱う）
 */
/**
 * Gemini の SDK の誤りから、状態番号（400・503 など）を取り出す。無ければ 0。
 * SDK の誤りは status を持つことがあり、無いときは文の「[503 Service Unavailable]」から読む
 */
const 誤りの状態番号 = (誤り) => {
  if (誤り && Number.isInteger(誤り.status)) return 誤り.status;
  const 合う = String((誤り && 誤り.message) || '').match(/\[(\d{3})[ \]]/);
  return 合う ? Number(合う[1]) : 0;
};
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
  期間にする,
  日付の始まり,
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


const generateMsgId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
const CHAT_HISTORY_KEY = 'aiChatMessages_v1';
const MAX_SAVED_MESSAGES = 50;
const BUTTON_POS_KEY = 'aiButtonPos_v1';

// キャラクターを明るい地（見出し・吹き出し）に置くときの色。体が白だと地に溶けるので青にし、
// 弦は濃い灰色、道着の襟は白にする（浮くボタンの上は、白い体の既定のまま）
const 明るい地のキャラ = { 体: '#007AFF', 弦: '#8E8E93', 襟: '#FFFFFF', 道着: '#7DBBFF' };

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
  } catch (誤り) {
    /* 読めなければ、右下から始める */
  }
  return null;
};

const saveButtonPos = (pos) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(BUTTON_POS_KEY, JSON.stringify(pos));
    }
  } catch (誤り) {
    /* 覚えられなくても、この場では動く。次回また右下に戻るだけ */
  }
};

/**
 * 会話の控えの置き場。団体はこれまでどおり。個人は本人ごとに分ける（同じ端末で別の人が入っても見えない）。
 * 本人がまだ分からない個人（読み込み中）には、団体の会話を読ませない
 */
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
  } catch (誤り) {
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
  } catch (誤り) {
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
  } = useストアの一部(['activeRole', 'members', 'sessions', 'currentRouteName', 'myMemberId', 'myMemberName']);
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
  const [modalVisible, setModalVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  // 質問例は、分類ごとに全部出すようになった（下の 分類たち）。
  // 「分類ごとに1件だけ」を選ぶ 質問例() は、打ちかけの続きにも使わないので
  // ここでは呼ばない（chatSuggestions 側には残してある）。
  // 打ちかけの続きは、画面に出していない例からも探す
  const 候補の元 = React.useMemo(
    () => 質問例のすべて({ 人たち: members, 記録たち: sessions, いま: new Date(), 個人 }),
    [members, sessions, 個人]
  );
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
    // もとは 例たち を見ていたが、中で使っているのは 候補の元。
    // 食い違っていたので直した（どちらも同じときに変わるので害は無かった）
  }, [inputText, 候補の元]);
  const defaultMessages = [
    {
      id: 'default-msg',
      role: 'model',
      text: 個人
        ? 個人用.個人の挨拶
        : 'こんにちは！弓道部的中ノートのAIアシスタントです。選手選びの相談や、的中傾向の分析、アプリの使い方など、何でも聞いてください。',
    },
  ];
  const [messages, setMessages] = useState(() => loadChatHistory(保存の鍵) || defaultMessages);
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
  const savedButtonPos = loadButtonPos();
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
          } catch (誤り) {
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
    // 性別の値をアプリの定義（男子・女子・未設定）にマッピング変換
    let finalGender = '未設定';
    if (gender === 'male' || gender === '男子') {
      finalGender = '男子';
    } else if (gender === 'female' || gender === '女子') {
      finalGender = '女子';
    }
    // 部員の追加は団体ログインのときだけ通る（ストア側で止めている）。
    // 確かめずに「追加しました」と出していたため、個人で入っている人には
    // 権限エラーの帯と「追加しました」が同時に出ていた
    if (activeRole !== 'group') return null;
    addMember(name, finalGender, Number(grade) || 1);
    return name;
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
            ? `${名}さんをメンバーに追加しました。`
            : 'メンバーの追加は団体ログインのときだけできます。追加していません。',
        });
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
          : `${追加した.length}人をメンバーに追加しました：${追加した.join('、')}`,
    });
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
    const 改善のために = (中身) => {
      require('./improvementLog').改善のために取っておく(
        'チャット',
        Object.assign({ 質問: userMsg, 道具: 使った道具, 模型: 'gemini-3.6-flash' }, 中身)
      );
    };

    while (attempt <= MAX_RETRY) {
      try {
        // 部員一覧のみ渡す（トークン節約）。詳細成績はgetDetailedMemberStatsで取得
        const memberList = members
          .map((member) => {
            const gradeLabel = member.grade >= 5 ? '卒業生' : member.grade === 0 ? 'その他' : `${member.grade}年`;
            return `${member.name}(${gradeLabel})`;
          })
          .join(', ');

        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        const relevantQA = selectQAs(userMsg, 個人);
        const qaSection = relevantQA ? `\n\n【アプリ操作・仕様Q&A（関連する項目のみ）】\n${relevantQA}` : '';
        // 基本の指示（systemInstructionBase）に、その日・その団体でしか
        // 決まらないものだけを足す。決まりごとを二重に書くと、食い違ったときに
        // どちらが効いているか分からなくなる
        const fullInstruction =
          (個人 ? 個人用.個人用の指示文(systemInstructionBase, members[0]) : systemInstructionBase) +
          qaSection +
          `\n\n[今日の日付: ${todayStr} / 昨日: ${yesterdayStr}]` +
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
          if ('count' === 設定.type) return Math.max(1, Number(設定.value) || 0);
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
                ...(絞り.当たった件数 === 0 ? { 使えるタグ: 絞り.使えるタグ } : { 当たったタグ: 絞り.当たったタグ }),
              }
            : null;
          const 添え書き = 絞り.絞った
            ? 絞り.当たった件数 === 0
              ? 'そのタグが付いた記録はありません。使えるタグの中から選び直すか、その旨を伝えてください。'
              : `タグ「${絞り.タグ.join('」「')}」に当たる記録 ${絞り.当たった件数} 件だけで集計しています（当たったタグ：${絞り.当たったタグ.join('・')}）。「タグで絞った数字」であることと、どのタグで数えたかを答えに添えてください。`
            : '';
          return { 記録たち: 絞り.記録たち, 表示, 添え書き };
        };

        // Function Calling の宣言
        const tools = [
          {
            functionDeclarations: [
              {
                name: 'getAllMembersStats',
                description:
                  '全部員の成績を集計し、順位を付けて返します。「全員の5月の的中率を教えて」「部員のランキングを見せて」「一番当てているのは誰」などに使います。順位付け・並べ替え・絞り込みはこのツールが行うので、返ってきた順番と数字をそのまま使ってください。自分で並べ替えたり足し算したりしないでください。',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    dateFrom: {
                      type: 'STRING',
                      description: "集計対象期間の開始日 (YYYY-MM-DD形式)。例: '2026-05-01'",
                    },
                    dateTo: {
                      type: 'STRING',
                      description: "集計対象期間の終了日 (YYYY-MM-DD形式)。例: '2026-05-31'",
                    },
                    sortBy: {
                      type: 'STRING',
                      description: "並び順。'的中率'（既定）, '的中数', '射数', '名前' のいずれか",
                    },
                    limit: {
                      type: 'INTEGER',
                      description: '上位何人を返すか。「トップ3」なら3。省略すると全員',
                    },
                    minShots: {
                      type: 'INTEGER',
                      description:
                        'この射数に満たない人を順位から外す。既定は1。少ない射数の高い的中率を上位に出したくないときは10〜20を指定する',
                    },
                    tags: {
                      type: 'ARRAY',
                      items: { type: 'STRING' },
                      description:
                        "タグで記録を絞り込む。例: ['自主稽古']。「自主練の的中率」「試合だけの成績」のように、タグで分けて聞かれたときに渡す。記録のタグの名前に含まれる言葉で当たる（# は付けても付けなくてもよい）。複数渡すと、すべてのタグが付いた記録だけ。タグの名前が分からないときは、先に何も渡さず呼ぶか、searchSessions で記録の目印を確かめる",
                    },
                  },
                },
              },
              {
                name: 'getAttendanceStats',
                description:
                  '部員の出欠を集計し、順位を付けて返します。「今月いちばん練習に来ているのは誰」「◯◯さんの出席率は」「休みが多いのは誰」などに使います。出欠画面と同じ数え方（正規練習日ごとに、記録に出ていれば来た、無ければ欠席。出席率＝来た日数÷今日までの練習日数）です。遅刻・早退は「来た」に数えます。順位・並べ替えはこのツールが行うので、返った順番と数字をそのまま使ってください。',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    dateFrom: { type: 'STRING', description: '集計対象期間の開始日 (YYYY-MM-DD形式)' },
                    dateTo: { type: 'STRING', description: '集計対象期間の終了日 (YYYY-MM-DD形式)' },
                    sortBy: {
                      type: 'STRING',
                      description: "並び順。'出席率'（既定）, '来た回数', '欠席', '名前' のいずれか",
                    },
                    limit: { type: 'INTEGER', description: '上位何人を返すか。省略すると全員' },
                  },
                },
              },
              {
                name: 'searchSessions',
                description:
                  '記録を言葉で探します。題・覚え書き・目印（タグ）・出ている人の名前を見ます。「雨で中断した練習はいつ」「審査のタグが付いた記録を見せて」「山田さんが出た記録」など、日付が分からないときに使います。日付が分かっているときは getSessionsByDate を使ってください。',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    keyword: { type: 'STRING', description: '探す言葉。空にすると期間内すべて' },
                    dateFrom: { type: 'STRING', description: '期間の開始日 (YYYY-MM-DD形式)' },
                    dateTo: { type: 'STRING', description: '期間の終了日 (YYYY-MM-DD形式)' },
                    limit: { type: 'INTEGER', description: '何件まで返すか。既定は20' },
                  },
                },
              },
              {
                name: 'countSessionParticipation',
                description:
                  '目印（タグ）や言葉で絞った記録に、部員が何回参加したかを人ごとに数えて、多い順に返します。「自主練が一番多いのは誰」「#審査の記録に出た回数」「合宿に何回参加したか」などに使います。出欠の集計（getAttendanceStats）とは別で、正規練習日ではなく、言葉で絞った記録を数えます。ゲストは数えません。',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    keyword: {
                      type: 'STRING',
                      description: "記録を絞る言葉。題・覚え書き・目印・出ている人の名前を見ます。例: '#自主稽古'、'合宿'",
                    },
                    dateFrom: { type: 'STRING', description: '期間の開始日 (YYYY-MM-DD形式)' },
                    dateTo: { type: 'STRING', description: '期間の終了日 (YYYY-MM-DD形式)' },
                    limit: { type: 'INTEGER', description: '上位何人を返すか。省略すると全員' },
                  },
                  required: ['keyword'],
                },
              },
              {
                name: 'getPositionStats',
                description:
                  '射位（大前・2番・落など）ごとの的中率を返します。立ち順を考えるときの材料です。「大前に向いているのは誰」「落で強いのは」「山田さんは大前と落でどちらが良い」などに使います。誰をどこに置くかはこのツールでは決めません。返した数字をもとに、根拠を添えて提案してください。射数が少ない射位は数字が揺れるので、射数も一緒に伝えてください。',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    dateFrom: { type: 'STRING', description: '期間の開始日 (YYYY-MM-DD形式)' },
                    dateTo: { type: 'STRING', description: '期間の終了日 (YYYY-MM-DD形式)' },
                    memberNames: {
                      type: 'ARRAY',
                      items: { type: 'STRING' },
                      description: 'この人たちだけに絞る。省略すると全員',
                    },
                    minShots: { type: 'INTEGER', description: 'この射数に満たない人を外す。既定は1' },
                    tags: {
                      type: 'ARRAY',
                      items: { type: 'STRING' },
                      description:
                        "タグで記録を絞り込む。例: ['自主稽古']。「自主練の的中率」「試合だけの成績」のように、タグで分けて聞かれたときに渡す。記録のタグの名前に含まれる言葉で当たる（# は付けても付けなくてもよい）。複数渡すと、すべてのタグが付いた記録だけ。タグの名前が分からないときは、先に何も渡さず呼ぶか、searchSessions で記録の目印を確かめる",
                    },
                  },
                },
              },
              {
                name: 'getSessionsByDate',
                description:
                  '日付や期間を指定して練習記録を取得します。「昨日の記録」「今週の練習」「5月の記録」「直近3回」などの質問に使います。dateとdateFrom/dateToとrecentCountはいずれか一つを指定してください。',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    date: {
                      type: 'STRING',
                      description: "特定の1日を指定する場合のYYYY-MM-DD形式の日付。例: '2026-05-23'",
                    },
                    dateFrom: { type: 'STRING', description: '期間指定の開始日 (YYYY-MM-DD形式)' },
                    dateTo: { type: 'STRING', description: '期間指定の終了日 (YYYY-MM-DD形式)' },
                    recentCount: {
                      type: 'INTEGER',
                      description: '直近N件取得する場合の件数。例: 3 → 直近3回分',
                    },
                  },
                },
              },
              {
                name: 'getDetailedMemberStats',
                description:
                  '指定した選手の詳細な成績データを取得します。初矢から4本目（留矢）まで何本目の矢が当たりやすいか、また大前や落など立順ごとの成績などを分析する際に呼び出してください。「9月の」「今年度の」のように期間が付いていれば dateFrom / dateTo を渡してください（省くと全期間）。',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    memberName: { type: 'STRING', description: '選手の名前' },
                    dateFrom: { type: 'STRING', description: '期間の開始日 (YYYY-MM-DD形式)。省くと全期間' },
                    dateTo: { type: 'STRING', description: '期間の終了日 (YYYY-MM-DD形式)。省くと全期間' },
                    tags: {
                      type: 'ARRAY',
                      items: { type: 'STRING' },
                      description:
                        "タグで記録を絞り込む。例: ['自主稽古']。「自主練の的中率」「試合だけの成績」のように、タグで分けて聞かれたときに渡す。記録のタグの名前に含まれる言葉で当たる（# は付けても付けなくてもよい）。複数渡すと、すべてのタグが付いた記録だけ。タグの名前が分からないときは、先に何も渡さず呼ぶか、searchSessions で記録の目印を確かめる",
                    },
                  },
                  required: ['memberName'],
                },
              },
              {
                name: 'navigateToScreen',
                description: '指定した画面タブへ遷移します。',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    screenName: {
                      type: 'STRING',
                      description: '遷移先の画面名（記録, 履歴, 分析, メンバー, 出欠, 設定 のいずれか）',
                    },
                  },
                  required: ['screenName'],
                },
              },
              {
                name: 'addMember',
                description:
                  '新しい部員を1人追加します。追加する前にユーザーへの確認が行われます。2人以上は addMembers を使ってください。',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    name: { type: 'STRING', description: '追加する部員の名前' },
                    grade: { type: 'INTEGER', description: '学年（1〜4など）' },
                    gender: { type: 'STRING', description: "性別（'male', 'female', '未設定' のいずれか）" },
                  },
                  required: ['name', 'grade', 'gender'],
                },
              },
              {
                name: 'addMembers',
                description:
                  '新しい部員を2人以上まとめて追加します。人ごとに確認のカードが出て、利用者がまとめて承認できます。「山田と佐藤を追加して」「1年生を3人登録して」のように複数人を頼まれたときは、addMember を何度も呼ばず、必ずこちらを1回だけ呼んでください。',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    members: {
                      type: 'ARRAY',
                      description: '追加する部員の一覧',
                      items: {
                        type: 'OBJECT',
                        properties: {
                          name: { type: 'STRING', description: '名前' },
                          grade: { type: 'INTEGER', description: '学年（1〜4など）' },
                          gender: {
                            type: 'STRING',
                            description: "性別（'male', 'female', '未設定' のいずれか）",
                          },
                        },
                        required: ['name', 'grade', 'gender'],
                      },
                    },
                  },
                  required: ['members'],
                },
              },
            ],
          },
        ];
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
          try {
            返り = await model.generateContentStream({ contents: 会話 });
            // 流れが途中で切れると、返事全体の約束（response）も失敗する。ここで受け止めないと
            // 誰も待っていない約束の失敗として便りに届く（本番で 2 通）。失敗そのものは
            // 下の for await が投げるので、そちらで扱う
            返り.response.catch(() => {});
            await 流しながら出す(返り, 模型の部品);
          } catch (誤り) {
            if (!流れが切れたか(誤り)) throw 誤り;
            // 流し読みが途中で切れたら、流さずに 1 回だけ送り直す。途中まで出した文は、
            // 確定した答えで置き換わる（最後の setMessages）
            console.warn('[AIChatBot] 流し読みが切れたので、流さずに送り直します', 誤り && 誤り.message);
            模型の部品.length = 0;
            途中の文 = '';
            const 全部 = await model.generateContent({ contents: 会話 });
            const 部品 =
              (全部.response.candidates &&
                全部.response.candidates[0] &&
                全部.response.candidates[0].content &&
                全部.response.candidates[0].content.parts) ||
              [];
            for (const 一つ of 部品) 模型の部品.push(一つ);
            if (模型の部品.length) 会話.push({ role: 'model', parts: 模型の部品 });
            呼ばれた道具 = 道具の呼び出しを取る(模型の部品);
            返事の文 = 文を取る(模型の部品);
            return { response: Promise.resolve(全部.response) };
          }
          if (模型の部品.length) 会話.push({ role: 'model', parts: 模型の部品 });
          呼ばれた道具 = 道具の呼び出しを取る(模型の部品);
          返事の文 = 文を取る(模型の部品);
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
            } catch (誤り) {
              文 = ''; // 道具の呼び出しだけのかけらは文字を持たない
            }
            if (!文) continue;
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

            if (call.name === 'getAllMembersStats') {
              const { dateFrom, dateTo, sortBy, limit, minShots } = call.args;

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
              const 結果 = 全員の成績(members, タグ絞り.記録たち, {
                期間,
                並び: sortBy,
                件数: limit,
                最小射数,
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
                    ...(タグ絞り.表示 ? { タグでの絞り込み: タグ絞り.表示 } : {}),
                    message:
                      タグ絞り.添え書き +
                      (Number.isFinite(minShots)
                        ? `${最小射数} 射に満たない人は順位から外しました。`
                        : 最小射数 > 1
                          ? `分析画面のランキングと同じ基準で、${最小射数} 射に満たない人は順位から外しました（外した人数は 射数が足りず外した人数）。`
                          : '') +
                      '順位・並べ替え・絞り込みは集計済みです。返した順番と数字をそのまま使い、' +
                      '自分で並べ替えたり計算したりしないでください。的中率は百分率です。',
                  },
                },
              });
            } else if (call.name === 'getAttendanceStats') {
              const { dateFrom, dateTo, sortBy, limit } = call.args;
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
              });
              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: Object.assign({}, 結果, {
                    message:
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
              const 結果 = 射位ごとの成績(members, タグ絞り.記録たち, {
                期間: 期間にする(dateFrom, dateTo),
                名前たち: memberNames,
                最小射数: minShots,
              });
              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: Object.assign({}, 結果, タグ絞り.表示 ? { タグでの絞り込み: タグ絞り.表示 } : {}, {
                    message:
                      タグ絞り.添え書き +
                      '射位ごとの的中率です。射数の少ない射位は数字が揺れるので、率だけでなく射数も添えて伝えてください。' +
                      '誰をどこに置くかは決めていません。数字を根拠に提案してください。',
                  }),
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
                    ? Object.assign({}, statsData, { タグでの絞り込み: タグ絞り.表示, message: タグ絞り.添え書き })
                    : statsData,
                },
              });
            } else if (call.name === 'getSessionsByDate') {
              const { date, dateFrom, dateTo, recentCount } = call.args;

              // 記録が無い・壊れているものを先に外す。archers が無い記録が1件でも
              // 混ざると、この道具ごと落ちて「エラー」しか返せなくなる
              let filtered = sessions
                .filter((記録) => 記録 && Array.isArray(記録.archers))
                .sort((甲, 乙) => (乙.date || 0) - (甲.date || 0));

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

              // 上限を置く。引数なしで呼ばれると全記録を人ごとの内訳付きで返し、
              // 返す量が膨れて遅くなるうえ、模型が読み切れず数字を取り違える
              const 上限 = 30;
              const 当たった件数 = filtered.length;
              filtered = filtered.slice(0, 上限);

              const sessionData = filtered.map((記録) => {
                const 日付 = new Date(記録.date || 0);
                const dateStr = `${日付.getFullYear()}/${日付.getMonth() + 1}/${日付.getDate()}`;
                const allMarks = 記録.archers.flatMap((射手) => 射手.marks || []);
                const total = allMarks.filter((印) => 印 === '○' || 印 === '×').length;
                const hits = allMarks.filter((印) => 印 === '○').length;
                const hitRate = total > 0 ? ((hits / total) * 100).toFixed(1) + '%' : 'データなし';
                const memberStatsMap = new Map(); // メンバーごとの集計マップ
                記録.archers.forEach((射手) => {
                  if (!射手 || !射手.marks) return;
                  const subs = 射手.substitutions || {};
                  const subIndices = Object.keys(subs)
                    .map(Number)
                    .sort((甲, 乙) => 甲 - 乙);

                  射手.marks.forEach((印, shotIdx) => {
                    let currentName = 射手.name || 'ゲスト';
                    for (const subIdx of subIndices) {
                      if (subIdx <= shotIdx) {
                        currentName = subs[subIdx] || '';
                      } else {
                        break;
                      }
                    }
                    currentName = currentName.trim();
                    if (!currentName) currentName = 'ゲスト';

                    if (!memberStatsMap.has(currentName)) {
                      memberStatsMap.set(currentName, { marks: [], hits: 0, total: 0 });
                    }
                    const stat = memberStatsMap.get(currentName);
                    stat.marks.push(印);
                    if (印 === '○') {
                      stat.hits++;
                      stat.total++;
                    } else if (印 === '×') {
                      stat.total++;
                    }
                  });
                });

                const archerList = Array.from(memberStatsMap.entries())
                  // 個人ログインでは、交代の相手（他の人）の分は空にしてあるので、載せない
                  .filter(([name]) => !(個人 && name === 他の人))
                  .map(([name, stat]) => {
                    return `${name}:${stat.marks.join('')}(${stat.hits}/${stat.total})`;
                  })
                  .join(', ');
                return {
                  date: dateStr,
                  title: 記録.title || '無題',
                  hitRate,
                  totalArrows: total,
                  archers: archerList,
                };
              });

              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: {
                    count: sessionData.length,
                    当たった件数,
                    返していない件数: Math.max(0, 当たった件数 - sessionData.length),
                    sessions: sessionData,
                    message:
                      sessionData.length === 0
                        ? '該当する記録が見つかりませんでした。'
                        : 当たった件数 > sessionData.length
                          ? `${当たった件数}件のうち、新しい順に${sessionData.length}件だけ返しました。全部を数えたいときは getAllMembersStats を期間付きで使ってください。返していない記録があることを利用者に伝えてください。`
                          : `${sessionData.length}件の記録を取得しました。`,
                  },
                },
              });
            } else if (call.name === 'navigateToScreen') {
              // 個人（部員）で入っているときは、メンバーと設定の画面が無い。
              // 何を渡しても success を返していたため、移動していないのに
              // 「移動しました」と答えていた
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

        // 答えの文が空で、止められたのでもないとき（空の返事が来ることがある。2026-10-02 に本番で 1 回）は、
        // 同じ内容で 1 回だけ送り直す。使う人に「もう一度お試しください」と押させない。
        // 空の返事は会話に積んでいないので、会話の最後は送ったもの。送り直しがまた道具を呼んだときは動かさない
        const 止められた = (返り) => {
          const 候補 = 返り && 返り.candidates && 返り.candidates[0];
          return !!(候補 && /SAFETY|PROHIBITED|BLOCKLIST|SPII|RECITATION/i.test(String(候補.finishReason || '')));
        };
        if (!返事の文.trim() && !(呼ばれた道具 && 呼ばれた道具.length) && !止められた(response) && 最後に送った中身 && 会話.length && 会話[会話.length - 1].role === 'user') {
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
          const 待つ秒 = 10;
          let 残り = 待つ秒;
          setRetryCountdown(残り);
          const 時計 = setInterval(() => {
            残り--;
            setRetryCountdown((前) => Math.max(0, 前 - 1));
            if (残り <= 0) clearInterval(時計);
          }, 1000);
          await new Promise((解く) => setTimeout(解く, 待つ秒 * 1000));
          clearInterval(時計);
          setRetryCountdown(0);
          attempt++;
          continue;
        }

        if (isPerMinute && attempt < MAX_RETRY) {
          // 1分クォータ超過 → カウントダウン後に自動リトライ
          const match = error.message.match(/"retryDelay":"(\d+)s"/);
          const waitSec = match ? parseInt(match[1]) + 2 : 35;
          let remaining = waitSec;
          setRetryCountdown(remaining);
          const timer = setInterval(() => {
            remaining--;
            setRetryCountdown((prev) => Math.max(0, prev - 1));
            if (remaining <= 0) clearInterval(timer);
          }, 1000);
          await new Promise((resolve) => setTimeout(resolve, waitSec * 1000));
          clearInterval(timer);
          setRetryCountdown(0);
          attempt++;
          continue;
        }

        console.error('AIChatBot Send Error:', error);
        // 画面で受け止めた誤りも、種類だけを便りに送る（質問や答えの中身は送らない。
        // 誤りの文言だけ）。送らないと、使う人に何が多く出ているのか運用側から見えない
        try {
          require('./errorReporter').不具合を送る('AIチャット', error);
        } catch (便りの誤り) {
          // 便りの仕組みが転んでも、チャットの知らせは出す
        }
        let errorMsg = '通信エラーが発生しました。';
        if (error.message?.includes('503')) {
          errorMsg = 'ただいまAIが混み合っています。しばらく待ってからもう一度送信してください。';
        } else if (is429) {
          if (isPerDay) {
            errorMsg = '本日のAI利用上限に達しました。明日0時以降に再度お試しください。';
          } else {
            errorMsg = 'AIの利用制限（クォータ）に達しました。しばらく時間をおいてから再度お試しください。';
          }
        } else if (error.message?.includes('404')) {
          errorMsg = 'AIモデルが見つかりません。API設定を確認してください。';
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
        transparent={true}
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
                    saveChatHistory(defaultMessages);
                  }}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="trash-outline" size={20} color="#8E8E93" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#8E8E93" />
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
                  <View key={idx} style={[styles.messageBubble, styles.modelBubble, { minWidth: 200 }]}>
                    <Text style={[styles.modelText, { fontWeight: 'bold', marginBottom: 8 }]}>
                      データの追加提案
                    </Text>
                    <Text style={styles.modelText}>
                      名前: {msg.args.name}
                      {'\n'}
                      学年: {msg.args.grade}年{'\n'}
                      性別:{' '}
                      {msg.args.gender === 'male'
                        ? '男性'
                        : msg.args.gender === 'female'
                          ? '女性'
                          : msg.args.gender}
                    </Text>
                    {msg.status === 'pending' ? (
                      <View
                        style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}
                      >
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#FF3B30' }]}
                          onPress={() => handleActionResponse(msg.id, false)}
                        >
                          <Text style={styles.actionBtnText}>キャンセル</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#34C759' }]}
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
                              color: msg.status === 'approved' ? '#34C759' : '#FF3B30',
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
                  <View
                    key={idx}
                    style={msg.role === 'user' ? undefined : styles.答えの行}
                  >
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
                    {retryCountdown > 0 ? `制限中... ${retryCountdown}秒後に再試行します` : '考え中...'}
                  </Text>
                </View>
              )}
            </ScrollView>

            {待っているカードの数 >= 2 && (
              <View style={styles.まとめて承認の段} testID="chat-bulk-approve">
                <Text style={styles.まとめて承認の文}>{待っているカードの数}件の追加が待っています</Text>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#FF3B30' }]}
                  onPress={() => handleAllPending(false)}
                >
                  <Text style={styles.actionBtnText}>すべてキャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#34C759' }]}
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
                      出来事.preventDefault && 出来事.preventDefault();
                      setInputText(続きの候補);
                    }
                  }}
                  placeholder="メッセージを入力..."
                  value={inputText}
                  onChangeText={setInputText}
                  multiline={true}
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
                <Ionicons name="send" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

exports.AIChatBot = AIChatBot;

