"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.AIChatBot = void 0;

const React = require("react");
const { useState, useRef, useEffect } = React;
const RN = require("react-native");
const _View = RN.View;
const _Text = require("./default_217").default; // テーマ変換を通すためブリッジ経由
const _StyleSheet = require("./default_45").default; // テーマ変換を通すためブリッジ経由
const _TouchableOpacity = RN.TouchableOpacity;
const _Modal = RN.Modal;
const _TextInput = require("./default_398").default; // テーマ変換（既定文字色）を通すためブリッジ経由
const _ScrollView = RN.ScrollView;
const _ActivityIndicator = RN.ActivityIndicator;
const _KeyboardAvoidingView = RN.KeyboardAvoidingView;
const _Dimensions = RN.Dimensions;
const _Animated = RN.Animated;
const _PanResponder = RN.PanResponder;

const { Ionicons } = require("./AntDesign_600");
const { GoogleGenerativeAI } = require("./h_1035");
const { useScoreStore } = require("./JP_useScoreStore_174");
const { useNavigation } = require("@react-navigation/native");
const { GEMINI_API_KEY } = require("./IS_WEB_199");
// 成績の集計・並べ替え・絞り込みは、模型ではなくここで済ませる。
// 人数ぶんの表を渡して選ばせると取り違えるため（test/chatStats.test.js）
const { 全員の成績, 出欠の集計, 記録をさがす, 射位ごとの成績 } = require("./chatStats");
// 「何でも聞いてください」だけでは何を聞けるか分からない。
// その団体の中身に合わせた質問例を出す（test/chatSuggestions.test.js）
const { 質問例, 打ちかけの候補, 分類ごと } = require("./chatSuggestions");
// 言い換えて聞かれても当てるための、コードだけの近さ測り（外のAPIは使わない）
const { 引きをつくる, 近い順 } = require("./textMatch");
const { getShadowStyle } = require("./module_592");
const { jsx, jsxs, Fragment } = require("./module_427");

// --- システムプロンプト（動的Q&A注入方式） ---

const systemInstructionBase = `あなたは「Kyudo Score Manager」専用の、弓道の記録を読み解き、アプリの使い方を案内するアシスタントです。
話し相手は部活動の管理者です。次の2つを行ってください。

1. [データを読む] ツールで取ってきた記録に基づいて、選手選考の助けになる見立てや、的中の傾向を伝える。
2. [使い方の案内] アプリの仕様の質問には、下の【アプリ操作・仕様Q&A】だけを根拠に答える。

【できないこと（正直に断ること）】
・Web検索はできません。手元にあるのは、この団体の記録とQ&Aだけです。
・弓道の一般知識やルール、大会の日程など、記録とQ&Aの外のことは調べられません。聞かれたら「このアプリの記録の外なので分かりません」と断ってください。知っている範囲で一般論を述べるのは構いませんが、調べた結果のように言わないでください。
・アプリの画面や操作を推測で語らないでください。「三本線のメニュー」のような、Q&Aに無い言い方を創作するのは固く禁じます。Q&Aに無いことは「分かりません」と答えてください。

【数字の扱い（守ること）】
・的中数・射数・的中率・順位・出席率は、必ずツールが返した値をそのまま使ってください。自分で足し算・割り算・並べ替えをしないでください。
・ツールを呼ばずに、部員一覧や会話の記憶から成績を答えないでください。分からなければツールを呼んでください。
・ツールが返していない期間や人については「その範囲は集計していない」と伝え、数字を作らないでください。
・「一番」「上位」「ランキング」と聞かれたら、並べ替えと件数の指定をツールに渡し、返ってきた順番のまま答えてください。
・射数の少ない人の高い的中率をそのまま上位に出すと誤解を招きます。ランキングでは最小射数の指定を検討し、率だけでなく射数も添えてください。

【どのツールを使うか】
・全員の成績・ランキング → getAllMembersStats（並び順・件数・最小射数を指定できます）
・一人の詳しい成績（1射ごと、大前・落など） → getDetailedMemberStats
・射位ごとの的中率（立ち順を考える材料） → getPositionStats
・出欠・出席率 → getAttendanceStats
・日付が分かっている記録 → getSessionsByDate
・日付が分からない記録を言葉で探す → searchSessions
・画面を開く → navigateToScreen
・部員を追加 → addMember
部員一覧に載っていない人でも、過去の記録にゲストや交代相手として出ていることがあります。「見当たらない」と自分で決めつけず、必ずツールで確かめてください。

【立ち順を尋ねられたとき】
・getPositionStats の数字を根拠に提案してください。誰をどこに置くかを決めるのは人です。断定せず、数字と、射数が少ない場合はその旨を添えてください。

【弓道用語の読み方（厳守）】
読み仮名やルビをふるとき、誤った読み方を決して使わないでください。
  - 大前：おおまえ（「おまえ」は誤り）
  - 二的：にてき（「にまと」は誤り）
  - 三的：さんてき（「みさん」は誤り）
  - 中：なか
  - 落前：おちまえ
  - 落：おち（「らく」は誤り）
  - 留矢：とめや / 甲矢：はや / 乙矢：おとや / 皆中：かいちゅう
・立ちの人数に応じて、正しい立ち順の名称（大前、二的、三的、中、落前、落など）を使い分けてください。「三的」は4人立ち以上で3番目を指す実在の用語です。
・読み仮名を勝手に創作することは厳禁です。

【アプリの言葉づかい（画面と揃えること）】
・的中を入れる四角は「マス」と呼びます。「セル」「枠」とは呼ばないでください。
・指で触れる操作は「押す」と書きます。「タップ」とは書かないでください（ただし「誤タップ防止」は機能の名前なのでそのまま使います）。
・4射のまとまりは「立（たち）」、その何番目かは「立目（たちめ）」です。「ラウンド」とは呼ばないでください。
・画面の名前は「記録」「履歴」「分析」「メンバー」「出欠」「設定」です。

【部員の追加について】
・部員を追加するときは、先に「登録しました」とテキストで答えないでください。必ず addMember ツールを呼んでください。呼ぶと画面に承認のカードが出て、利用者が押して初めて登録されます。
・複数人をまとめて頼まれたら、addMember を同時に複数回呼んでください。一度に複数のカードを出せます。
・ツールを呼ぶときは、擬似コードや解説などの余計な文を一緒に出さず、呼び出しだけを行ってください。

【答え方】
・「**」や「*」などのMarkdown記号は一切使わないでください。
・強調は記号ではなく、言葉や改行、「」で行ってください。
・箇条書きは「・」や「1.」を使ってください。
・数字を挙げるときは、いつの期間のものかを必ず添えてください。
・長くなりすぎないようにしてください。聞かれたことに先に答え、補足は後に短く付けてください。`;


