"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.AIChatBot = void 0;

const React = require("react");
const { useState, useRef, useEffect } = React;
const RN = require("react-native");
const _View = RN.View;
const _Text = RN.Text;
const _StyleSheet = RN.StyleSheet;
const _TouchableOpacity = RN.TouchableOpacity;
const _Modal = RN.Modal;
const _TextInput = RN.TextInput;
const _ScrollView = RN.ScrollView;
const _ActivityIndicator = RN.ActivityIndicator;
const _KeyboardAvoidingView = RN.KeyboardAvoidingView;
const _Dimensions = RN.Dimensions;

const { Ionicons } = require("./AntDesign_600");
const { GoogleGenerativeAI } = require("./h_1035");
const { useScoreStore } = require("./JP_useScoreStore_174");
const { useNavigation } = require("@react-navigation/native");
const { GEMINI_API_KEY } = require("./IS_WEB_199");
const { getShadowStyle } = require("./module_592");
const { jsx, jsxs, Fragment } = require("./module_427");

// --- システムプロンプト（動的Q&A注入方式） ---

const systemInstructionBase = `あなたは「Kyudo Score Manager」専用の、弓道データ分析およびアプリ操作サポートを行うAIアシスタントです。
ユーザーは部活動の管理者です。以下の2つの役割を遂行してください：

1. [データ分析] 提供された部員データに基づき、選手選考のアドバイスや的中傾向の分析を弓道用語を交えて行ってください。
2. [アプリサポート] アプリの仕様に関する質問には以下の【アプリ操作・仕様Q&A】を「絶対的な真実」として答えてください。
3. [Web検索] 弓道のルールや一般知識など、アプリの仕様外の質問に対しては、Google検索ツールを積極的に活用して最新情報を回答してください。
【※超重要※】アプリの操作や仕様について回答する際は、必ず以下のQ&Aの内容にのみ基づいて回答してください。「三本線のメニュー」など一般的なアプリの仕様を勝手に推測・創作（ハルシネーション）して答えることは固く禁じます。

【弓道用語の正確な表現と読み仮名に関する厳重指示】
・以下の弓道用語を出力する際、または読み仮名やルビをふる場合は、誤った読み方（「おまえ」「にまと」「みさん」「らく」など）を決して使用せず、以下の正しい表記と読み方を使用してください：
  - 大前：おおまえ（「おまえ」は誤り）
  - 二的：にてき（「にまと」は誤り）
  - 三的：さんてき（「みさん」は誤り）
  - 中：なか
  - 落前：おちまえ
  - 落：おち（「らく」は誤り）
  - 留矢：とめや
  - 甲矢：はや
  - 乙矢：おとや
  - 皆中：かいちゅう
・立ち順（ポジション）の表現について：
  - 立ちの人数（1人〜多人数）に応じて、弓道で一般的に用いられる正しい立ち順の名称（大前（おおまえ）、二的（にてき）、三的（さんてき）、中（なか）、落前（おちまえ）、落（おち）など）を使い分けてください。
  - 「三的」は4人立ち以上で3番目の的やポジションを指す際に実在する用語ですので、人数構成に合わせて正しく使用してください。
  - 的の数や立ち順を表現する際、漢字の読み仮名を勝手に「にまと」「みさん」「おまえ」「らく」などと創作することは厳禁です。必ず正しい弓道の読み方に統一してください。

【Function Calling（ツール使用）に関する超重要指示】
・新しいメンバー（部員）を追加する場合は、絶対にテキストで「登録しました」などと先に回答しないでください。必ず \`addMember\` ツールを呼び出してください。ツールを呼び出すことで、画面上にユーザーが承認・キャンセルするための「認証ボタン（承認カード）」が表示されます。
・ツールを呼び出す際は、余計なテキスト出力（擬似コードや解説など）を同時に行わず、ツール呼び出し（Function Call）のみを行ってください。

【回答スタイルに関する重要指示】
・回答に「**」や「*」などのMarkdown記号を一切使用しないでください。
・強調したい場合は、記号ではなく言葉や適切な改行、または「」などの括弧を使ってください。
・箇条書きにする場合は「・」や「1.」などの一般的な全角記号を使用してください。`;


