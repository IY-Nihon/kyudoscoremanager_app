/**
 * Module ID: WhatsNewModal (hand-written, not bundler-generated)
 * アプリ起動時に最近の変更点をお知らせするモーダル
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });
exports.WhatsNewModal = void 0;

const React = require('react');
const { useState, useEffect, useRef } = React;
const RN = require('react-native');
const _View = RN.View;
const _Text = require('./default_217').default; // テーマ変換を通すためブリッジ経由
const _StyleSheet = require('./default_45').default; // テーマ変換を通すためブリッジ経由
const _TouchableOpacity = RN.TouchableOpacity;
const _Modal = RN.Modal;
const _ScrollView = RN.ScrollView;

const AsyncStorage = require('@react-native-async-storage/async-storage').default;
const { Ionicons } = require('./AntDesign_600');
const { getShadowStyle } = require('./module_592');

// ─────────────────────────────────────────
// お知らせバージョン
// 新しいお知らせを追加・変更したら、このバージョン文字列を必ず更新してください。
// 「次のお知らせが来るまで表示しない」を選んだ端末でも、この値が変わると再度表示されます。
// ─────────────────────────────────────────
const NOTICE_VERSION = '2026-08-28-01';
const STORAGE_KEY = 'whatsNewDismissedVersion';
// 最後に開いたときの版。閉じるたびに書く。
// どこから下が「前に読んだぶん」かの線を引くためだけに使う。
// 自動で出すかどうかは STORAGE_KEY のほうで決めるので、混ぜない
//（あちらは「次のお知らせが来るまで表示しない」を選んだときだけ書く）
const LAST_SEEN_KEY = 'whatsNewLastSeenVersion';

// 新しい順に並べる。上から「前に見た版より新しいか」を数えて、
// そこで線を引くため、順番が崩れると線の位置が狂う（検査で見ている）
const NOTICE_ITEMS = [
  {
    date: '2026/08/28',
    版: '2026-08-28-01',
    title: '個人の詳細が、比較しても項目が減らなくなりました',
    points: [
      '比較相手を選ぶと「立ちの結果分布」が消えていました。比較のときも、皆中・三中・羽分・一中・残念を人ごとに並べて見られます。',
      '見出しの言い方も、比較のあり／なしでそろえました。',
      '的中率推移の点を押すと、矢所・立ち順別・結果分布がまとめてその期間に切り替わります。比較しているときも押せます。',
      '4射そろわない射があるときは、その旨を分布の下に添えます（的中率には入っています）。',
    ],
  },
  {
    date: '2026/08/28',
    版: '2026-08-28-01',
    title: '出欠が、途中交代で入った人を数えるようになりました',
    points: [
      '途中交代で立った人が、実際に引いているのに欠席として数えられていました。',
      '出欠画面の出席率と、保存するときに出る出欠の確認窓の両方を直しました。交代で入った人は出席になります。',
    ],
  },
  {
    date: '2026/08/28',
    版: '2026-08-28-01',
    title: '的中率の数え方を、どの画面でも同じにしました',
    points: [
      '順位・的中率推移のグラフ・矢所の傾向・AIアシスタントで、数え方が少しずつ違っていました。同じ人なのに画面ごとに数字が食い違うことがありました。',
      '数え方を1つにまとめ、途中交代のぶんも正しくその人に付くようにしました。',
      '個人の詳細で「他のメンバーと比較」を使うとき、学年や性別で絞っていると相手の立ち順別が 0% になっていたのも直りました。',
      '記録に名前だけで入っていて名簿と結び付いていなかったぶんは、こちらで名簿につなぎ直しました。数字が減ることはありません。',
      'AIアシスタントに聞いたときも、「集計に含めない」にした記録は数えないようにしました。順位と個人の詳細で数字が食い違わなくなります。',
    ],
  },
  {
    date: '2026/08/28',
    版: '2026-08-28-01',
    title: 'Excel の書き出しが、画面と同じ数字になりました',
    points: [
      '書き出しの的中率が、画面の分析より低く出ていました。まだ引いていない矢まで分母に入れていたためです。',
      '実際に引いた数で数えるようにし、途中交代のぶんも人ごとの行に分けました。',
      '「集計に含めない」にした記録は本表から外し、別のシートに残すようにしました。',
    ],
  },
  {
    date: '2026/08/28',
    版: '2026-08-28-01',
    title: '鍵のかかったマスを押すと、開け方が出ます',
    points: [
      '誤タップ防止で鍵がかかったマスを押すと「このマスは鍵がかかっています。長押しで開きます」と出るようになりました。',
      'これまでは押しても何も起きず、開け方が分かりませんでした。',
    ],
  },
  {
    date: '2026/08/28',
    版: '2026-08-28-01',
    title: '記録表の動きを軽くしました',
    points: [
      '○×を入れるたびに、画面の裏で人数ぶんの探しものをしていました。マスの数だけ重なるので、人数と射数が多いほど反応が鈍くなっていました。',
      '必要なときだけ調べるようにして、押したときの反応を軽くしました。',
    ],
  },
  {
    date: '2026/08/28',
    版: '2026-08-28-01',
    title: '写真の読み取りが名簿を見るようになりました',
    points: [
      '立ち順表や的中記録表を読み取るとき、部員名簿を手がかりに使うようになりました。',
      '手書きの氏名で似た字に迷ったとき、名簿にある方へ寄せます。ゲストなど名簿に無い名前は、これまでどおりそのまま読み取ります。',
    ],
  },
  {
    date: '2026/08/28',
    版: '2026-08-28-01',
    title: 'AIアシスタントを見直しました',
    points: [
      '成績や順位の集計をアプリの中で行うようにして、数字の取り違えを無くしました。',
      '答えが出来上がるまで待たずに、文字が届いた端から表示するようにしました。',
      '出欠の集計、記録の言葉での検索、射位ごとの的中率を新しく聞けるようになりました。',
      '開いたときに、その部の中身に合わせた質問例が出ます。押すと入力欄に入るので、直してから送れます。',
      '入力の途中でも、続きの候補が出ます。',
      '答えに、下調べの様子や日本語でない説明が混ざることがありました。聞かれたことへの答えだけを返すようにしました。',
    ],
  },
  {
    date: '2026/08/28',
    版: '2026-08-28-01',
    title: '取り消しで途中交代が消えなくなりました',
    points: [
      '○×の取り消しを続けると、その間に入れた途中交代まで一緒に消えていました。',
      '交代を入れたことも一手として数えるようにしたので、○×だけを戻せます。交代そのものも取り消し・やり直しで戻せます。',
    ],
  },
  {
    date: '2026/08/22',
    版: '2026-08-22-01',
    title: '確認やお知らせを、アプリの中に出すようにしました',
    points: [
      'これまでパソコンやスマホのブラウザで使うと、削除の確認などがブラウザ標準の窓で出ていました。アプリの中の窓に変わり、見た目が揃います。',
      '短いお知らせは画面の下に帯で出て、読み終わるころに自分で消えます。選んでもらう確認だけが窓で止まります。',
    ],
  },
  {
    date: '2026/08/22',
    版: '2026-08-22-01',
    title: 'ライブ記録に「閲覧用」で参加できます',
    points: [
      'ライブに参加するとき、「記録用」か「閲覧用」かを選べるようになりました。',
      '閲覧用は画面を見るだけで、○×・鍵・途中交代・人の追加・射数の変更・保存のいずれもできません。押すと「閲覧用で参加しています」と出ます。',
      '記録する担当が決まっているとき、ほかの人が誤って触ってしまうのを防げます。主催者はこれまでどおり記録する側です。',
    ],
  },
  {
    date: '2026/08/22',
    版: '2026-08-22-01',
    title: '途中交代があるときの「計」を切り替えられます',
    points: [
      '途中交代を入れると、計は「山田 3, 田中 2」と内訳で出ます。',
      'その計を押すと、合わせた数（5）に切り替わります。もう一度押すと内訳へ戻ります。',
    ],
  },
  {
    date: '2026/08/22',
    版: '2026-08-22-01',
    title: '途中交代を取り消せるようになりました',
    points: [
      '名前のますを押すと、入っている交代が「5射目〜 田中 の交代を取り消す」として並びます。押すとその1つだけ取り消せます。',
      'これまでは取り消す方法が無く、間違えるとリセットするしかありませんでした。',
    ],
  },
  {
    date: '2026/08/22',
    版: '2026-08-22-01',
    title: '記録表を広く使えるようにしました',
    points: [
      '記録表の右上の丸い印を押すと、上下の操作の帯が隠れて記録表が広がります。もう一度押すと戻ります。',
      '畳んだままかどうかは、この端末に残ります。',
    ],
  },
  {
    date: '2026/08/22',
    版: '2026-08-22-01',
    title: '記録表を横向きにも並べられます',
    points: [
      '記録画面の左下、取り消し・やり直しのとなりにある「横へ」を押すと、名前が左・○×が右へ伸びる並べ方に変わります。',
      '射数は左から右へ、人は上から下へ。個人の計は一番右に出ます。合計と間隔も、そのまま横向きで使えます。',
      '選んだ並べ方はその端末に残ります。「縦へ」を押せばいつでも元に戻せます。',
    ],
  },
  {
    date: '2026/08/22',
    版: '2026-08-22-01',
    title: '途中交代を「立目」でも入れられます',
    points: [
      '名前を押して「途中交代」を開くと、交代するところを一覧から選べるようになりました。開いたときは「立目」です。',
      '「2立目」を選べば5射目からの交代になります。何射目からになるかは、決める前に画面へ出ます。',
      '1射ずつ選びたいときは「射目」に切り替えてください。',
    ],
  },
  {
    date: '2026/08/22',
    版: '2026-08-22-01',
    title: '',
    points: ['細い画面での表示の崩れなど、その他の不具合を直しました。'],
  },
  {
    date: '2026/08/18',
    版: '2026-08-18-02',
    title: '保存のときの出欠確認を、出さないようにもできます',
    points: [
      '「終了・保存」を押すと出る出欠の確認は、設定の「保存のしかた」から切れるようになりました。',
      '切ると、そのまま保存の画面へ進みます。記録に名前が出ている人は、出欠画面でこれまでどおり出席として数えられます。',
      'ただし遅刻・早退の区別は付かなくなります。あとから直すときは、管理者モードで履歴の詳細から出欠を編集できます。',
    ],
  },
  {
    date: '2026/08/18',
    版: '2026-08-18-01',
    title: '誤タップ防止の鍵を追加しました',
    points: [
      '○×を入れて3秒たつと、そのマスは薄い灰色になり、押しても変わらなくなります。記録中に手や袖が当たって、入れた○×が消えてしまうのを防ぐためです。',
      '直したいときは、そのマスを長押ししてください。そこだけ開き、「このマスの鍵を開けました」と出ます。',
      '1立が全部埋まったときは、間隔・計の列の鍵も自動でかかります。こちらは鍵を押して開けます。',
      'この動きが要らない場合は、設定の「入力の保護」から切れます。',
    ],
  },
  {
    date: '2026/08/18',
    版: '2026-08-18-01',
    title: '使い方の案内を追加しました',
    points: [
      '初めて使う方に、射手の追加から○×の入力、保存までを画面の上で順に案内するようにしました。',
      'あとから見直すときは、設定の「使い方を見る」からいつでも始められます。',
    ],
  },
  {
    date: '2026/08/18',
    版: '2026-08-18-01',
    title: '記録画面の「＋ −」と表示の大きさを分かりやすくしました',
    points: [
      '「＋ −」は立ちの増減になりました。1立（4射）ずつ増やしたり減らしたりできます。真ん中の「8射」を押せば、これまでどおり一覧からも選べます。',
      '表示の大きさは「％」で出るようになりました。押すとバーが開き、50%から200%まで1%きざみで調整できます。',
      '増減したあとは、取り消しで元の射数に戻せます。減らしたときに消えた○×も一緒に戻ります。',
    ],
  },
  {
    date: '2026/08/18',
    版: '2026-08-18-01',
    title: 'ライブ記録を使いやすくしました',
    points: [
      'ライブ記録の名前に「/」などが使えてしまい、その場合に誰も参加できないライブができてしまう不具合を修正しました。使えない文字を入力すると、その場でお知らせします。',
      'ライブ記録の参加一覧が、最後に使った順に並ぶようになりました。',
      'ライブ記録は、最後に使ってから14日たつと自動で消えます。参加一覧にも出なくなります。',
      '消えるのはライブ用の共有の記録表だけです。「終了・保存」で保存した記録は消えません。',
    ],
  },
  {
    date: '2026/08/18',
    版: '2026-08-18-01',
    title: '',
    points: ['不具合の修正やセキュリティの強化など、その他諸々の修正を行いました。'],
  },
  {
    date: '2026/08/06',
    版: '2026-08-06-01',
    title: '',
    points: ['不具合の修正やセキュリティの強化など、その他諸々の修正を行いました。'],
  },
  {
    date: '2026/08/03',
    title: 'ダークモードに対応しました',
    boldPoints: true,
    points: [
      '設定の「表示」から、ライト／ダーク／端末に合わせる、を選べるようになりました。',
      '「端末に合わせる」を選ぶと、スマホやPCの設定に連動して自動で切り替わります。',
    ],
  },
  {
    date: '2026/08/03',
    title: '紙に取った記録も画像から読み取れるようになりました(デモ)',
    points: [
      '記録画面の「画像」ボタンで「紙の記録」を選ぶと、氏名と1射ごとの○×をAIが読み取って記録表に反映できます。',
      '手書きの○や×、書き方のくせもある程度そのまま読み取れます。読み取り後の画面で押して修正もできます。',
      '認識の精度を上げるため、うまく読み取れなかった記録用紙の画像をお問い合わせから送っていただけると助かります。',
    ],
  },
  {
    date: '2026/08/03',
    title: '書き出しがExcel形式になりました',
    points: [
      '設定の「データをExcel形式で書き出し」から、そのままExcelで開けるファイルを保存できます。',
      '見出しに並べ替えボタンが付いた状態で開くので、日付順・的中率順などをその場で切り替えられます。列幅も調整済みです。',
      '「印刷向け形式」を選ぶと、これまでどおりメンバーを縦・日付を横に並べた集計表を出せます。',
    ],
  },
  {
    date: '2026/08/03',
    title: '',
    points: ['アプリ内部の整理を行い、読み込みが軽くなりました。表示や操作の変更はありません。'],
  },
  {
    date: '2026/07/11',
    title: '',
    points: [
      '分析画面のグラフの点を押すと表示される記録一覧から、その記録・その人の履歴詳細へ直接ジャンプできるようになりました。',
    ],
  },
  {
    date: '2026/07/10',
    title: '',
    points: [
      '記録画面の矢所入力を改善：PCではマウスに追従するプレビュー表示、スマホではドラッグして指を離した位置に登録できるようになりました。',
    ],
  },
  {
    date: '2026/07/08',
    title:
      '画像から立ち順を自動登録できるようになりました(デモ)※機能改善のために立ち順の黒板の画像などがあればお問い合わせから送っていただけると幸いです。',
    points: [
      'ホワイトボードの立ち順表を撮影・選択するだけで、AIが読み取って記録表に反映できます。',
      '「撮影する」ボタンからその場でカメラ起動、「画像を選択」からは既存の写真も使えます。',
    ],
  },
  {
    date: '2026/07/04',
    title: '',
    boldPoints: true,
    points: ['分析画面で複数人を比較できるようになりました。', '設定にお問い合わせフォームを追加しました。'],
  },
];

// 起動から一度でも表示したかを覚えておく。
// テーマを切り替えると App 側が key を変えて配下を作り直すため、
// この目印が無いと閉じたお知らせが切り替えのたびに出てきてしまう。
let shownThisSession = false;

/**
 * 前に開いたときより後に足した項目の数。
 *
 * 版は '2026-08-18-02' の形なので、そのまま文字として比べれば新しい順になる。
 * 版を持たない古い項目は「前からあったもの」として扱う。
 * 一度も開いていない人（最後に見た版が無い）は、全部が新しい。
 */