// Q&Aデータ（キーワード付き・動的注入用／文章は原文のまま）
const qaData = [
  { k: ['タブ','構成','使い方','機能'], t: 'Q0: アプリの上部にあるタブはそれぞれ何に使うの？\nA: それぞれ以下の機能があります。・【記録】今日の立ち（チーム）を作り、的中を入力します。・【履歴】過去のデータの確認や修正、削除を行います。・【分析】部全体の調子や、個人の詳細成績、ランキングを確認します。・【出欠管理】カレンダーで正規練習日を決め、出席率を確認します。・【メンバー】部員の追加や削除を行います。・【設定】CSVでの書き出しや自動進級設定等を行います。' },
  { k: ['入力','的中','矢','押す','○','×','付け','つけ'], t: 'Q1: 的中記録はどうつける？\nA: 画面下部の「人」ボタンで射手を追加し、各矢の箇所を押して○/×を入力します。' },
  { k: ['遅刻','早退','出欠','変更'], t: 'Q2: 遅刻や早退の記録は？\nA: 記録タブの「終了・保存」ボタンを押すと出欠確認画面が表示され、各メンバーの出欠状態（出席・遅刻・早退・欠席等）を選択できます。後から修正する場合は、管理者モードで履歴詳細を開き「≡」メニュー→「記録を編集」から変更できます。' },
  { k: ['正規','練習日','カレンダー','登録','予定'], t: 'Q3: 正規練習日の設定方法は？\nA: 出欠管理タブのカレンダーで日付を押すと登録されます。カメラ（AI）で予定表をスキャンして自動入力することも可能です。' },
  { k: ['出席率','出欠率'], t: 'Q4: 出席率は確認できる？\nA: 出欠管理タブで、月間や年間の全体および個人の出席率を自動計算して表示します。' },
  { k: ['まとめて','一括','複数','出欠'], t: 'Q5: まとめて出欠を変更できる？\nA: 管理者モードをオンにした状態で履歴タブから記録を押して詳細画面を開き、画面右上の「≡」（ハンバーガー）メニューから「記録を編集」を選ぶと各メンバーの出欠状態を変更できます。' },
  { k: ['人数','制限','立ち','何人'], t: 'Q6: 立ちの人数制限はある？\nA: 特に制限はありませんが、画面の表示幅に応じてスクロールになります。' },
  { k: ['卒業生','混在','一緒','現役'], t: 'Q7: 現役と卒業生は一緒に記録できる？\nA: メンバー選択画面で現役生と卒業生が分かれて表示され、混在して立ちを組めます。' },
  { k: ['初矢','一本目','最初'], t: 'Q8: 初矢だけ外した場合はわかる？\nA: 「×○○○」のように入力すれば自動で初矢失中として保存されます。' },
  { k: ['途中','参加','遅れ'], t: 'Q9: 途中から参加した人は？\nA: 練習に遅れて来た人のことなら、射手として追加して記録をつけ、保存のときに出欠を「遅刻」にします。立の途中で射手が入れ替わったことなら、出欠ではなく「途中交代」を使います（Q55）。' },
  { k: ['記録タブ','過去','今日'], t: 'Q10: 記録タブに過去のデータは出る？\nA: 記録タブは今日の入力用です。過去のデータは履歴タブを見ます。' },
  { k: ['修正','直す','間違え','編集'], t: 'Q11: 過去の的中記録を間違えた場合は？\nA: 管理者モードで履歴タブから対象の記録を押すし、詳細画面で各矢の○/×を押すと記録を変更できます。' },
  { k: ['検索','探す','日付'], t: 'Q12: 特定の日付のセッションを探したい\nA: 履歴タブ上部の検索バーから、日付やタイトルで検索できます。' },
  { k: ['削除','消す','消したい'], t: 'Q13: 練習日そのものを消すには？\nA: 履歴タブの一覧画面右上の「編集」を押して削除したい記録を選択、または記録詳細画面のゴミ箱アイコンから「ゴミ箱に移動」で削除できます。' },
  { k: ['復元','戻す','元に戻','ゴミ箱'], t: 'Q14: 間違えて消した記録は戻せる？\nA: 削除したデータは一度「ゴミ箱」に入り、そこから復元可能です。ゴミ箱を空にすると完全削除されます。' },
  { k: ['出欠','直せ','修正'], t: 'Q15: 過去の出欠も直せる？\nA: 管理者モードであれば修正可能です。' },
  { k: ['全体的中率','履歴','表示'], t: 'Q16: 履歴に表示される「全体的中率」とは？\nA: 履歴一覧には参加人数と矢数が表示されます。的中率は各詳細または分析タブで確認します。' },
  { k: ['オフライン','通信','圏外','見れ'], t: 'Q17: オフラインでも履歴は見れる？\nA: キャッシュが残っていればオフラインでも見れますが、最新データは通信が必要です。' },
  { k: ['期','表示'], t: 'Q18: 履歴に「期」が表示される？\nA: 卒業生の場合は「期（termKi）」が表示され、期ごとにグループ化されます。' },
  { k: ['古い','読み込まれない','表示されない'], t: 'Q19: 古い履歴が読み込まれない\nA: データが消えたわけではなく、通信負荷軽減のために非表示になっているだけです。' },
  { k: ['自分','参加していない','他の人'], t: 'Q20: 自分が参加していない履歴も見える？\nA: メンバーアカウントの場合は、自分が参加した練習の履歴のみが表示されます。' },
  { k: ['全体','調子','グラフ','推移'], t: 'Q21: 全体の調子を知りたい\nA: 分析タブの全体グラフで月別の部全体の的中率推移が確認できます。' },
  { k: ['個人','詳細','成績'], t: 'Q22: 個人の詳細な成績は見れる？\nA: 分析タブで個人を選ぶと、日別の成績グラフが表示されます。' },
  { k: ['立順','大前','落','番目'], t: 'Q23: アプリで個人の立順ごとの成績は見れる？\nA: アプリの画面上にはありませんが、私に「〇〇さんの大前での成績を教えて」と聞いてください。射位ごとの的中率を集計してお答えします。射数の少ない射位は数字が揺れるので、射数も一緒にお伝えします。' },
  { k: ['初矢','1本目','的中率'], t: 'Q24: 初矢（1本目）の的中率は？\nA: 個人分析画面で「初矢的中率」として算出されています。' },
  { k: ['皆中','4射4中'], t: 'Q25: 皆中（4射4中）の回数はわかる？\nA: 個人分析に皆中回数が表示されます。' },
  { k: ['羽分け','2中'], t: 'Q26: 羽分け（4射2中）のデータはある？\nA: 個人分析画面で羽分け回数なども確認できます。' },
  { k: ['最近','1ヶ月','直近'], t: 'Q27: 最近1ヶ月の調子だけ見れる？\nA: 分析タブのグラフの右端が最新の調子を示しています。' },
  { k: ['卒業生','分析'], t: 'Q28: 卒業生の分析もできる？\nA: はい、メンバー選択で卒業生を選べば過去のデータも分析できます。' },
  { k: ['期','比較'], t: 'Q29: 「期」ごとの比較はできる？\nA: アプリ上には直接の機能はありませんが、データがあればAI（私）が比較します。' },
  { k: ['ランキング','順位','一番'], t: 'Q30: 誰が一番中っているかランキングはある？\nA: 分析タブの下部に、メンバー別の的中率ランキング（成績一覧）が表示されます。' },
  { k: ['追加','新入','登録','入部'], t: 'Q31: 新入部員を追加するには？\nA: メンバータブ右上の「メンバー追加」アイコンボタンを押すし、名前、学年、性別を登録します。' },
  { k: ['学年','進級','4月','自動'], t: 'Q32: 年度が変わったら学年はどうする？\nA: 設定タブの「4月1日の自動進級」がオンになっていれば、すべてのメンバーの学年が自動で更新されます。手動で少しずつ行う場合は、メンバータブで各部員を押して個別に学年を変更する必要があります。' },
  { k: ['4年生','5年','卒業','進級'], t: 'Q33: 4年生が進級するとどうなる？\nA: 「卒業生」としてシステムに残り続けます。' },
  { k: ['卒業生','データ','消えない'], t: 'Q34: 卒業生のデータは消えないの？\nA: 消えません。過去の記録もそのまま残ります。' },
  { k: ['卒業生','非表示','画面','消したい'], t: 'Q35: 卒業生を画面上から消したい場合は？\nA: メンバータブでその人を押すし「削除」を行えば消えます。' },
  { k: ['名前','変更','変えたい'], t: 'Q36: メンバーの名前を変えたい\nA: メンバータブで対象者を押すと名前の編集ができます。' },
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
  { k: ['メンバーアカウント','個人ID','メンバーログイン','ログイン'], t: 'Q51: メンバーアカウントでログインするには？\nA: ログイン画面で「メンバー」を選び、団体IDと個人IDを入力します。個人ID（4桁の数字）は、管理者モードをオンにした状態で、メンバータブから各部員を押すと確認できます。' },
  { k: ['管理者','管理者モード','管理者設定'], t: 'Q52: 管理者モードとは？どうやってオンにするの？\nA: 管理者モードは、記録の編集や個人IDの確認等ができる権限です。設定タブの「管理者設定」にある「管理者モード」スイッチをオンにし、団体パスワードを入力すると有効になります。' },
  { k: ['ライブ','リアルタイム','同時','複数','共有','一緒'], t: 'Q53: 何人かで同時に記録できる？\nA: できます。記録タブの「ライブ」を押してライブ名を決めると、ほかの端末から同じライブに参加できます。参加した全員の○×がその場で全員の画面に届きます。取り消し・やり直しも全員に伝わります。' },
  { k: ['閲覧','見るだけ','見学','記録用','参加のしかた'], t: 'Q54: ライブに参加するとき、間違えて触らないようにできる？\nA: できます。ライブに参加するとき「記録用」か「閲覧用」を選べます。閲覧用は画面を見るだけで、○×・矢所・鍵・途中交代・人の追加・射数の変更・保存のいずれもできません。押すと「閲覧用で参加しています」と短く出ます。記録する担当が決まっているときに使ってください。' },
  { k: ['交代','途中','入れ替','立目','代わり'], t: 'Q55: 途中で射手が代わったときは？\nA: 名前のマスを押して「途中交代」を開くと、交代するところを一覧から選べます。開いたときは「立目」で、たとえば2立目を選ぶと5射目からの交代になります。1射ずつ選びたいときは「射目」に切り替えてください。交代相手は学年でまとまっていて、開け閉めできます。' },
  { k: ['交代','取り消し','消す','解除','間違え'], t: 'Q56: 入れた途中交代を取り消すには？\nA: 名前のマスを押すと、入っている交代が「5射目〜 田中 の交代を取り消す」のように並びます。押すとその1つだけ取り消せます。取り消し（元に戻す）ボタンでも戻せます。' },
  { k: ['計','合計','内訳','合算','個人の計'], t: 'Q57: 途中交代があるときの「計」の見方は？\nA: 交代が入っていると、計は「山田 3, 田中 2」のように誰が何中したかの内訳で出ます。その計を押すと合わせた数（5）に切り替わり、もう一度押すと内訳へ戻ります。' },
  { k: ['横','向き','レイアウト','並べ方','縦'], t: 'Q58: 記録表を横向きにできる？\nA: できます。記録画面の左下、取り消し・やり直しのとなりにある「横へ」を押すと、名前が左・○×が右へ伸びる並べ方に変わります。射数は左から右へ、人は上から下へ、個人の計は一番右に出ます。「縦へ」で元に戻ります。選んだ並べ方はその端末に残ります。' },
  { k: ['広く','畳','隠す','帯','取っ手','狭い'], t: 'Q59: 記録表をもっと広く使いたい\nA: 記録表の右上にある丸い印を押すと、上下の操作の帯が隠れて記録表が広がります。もう一度押すと戻ります。畳んだままかどうかはその端末に残ります。画面を移る帯（記録・履歴…）は隠れません。' },
  { k: ['鍵','誤タップ','触れ','消え','灰色','長押し'], t: 'Q60: 入れた○×が手や袖で消えてしまう\nA: 誤タップ防止が働きます。○×を入れて3秒たつとそのマスは薄い灰色になり、押しても変わらなくなります。直したいときはそのマスを長押ししてください。そこだけ開き「このマスの鍵を開けました」と出ます。1立が全部埋まったときは、間隔と計の鍵も自動でかかります。こちらは鍵を押して開けます。' },
  { k: ['画像','写真','読み取り','紙','手書き','カメラ'], t: 'Q61: 紙の記録表を写真から取り込める？\nA: できます。記録画面下の「画像」を押して、紙の的中記録表の写真を選ぶと読み取ります。同じ表の続きなら複数枚まとめて選べます。読み取った結果は取り込む前に確認できます。手書きなので読み違えることがあります。取り込んだあとに必ず見比べてください。' },
  { k: ['確認','ポップアップ','窓','知らせ','帯','出る'], t: 'Q62: 削除の確認などが出る場所が変わった？\nA: 変わりました。以前はブラウザの窓で出ていた確認とお知らせを、すべてアプリの中に出すようにしました。選んでもらう確認は画面の中の窓で止まり、短いお知らせは画面の下に帯で出て自分で消えます。団体IDの控えのような長いお知らせは、押して閉じるまで残ります。' },
  { k: ['矢所','矢どころ','どこ','当たった場所'], t: 'Q63: 矢が的のどこに当たったか残せる？\nA: 残せます。マスを長押しすると矢所を記録できます。ライブ中は矢所も相手の画面に届きます。' },
  { k: ['表示','大きさ','小さい','見えない','拡大','縮小','文字','サイズ'], t: 'Q64: 文字やマスが小さくて見えない\nA: 記録画面の上にある「表示」の−と＋で、記録表の大きさを変えられます。押すといまの倍率（100%など）が出ます。人数が多くて横に収まらないときは小さく、手元で入れにくいときは大きくしてください。「表示の大きさ」はその端末に残ります。' },
];