// Q&Aデータ（キーワード付き・動的注入用／文章は原文のまま）
const qaData = [
  { k: ['タブ','構成','使い方','機能'], t: 'Q0: アプリの上部にあるタブはそれぞれ何に使うの？\nA: それぞれ以下の機能があります。・【記録】今日の立ち（チーム）を作り、的中を入力します。・【履歴】過去のデータの確認や修正、削除を行います。・【分析】部全体の調子や、個人の詳細成績、ランキングを確認します。・【出欠管理】カレンダーで正規練習日を決め、出席率を確認します。・【メンバー】部員の追加や削除を行います。・【設定】CSVでの書き出しや自動進級設定等を行います。' },
  { k: ['入力','的中','矢','タップ','○','×','付け','つけ'], t: 'Q1: 的中記録はどうつける？\nA: 画面下部の「人」ボタンで射手を追加し、各矢の箇所をタップして○/×を入力します。' },
  { k: ['遅刻','早退','出欠','変更'], t: 'Q2: 遅刻や早退の記録は？\nA: 記録タブの「終了・保存」ボタンを押すと出欠確認画面が表示され、各メンバーの出欠状態（出席・遅刻・早退・欠席等）を選択できます。後から修正する場合は、管理者モードで履歴詳細を開き「≡」メニュー→「記録を編集」から変更できます。' },
  { k: ['正規','練習日','カレンダー','登録','予定'], t: 'Q3: 正規練習日の設定方法は？\nA: 出欠管理タブのカレンダーで日付をタップすると登録されます。カメラ（AI）で予定表をスキャンして自動入力することも可能です。' },
  { k: ['出席率','出欠率'], t: 'Q4: 出席率は確認できる？\nA: 出欠管理タブで、月間や年間の全体および個人の出席率を自動計算して表示します。' },
  { k: ['まとめて','一括','複数','出欠'], t: 'Q5: まとめて出欠を変更できる？\nA: 管理者モードをオンにした状態で履歴タブから記録をタップして詳細画面を開き、画面右上の「≡」（ハンバーガー）メニューから「記録を編集」を選ぶと各メンバーの出欠状態を変更できます。' },
  { k: ['人数','制限','立ち','何人'], t: 'Q6: 立ちの人数制限はある？\nA: 特に制限はありませんが、画面の表示幅に応じてスクロールになります。' },
  { k: ['卒業生','混在','一緒','現役'], t: 'Q7: 現役と卒業生は一緒に記録できる？\nA: メンバー選択画面で現役生と卒業生が分かれて表示され、混在して立ちを組めます。' },
  { k: ['初矢','一本目','最初'], t: 'Q8: 初矢だけ外した場合はわかる？\nA: 「×○○○」のように入力すれば自動で初矢失中として保存されます。' },
  { k: ['途中','参加','遅れ'], t: 'Q9: 途中から参加した人は？\nA: まずは射手として追加して記録をつけ、保存時に出欠を「遅刻」に設定します。' },
  { k: ['記録タブ','過去','今日'], t: 'Q10: 記録タブに過去のデータは出る？\nA: 記録タブは今日の入力用です。過去のデータは履歴タブを見ます。' },
  { k: ['修正','直す','間違え','編集'], t: 'Q11: 過去の的中記録を間違えた場合は？\nA: 管理者モードで履歴タブから対象の記録をタップし、詳細画面で各矢の○/×をタップすると記録を変更できます。' },
  { k: ['検索','探す','日付'], t: 'Q12: 特定の日付のセッションを探したい\nA: 履歴タブ上部の検索バーから、日付やタイトルで検索できます。' },
  { k: ['削除','消す','消したい'], t: 'Q13: 練習日そのものを消すには？\nA: 履歴タブの一覧画面右上の「編集」をタップして削除したい記録を選択、または記録詳細画面のゴミ箱アイコンから「ゴミ箱に移動」で削除できます。' },
  { k: ['復元','戻す','元に戻','ゴミ箱'], t: 'Q14: 間違えて消した記録は戻せる？\nA: 削除したデータは一度「ゴミ箱」に入り、そこから復元可能です。ゴミ箱を空にすると完全削除されます。' },
  { k: ['出欠','直せ','修正'], t: 'Q15: 過去の出欠も直せる？\nA: 管理者モードであれば修正可能です。' },
  { k: ['全体的中率','履歴','表示'], t: 'Q16: 履歴に表示される「全体的中率」とは？\nA: 履歴一覧には参加人数と矢数が表示されます。的中率は各詳細または分析タブで確認します。' },
  { k: ['オフライン','通信','圏外','見れ'], t: 'Q17: オフラインでも履歴は見れる？\nA: キャッシュが残っていればオフラインでも見れますが、最新データは通信が必要です。' },
  { k: ['期','表示'], t: 'Q18: 履歴に「期」が表示される？\nA: 卒業生の場合は「期（termKi）」が表示され、期ごとにグループ化されます。' },
  { k: ['古い','読み込まれない','表示されない'], t: 'Q19: 古い履歴が読み込まれない\nA: データが消えたわけではなく、通信負荷軽減のために非表示になっているだけです。' },
  { k: ['自分','参加していない','他の人'], t: 'Q20: 自分が参加していない履歴も見える？\nA: メンバーアカウントの場合は、自分が参加した練習の履歴のみが表示されます。' },
  { k: ['全体','調子','グラフ','推移'], t: 'Q21: 全体の調子を知りたい\nA: 分析タブの全体グラフで月別の部全体の的中率推移が確認できます。' },
  { k: ['個人','詳細','成績'], t: 'Q22: 個人の詳細な成績は見れる？\nA: 分析タブで個人を選ぶと、日別の成績グラフが表示されます。' },
  { k: ['立順','大前','落','番目'], t: 'Q23: アプリで個人の立順ごとの成績は見れる？\nA: アプリ画面上にはありませんが、AI（私）に「〇〇選手の大前での成績を教えて」と聞いていただければ計算してお答えします。' },
  { k: ['初矢','1本目','的中率'], t: 'Q24: 初矢（1本目）の的中率は？\nA: 個人分析画面で「初矢的中率」として算出されています。' },
  { k: ['皆中','4射4中'], t: 'Q25: 皆中（4射4中）の回数はわかる？\nA: 個人分析に皆中回数が表示されます。' },
  { k: ['羽分け','2中'], t: 'Q26: 羽分け（4射2中）のデータはある？\nA: 個人分析画面で羽分け回数なども確認できます。' },
  { k: ['最近','1ヶ月','直近'], t: 'Q27: 最近1ヶ月の調子だけ見れる？\nA: 分析タブのグラフの右端が最新の調子を示しています。' },
  { k: ['卒業生','分析'], t: 'Q28: 卒業生の分析もできる？\nA: はい、メンバー選択で卒業生を選べば過去のデータも分析できます。' },
  { k: ['期','比較'], t: 'Q29: 「期」ごとの比較はできる？\nA: アプリ上には直接の機能はありませんが、データがあればAI（私）が比較します。' },
  { k: ['ランキング','順位','一番'], t: 'Q30: 誰が一番中っているかランキングはある？\nA: 分析タブの下部に、メンバー別の的中率ランキング（成績一覧）が表示されます。' },
  { k: ['追加','新入','登録','入部'], t: 'Q31: 新入部員を追加するには？\nA: メンバータブ右上の「メンバー追加」アイコンボタンをタップし、名前、学年、性別を登録します。' },
  { k: ['学年','進級','4月','自動'], t: 'Q32: 年度が変わったら学年はどうする？\nA: 設定タブの「4月1日の自動進級」がオンになっていれば、すべてのメンバーの学年が自動で更新されます。手動で少しずつ行う場合は、メンバータブで各部員をタップして個別に学年を変更する必要があります。' },
  { k: ['4年生','5年','卒業','進級'], t: 'Q33: 4年生が進級するとどうなる？\nA: 「卒業生」としてシステムに残り続けます。' },
  { k: ['卒業生','データ','消えない'], t: 'Q34: 卒業生のデータは消えないの？\nA: 消えません。過去の記録もそのまま残ります。' },
  { k: ['卒業生','非表示','画面','消したい'], t: 'Q35: 卒業生を画面上から消したい場合は？\nA: メンバータブでその人をタップし「削除」を行えば消えます。' },
  { k: ['名前','変更','変えたい'], t: 'Q36: メンバーの名前を変えたい\nA: メンバータブで対象者をタップすると名前の編集ができます。' },
  { k: ['パスワード','忘れ','ログイン'], t: 'Q37: パスワードを忘れた\nA: ログイン画面にある「パスワードを忘れた」のリンクから、登録メールアドレス宛に再設定メールを送信してください。' },
  { k: ['共有','同期','複数','スマホ','端末'], t: 'Q38: 他のスマホで同じデータを共有できる？\nA: 同じグループIDとパスワードでログインすれば完全に同期されます。' },
  { k: ['オフライン','通信','切れ','圏外','記録'], t: 'Q39: 通信が切れたらデータはどうなる？\nA: オフラインでも記録可能で、通信が回復した時に自動でクラウドに同期されます。' },
  { k: ['重い','遅い','動作'], t: 'Q40: アプリの動作が重い\nA: 設定等から不要な古いメンバーを整理するか、端末の再起動を試してください。' },
  { k: ['大前','向いて','選考','選手'], t: 'Q41: 大前（1番目）に向いている選手は？\nA: 初矢の的中率が高く、チームに勢いをもたらせる選手です。' },
  { k: ['落','向いて','最後','選考'], t: 'Q42: 落（最後）に向いている選手は？\nA: プレッシャーに強く、全体の的中率が安定している選手です。' },
  { k: ['皆中','多い','全体','低い','ムラ'], t: 'Q43: 皆中は多いが全体的中率が低い選手への指導は？\nA: ムラがあるため、射形の安定性を見直すようアドバイスします。' },
  { k: ['羽分け','伸びない','原因'], t: 'Q44: 羽分け（2中）から伸びない原因は？\nA: 集中力の切れか、矢所の偏り（特定の癖）が考えられます。' },
  { k: ['初矢','外す','原因'], t: 'Q45: 初矢ばかり外す原因は？\nA: 立ち上がり（入場の緊張感や一矢目の呼吸）が整っていない可能性があります。' },
  { k: ['試合','メンタル','緊張'], t: 'Q46: 試合前のメンタル調整方法は？\nA: 「中てよう」とするのではなく「自分の射をすること」に集中するよう助言します。' },
  { k: ['チーム','落ちている','練習'], t: 'Q47: チームの的中が落ちている時の練習は？\nA: 基本に立ち返り、巻藁練習やゴム弓でのフォーム確認を推奨します。' },
  { k: ['弓','キロ','強さ','変える'], t: 'Q48: 弓のキロ数（強さ）を変えるタイミングは？\nA: 矢飛びが極端に落ちる、または引き尺が余裕すぎる場合に検討します。' },
  { k: ['離れ','引っかかる','原因'], t: 'Q49: 離れで引っかかる原因は？\nA: 妻手の捻りが甘い、または胸を開くのが不足している場合が多いです。' },
  { k: ['用語','アドバイス','指導','専門'], t: 'Q50: 弓道用語でアドバイスして\nA: 「会が浅い」「早気」「残心が崩れる」などの専門用語を用いて的確に指導します。' },
  { k: ['メンバーアカウント','個人ID','メンバーログイン','ログイン'], t: 'Q51: メンバーアカウントでログインするには？\nA: ログイン画面で「メンバー」を選び、団体IDと個人IDを入力します。個人ID（4桁の数字）は、管理者モードをオンにした状態で、メンバータブから各部員をタップすると確認できます。' },
  { k: ['管理者','管理者モード','管理者設定'], t: 'Q52: 管理者モードとは？どうやってオンにするの？\nA: 管理者モードは、記録の編集や個人IDの確認等ができる権限です。設定タブの「管理者設定」にある「管理者モード」スイッチをオンにし、団体パスワードを入力すると有効になります。' },
];