function 未読の数(最後に見た版) {
  let n = 0;
  for (const 項目 of NOTICE_ITEMS) {
    if (!項目.版) break;
    if (最後に見た版 && !(項目.版 > 最後に見た版)) break;
    n++;
  }
  return n;
}

const WhatsNewModal = () => {
  const [visible, setVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [未読, set未読] = useState(0);
  // 開いたときに「ここから下は前回まで」の線まで送るための控え。
  // 未読がたくさんあると、上から順に読むと新しい順（時系列の逆）になる。
  // 線が画面の下に来るように送れば、いちばん古い未読が目の高さに入り、
  // 上へ戻れば新しいものが読める。線に合わせて送ると、その下の
  // 「もう読んだぶん」が画面を占めてしまうので、下端に置くのが要る
  const 巻物 = useRef(null);
  const 境目の位置 = useRef(0);
  const 巻物の高さ = useRef(0);
  const 送った = useRef(false);

  /**
   * 「ここから下は前回までのお知らせ」の線が、画面の下のほうに来るまで送る。
   *
   * 線の高さと巻物の高さが両方そろった時点で呼ばれる。窓を開くたびに
   * 1回だけ送り、そのあと利用者が動かしたぶんを奪わない。
   */
  const 送る = () => {
    if (送った.current || !巻物.current) return;
    if (境目の位置.current <= 0 || 巻物の高さ.current <= 0) return;
    送った.current = true;
    // 線を下端より少し上に置く。ちょうど下端だと線が縁に張り付いて読みにくい
    const 位置 = Math.max(境目の位置.current - 巻物の高さ.current + 56, 0);
    // 描き終わりを待つ。待たずに送ると、まだ高さが確定しておらず動かないことがある
    setTimeout(() => {
      if (巻物.current && 巻物.current.scrollTo) {
        巻物.current.scrollTo({ y: 位置, animated: false });
      }
    }, 0);
  };

  // 窓を閉じたら、次に開いたときにまた送れるようにする
  useEffect(() => {
    if (!visible) 送った.current = false;
  }, [visible]);

  useEffect(() => {
    if (shownThisSession) {
      setCheckedStorage(true);
      return;
    }
    (async () => {
      try {
        // 使い方の案内がまだの人には出さない。案内と二重の壁になるため。
        // 案内を終えた（＝一度は使った）人から、次に開いたときにお知らせする。
        //
        // ここで「見た」印を書いてはいけない。書くと、そのあと案内を終えても
        // 印が付いたままで、この版のお知らせが二度と出なくなる。
        // 実際そうなっていた（案内をスキップして開き直しても出ない）。
        // 出さずに帰るだけにすれば、次に開いたときに出る。
        const 案内済み = await AsyncStorage.getItem('tutorialDoneVersion');
        if (!案内済み) {
          shownThisSession = true;
          setCheckedStorage(true);
          return;
        }
        const dismissedVersion = await AsyncStorage.getItem(STORAGE_KEY);
        if (dismissedVersion !== NOTICE_VERSION) {
          // どこから下が前に読んだぶんか、線を引くために数えておく。
          // 「見たところ」の印は今回から付け始めたので、まだ無い人が居る。
          // その人には「今後表示しない」を押した版を代わりに使う。
          // 印が無いからと全部を新しい扱いにすると、切り替え直後の
          // ――線がいちばん要る一回目に――線が最上段へ行って役に立たない
          const 見たところ = (await AsyncStorage.getItem(LAST_SEEN_KEY)) || dismissedVersion;
          set未読(未読の数(見たところ));
          shownThisSession = true;
          setVisible(true);
        }
      } catch (e) {
        console.error('[WhatsNewModal] Failed to read storage:', e);
        // 読み込み失敗時は安全側に倒して表示する
        shownThisSession = true;
        setVisible(true);
      } finally {
        setCheckedStorage(true);
      }
    })();
  }, []);

  const handleClose = async () => {
    setVisible(false);
    try {
      // 開いた時点までを「読んだ」ことにする。閉じ方によらず必ず書く。
      // 次に開いたとき、ここから上が新しいぶんになる
      await AsyncStorage.setItem(LAST_SEEN_KEY, NOTICE_VERSION);
    } catch (e) {
      console.error('[WhatsNewModal] Failed to save last seen:', e);
    }
    if (dontShowAgain) {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, NOTICE_VERSION);
      } catch (e) {
        console.error('[WhatsNewModal] Failed to save dismissal:', e);
      }
    }
  };

  if (!checkedStorage || !visible) return null;

  return (
    <_Modal visible={true} animationType="fade" transparent={true} onRequestClose={handleClose}>
      <_View style={styles.overlay}>
        <_View
          style={[styles.container, getShadowStyle({ shadowOpacity: 0.2, shadowRadius: 16, elevation: 16 })]}
        >
          <_View style={styles.header}>
            <_View style={styles.headerTitleRow}>
              <Ionicons name="megaphone-outline" size={20} color="#007AFF" />
              <_Text style={styles.headerTitle}>お知らせ</_Text>
            </_View>
            <_TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </_TouchableOpacity>
          </_View>

          <_ScrollView
            ref={巻物}
            style={styles.body}
            contentContainerStyle={{ padding: 16 }}
            onLayout={(e) => {
              巻物の高さ.current = e.nativeEvent.layout.height;
              送る();
            }}
          >
            {NOTICE_ITEMS.map((section, idx) => (
              <React.Fragment key={idx}>
                {/* 前に開いたとき以降に足したぶんと、それより前との境目。
                    新しいものが上に並ぶので、この線から下は読んだことがある */}
                {未読 > 0 && idx === 未読 && (
                  <_View
                    style={styles.読んだ境目}
                    onLayout={(e) => {
                      境目の位置.current = e.nativeEvent.layout.y;
                      送る();
                    }}
                  >
                    <_View style={styles.読んだ線} />
                    <_Text style={styles.読んだ文字}>ここから下は前回までのお知らせ</_Text>
                    <_View style={styles.読んだ線} />
                  </_View>
                )}
                <_View style={styles.section}>
                  <_Text style={styles.sectionDate}>{section.date}</_Text>
                  {!!section.title && <_Text style={styles.sectionTitle}>{section.title}</_Text>}
                  {section.points.map((p, pIdx) => (
                    <_View key={pIdx} style={styles.pointRow}>
                      <_Text style={styles.pointBullet}>・</_Text>
                      <_Text style={[styles.pointText, section.boldPoints && styles.pointTextBold]}>{p}</_Text>
                    </_View>
                  ))}
                </_View>
              </React.Fragment>
            ))}
          </_ScrollView>

          <_View style={styles.footer}>
            <_TouchableOpacity style={styles.checkboxRow} onPress={() => setDontShowAgain((prev) => !prev)}>
              <_View style={[styles.checkbox, dontShowAgain && styles.checkboxChecked]}>
                {dontShowAgain && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </_View>
              <_Text style={styles.checkboxLabel}>次のお知らせが来るまで表示しない</_Text>
            </_TouchableOpacity>

            <_TouchableOpacity style={styles.closeFooterBtn} onPress={handleClose}>
              <_Text style={styles.closeFooterBtnText}>閉じる</_Text>
            </_TouchableOpacity>
          </_View>
        </_View>
      </_View>
    </_Modal>
  );
};