// ユーザーの質問に関連するQ&Aを最大8件選んで返す
// 送るQ&Aの数。多すぎると模型の注意が散り、少なすぎると取りこぼす。
// 64件すべて送ると約2,500トークンで、選ぶ意味が無くなるうえ注意も散る
const QAの件数 = 12;

// どれも当たらなかったときに必ず入れる基本。ここが空だと、
// 「Q&Aだけを根拠に答えよ」と指示しているのに根拠が届かない
const 基本のQA = ['Q0:', 'Q1:', 'Q52:'];

// 近さの引きは一度だけ作る。質問のたびに作り直す必要はない。
// 本文に加えてキーワードも混ぜる（書き手が想定した言い方が入っている）
const QAの引き = 引きをつくる(qaData.map((qa, i) => ({ id: i, 文: qa.t + ' ' + qa.k.join(' ') })));

/**
 * 質問に関係するQ&Aを選ぶ。
 *
 * キーワード一致は正確だが、言い換えられると当たらない。
 * 文字の二つ組は言い換えに強いが、当てずっぽうも混じる。
 * 片方だけだと取りこぼすので、両方の点を足して並べる。
 */
const selectQAs = (userMsg) => {
  const 近さ = new Map();
  近い順(QAの引き, userMsg, { 下限: 0.02 }).forEach((x) => 近さ.set(x.id, x.近さ));

  const scored = qaData
    .map((qa, i) => {
      const 語の一致 = qa.k.filter((kw) => userMsg.includes(kw)).length;
      // キーワード1つを、近さ0.1ぶんとして数える
      return { qa, 点: 語の一致 * 0.1 + (近さ.get(i) || 0) };
    })
    .filter((x) => x.点 > 0)
    .sort((a, b) => b.点 - a.点)
    .slice(0, QAの件数)
    .map((x) => x.qa);

  // 当たりが薄いときは基本を足す。まったく無いまま送らない
  基本のQA.forEach((印) => {
    const 基本 = qaData.find((qa) => qa.t.startsWith(印));
    if (基本 && !scored.includes(基本)) scored.push(基本);
  });

  // 近いものほど後ろへ。指示に近い位置の方が効きやすい
  return scored.reverse().map((qa) => qa.t).join('\n');
};