// ユーザーの質問に関連するQ&Aを最大8件選んで返す
const selectQAs = (userMsg) => {
  const scored = qaData
    .map(qa => ({ ...qa, score: qa.k.filter(kw => userMsg.includes(kw)).length }))
    .filter(qa => qa.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  if (scored.length === 0) return '';
  return scored.map(qa => qa.t).join('\n');
};

const CHAT_HISTORY_KEY = 'aiChatMessages_v1';
const MAX_SAVED_MESSAGES = 50;

const loadChatHistory = () => {
  try {
    const saved = typeof localStorage !== 'undefined' && localStorage.getItem(CHAT_HISTORY_KEY);
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return null;
};

const saveChatHistory = (messages) => {
  try {
    if (typeof localStorage !== 'undefined') {
      const toSave = messages.slice(-MAX_SAVED_MESSAGES);
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(toSave));
    }
  } catch(e) {}
};

const AIChatBot = () => {
  const { activeRole, members = [], sessions = [], currentRouteName } = useScoreStore();
  const addMember = useScoreStore(state => state.addMember);
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [inputText, setInputText] = useState("");
  const defaultMessages = [{ role: "model", text: "こんにちは！弓道スコア管理AIアシスタントです。選手選びの相談や、的中傾向の分析、アプリの使い方など、何でも聞いてください。" }];
  const [messages, setMessages] = useState(() => loadChatHistory() || defaultMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);

  useEffect(() => { saveChatHistory(messages); }, [messages]);
  const scrollViewRef = useRef(null);

  if (activeRole !== "group" || currentRouteName === "記録") {
    return null;
  }

  const handleActionResponse = (msgIndex, isApproved) => {
    const targetMsg = messages[msgIndex];
    if (!targetMsg || targetMsg.status !== 'pending') return;
    
    const updatedMessages = [...messages];
    updatedMessages[msgIndex] = { ...targetMsg, status: isApproved ? 'approved' : 'rejected' };
    
    if (isApproved) {
      if (targetMsg.actionType === 'addMember') {
        const { name, grade, gender } = targetMsg.args;
        // 性別の値をアプリの定義（男子・女子・未設定）にマッピング変換
        let finalGender = '未設定';
        if (gender === 'male' || gender === '男子') {
          finalGender = '男子';
        } else if (gender === 'female' || gender === '女子') {
          finalGender = '女子';
        }
        addMember(name, finalGender, grade);
        updatedMessages.push({ role: 'model', text: `${name}さんをメンバーに追加しました。` });
      }
    } else {
      updatedMessages.push({ role: 'model', text: `操作をキャンセルしました。` });
    }
    
    setMessages(updatedMessages);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    const userMsg = inputText.trim();
    setInputText("");
    
    const newMessages = [...messages, { role: "user", text: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    let attempt = 0;
    const MAX_RETRY = 1;

    while (attempt <= MAX_RETRY) {
    try {
      // 部員一覧のみ渡す（トークン節約）。詳細成績はgetDetailedMemberStatsで取得
      const memberList = members.map(member => {
        const gradeLabel = member.grade >= 5 ? '卒業生' : `${member.grade}年`;
        return `${member.name}(${gradeLabel})`;
      }).join(', ');

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;

      const relevantQA = selectQAs(userMsg);
      const qaSection = relevantQA
        ? `\n\n【アプリ操作・仕様Q&A（関連する項目のみ）】\n${relevantQA}`
        : '';
      const fullInstruction = `${systemInstructionBase}${qaSection}\n\n[今日の日付: ${todayStr} / 昨日: ${yesterdayStr}]\n[部員一覧（計${members.length}名）]\n${memberList}\n\n※全員の成績データやランキングを取得する場合は getAllMembersStats ツールを、特定の選手一人の過去の詳細成績（本数ごとの的中や大前・落など）を取得する場合は getDetailedMemberStats ツールを使用してください。`;

      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      
      // Function Calling の宣言
      const tools = [{
        functionDeclarations: [
          {
            name: "getAllMembersStats",
            description: "全部員の的中率や統計情報（総射数、総的中数、的中率）を取得します。「全員の5月の的中率を教えて」「部員のランキングを見せて」などの、部員全体の統計を求める質問に使います。",
            parameters: {
              type: "OBJECT",
              properties: {
                dateFrom: { type: "STRING", description: "集計対象期間の開始日 (YYYY-MM-DD形式)。例: '2026-05-01'" },
                dateTo: { type: "STRING", description: "集計対象期間の終了日 (YYYY-MM-DD形式)。例: '2026-05-31'" }
              }
            }
          },
          {
            name: "getSessionsByDate",
            description: "日付や期間を指定して練習記録を取得します。「昨日の記録」「今週の練習」「5月の記録」「直近3回」などの質問に使います。dateとdateFrom/dateToとrecentCountはいずれか一つを指定してください。",
            parameters: {
              type: "OBJECT",
              properties: {
                date: { type: "STRING", description: "特定の1日を指定する場合のYYYY-MM-DD形式の日付。例: '2026-05-23'" },
                dateFrom: { type: "STRING", description: "期間指定の開始日 (YYYY-MM-DD形式)" },
                dateTo: { type: "STRING", description: "期間指定の終了日 (YYYY-MM-DD形式)" },
                recentCount: { type: "INTEGER", description: "直近N件取得する場合の件数。例: 3 → 直近3回分" }
              }
            }
          },
          {
            name: "getDetailedMemberStats",
            description: "指定した選手の過去の詳細な成績データを取得します。初矢から4本目（留矢）まで何本目の矢が当たりやすいか、また大前や落など立順ごとの成績などを分析する際に呼び出してください。",
            parameters: {
              type: "OBJECT",
              properties: {
                memberName: { type: "STRING", description: "選手の名前" }
              },
              required: ["memberName"]
            }
          },
          {
            name: "navigateToScreen",
            description: "指定した画面タブへ遷移します。",
            parameters: {
              type: "OBJECT",
              properties: {
                screenName: { type: "STRING", description: "遷移先の画面名（記録, 履歴, 分析, メンバー, 出欠, 設定 のいずれか）" }
              },
              required: ["screenName"]
            }
          },
          {
            name: "addMember",
            description: "新しい部員を追加します。追加する前にユーザーへの確認が行われます。",
            parameters: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING", description: "追加する部員の名前" },
                grade: { type: "INTEGER", description: "学年（1〜4など）" },
                gender: { type: "STRING", description: "性別（'male', 'female', '未設定' のいずれか）" }
              },
              required: ["name", "grade", "gender"]
            }
          }
        ]
      }];

      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite", 
        systemInstruction: fullInstruction,
        tools: tools
      });

      const chat = model.startChat({
        history: newMessages.slice(1).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.role === 'actionCard' ? `[システムのデータ追加提案: ${msg.status}]` : msg.text }]
        }))
      });

      console.log('[AIChatBot] Sending message with Function Calling enabled...');
      let result = await chat.sendMessage([{text: userMsg}]);
      let response = await result.response;
      
      // Function Calling の処理ループ
      let calls = response.functionCalls ? response.functionCalls() : [];
      let loopCount = 0;
      
      while (calls && calls.length > 0 && loopCount < 5) {
        loopCount++;
        const functionResponses = [];
        let hasPendingAction = false;
        
        for (const call of calls) {
          console.log('[AIChatBot] Function Called:', call.name, call.args);
          
          if (call.name === "getAllMembersStats") {
            const { dateFrom, dateTo } = call.args;
            const from = dateFrom ? new Date(dateFrom).getTime() : 0;
            const to = dateTo ? new Date(dateTo).getTime() + 86400000 : Infinity;
            
            const targetSessions = sessions.filter(s => (s.date || 0) >= from && (s.date || 0) <= to);
            
            const rows = members.map(m => {
              let hits = 0, total = 0;
              targetSessions.forEach(s => {
                s.archers.forEach(a => {
                  if (!a || !a.marks) return;
                  const subs = a.substitutions || {};
                  const subIds = a.substitutionIds || {};
                  const subIndices = Object.keys(subs).map(Number).sort((e, t) => e - t);
                  
                  a.marks.forEach((mk, shotIdx) => {
                    if (mk !== '○' && mk !== '×') return;
                    
                    let currentId = a.memberId;
                    let currentName = a.name || '';
                    for (const subIdx of subIndices) {
                      if (subIdx <= shotIdx) {
                        currentId = subIds[subIdx] || undefined;
                        currentName = subs[subIdx] || '';
                      } else {
                        break;
                      }
                    }
                    
                    const isM = (m.id && currentId === m.id) || 
                                (currentName && m.name && currentName.replace(/\s/g,'') === m.name.replace(/\s/g,''));
                                
                    if (isM) {
                      if (mk === '○') { hits++; total++; }
                      else if (mk === '×') { total++; }
                    }
                  });
                });
              });
              const rate = total > 0 ? ((hits / total) * 100).toFixed(1) : '-';
              return `${m.name}|${rate}|${hits}/${total}`;
            });

            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: {
                  count: rows.length,
                  stats: rows.join('\n'),
                  message: "集計が完了しました。フォーマット: 名前|的中率|的中数/総射数"
                }
              }
            });
          } else if (call.name === "getDetailedMemberStats") {
            const targetName = call.args.memberName;
            const targetMember = members.find(m => m.name.includes(targetName));
            let statsData = { error: "選手が見つかりませんでした。" };
            
            if (targetMember) {
              let shotTotals = [0, 0, 0, 0];
              let shotHits = [0, 0, 0, 0];
              let omaeTotal = 0, omaeHit = 0;
              let ochiTotal = 0, ochiHit = 0;
              let totalMarks = 0, hitMarks = 0, kaichu = 0;
              let recentTotal = 0, recentHit = 0;
              let totalSessions = 0;
              
              const sortedSessions = [...sessions].sort((a, b) => b.created - a.created);
              sortedSessions.forEach((session, sessionIdx) => {
                let participatedInSession = false;
                session.archers.forEach((archer, archerIdx) => {
                  if (!archer || !archer.marks) return;
                  const subs = archer.substitutions || {};
                  const subIds = archer.substitutionIds || {};
                  const subIndices = Object.keys(subs).map(Number).sort((e, t) => e - t);
                  
                  archer.marks.forEach((m, idx) => {
                    if (m !== '○' && m !== '×') return;
                    
                    let currentId = archer.memberId;
                    let currentName = archer.name || '';
                    for (const subIdx of subIndices) {
                      if (subIdx <= idx) {
                        currentId = subIds[subIdx] || undefined;
                        currentName = subs[subIdx] || '';
                      } else {
                        break;
                      }
                    }
                    
                    const isTarget = (targetMember.id && currentId === targetMember.id) ||
                                     (currentName && targetMember.name && currentName.replace(/\s/g,'') === targetMember.name.replace(/\s/g,''));
                                     
                    if (isTarget) {
                      participatedInSession = true;
                      const arrowPos = idx % 4;
                      shotTotals[arrowPos]++;
                      if (m === '○') shotHits[arrowPos]++;
                      totalMarks++;
                      if (m === '○') hitMarks++;
                      if (sessionIdx < 10) {
                        recentTotal++;
                        if (m === '○') recentHit++;
                      }
                      
                      // 大前 (1番目)
                      if (archerIdx === 0) {
                        omaeTotal++;
                        if (m === '○') omaeHit++;
                      }
                      // 落 (最後、3人以上の場合)
                      if (session.archers.length >= 3 && archerIdx === session.archers.length - 1) {
                        ochiTotal++;
                        if (m === '○') ochiHit++;
                      }
                    }
                  });
                  
                  // 皆中判定
                  for (let i = 0; i < Math.floor(archer.marks.length / 4); i++) {
                    let isBlockAllTarget = true;
                    let isBlockAllHit = true;
                    for (let l = 0; l < 4; l++) {
                      const shotIdx = 4 * i + l;
                      const mark = archer.marks[shotIdx];
                      
                      let currentId = archer.memberId;
                      let currentName = archer.name || '';
                      for (const subIdx of subIndices) {
                        if (subIdx <= shotIdx) {
                          currentId = subIds[subIdx] || undefined; // 交代後の正しいIDを使用
                          currentName = subs[subIdx] || '';        // 交代後の正しい名前を使用
                        } else {
                          break;
                        }
                      }
                      
                      const isTarget = (targetMember.id && currentId === targetMember.id) ||
                                       (currentName && targetMember.name && currentName.replace(/\s/g,'') === targetMember.name.replace(/\s/g,''));
                      
                      if (!isTarget) {
                        isBlockAllTarget = false;
                        break;
                      }
                      if (mark !== '○') {
                        isBlockAllHit = false;
                      }
                    }
                    if (isBlockAllTarget && isBlockAllHit) {
                      kaichu++;
                    }
                  }
                });
                if (participatedInSession) {
                  totalSessions++;
                }
              });
              
              statsData = {
                name: targetMember.name,
                totalSessions: totalSessions,
                totalHitRate: totalMarks > 0 ? ((hitMarks / totalMarks) * 100).toFixed(1) + "%" : "データなし",
                totalArrows: totalMarks,
                recentHitRate: recentTotal > 0 ? ((recentHit / recentTotal) * 100).toFixed(1) + "%" : "データなし",
                kaichuCount: kaichu,
                firstShotHitRate: shotTotals[0] > 0 ? ((shotHits[0] / shotTotals[0]) * 100).toFixed(1) + "%" : "データなし",
                secondShotHitRate: shotTotals[1] > 0 ? ((shotHits[1] / shotTotals[1]) * 100).toFixed(1) + "%" : "データなし",
                thirdShotHitRate: shotTotals[2] > 0 ? ((shotHits[2] / shotTotals[2]) * 100).toFixed(1) + "%" : "データなし",
                fourthShotHitRate: shotTotals[3] > 0 ? ((shotHits[3] / shotTotals[3]) * 100).toFixed(1) + "%" : "データなし",
                omaeHitRate: omaeTotal > 0 ? ((omaeHit / omaeTotal) * 100).toFixed(1) + "%" : "データなし",
                ochiHitRate: ochiTotal > 0 ? ((ochiHit / ochiTotal) * 100).toFixed(1) + "%" : "データなし"
              };
            }
            
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: statsData
              }
            });
          } else if (call.name === "getSessionsByDate") {
            const { date, dateFrom, dateTo, recentCount } = call.args;

            let filtered = [...sessions].sort((a, b) => (b.date || 0) - (a.date || 0));

            if (recentCount) {
              filtered = filtered.slice(0, recentCount);
            } else if (date) {
              const target = new Date(date);
              filtered = filtered.filter(s => {
                const d = new Date(s.date || 0);
                return d.getFullYear() === target.getFullYear() &&
                       d.getMonth() === target.getMonth() &&
                       d.getDate() === target.getDate();
              });
            } else if (dateFrom || dateTo) {
              const from = dateFrom ? new Date(dateFrom).getTime() : 0;
              const to = dateTo ? new Date(dateTo).getTime() + 86400000 : Infinity;
              filtered = filtered.filter(s => (s.date || 0) >= from && (s.date || 0) <= to);
            }

            const sessionData = filtered.map(s => {
              const d = new Date(s.date || 0);
              const dateStr = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
              const allMarks = s.archers.flatMap(a => a.marks || []);
              const total = allMarks.filter(m => m === '○' || m === '×').length;
              const hits = allMarks.filter(m => m === '○').length;
              const hitRate = total > 0 ? ((hits / total) * 100).toFixed(1) + '%' : 'データなし';
              const memberStatsMap = new Map(); // メンバーごとの集計マップ
              s.archers.forEach(a => {
                if (!a || !a.marks) return;
                const subs = a.substitutions || {};
                const subIndices = Object.keys(subs).map(Number).sort((e, t) => e - t);
                
                a.marks.forEach((mk, shotIdx) => {
                  let currentName = a.name || 'ゲスト';
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
                  stat.marks.push(mk);
                  if (mk === '○') {
                    stat.hits++;
                    stat.total++;
                  } else if (mk === '×') {
                    stat.total++;
                  }
                });
              });

              const archerList = Array.from(memberStatsMap.entries()).map(([name, stat]) => {
                return `${name}:${stat.marks.join('')}(${stat.hits}/${stat.total})`;
              }).join(', ');
              return { date: dateStr, title: s.title || '無題', hitRate, totalArrows: total, archers: archerList };
            });

            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: {
                  count: sessionData.length,
                  sessions: sessionData,
                  message: sessionData.length === 0 ? '該当する記録が見つかりませんでした。' : `${sessionData.length}件の記録を取得しました。`
                }
              }
            });
          } else if (call.name === "navigateToScreen") {
            const screenMap = {
              "記録": "記録",
              "履歴": "履歴", 
              "分析": "分析",
              "メンバー": "メンバー",
              "出欠": "出欠",
              "設定": "設定"
            };
            const target = screenMap[call.args.screenName] || call.args.screenName;
            
            setTimeout(() => {
              try {
                navigation.navigate(target);
                setModalVisible(false);
              } catch(e) { console.warn("Navigation failed", e); }
            }, 500);

            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: { success: true, message: `${target}画面へ遷移しました。` }
              }
            });
          } else if (call.name === "addMember") {
            const newMsg = {
               role: "actionCard",
               actionType: "addMember",
               args: call.args,
               status: "pending",
               callName: call.name
            };
            setMessages(prev => [...prev, newMsg]);
            hasPendingAction = true;
          }
        }
        
        if (hasPendingAction) {
          setIsLoading(false);
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
          return;
        }
        
        if (functionResponses.length > 0) {
          // 関数実行結果をモデルに返す
          result = await chat.sendMessage(functionResponses);
          response = await result.response;
          calls = response.functionCalls ? response.functionCalls() : [];
        } else {
          break;
        }
      }

      let responseText = "";
      try {
        responseText = response.text();
      } catch (e) {
        console.warn("[AIChatBot] Text extraction failed:", e);
      }
      
      if (!responseText || responseText.trim() === "") {
        responseText = "（回答を生成できませんでした。もう一度お試しください）";
      }

      setMessages([...newMessages, { role: "model", text: responseText }]);
      break; // 成功

    } catch (error) {
      const is429 = error.message?.includes("429");
      const isPerDay = error.message?.includes('PerDayPerProject');
      const isPerMinute = is429 && !isPerDay;

      if (isPerMinute && attempt < MAX_RETRY) {
        // 1分クォータ超過 → カウントダウン後に自動リトライ
        const match = error.message.match(/"retryDelay":"(\d+)s"/);
        const waitSec = match ? parseInt(match[1]) + 2 : 35;
        let remaining = waitSec;
        setRetryCountdown(remaining);
        const timer = setInterval(() => {
          remaining--;
          setRetryCountdown(prev => Math.max(0, prev - 1));
          if (remaining <= 0) clearInterval(timer);
        }, 1000);
        await new Promise(resolve => setTimeout(resolve, waitSec * 1000));
        clearInterval(timer);
        setRetryCountdown(0);
        attempt++;
        continue;
      }

      console.error("AIChatBot Send Error:", error);
      let errorMsg = "通信エラーが発生しました。";
      if (error.message?.includes("503")) {
        errorMsg = "ただいまAIが混み合っています。しばらく待ってからもう一度送信してください。";
      } else if (is429) {
        if (isPerDay) {
          errorMsg = "本日のAI利用上限に達しました。明日0時以降に再度お試しください。";
        } else {
          errorMsg = "AIの利用制限（クォータ）に達しました。しばらく時間をおいてから再度お試しください。";
        }
      } else if (error.message?.includes("404")) {
        errorMsg = "AIモデルが見つかりません。API設定を確認してください。";
      } else if (error.message?.includes("403")) {
        errorMsg = "APIキーの権限がありません。Google CloudでAPIを有効化してください。";
      } else {
        errorMsg = `エラー: ${error.message}`;
      }
      setMessages([...newMessages, { role: "model", text: errorMsg }]);
      break;
    }
    } // end while

    setIsLoading(false);
    setRetryCountdown(0);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const { width: winW, height: winH } = _Dimensions.get("window");
  const modalW = Math.min(0.9 * winW, 450);
  const modalH = Math.min(0.8 * winH, 600);

  return (
    <Fragment>
      <_TouchableOpacity
        style={[styles.floatingButton, getShadowStyle({ shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 })]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="chatbubble-ellipses" size={30} color="#FFF" />
        <_View style={styles.badge}>
          <_Text style={styles.badgeText}>AI</_Text>
        </_View>
      </_TouchableOpacity>

      <_Modal visible={modalVisible} animationType="slide" transparent={true}>
        <_KeyboardAvoidingView behavior="height" style={styles.modalOverlay}>
          <_View style={[styles.chatContainer, { width: modalW, height: modalH }, getShadowStyle({ shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 })]}>
            <_View style={styles.header}>
              <_View style={styles.headerTitleRow}>
                <Ionicons name="sparkles" size={20} color="#007AFF" />
                <_Text style={styles.headerTitle}>AIアシスタント</_Text>
              </_View>
              <_View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <_TouchableOpacity onPress={() => { setMessages(defaultMessages); saveChatHistory(defaultMessages); }} style={{ padding: 4 }}>
                  <Ionicons name="trash-outline" size={20} color="#8E8E93" />
                </_TouchableOpacity>
                <_TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#8E8E93" />
                </_TouchableOpacity>
              </_View>
            </_View>

            <_ScrollView
              ref={scrollViewRef}
              style={styles.messageArea}
              contentContainerStyle={{ padding: 16 }}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((msg, idx) => (
                msg.role === "actionCard" ? (
                  <_View key={idx} style={[styles.messageBubble, styles.modelBubble, { minWidth: 200 }]}>
                    <_Text style={[styles.modelText, { fontWeight: 'bold', marginBottom: 8 }]}>
                      データの追加提案
                    </_Text>
                    <_Text style={styles.modelText}>
                      名前: {msg.args.name}{"\n"}
                      学年: {msg.args.grade}年{"\n"}
                      性別: {msg.args.gender === 'male' ? '男性' : msg.args.gender === 'female' ? '女性' : msg.args.gender}
                    </_Text>
                    {msg.status === 'pending' ? (
                      <_View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
                        <_TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FF3B30' }]} onPress={() => handleActionResponse(idx, false)}>
                          <_Text style={styles.actionBtnText}>キャンセル</_Text>
                        </_TouchableOpacity>
                        <_TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#34C759' }]} onPress={() => handleActionResponse(idx, true)}>
                          <_Text style={styles.actionBtnText}>承認</_Text>
                        </_TouchableOpacity>
                      </_View>
                    ) : (
                      <_View style={{ marginTop: 12 }}>
                        <_Text style={[styles.modelText, { color: msg.status === 'approved' ? '#34C759' : '#FF3B30', fontWeight: 'bold', textAlign: 'right' }]}>
                          {msg.status === 'approved' ? '✓ 承認済み' : 'キャンセル済み'}
                        </_Text>
                      </_View>
                    )}
                  </_View>
                ) : (
                  <_View key={idx} style={[styles.messageBubble, msg.role === "user" ? styles.userBubble : styles.modelBubble]}>
                    <_Text style={[styles.messageText, msg.role === "user" ? styles.userText : styles.modelText]}>
                      {msg.text}
                    </_Text>
                  </_View>
                )
              ))}
              {isLoading && (
                <_View style={[styles.messageBubble, styles.modelBubble, { flexDirection: "row", alignItems: "center" }]}>
                  <_ActivityIndicator size="small" color="#007AFF" style={{ marginRight: 8 }} />
                  <_Text style={styles.modelText}>
                    {retryCountdown > 0 ? `制限中... ${retryCountdown}秒後に再試行します` : '考え中...'}
                  </_Text>
                </_View>
              )}
            </_ScrollView>

            <_View style={styles.inputArea}>
              <_TextInput
                style={styles.input}
                placeholder="メッセージを入力..."
                value={inputText}
                onChangeText={setInputText}
                multiline={true}
                maxLength={500}
              />
              <_TouchableOpacity
                style={[styles.sendBtn, (!inputText.trim() || isLoading) && { opacity: 0.5 }]}
                onPress={handleSend}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons name="send" size={20} color="#FFF" />
              </_TouchableOpacity>
            </_View>
          </_View>
        </_KeyboardAvoidingView>
      </_Modal>
    </Fragment>
  );
};

