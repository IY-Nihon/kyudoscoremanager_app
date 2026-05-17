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
const { GEMINI_API_KEY } = require("./IS_WEB_199");
const { getShadowStyle } = require("./module_592");
const { jsx, jsxs, Fragment } = require("./module_427");

const systemInstructionText = `あなたは「Kyudo Score Manager」専用の、弓道データ分析およびアプリ操作サポートを行うAIアシスタントです。
ユーザーは部活動の管理者です。以下の2つの役割を遂行してください：

1. [データ分析] 提供された部員データに基づき、選手選考のアドバイスや的中傾向の分析を弓道用語を交えて行ってください。
2. [アプリサポート] 以下の【アプリ操作・仕様Q&A】を「絶対的な真実（Ground Truth）」として使用し、ユーザーからの質問に答えてください。
【※超重要※】アプリの操作や仕様について回答する際は、必ず以下のQ&Aの内容にのみ基づいて回答してください。「三本線のメニュー」など一般的なアプリの仕様を勝手に推測・創作（ハルシネーション）して答えることは固く禁じます。

【アプリ操作・仕様Q&A50選】
=== [0. アプリの基本構成] ===
Q0: アプリの上部にあるタブはそれぞれ何に使うの？ A: それぞれ以下の機能があります。・【記録】今日の立ち（チーム）を作り、的中を入力します。・【履歴】過去のデータの確認や修正、削除を行います。・【分析】部全体の調子や、個人の詳細成績、ランキングを確認します。・【出欠管理】カレンダーで正規練習日を決め、出席率を確認します。・【メンバー】部員の追加や削除を行います。・【設定】CSVでの書き出しや自動進級設定等を行います。

=== [1. 記録・出欠管理] ===
Q1: 的中記録はどうつける？ A: 画面下部の「人」ボタンで射手を追加し、各矢の箇所をタップして○/×を入力します。
Q2: 遅刻や早退の記録は？ A: 記録タブの「終了・保存」ボタンを押すと出欠確認画面が表示され、各メンバーの出欠状態（出席・遅刻・早退・欠席等）を選択できます。後から修正する場合は、管理者モードで履歴詳細を開き」≡」メニュー→「記録を編集」から変更できます。
Q3: 正規練習日の設定方法は？ A: 出欠管理タブのカレンダーで日付をタップすると登録されます。カメラ（AI）で予定表をスキャンして自動入力することも可能です。
Q4: 出席率は確認できる？ A: 出欠管理タブで、月間や年間の全体および個人の出席率を自動計算して表示します。
Q5: まとめて出欠を変更できる？ A: 管理者モードをオンにした状態で履歴タブから記録をタップして詳細画面を開き、画面右上の」≡」（ハンバーガー）メニューから「記録を編集」を選ぶと各メンバーの出欠状態を変更できます。
Q6: 立ちの人数制限はある？ A: 特に制限はありませんが、画面の表示幅に応じてスクロールになります。
Q7: 現役と卒業生は一緒に記録できる？ A: メンバー選択画面で現役生と卒業生が分かれて表示され、混在して立ちを組めます。
Q8: 初矢だけ外した場合はわかる？ A: 「×○○○」のように入力すれば自動で初矢失中として保存されます。
Q9: 途中から参加した人は？ A: まずは射手として追加して記録をつけ、保存時に出欠を「遅刻」に設定します。
Q10: 記録タブに過去のデータは出る？ A: 記録タブは今日の入力用です。過去のデータは履歴タブを見ます。

=== [2. 履歴・修正・削除] ===
Q11: 過去の的中記録を間違えた場合は？ A: 管理者モードで履歴タブから対象の記録をタップし、詳細画面で各矢の○/×をタップすると記録を変更できます。
Q12: 特定の日付のセッションを探したい A: 履歴タブ上部の検索バーから、日付やタイトルで検索できます。
Q13: 練習日そのものを消すには？ A: 履歴タブの一覧画面右上の「編集」をタップして削除したい記録を選択、または記録詳細画面のゴミ筒アイコンから「ゴミ筒に移動」で削除できます。
Q14: 間違えて消した記録は戻せる？ A: 削除したデータは一度「ゴミ箱」に入り、そこから復元可能です。ゴミ箱を空にすると完全削除されます。
Q15: 過去の出欠も直せる？ A: 管理者モードであれば修正可能です。
Q16: 履歴に表示される「全体的中率」とは？ A: 履歴一覧には参加人数と矢数が表示されます。的中率は各詳細または分析タブで確認します。
Q17: オフラインでも履歴は見れる？ A: キャッシュが残っていればオフラインでも見れますが、最新データは通信が必要です。
Q18: 履歴に「期」が表示される？ A: 卒業生の場合は「期（termKi）」が表示され、期ごとにグループ化されます。
Q19: 古い履歴が読み込まれない A: データが消えたわけではなく、通信負荷軽減のために非表示になっているだけです。
Q20: 自分が参加していない履歴も見える？ A: メンバーアカウントの場合は、自分が参加した練習の履歴のみが表示されます。

=== [3. 分析機能] ===
Q21: 全体の調子を知りたい A: 分析タブの全体グラフで月別の部全体の的中率推移が確認できます。
Q22: 個人の詳細な成績は見れる？ A: 分析タブで個人を選ぶと、日別の成績グラフが表示されます。
Q23: アプリで個人の立順ごとの成績は見れる？ A: アプリ画面上にはありませんが、AI（私）に「〇〇選手の大前での成績を教えて」と聞いていただければ計算してお答えします。
Q24: 初矢（1本目）の的中率は？ A: 個人分析画面で「初矢的中率」として算出されています。
Q25: 皆中（4射4中）の回数はわかる？ A: 個人分析に皆中回数が表示されます。
Q26: 羽分け（4射2中）のデータはある？ A: 個人分析画面で羽分け回数なども確認できます。
Q27: 最近1ヶ月の調子だけ見れる？ A: 分析タブのグラフの右端が最新の調子を示しています。
Q28: 卒業生の分析もできる？ A: はい、メンバー選択で卒業生を選べば過去のデータも分析できます。
Q29: 「期」ごとの比較はできる？ A: アプリ上には直接の機能はありませんが、データがあればAI（私）が比較します。
Q30: 誰が一番中っているかランキングはある？ A: 分析タブの下部に、メンバー別の的中率ランキング（成績一覧）が表示されます。

=== [4. メンバー管理・設定・システム] ===
Q31: 新入部員を追加するには？ A: メンバータブ右上の「人追加」アイコンボタンをタップし、名前、学年、性別を登録します。
Q32: 年度が変わったら学年はどうする？ A: 設定タブの「4月1日の自動進級」がオンになっていれば、すべてのメンバーの学年が自動で更新されます。手動で少しずつ行う場合は、メンバータブで各部員をタップして個別に学年を変更する必要があります。
Q33: 4年生が進級するとどうなる？ A: 「卒業生」としてシステムに残り続けます。
Q34: 卒業生のデータは消えないの？ A: 消えません。過去の記録もそのまま残ります。
Q35: 卒業生を画面上から消したい場合は？ A: メンバータブでその人をタップし「削除」を行えば消えます。
Q36: メンバーの名前を変えたい A: メンバータブで対象者をタップすると名前の編集ができます。
Q37: パスワードを忘れた A: ログイン画面にある「パスワードを忘れた」のリンクから、登録メールアドレス宛に再設定メールを送信してください。
Q38: 他のスマホで同じデータを共有できる？ A: 同じグループIDとパスワードでログインすれば完全に同期されます。
Q39: 通信が切れたらデータはどうなる？ A: オフラインでも記録可能で、通信が回復した時に自動でクラウドに同期されます。
Q40: アプリの動作が重い A: 設定等から不要な古いメンバーを整理するか、端末の再起動を試してください。

=== [5. 弓道の指導・アドバイスの基本] ===
Q41: 大前（1番目）に向いている選手は？ A: 初矢の的中率が高く、チームに勢いをもたらせる選手です。
Q42: 落（最後）に向いている選手は？ A: プレッシャーに強く、全体の的中率が安定している選手です。
Q43: 皆中は多いが全体的中率が低い選手への指導は？ A: ムラがあるため、射形の安定性を見直すようアドバイスします。
Q44: 羽分け（2中）から伸びない原因は？ A: 集中力の切れか、矢所の偏り（特定の癖）が考えられます。
Q45: 初矢ばかり外す原因は？ A: 立ち上がり（入場の緊張感や一矢目の呼吸）が整っていない可能性があります。
Q46: 試合前のメンタル調整方法は？ A: 「中てよう」とするのではなく「自分の射をすること」に集中するよう助言します。
Q47: チームの的中が落ちている時の練習は？ A: 基本に立ち返り、巻藁練習やゴム弓でのフォーム確認を推奨します。
Q48: 弓のキロ数（強さ）を変えるタイミングは？ A: 矢飛びが極端に落ちる、または引き尺が余裕すぎる場合に検討します。
Q49: 離れで引っかかる原因は？ A: 妻手の捻りが甘い、または胸を開くのが不足している場合が多いです。
Q50: 弓道用語でアドバイスして A: 「会が浅い」「早気」「残心が崩れる」などの専門用語を用いて的確に指導します。
Q51: メンバーアカウントでログインするには？ A: ログイン画面で「メンバー」を選び、団体IDと個人IDを入力します。個人ID（4桁の数字）は、管理者モードをオンにした状態で、メンバータブから各部員をタップすると確認できます。
Q52: 管理者モードとは？どうやってオンにするの？ A: 管理者モードは、記録の編集や個人IDの確認等ができる権限です。設定タブの「管理者設定」にある「管理者モード」スイッチをオンにし、団体パスワードを入力すると有効になります。

【回答スタイルに関する重要指示】
・回答に「**」や「*」などのMarkdown記号を一切使用しないでください。
・強調したい場合は、記号ではなく言葉や適切な改行、または「」などの括弧を使ってください。
・箇条書きにする場合は「・」や「1.」などの一般的な全角記号を使用してください。`;