const generateMsgId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
const CHAT_HISTORY_KEY = 'aiChatMessages_v1';
const MAX_SAVED_MESSAGES = 50;

const loadChatHistory = () => {
  try {
    const saved = typeof localStorage !== 'undefined' && localStorage.getItem(CHAT_HISTORY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map(msg => msg.id ? msg : { ...msg, id: generateMsgId() });
      }
    }
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
  // 質問例。部員と記録が変わったときだけ作り直す
  const 例たち = React.useMemo(
    () => 質問例({ 人たち: members, 記録たち: sessions, いま: new Date() }),
    [members, sessions]
  );
  // 打ちかけの候補。何も打っていないときは出さない（入口の例と重なるため）
  const 候補たち = React.useMemo(
    () => (inputText.trim() ? 打ちかけの候補(inputText, 例たち, 3) : []),
    [inputText, 例たち]
  );
  const defaultMessages = [{ id: "default-msg", role: "model", text: "こんにちは！弓道スコア管理AIアシスタントです。選手選びの相談や、的中傾向の分析、アプリの使い方など、何でも聞いてください。" }];
  const [messages, setMessages] = useState(() => loadChatHistory() || defaultMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);

  useEffect(() => { saveChatHistory(messages); }, [messages]);
  const scrollViewRef = useRef(null);

  const [layoutWidth, setLayoutWidth] = useState(_Dimensions.get("window").width);
  const [layoutHeight, setLayoutHeight] = useState(_Dimensions.get("window").height);
  
  const onLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setLayoutWidth(width);
    setLayoutHeight(height);
  };

  // --- ドラッグ移動用のステート ＆ 追従ロジック ---
  const pan = useRef(new _Animated.ValueXY()).current;
  const currentPos = useRef({ x: 0, y: 0 });
  const snapXRef = useRef("right");
  const snapYRef = useRef("bottom");
  const isDragging = useRef(false);

  // 画面リサイズ時に現在のスナップ状態を維持したまま正しい位置へ追従
  useEffect(() => {
    const initX = layoutWidth - 20 - 60;
    const initY = layoutHeight - 20 - 60;
    
    const targetX = snapXRef.current === "left" ? 20 - initX : 0;
    const targetY = snapYRef.current === "top" ? 60 - initY : 0;
    
    currentPos.current = { x: targetX, y: targetY };
    pan.setValue({ x: targetX, y: targetY });
  }, [layoutWidth, layoutHeight]);

  const panResponder = useRef(
    _PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
      onPanResponderGrant: () => {
        isDragging.current = false;
        pan.setOffset({ x: currentPos.current.x, y: currentPos.current.y });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, g) => {
        if (Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2) {
          isDragging.current = true;
        }
        
        const initX = layoutWidth - 20 - 60;
        const initY = layoutHeight - 20 - 60;
        
        const offsetX = currentPos.current.x;
        const offsetY = currentPos.current.y;
        
        let absX = initX + offsetX + g.dx;
        let absY = initY + offsetY + g.dy;
        
        const minAbsX = 20;
        const maxAbsX = layoutWidth - 20 - 60;
        const minAbsY = 60;
        const maxAbsY = layoutHeight - 20 - 60;
        
        if (absX < minAbsX) absX = minAbsX;
        if (absX > maxAbsX) absX = maxAbsX;
        if (absY < minAbsY) absY = minAbsY;
        if (absY > maxAbsY) absY = maxAbsY;
        
        const nextX = absX - initX - offsetX;
        const nextY = absY - initY - offsetY;
        
        pan.setValue({ x: nextX, y: nextY });
        currentPos.current = { x: offsetX + nextX, y: offsetY + nextY };
      },
      onPanResponderRelease: (_, g) => {
        pan.flattenOffset();
        if (!isDragging.current) {
          setModalVisible(true);
        } else {
          const initX = layoutWidth - 20 - 60;
          const initY = layoutHeight - 20 - 60;
          
          const isLeft = Math.abs(g.vx) > 0.2 ? g.vx < 0 : g.dx < 0;
          const isTop = Math.abs(g.vy) > 0.2 ? g.vy < 0 : g.dy < 0;
          
          snapXRef.current = isLeft ? "left" : "right";
          snapYRef.current = isTop ? "top" : "bottom";
          
          const snapTopY = 60;
          
          const targetX = isLeft ? 20 - initX : 0;
          const targetY = isTop ? snapTopY - initY : 0;
          
          currentPos.current = { x: targetX, y: targetY };
          
          _Animated.spring(pan, {
            toValue: { x: targetX, y: targetY },
            useNativeDriver: false
          }).start();
        }
      }
    })
  ).current;

  if (activeRole !== "group" || currentRouteName === "記録") {
    return null;
  }

  const handleActionResponse = (msgId, isApproved) => {
    const targetMsgIndex = messages.findIndex(m => m.id === msgId);
    if (targetMsgIndex === -1) return;
    const targetMsg = messages[targetMsgIndex];
    if (!targetMsg || targetMsg.status !== 'pending') return;
    
    const updatedMessages = [...messages];
    updatedMessages[targetMsgIndex] = { ...targetMsg, status: isApproved ? 'approved' : 'rejected' };
    
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
        // 部員の追加は団体ログインのときだけ通る（ストア側で止めている）。
        // 確かめずに「追加しました」と出していたため、個人で入っている人には
        // 権限エラーの帯と「追加しました」が同時に出ていた
        if (activeRole !== 'group') {
          updatedMessages.push({
            id: generateMsgId(),
            role: 'model',
            text: 'メンバーの追加は団体ログインのときだけできます。追加していません。',
          });
        } else {
          addMember(name, finalGender, grade);
          updatedMessages.push({ id: generateMsgId(), role: 'model', text: `${name}さんをメンバーに追加しました。` });
        }
      }
    } else {
      updatedMessages.push({ id: generateMsgId(), role: 'model', text: `操作をキャンセルしました。` });
    }
    
    setMessages(updatedMessages);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    const userMsg = inputText.trim();
    setInputText("");
    
    const newMessages = [...messages, { id: generateMsgId(), role: "user", text: userMsg }];
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
      // 基本の指示（systemInstructionBase）に、その日・その団体でしか
      // 決まらないものだけを足す。決まりごとを二重に書くと、食い違ったときに
      // どちらが効いているか分からなくなる
      const fullInstruction =
        systemInstructionBase +
        qaSection +
        `\n\n[今日の日付: ${todayStr} / 昨日: ${yesterdayStr}]` +
        `\n[部員一覧（計${members.length}名）]\n${memberList}`;

      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      
      // Function Calling の宣言
      const tools = [{
        functionDeclarations: [
          {
            name: "getAllMembersStats",
            description: "全部員の成績を集計し、順位を付けて返します。「全員の5月の的中率を教えて」「部員のランキングを見せて」「一番当てているのは誰」などに使います。順位付け・並べ替え・絞り込みはこのツールが行うので、返ってきた順番と数字をそのまま使ってください。自分で並べ替えたり足し算したりしないでください。",
            parameters: {
              type: "OBJECT",
              properties: {
                dateFrom: { type: "STRING", description: "集計対象期間の開始日 (YYYY-MM-DD形式)。例: '2026-05-01'" },
                dateTo: { type: "STRING", description: "集計対象期間の終了日 (YYYY-MM-DD形式)。例: '2026-05-31'" },
                sortBy: { type: "STRING", description: "並び順。'的中率'（既定）, '的中数', '射数', '名前' のいずれか" },
                limit: { type: "INTEGER", description: "上位何人を返すか。「トップ3」なら3。省略すると全員" },
                minShots: { type: "INTEGER", description: "この射数に満たない人を順位から外す。既定は1。少ない射数の高い的中率を上位に出したくないときは10〜20を指定する" }
              }
            }
          },
          {
            name: "getAttendanceStats",
            description: "部員の出欠を集計し、順位を付けて返します。「今月いちばん練習に来ているのは誰」「◯◯さんの出席率は」「休みが多いのは誰」などに使います。遅刻・早退は「来た」に数えます。出欠を付けずに保存された記録は数に入れません。順位・並べ替えはこのツールが行うので、返った順番と数字をそのまま使ってください。",
            parameters: {
              type: "OBJECT",
              properties: {
                dateFrom: { type: "STRING", description: "集計対象期間の開始日 (YYYY-MM-DD形式)" },
                dateTo: { type: "STRING", description: "集計対象期間の終了日 (YYYY-MM-DD形式)" },
                sortBy: { type: "STRING", description: "並び順。'出席率'（既定）, '来た回数', '欠席', '名前' のいずれか" },
                limit: { type: "INTEGER", description: "上位何人を返すか。省略すると全員" }
              }
            }
          },
          {
            name: "searchSessions",
            description: "記録を言葉で探します。題・覚え書き・目印（タグ）・出ている人の名前を見ます。「雨で中断した練習はいつ」「審査のタグが付いた記録を見せて」「山田さんが出た記録」など、日付が分からないときに使います。日付が分かっているときは getSessionsByDate を使ってください。",
            parameters: {
              type: "OBJECT",
              properties: {
                keyword: { type: "STRING", description: "探す言葉。空にすると期間内すべて" },
                dateFrom: { type: "STRING", description: "期間の開始日 (YYYY-MM-DD形式)" },
                dateTo: { type: "STRING", description: "期間の終了日 (YYYY-MM-DD形式)" },
                limit: { type: "INTEGER", description: "何件まで返すか。既定は20" }
              }
            }
          },
          {
            name: "getPositionStats",
            description: "射位（大前・2番・落など）ごとの的中率を返します。立ち順を考えるときの材料です。「大前に向いているのは誰」「落で強いのは」「山田さんは大前と落でどちらが良い」などに使います。誰をどこに置くかはこのツールでは決めません。返した数字をもとに、根拠を添えて提案してください。射数が少ない射位は数字が揺れるので、射数も一緒に伝えてください。",
            parameters: {
              type: "OBJECT",
              properties: {
                dateFrom: { type: "STRING", description: "期間の開始日 (YYYY-MM-DD形式)" },
                dateTo: { type: "STRING", description: "期間の終了日 (YYYY-MM-DD形式)" },
                memberNames: { type: "ARRAY", items: { type: "STRING" }, description: "この人たちだけに絞る。省略すると全員" },
                minShots: { type: "INTEGER", description: "この射数に満たない人を外す。既定は1" }
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
        // flash-lite は最も軽い層で、道具の使い忘れや数字の取り違えが起きやすい。
        // flash に上げると質問の取り違えが減る。そのぶん無料枠の消費は速く、
        // 上限（429）に当たりやすくなるので、当たったときの待ちの作りはそのまま残す
        model: "gemini-2.5-flash", 
        systemInstruction: fullInstruction,
        tools: tools
      });

      const chat = model.startChat({
        history: newMessages.slice(1).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.role === 'actionCard' ? `[システムのデータ追加提案: ${msg.status}]` : msg.text }]
        }))
      });

      // 流しながら出す。全文ができるまで待たせると、道具を使う質問では
      // 数秒から十数秒、砂時計だけを見せることになる。
      // 道具を呼ぶときは文字が来ないので、その回は何も出ないだけで済む
      const 途中の札 = generateMsgId();
      let 途中の文 = '';
      const 送る = async (中身) => {
        途中の文 = '';
        const r = await chat.sendMessageStream(中身);
        for await (const かけら of r.stream) {
          let 文 = '';
          try {
            文 = かけら.text() || '';
          } catch (e) {
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
        return r;
      };

      console.log('[AIChatBot] Sending message with Function Calling enabled...');
      let result = await 送る([{text: userMsg}]);
      let response = await result.response;
      
      // Function Calling の処理ループ
      let calls = response.functionCalls ? response.functionCalls() : [];
      let loopCount = 0;
      
      while (calls && calls.length > 0 && loopCount < 5) {
        loopCount++;
        const functionResponses = [];
        let hasPendingAction = false;
        const pendingActionCards = [];
        
        for (const call of calls) {
          console.log('[AIChatBot] Function Called:', call.name, call.args);
          
          if (call.name === "getAllMembersStats") {
            const { dateFrom, dateTo, sortBy, limit, minShots } = call.args;
            const from = dateFrom ? new Date(dateFrom).getTime() : 0;
            const to = dateTo ? new Date(dateTo).getTime() + 86400000 : Infinity;
            
            // 数える・並べる・絞るは、すべてここで済ませる。
            // 人数ぶんの表を渡して模型に選ばせると取り違えるため
            const 結果 = 全員の成績(members, sessions, {
              期間: { 始め: from, 終わり: to },
              並び: sortBy,
              件数: limit,
              最小射数: minShots,
            });

            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: {
                  並び: 結果.並び,
                  数えた記録の件数: 結果.数えた記録,
                  順位を付けた人数: 結果.人数,
                  射数が足りず外した人数: 結果.射数が足りず外した人数,
                  団体全体: 結果.全体,
                  順位: 結果.一覧,
                  message:
                    "順位・並べ替え・絞り込みは集計済みです。返した順番と数字をそのまま使い、" +
                    "自分で並べ替えたり計算したりしないでください。的中率は百分率です。",
                }
              }
            });
          } else if (call.name === "getAttendanceStats") {
            const { dateFrom, dateTo, sortBy, limit } = call.args;
            const 結果 = 出欠の集計(members, sessions, {
              期間: {
                始め: dateFrom ? new Date(dateFrom).getTime() : 0,
                終わり: dateTo ? new Date(dateTo).getTime() + 86400000 : Infinity,
              },
              並び: sortBy,
              件数: limit,
            });
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: Object.assign({}, 結果, {
                  message:
                    "遅刻・早退は「来た」に数えています。出欠を付けずに保存された記録は数に入れていません。" +
                    "順位と数字はそのまま使ってください。",
                }),
              }
            });
          } else if (call.name === "searchSessions") {
            const { keyword, dateFrom, dateTo, limit } = call.args;
            const 結果 = 記録をさがす(sessions, {
              言葉: keyword,
              期間: {
                始め: dateFrom ? new Date(dateFrom).getTime() : 0,
                終わり: dateTo ? new Date(dateTo).getTime() + 86400000 : Infinity,
              },
              件数: limit,
            });
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: Object.assign({}, 結果, {
                  message:
                    "新しい順に返しています。見つかった件数より少なく返している場合は、その旨を伝えてください。",
                }),
              }
            });
          } else if (call.name === "getPositionStats") {
            const { dateFrom, dateTo, memberNames, minShots } = call.args;
            const 結果 = 射位ごとの成績(members, sessions, {
              期間: {
                始め: dateFrom ? new Date(dateFrom).getTime() : 0,
                終わり: dateTo ? new Date(dateTo).getTime() + 86400000 : Infinity,
              },
              名前たち: memberNames,
              最小射数: minShots,
            });
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: Object.assign({}, 結果, {
                  message:
                    "射位ごとの的中率です。射数の少ない射位は数字が揺れるので、率だけでなく射数も添えて伝えてください。" +
                    "誰をどこに置くかは決めていません。数字を根拠に提案してください。",
                }),
              }
            });
          } else if (call.name === "getDetailedMemberStats") {
            const targetName = call.args.memberName;
            const cleanTargetName = targetName.replace(/\s/g, '');
            
            let targetMember = members.find(m => {
              const cleanMName = m.name.replace(/\s/g, '');
              return cleanMName.includes(cleanTargetName) || cleanTargetName.includes(cleanMName);
            });
            
            let targetId = targetMember ? targetMember.id : null;
            let finalTargetName = targetMember ? targetMember.name : targetName;
            
            // archers を持たない記録が1件でも混ざると、この道具ごと落ちる
            const 使える記録 = sessions.filter((s) => s && Array.isArray(s.archers));
            const hasRecord = 使える記録.some(s => s.archers.some(a => {
              if (a.name) {
                const cleanAName = a.name.replace(/\s/g, '');
                if (cleanAName.includes(cleanTargetName) || cleanTargetName.includes(cleanAName)) return true;
              }
              const subs = a.substitutions || {};
              return Object.values(subs).some(subName => {
                if (!subName) return false;
                const cleanSubName = subName.replace(/\s/g, '');
                return cleanSubName.includes(cleanTargetName) || cleanTargetName.includes(cleanSubName);
              });
            }));
            
            let statsData = { error: "選手が見つかりませんでした。" };
            
            if (targetMember || hasRecord) {
              let shotTotals = [0, 0, 0, 0];
              let shotHits = [0, 0, 0, 0];
              let omaeTotal = 0, omaeHit = 0;
              let ochiTotal = 0, ochiHit = 0;
              let totalMarks = 0, hitMarks = 0, kaichu = 0;
              let recentTotal = 0, recentHit = 0;
              let totalSessions = 0;
              
              const sortedSessions = [...使える記録].sort((a, b) => (b.created || 0) - (a.created || 0));
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
                    
                    const cleanCurrentName = currentName.replace(/\s/g, '');
                    const cleanFinalTargetName = finalTargetName.replace(/\s/g, '');
                    
                    const isTarget = (targetId && currentId === targetId) ||
                                     (cleanCurrentName && cleanFinalTargetName && 
                                      (cleanCurrentName.includes(cleanFinalTargetName) || cleanFinalTargetName.includes(cleanCurrentName)));
                                     
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
                      
                      const cleanCurrentName = currentName.replace(/\s/g, '');
                      const cleanFinalTargetName = finalTargetName.replace(/\s/g, '');
                      
                      const isTarget = (targetId && currentId === targetId) ||
                                       (cleanCurrentName && cleanFinalTargetName && 
                                        (cleanCurrentName.includes(cleanFinalTargetName) || cleanFinalTargetName.includes(cleanCurrentName)));
                      
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
              
              const recentSessionsDetail = [];
              sortedSessions.forEach(session => {
                if (recentSessionsDetail.length >= 5) return;
                
                let archerIndex = -1;
                let foundArcher = null;
                
                session.archers.forEach((archer, idx) => {
                  if (!archer || !archer.marks) return;
                  const subs = archer.substitutions || {};
                  const subIds = archer.substitutionIds || {};
                  const subIndices = Object.keys(subs).map(Number).sort((e, t) => e - t);
                  
                  let hasParticipation = false;
                  archer.marks.forEach((m, shotIdx) => {
                    if (m !== '○' && m !== '×') return;
                    
                    let currentId = archer.memberId;
                    let currentName = archer.name || '';
                    for (const subIdx of subIndices) {
                      if (subIdx <= shotIdx) {
                        currentId = subIds[subIdx] || undefined;
                        currentName = subs[subIdx] || '';
                      } else {
                        break;
                      }
                    }
                    
                    const cleanCurrentName = currentName.replace(/\s/g, '');
                    const cleanFinalTargetName = finalTargetName.replace(/\s/g, '');
                    
                    if ((targetId && currentId === targetId) ||
                        (cleanCurrentName && cleanFinalTargetName && 
                         (cleanCurrentName.includes(cleanFinalTargetName) || cleanFinalTargetName.includes(cleanCurrentName)))) {
                      hasParticipation = true;
                    }
                  });
                  
                  if (hasParticipation) {
                    archerIndex = idx;
                    foundArcher = archer;
                  }
                });
                
                if (foundArcher) {
                  const d = new Date(session.date || 0);
                  const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                  
                  let positionName = `${archerIndex + 1}番目`;
                  if (archerIndex === 0) positionName = "大前";
                  else if (session.archers.length >= 3 && archerIndex === session.archers.length - 1) positionName = "落";
                  
                  const marksStr = foundArcher.marks.filter(m => m === '○' || m === '×').join('');
                  const hits = foundArcher.marks.filter(m => m === '○').length;
                  const total = foundArcher.marks.filter(m => m === '○' || m === '×').length;
                  
                  recentSessionsDetail.push({
                    date: dateStr,
                    title: session.title || "無題",
                    position: positionName,
                    marks: marksStr,
                    result: `${hits}/${total}`
                  });
                }
              });
              
              statsData = {
                name: finalTargetName,
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
                ochiHitRate: ochiTotal > 0 ? ((ochiHit / ochiTotal) * 100).toFixed(1) + "%" : "データなし",
                recentSessionsDetail: recentSessionsDetail
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

            // 記録が無い・壊れているものを先に外す。archers が無い記録が1件でも
            // 混ざると、この道具ごと落ちて「エラー」しか返せなくなる
            let filtered = sessions
              .filter((s) => s && Array.isArray(s.archers))
              .sort((a, b) => (b.date || 0) - (a.date || 0));

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

            // 上限を置く。引数なしで呼ばれると全記録を人ごとの内訳付きで返し、
            // 返す量が膨れて遅くなるうえ、模型が読み切れず数字を取り違える
            const 上限 = 30;
            const 当たった件数 = filtered.length;
            filtered = filtered.slice(0, 上限);

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
                  当たった件数,
                  返していない件数: Math.max(0, 当たった件数 - sessionData.length),
                  sessions: sessionData,
                  message:
                    sessionData.length === 0
                      ? '該当する記録が見つかりませんでした。'
                      : 当たった件数 > sessionData.length
                        ? `${当たった件数}件のうち、新しい順に${sessionData.length}件だけ返しました。全部を数えたいときは getAllMembersStats を期間付きで使ってください。返していない記録があることを利用者に伝えてください。`
                        : `${sessionData.length}件の記録を取得しました。`
                }
              }
            });
          } else if (call.name === "navigateToScreen") {
            // 個人（部員）で入っているときは、メンバーと設定の画面が無い。
            // 何を渡しても success を返していたため、移動していないのに
            // 「移動しました」と答えていた
            const 団体だけの画面 = ["メンバー", "設定"];
            const 行ける画面 =
              activeRole === 'member'
                ? ["記録", "履歴", "分析", "出欠"]
                : ["記録", "履歴", "分析", "メンバー", "出欠", "設定"];
            const target = String(call.args.screenName || '');
            const 行けるか = 行ける画面.includes(target);

            if (行けるか) {
              setTimeout(() => {
                try {
                  navigation.navigate(target);
                  setModalVisible(false);
                } catch(e) { console.warn("Navigation failed", e); }
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
                        団体だけの画面.includes(target) && activeRole === 'member'
                          ? `${target}画面は団体ログインのときだけ開けます。移動していません。その旨を伝えてください。`
                          : `${target}という画面はありません。移動していません。行ける画面の中から選び直してください。`,
                    }
              }
            });
          } else if (call.name === "addMember") {
            const newMsg = {
               id: generateMsgId(),
               role: "actionCard",
               actionType: "addMember",
               args: call.args,
               status: "pending",
               callName: call.name
            };
            pendingActionCards.push(newMsg);
            hasPendingAction = true;
          }
        }
        
        // 複数の addMember カードをまとめて追加
        if (hasPendingAction) {
          // 流しながら出していた途中の札は捨てる。道具を呼ぶ前に少しだけ
          // 文字が来ることがあり、そのままだと言いかけの文が残る
          setMessages(prev => [...prev.filter((m) => m.id !== 途中の札), ...pendingActionCards]);
          setIsLoading(false);
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
          return;
        }
        
        if (functionResponses.length > 0) {
          // 関数実行結果をモデルに返す
          result = await 送る(functionResponses);
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

      // 途中に出していた札は捨て、確定した1件だけを残す。
      // 残したままだと、同じ答えが2つ並ぶ
      setMessages([...newMessages, { id: generateMsgId(), role: "model", text: responseText }]);
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
      setMessages([...newMessages, { id: generateMsgId(), role: "model", text: errorMsg }]);
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
    <_View style={_StyleSheet.absoluteFill} pointerEvents="box-none" onLayout={onLayout}>
      <_Animated.View
        style={[styles.floatingButton, getShadowStyle({ shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }), { transform: pan.getTranslateTransform() }]}
        {...panResponder.panHandlers}
      >
        <Ionicons name="chatbubble-ellipses" size={30} color="#FFF" />
        <_View style={styles.badge}>
          <_Text style={styles.badgeText}>AI</_Text>
        </_View>
      </_Animated.View>

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
                        <_TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FF3B30' }]} onPress={() => handleActionResponse(msg.id, false)}>
                          <_Text style={styles.actionBtnText}>キャンセル</_Text>
                        </_TouchableOpacity>
                        <_TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#34C759' }]} onPress={() => handleActionResponse(msg.id, true)}>
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
              {/*
                まだ一度も聞いていないときだけ、質問例を出す。
                話し始めたあとも出し続けると、会話の流れを遮る
              */}
              {messages.length <= 1 && !isLoading && (
                <_View style={styles.例の枠}>
                  {分類ごと(例たち).map(({ 分類, 文たち }) => (
                    <_View key={分類} style={{ marginBottom: 10 }}>
                      <_Text style={styles.例の見出し}>{分類}</_Text>
                      <_View style={styles.例の並び}>
                        {文たち.map((文) => (
                          <_TouchableOpacity
                            key={文}
                            style={styles.例の札}
                            onPress={() => setInputText(文)}
                            disabled={isLoading}
                          >
                            <_Text style={styles.例の字}>{文}</_Text>
                          </_TouchableOpacity>
                        ))}
                      </_View>
                    </_View>
                  ))}
                  <_Text style={styles.例の断り}>
                    押すと入力欄に入ります。直してから送れます。
                  </_Text>
                </_View>
              )}
              {isLoading && (
                <_View style={[styles.messageBubble, styles.modelBubble, { flexDirection: "row", alignItems: "center" }]}>
                  <_ActivityIndicator size="small" color="#007AFF" style={{ marginRight: 8 }} />
                  <_Text style={styles.modelText}>
                    {retryCountdown > 0 ? `制限中... ${retryCountdown}秒後に再試行します` : '考え中...'}
                  </_Text>
                </_View>
              )}
            </_ScrollView>

            {/* 打ちながらの候補。送る前に選べるので、通信も費用もかからない */}
            {候補たち.length > 0 && !isLoading && (
              <_View style={styles.候補の枠}>
                {候補たち.map((x) => (
                  <_TouchableOpacity
                    key={x.文}
                    style={styles.候補の行}
                    onPress={() => setInputText(x.文)}
                  >
                    <Ionicons name="return-down-forward" size={14} color="#8E8E93" style={{ marginRight: 6 }} />
                    <_Text style={styles.候補の字} numberOfLines={1}>{x.文}</_Text>
                  </_TouchableOpacity>
                ))}
              </_View>
            )}

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
    </_View>
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
  // 背景は #F8F8F8 ではなくアプリ標準の #F2F2F7 を使う。
  // #F8F8F8 はダーク時に #2C2C2E へ変換され、AI側の吹き出し(#E5E5EA→#2C2C2E)と
  // 同色になって吹き出しの輪郭が消えてしまうため。
  messageArea: { flex: 1, backgroundColor: "#F2F2F7" },
  messageBubble: { maxWidth: "85%", padding: 12, borderRadius: 18, marginBottom: 12 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#007AFF", borderBottomRightRadius: 4 },
  modelBubble: { alignSelf: "flex-start", backgroundColor: "#E5E5EA", borderBottomLeftRadius: 4 },
  // 質問例（入口）。何を聞けるかが分からないまま閉じられるのを防ぐ
  例の枠: { marginTop: 12, paddingHorizontal: 4 },
  例の見出し: { fontSize: 12, color: "#8E8E93", fontWeight: "bold", marginBottom: 6 },
  例の並び: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  例の札: {
    borderWidth: 1,
    borderColor: "#C7C7CC",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FFF",
  },
  例の字: { fontSize: 13, color: "#1C1C1E" },
  例の断り: { fontSize: 11, color: "#8E8E93", marginTop: 4 },
  // 打ちかけの候補（入力欄の上）
  候補の枠: { borderTopWidth: 1, borderTopColor: "#E5E5EA", backgroundColor: "#F9F9FB" },
  候補の行: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  候補の字: { fontSize: 13, color: "#1C1C1E", flex: 1 },
  messageText: { fontSize: 15, lineHeight: 20 },
  userText: { color: "#FFF" },
  modelText: { color: "#1C1C1E" },
  inputArea: { flexDirection: "row", padding: 12, paddingBottom: 12, backgroundColor: "#FFF", borderTopWidth: 1, borderTopColor: "#F2F2F7", alignItems: "center" },
  input: { flex: 1, backgroundColor: "#F2F2F7", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, maxHeight: 100, fontSize: 15, marginRight: 8 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#007AFF", justifyContent: "center", alignItems: "center" },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  actionBtnText: { color: "#FFF", fontSize: 13, fontWeight: "bold" }
});