exports.AIChatBot = AIChatBot;

const styles = _StyleSheet.create({
  floatingButton: {
    position: "absolute", right: 20, bottom: 20, width: 60, height: 60,
    borderRadius: 30, backgroundColor: "#007AFF",
    justifyContent: "center", alignItems: "center", zIndex: 9999
  },
  badge: {
    position: "absolute", top: -5, right: -5, backgroundColor: "#FF3B30",
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10,
    borderWidth: 2, borderColor: "#FFF"
  },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end", alignItems: "center" },
  chatContainer: { backgroundColor: "#FFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: "hidden" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#F2F2F7", backgroundColor: "#FFF" },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: "bold", color: "#1C1C1E" },
  closeBtn: { padding: 4 },
  messageArea: { flex: 1, backgroundColor: "#F8F8F8" },
  messageBubble: { maxWidth: "85%", padding: 12, borderRadius: 18, marginBottom: 12 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#007AFF", borderBottomRightRadius: 4 },
  modelBubble: { alignSelf: "flex-start", backgroundColor: "#E5E5EA", borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  userText: { color: "#FFF" },
  modelText: { color: "#1C1C1E" },
  inputArea: { flexDirection: "row", padding: 12, paddingBottom: 12, backgroundColor: "#FFF", borderTopWidth: 1, borderTopColor: "#F2F2F7", alignItems: "center" },
  input: { flex: 1, backgroundColor: "#F2F2F7", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, maxHeight: 100, fontSize: 15, marginRight: 8 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#007AFF", justifyContent: "center", alignItems: "center" },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  actionBtnText: { color: "#FFF", fontSize: 13, fontWeight: "bold" }
});