const AIChatBot = () => {
  const { activeRole, members = [], sessions = [], currentRouteName } = useScoreStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([
    { role: "model", text: "こんにちは！弓道スコア管理AIアシスタントです。選手選びの相談や、的中傾向の分析、アプリの使い方など、何でも聞いてください。" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);

  if (activeRole !== "group" || currentRouteName === "記録") {
    return null;
  }

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    const userMsg = inputText.trim();
    setInputText("");
    
    const newMessages = [...messages, { role: "user", text: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // 部員データの拡張計算
      const memberDataStrings = members.map(member => {
        const userSessions = sessions
          .filter(session => session.archers.some(a => a.memberId === member.id || a.name === member.name))
          .sort((a, b) => b.created - a.created);
        
        const totalSessions = userSessions.length;
        let totalMarks = 0, hitMarks = 0, kaichu = 0;
        let recentTotal = 0, recentHit = 0;

        userSessions.forEach((session, idx) => {
          const archer = session.archers.find(a => a.memberId === member.id || a.name === member.name);
          if (archer && archer.marks) {
            archer.marks.forEach(m => {
              if (m === '○' || m === '×') {
                totalMarks++;
                if (m === '○') hitMarks++;
                
                // 直近10回のセッションでの的中
                if (idx < 10) {
                  recentTotal++;
                  if (m === '○') recentHit++;
                }
              }
            });

            // 皆中判定
            for (let i = 0; i < Math.floor(archer.marks.length / 4); i++) {
              const group = archer.marks.slice(4 * i, 4 * (i + 1));
              if (group.length === 4 && group.every(m => m === '○')) kaichu++;
            }
          }
        });

        const totalRate = totalMarks > 0 ? ((hitMarks / totalMarks) * 100).toFixed(1) : '0';
        const recentRate = recentTotal > 0 ? ((recentHit / recentTotal) * 100).toFixed(1) : '0';
        const gradeLabel = member.grade >= 5 ? '卒業生' : `${member.grade}年`;

        return `${member.name}(${gradeLabel}): 参加${totalSessions}回, 全体的中${totalRate}%(計${totalMarks}射), 直近10回的中${recentRate}%, 皆中${kaichu}回`;
      }).join('\n');

      const fullInstruction = `${systemInstructionText}\n\n[部員データ]\n${memberDataStrings}`;

      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      
      // Function Calling の宣言
      const tools = [{
        functionDeclarations: [
          {
            name: "getDetailedMemberStats",
            description: "指定した選手の過去の詳細な成績データを取得します。初矢の成績や立順ごとの成績などを分析する際に呼び出してください。",
            parameters: {
              type: "OBJECT",
              properties: {
                memberName: { type: "STRING", description: "選手の名前" }
              },
              required: ["memberName"]
            }
          }
        ]
      }];

      const model = genAI.getGenerativeModel({ 
        model: "gemini-flash-latest", 
        systemInstruction: fullInstruction,
        tools: tools
      });

      const chat = model.startChat({
        history: newMessages.slice(1).map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }]
        }))
      });

      console.log('[AIChatBot] Sending message with Function Calling enabled...');
      let result = await chat.sendMessage([{text: userMsg}]);
      let response = await result.response;
      
      // Function Calling の処理ループ
      const calls = response.functionCalls ? response.functionCalls() : [];
      if (calls && calls.length > 0) {
        const call = calls[0];
        console.log('[AIChatBot] Function Called:', call.name, call.args);
        
        if (call.name === "getDetailedMemberStats") {
          const targetName = call.args.memberName;
          const targetMember = members.find(m => m.name.includes(targetName));
          let statsData = { error: "選手が見つかりませんでした。" };
          
          if (targetMember) {
            let firstShotTotal = 0, firstShotHit = 0;
            let omaeTotal = 0, omaeHit = 0;
            let ochiTotal = 0, ochiHit = 0;
            
            sessions.forEach(session => {
              const archerIdx = session.archers.findIndex(a => a.memberId === targetMember.id || a.name === targetMember.name);
              if (archerIdx !== -1) {
                const archer = session.archers[archerIdx];
                if (archer.marks && archer.marks.length > 0) {
                  // 初矢
                  if (archer.marks[0] === '○' || archer.marks[0] === '×') {
                    firstShotTotal++;
                    if (archer.marks[0] === '○') firstShotHit++;
                  }
                  // 大前 (1番目)
                  if (archerIdx === 0) {
                    archer.marks.forEach(m => {
                      if (m === '○' || m === '×') {
                        omaeTotal++;
                        if (m === '○') omaeHit++;
                      }
                    });
                  }
                  // 落 (最後、3人以上の場合)
                  if (session.archers.length >= 3 && archerIdx === session.archers.length - 1) {
                    archer.marks.forEach(m => {
                      if (m === '○' || m === '×') {
                        ochiTotal++;
                        if (m === '○') ochiHit++;
                      }
                    });
                  }
                }
              }
            });
            
            statsData = {
              name: targetMember.name,
              firstShotHitRate: firstShotTotal > 0 ? ((firstShotHit / firstShotTotal) * 100).toFixed(1) + "%" : "データなし",
              omaeHitRate: omaeTotal > 0 ? ((omaeHit / omaeTotal) * 100).toFixed(1) + "%" : "データなし",
              ochiHitRate: ochiTotal > 0 ? ((ochiHit / ochiTotal) * 100).toFixed(1) + "%" : "データなし"
            };
          }
          
          // 関数実行結果をモデルに返す
          result = await chat.sendMessage([{
            functionResponse: {
              name: "getDetailedMemberStats",
              response: statsData
            }
          }]);
          response = await result.response;
        }
      }

      const responseText = response.text();
      setMessages([...newMessages, { role: "model", text: responseText }]);

    } catch (error) {
      console.error("AIChatBot Send Error:", error);
      let errorMsg = "通信エラーが発生しました。";
      if (error.message?.includes("503")) {
        errorMsg = "ただいまAIが混み合っています。しばらく待ってからもう一度送信してください。";
      } else if (error.message?.includes("404")) {
        errorMsg = "AIモデルが見つかりません。API設定を確認してください。";
      } else if (error.message?.includes("403")) {
        errorMsg = "APIキーの権限がありません。Google CloudでAPIを有効化してください。";
      } else {
        errorMsg = `エラー: ${error.message}`;
      }
      setMessages([...newMessages, { role: "model", text: errorMsg }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
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
              <_TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#8E8E93" />
              </_TouchableOpacity>
            </_View>

            <_ScrollView
              ref={scrollViewRef}
              style={styles.messageArea}
              contentContainerStyle={{ padding: 16 }}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((msg, idx) => (
                <_View key={idx} style={[styles.messageBubble, msg.role === "user" ? styles.userBubble : styles.modelBubble]}>
                  <_Text style={[styles.messageText, msg.role === "user" ? styles.userText : styles.modelText]}>
                    {msg.text}
                  </_Text>
                </_View>
              ))}
              {isLoading && (
                <_View style={[styles.messageBubble, styles.modelBubble, { flexDirection: "row", alignItems: "center" }]}>
                  <_ActivityIndicator size="small" color="#007AFF" style={{ marginRight: 8 }} />
                  <_Text style={styles.modelText}>考え中...</_Text>
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
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#007AFF", justifyContent: "center", alignItems: "center" }
});