exports.WhatsNewModal = WhatsNewModal;

const styles = _StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '90%', maxWidth: 420, maxHeight: '80%', backgroundColor: '#FFF', borderRadius: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  closeBtn: { padding: 4 },
  body: { flexGrow: 0 },
  section: { marginBottom: 20 },
  sectionDate: { fontSize: 11, color: '#8E8E93', fontWeight: '600', marginBottom: 2 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 8 },
  pointRow: { flexDirection: 'row', marginBottom: 4, paddingLeft: 4 },
  pointBullet: { fontSize: 13, color: '#007AFF', marginRight: 4 },
  pointText: { fontSize: 13, color: '#3C3C43', flex: 1, lineHeight: 19 },
  pointTextBold: { fontWeight: 'bold', color: '#1C1C1E' },
  // 「ここから下は前回までのお知らせ」の線。左右に細い線を渡し、間に字を置く
  読んだ境目: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 4 },
  読んだ線: { flex: 1, height: 1, backgroundColor: '#E5E5EA' },
  読んだ文字: { fontSize: 11, color: '#8E8E93', marginHorizontal: 8 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#EEE' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  checkboxLabel: { fontSize: 13, color: '#3C3C43' },
  closeFooterBtn: { backgroundColor: '#007AFF', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  closeFooterBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});
