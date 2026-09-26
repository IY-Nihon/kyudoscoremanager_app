/**
 * Module ID: OCRRecordModal (hand-written, not bundler-generated)
 * ホワイトボードの立ち順写真から記録表を自動構築するモーダル
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });
exports.OCRRecordModal = undefined;

const React = require('react');
const { useState, useMemo } = React;
const {
  Text,
  StyleSheet,
  TextInput,
  Alert,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Image,
} = require('./rn');
// React Native の Alert はブラウザでは何も出ない。「候補が複数ある名前が残っています」を
// 出したつもりで黙っていて、反映を押しても何も起きないように見えた（検証環境で実際に）。
// アプリの中の窓へ流す橋渡しを使う（機種を問わず同じ見た目で出る）

const DocumentPicker = require('expo-document-picker');
const ImagePicker = require('expo-image-picker');
const { Ionicons } = require('@expo/vector-icons');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { IS_WEB } = require('./IS_WEB');
// 鍵はアプリに無い。中継（Cloudflare Workers）へログインの証を付けて呼ぶ
const 中継 = require('./geminiChukei');
const { generateUUID } = require('./uuid');
const { formatMemberName } = require('./formatMemberName');
const { getShadowStyle } = require('./shadowStyle');
const { 記録の指示文, 立ち順の指示文, 名簿の手がかり, 板の箱の指示文 } = require('./ocrPrompts');
const { マスを開く, 一射目からの順にする, 迷いを開く } = require('./ocrCells');
// 板と紙の○×は端末で読む（Gemini は線の向きを読めない）。名前と並びは Gemini のまま
const { マスを端末で差し替える } = require('./ocr/sashikae');
const 画像の道具 = require('./ocr/gazou-web');
const 板の重み = require('../scripts/ocr-cells/omomi-chiisai.json');
const 紙の重み = require('../scripts/ocr-cells/kami-omomi.json');
// 検査（e2e/ocrTanmatsu.spec.mjs）から、ブラウザの canvas の道で読めるかを確かめるための入口。
// アプリの動きには関わらない
if (IS_WEB && typeof window !== 'undefined') {
  window.端末の読み取り = {
    画像の道具,
    板の印を読む: async (base64, 板の人数たち, 行数) => {
      const { 板の印を読む } = require('./ocr/yomu');
      const 元 = await 画像の道具.画を読む(base64);
      return 板の印を読む(元, { 板の人数たち, 行数, 回す: 画像の道具.回す, 重み: 板の重み });
    },
    // 1マスの切り抜きと、網に届く形（20×20）を返す。読み違えたマスを Node と比べるため
    マスを見る: async (base64, 板の人数たち, 行数, 板, 列, 行, 箱たち) => {
      const { 板ごとの格子, 箱の大きさ } = require('../scripts/ocr-cells/kiridasu.mjs');
      const { 形にする, 切り取る, 辺 } = require('../scripts/ocr-cells/manabu.mjs');
      const 元 = await 画像の道具.画を読む(base64);
      const 板たち = await 板ごとの格子(元, { 板の人数たち, 行数, 回す: 画像の道具.回す, 箱たち });
      const 格子 = 板たち[板].格子;
      const { 半幅, 半高 } = 箱の大きさ(格子);
      const 左 = Math.max(0, Math.round(格子.列[列].中心) - 半幅);
      const 上 = Math.max(0, Math.round(格子.行.位置[行] + (格子.列[列].ずれ || 0)) - 半高);
      const 切 = 切り取る(格子.生.画素, 格子.生.幅, 格子.生.高, 左, 上, 半幅 * 2, 半高 * 2);
      // 板の印を読む と同じ注文で（印の幅が無いと、薄い輪の拾い直しが掛からず本番と違う形になる）
      const 形 = await 形にする(切.画, 切.幅, 切.高, 格子.立て方 ? 'ぎっしり' : undefined, {
        印の幅: 格子.箱の幅 || 格子.印の幅,
      });
      return {
        左,
        上,
        幅: 切.幅,
        高: 切.高,
        切: Array.from(切.画),
        形: Array.from(形.slice(0, 辺 * 辺)),
        画の幅: 元.幅,
        画の高: 元.高,
        印の幅: 格子.印の幅,
        箱の幅: 格子.箱の幅,
      };
    },
    // 格子そのもの（印の位置・行の当てはめ）を Node と見比べるため
    板ごとの格子: (元, 注文) => require('../scripts/ocr-cells/kiridasu.mjs').板ごとの格子(元, 注文),
    紙の印を読む: async (base64, 人数, 立数, 立のマス) => {
      const { 紙の印を読む } = require('./ocr/yomu');
      const 元 = await 画像の道具.画を読む(base64);
      return 紙の印を読む(元, { 人数, 立数, 立のマス, 重み: 紙の重み });
    },
  };
}

// ─────────────────────────────────────────
// 画像 URI → base64 変換（Web / ネイティブ両対応）
// ─────────────────────────────────────────
async function uriToBase64(uri) {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result || '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// 氏名の正規化と名寄せは ./ocrNamae に移した（Gemini の名簿照合と合わせて検査するため）
const { normalize, matchArcherName, 名簿で名寄せ, 重なりを外す } = require('./ocrNamae');

const SHOT_LABELS = [
  '壱之立',
  '弐之立',
  '参之立',
  '四之立',
  '伍之立',
  '六之立',
  '七之立',
  '八之立',
  '九之立',
  '拾之立',
];

// ─────────────────────────────────────────
// 的中マークの正規化
//
// アプリ内部の marks は '○'（的中）/ '×'（外れ）/ ''（未記録）の3値。
// 紙の記録は書き手によって表記が揺れるため（丸なら ○◯〇●、
// バツなら ×✕✖x、罰点として / や ＼ を使う流儀もある）、
// AI が読み取った文字を内部表現へ寄せる。
// ─────────────────────────────────────────
const HIT_CHARS = new Set(['○', '◯', '〇', '●', '◎', 'o', 'O', '0', '丸', '当', '中']);
const MISS_CHARS = new Set([
  '×',
  '✕',
  '✖',
  'x',
  'X',
  '・',
  '･',
  '/',
  '／',
  '\\',
  '＼',
  '-',
  'ー',
  'バツ',
  '外',
]);

function normalizeMark(raw) {
  if (raw == null) return '';
  const 文 = String(raw).trim();
  if (文 === '') return '';
  if (HIT_CHARS.has(文)) return '○';
  if (MISS_CHARS.has(文)) return '×';
  // 「○」「×」が他の文字と混ざって返ってきた場合の保険
  const firstHit = [...文].find((一字) => HIT_CHARS.has(一字));
  const firstMiss = [...文].find((一字) => MISS_CHARS.has(一字));
  if (firstHit && !firstMiss) return '○';
  if (firstMiss && !firstHit) return '×';
  return '';
}

/** AI が返した marks 配列を shotsPerRound の長さに正規化する */
function normalizeMarks(rawMarks, shotsPerRound) {
  const src = Array.isArray(rawMarks) ? rawMarks : [];
  const out = Array(shotsPerRound).fill('');
  for (let 番 = 0; 番 < shotsPerRound; 番++) out[番] = normalizeMark(src[番]);
  return out;
}

const OCRRecordModal = ({
  visible,
  onClose,
  members = [],
  alumni = [],
  shotsPerRound = 8,
  onApply,
  // 記録表にすでに中身があるか。あるときは置き換わることを確かめる
  hasExistingRecord = false,
  // いまの記録表で埋まっている射数（いちばん後ろの○×の位置）。射数を合わせるのに使う
  記入済みの射数 = 0,
}) => {
  const [step, setStep] = useState('pick'); // pick | analyzing | preview
  // 最初に読んだ結果（利用者が直す前）と、それを取っておいた記録の id。
  // アプリの改善のため、読み取りが終わったら（成功・失敗とも）送った写真と最初の結果を、
  // 反映したら直したあとを、それぞれ取っておく（src/improvementLog.js）
  const 最初の読み取り = React.useRef(null);
  const 読み取りの記録id = React.useRef(null);
  // lineup: ホワイトボードの立ち順表（名前のみ）
  // record: 紙に取った的中記録（名前＋各射の○×）
  const [mode, setMode] = useState('lineup');
  const [images, setImages] = useState([]); // [{uri, base64}]
  const [tachiList, setTachiList] = useState([]); // [{seats:[{rawText,status,match,options}]}]
  // record モード用: [{rawText, status, match, options, marks:['○','×','',...]}]
  const [recordRows, setRecordRows] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  // AI が混んでいて（503）、待ってからもう一度読んでいる間だけ true（読み取り中の文を変える）
  const [混み待ち, set混み待ち] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null); // {tachiIdx, seatIdx}
  const [pickerSearch, setPickerSearch] = useState('');
  const [expandedActiveGrades, setExpandedActiveGrades] = useState(new Set(['1', '2', '3', '4', '0']));
  const [expandedTerms, setExpandedTerms] = useState(new Set());

  // 大前がどちらの端かは、道場や大会で違う。1枚の写真に板が2つ写り、
  // それぞれ外側が大前ということもある（リーグの対戦）。読む前に選んでもらう。
  //   '右から' … 右端が大前。右から左へ読む
  //   '左から' … 左端が大前。左から右へ読む
  //   '左右から' … 板が2つ。それぞれ外側が大前（左の板は左から、右の板は右から）
  const [向き, set向き] = useState('右から');
  // すでに記録表に人が居るときの入れ方。'置き換える' か '後ろに足す'
  // 読み取った人は、いまの記録表の後ろに足す（置き換えは無くした）
  // 縦の表で、1射目がどちら側か。板は下から書き足されることがある。
  // 実物で確かめた（団体910280 の板は下から。合計欄も下から 22→44→65→88→107 と増える）。
  // 取り違えると、その人の○×が丸ごと逆順になる
  // 1射目は「下から」で固定（ヒアリング 2026-09-11：板も紙も黒板も下から）。
  // 横書きの紙（1行1人・左から1射目）だけは、Gemini が返す layout で見分ける
  // ○×をどこで読んだか。'端末' なら板の印を端末で読み替えた。'AI' は Gemini のまま
  const [読み取り元, set読み取り元] = useState('AI');
  // 端末が数えた列の数と、AI の人数が合わなかったときの断り（名札の無い列を AI が落とすことがある）
  const [列の断り, set列の断り] = useState('');
  // 端末で○×を読めなかったときの訳。AI の○×は丸に線の向きを取り違えやすいので、確認画面で断る
  const [端末の断り, set端末の断り] = useState('');

  // ゲスト入力用ステート
  const [isEnteringGuest, setIsEnteringGuest] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState('');

  const resetAll = () => {
    setStep('pick');
    setMode('lineup');
    set向き('右から');
    setImages([]);
    setTachiList([]);
    setRecordRows([]);
    setErrorMsg('');
    setPickerTarget(null);
    setPickerSearch('');
    setExpandedActiveGrades(new Set(['1', '2', '3', '4', '0']));
    setExpandedTerms(new Set());
    setIsEnteringGuest(false);
    setGuestNameInput('');
  };

  const handleClose = () => {
    resetAll();
    onClose && onClose();
  };
  // 戻るボタン（と web の Esc）で閉じるとき。読んでいる途中や読んだあとは、捨ててよいかを聞く。
  // ×と違って戻るはうっかり押しやすく、読み直しには時間がかかる（2026-09-26、戻るで窓を閉じるようにしたとき）
  const 戻るで閉じるとき = () => {
    if ('pick' === step) return void handleClose();
    Alert.alert(
      '読み取った内容を捨てますか？',
      'analyzing' === step
        ? '読み取りをやめて閉じます。'
        : '閉じると、読み取った結果と直した内容は残りません。',
      [
        { text: '続ける', style: 'cancel' },
        { text: '捨てて閉じる', style: 'destructive', onPress: handleClose },
      ]
    );
  };

  // Realtime同期の反映タイミング等で同一IDのメンバーが重複して配列に含まれるケースがあるため、
  // ID単位で重複除去してから名寄せ候補として使う（重複していると完全一致でも「要確認」に落ちてしまうため）
  const allCandidates = useMemo(() => {
    const raw = [
      ...members.map((部員) => ({ ...部員, isAlumni: false })),
      ...alumni.map((卒業生) => ({ ...卒業生, isAlumni: true })),
    ];
    const dedupMap = new Map();
    raw.forEach((一字) => {
      const key = 一字.id != null ? `${一字.isAlumni ? 'a' : 'm'}:${一字.id}` : null;
      if (key) {
        dedupMap.set(key, 一字);
      } else {
        // idが無い異常データは念のため残す（除外すると登録漏れになるため）
        dedupMap.set(`no-id:${dedupMap.size}`, 一字);
      }
    });
    return Array.from(dedupMap.values());
  }, [members, alumni]);

  // すでに選択されているメンバーID of Set（ピッカーでのスタイル同期用）
  const selectedMemberIds = useMemo(() => {
    const ids = new Set();
    tachiList.forEach((tachi) => {
      tachi.seats.forEach((seat) => {
        if (seat.status === 'matched' && seat.match?.id) {
          ids.add(seat.match.id);
        }
      });
    });
    return ids;
  }, [tachiList]);

  // ─────────────────────────────────────────
  // 画像選択（追加撮影で複数枚対応）
  // ─────────────────────────────────────────
  const pickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const asset = result.assets[0];
      const base64 = await uriToBase64(asset.uri);
      setImages((prev) => [...prev, { uri: asset.uri, base64 }]);
    } catch (誤り) {
      console.error('[OCRRecordModal] Image pick error:', 誤り);
      setErrorMsg('画像の選択に失敗しました。');
    }
  };

  // ─────────────────────────────────────────
  // カメラ撮影（その場でホワイトボードを撮影して直接追加）
  // ─────────────────────────────────────────
  const captureImage = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setErrorMsg('カメラの利用が許可されていません。端末の設定からカメラへのアクセスを許可してください。');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions ? ImagePicker.MediaTypeOptions.Images : ['images'],
        quality: 0.8,
        allowsEditing: false,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const asset = result.assets[0];
      const base64 = asset.base64 ? asset.base64 : await uriToBase64(asset.uri);
      setImages((prev) => [...prev, { uri: asset.uri, base64 }]);
    } catch (誤り) {
      console.error('[OCRRecordModal] Camera capture error:', 誤り);
      setErrorMsg('カメラの起動に失敗しました。');
    }
  };

  // 読み取りが終わったら、送った写真と結果を取っておく。反映せずにやり直した・閉じた読み取りや、
  // 読めなかった読み取りも残す（使えなかった読み取りほど改善に要る。2026-09-26 に運用者から）。待たない
  const 読み取りを取っておく = (中身) => {
    const 記録 = require('./improvementLog');
    const id = 記録.新しいid();
    読み取りの記録id.current = id;
    const 写真たち = (images || []).map((一枚) => 一枚 && 一枚.base64).filter(Boolean);
    // 縮められなければ（読めない形式など）元の写真をそのまま送る（5MB まで）
    Promise.all(
      写真たち.map((b) => 記録.写真を縮める(b).then((小) => 小 || 記録.base64をBlobに(b, 'image/jpeg')))
    )
      .then((縮めた) =>
        記録.改善のために取っておく(
          '写真読み取り',
          Object.assign({ 段階: '読み取り', モード: mode, 写真の枚数: 写真たち.length }, 中身),
          縮めた,
          id
        )
      )
      .catch(() => {});
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, 番) => 番 !== idx));
  };

  // ─────────────────────────────────────────
  // Gemini による画像解析
  // ─────────────────────────────────────────
  const analyzeImages = async () => {
    if (images.length === 0) return;
    setStep('analyzing');
    setErrorMsg('');

    if (!中継.中継がある()) {
      setErrorMsg('AI機能の設定（中継の宛先）が見つかりません。管理者にご確認ください。');
      setStep('pick');
      return;
    }

    const prompt = buildPrompt();

    try {
      // 鍵の引数は飾り。中継が本物の鍵に付け替える（baseUrl と Authorization は SDKの設定 が足す）
      const genAI = new GoogleGenerativeAI('chukei');
      const model = genAI.getGenerativeModel(
        {
          // 2.5-flash は相手校の板で行の数が 14〜17 に揺れ、1 字の姓を別の姓と読んだ。
          // 3.6-flash は同じ写真・同じ指示文で 8+8 行・名寄せ 16/16 が4回とも（2026-09-12）
          model: 'gemini-3.6-flash',
          generationConfig: { responseMimeType: 'application/json' },
        },
        await 中継.SDKの設定()
      );

      const 読ませる = async (指示文) => {
        const parts = [{ text: 指示文 }];
        images.forEach((img) => {
          parts.push({ inlineData: { mimeType: 'image/jpeg', data: img.base64 } });
        });
        let result;
        try {
          result = await model.generateContent(parts);
        } catch (誤り) {
          // 503（模型が混んでいる）。中継が 2・4・8 秒待って 3 回送り直したうえでの 503 なので、
          // 山が長い。もう少し待ってから、もう一度だけ読む（配信した日に 2 回続けて出た。2026-09-20）
          if (!/503/.test(String(誤り?.message || 誤り))) throw 誤り;
          set混み待ち(true);
          try {
            await new Promise((r) => setTimeout(r, 8000));
            result = await model.generateContent(parts);
          } finally {
            set混み待ち(false);
          }
        }
        return JSON.parse(result.response.text());
      };
      let parsed = await 読ませる(prompt);

      if (mode === 'record') {
        // 新しい形は teams（板ごと）。古い形（rows だけ）も受ける。
        // 板が2つ写っているときは、間に区切りを入れるために team の番号を持たせる
        const teamsにする = (読み取り) =>
          Array.isArray(読み取り.teams) && 読み取り.teams.length
            ? 読み取り.teams
            : [
                {
                  name: '',
                  cellStyle: '1射',
                  tachiPeople: 0,
                  rows: Array.isArray(読み取り.rows) ? 読み取り.rows : [],
                },
              ];
        let 生のteams = teamsにする(parsed);
        const 板の様子 = (チームたち) =>
          チームたち
            .map(
              (チーム) =>
                `[${チーム.name || ''} 立${チーム.tachiPeople} 大前${チーム.omae || '?'} ${(チーム.rows || []).map((行) => 行.name || '(無名)').join('・')}]`
            )
            .join(' ');
        console.log('[OCRRecordModal] 読んだ板:', 板の様子(生のteams));
        // ○×のマスは端末で読み替える（板でも紙でも）。合わなければ Gemini のまま
        const 端末で = (チーム, 箱たち, 行数, 帯の数) =>
          IS_WEB
            ? マスを端末で差し替える(チーム, images, {
                向き,
                道具: 画像の道具,
                重み: 板の重み,
                紙の重み,
                箱たち,
                行数,
                帯の数,
              })
            : Promise.resolve({
                teams: チーム,
                読み取り元: 'AI',
                訳: 'Web でないので端末の読み取りは使わない',
              });
        let 差し替え = await 端末で(生のteams);
        // 端末が数えた列の数（板ごと）。あとで AI の人数と食い違ったままなら、確認画面で断る
        let 端末の見当 = Array.isArray(差し替え.列の見当たち) ? 差し替え.列の見当たち : null;
        // 人数が板と合わないとき（名札の読めない列を落とした、2枚の板を1つにした）は、
        // もう一度だけ Gemini に読ませる。端末の○×（本物の板で 98〜100%）を、人数の
        // 食い違いだけで捨てないため。添えるのは
        //   ・「板が2つ」を選んだのに teams が1つ → 板の数（2枚）
        //   ・teams の数は合っていて、端末の見当が1人だけ違う → 板ごとの人数
        // 2人以上違うときは端末の見当も怪しい（板をまとめて9人と数えた実例）ので読み直さない
        //「板が2つ」を選んだのに teams が1つのときは、端末で読めていても読み直す
        //（1つの板として並べると、右の板の大前と落が逆になる）
        const 読み直しの注文 = () => {
          if (向き === '左右から' && 生のteams.length === 1) return { 板の数: 2 };
          if (差し替え.読み取り元 !== 'AI') return null;
          const 見当 = 差し替え.列の見当たち;
          if (!Array.isArray(見当) || 見当.length !== 生のteams.length) return null;
          const 違い = 見当.map((数, 番) => Math.abs(数 - 生のteams[番].rows.length));
          return 違い.every((差) => 差 <= 1) && 違い.some((差) => 差 === 1) ? { 列の数たち: 見当 } : null;
        };
        // 板の数を直したあと人数が1人違う、という2段はあるので、2回まで
        for (let 回 = 0; 回 < 2; 回++) {
          const 注文 = 読み直しの注文();
          if (!注文) break;
          console.log('[OCRRecordModal] 読み直す:', 差し替え.訳 || '板の数が違う', 注文);
          try {
            const 二度目 = await 読ませる(
              記録の指示文({
                手がかり: buildNameHint(),
                射数: shotsPerRound,
                枚数: images.length,
                向き,
                ...注文,
              })
            );
            const 二度目のteams = teamsにする(二度目);
            console.log('[OCRRecordModal] 読み直した板:', 板の様子(二度目のteams));
            const 二度目の差し替え = await 端末で(二度目のteams);
            // 端末で読めたら採る。板の数だけ直ったときも、次の読み直しの土台として採る
            const 採る =
              二度目の差し替え.読み取り元 === '端末' ||
              (注文.板の数 && 二度目のteams.length === 注文.板の数 && 生のteams.length !== 注文.板の数);
            if (!採る) break;
            parsed = 二度目;
            生のteams = 二度目のteams;
            差し替え = 二度目の差し替え;
          } catch (誤り) {
            console.log('[OCRRecordModal] 読み直しに失敗:', String((誤り && 誤り.message) || 誤り));
            break;
          }
        }
        // それでも端末で読めなかった板（印がマスいっぱいで隣と触れ合う相手校の板）は、
        // Gemini に板ごとの○×の範囲（箱）だけを出させ、中を等分して端末で読む。
        // 写真1枚の板のときだけ。箱の数が板の数と合わなければ Gemini のまま
        if (
          差し替え.読み取り元 !== '端末' &&
          IS_WEB &&
          images.length === 1 &&
          生のteams.every((チーム) => !チーム || チーム.cellStyle !== '1射')
        ) {
          console.log('[OCRRecordModal] 端末で読めないので箱を聞く:', 差し替え.訳 || '');
          try {
            const 箱の返事 = await 読ませる(板の箱の指示文({ 板の数: 生のteams.length }));
            console.log('[OCRRecordModal] 箱の返事:', JSON.stringify(箱の返事).slice(0, 400));
            // {"boards":[…]} と頼んでも、配列だけを返してくることがある
            const boards = Array.isArray(箱の返事)
              ? 箱の返事
              : Array.isArray(箱の返事 && 箱の返事.boards)
                ? 箱の返事.boards
                : [];
            const 箱たち = boards
              .map((板) => 板 && 板.box_2d)
              .filter((箱) => Array.isArray(箱) && 箱.length === 4);
            // 段の数は 帯の数×帯の中の印の数。Gemini は印が 10 段並ぶ板の cells を 4 や 5 と数えた
            //（帯を 1 マスと見る）ので、cells の数は当てにしない。数えられなければ cells の数のまま
            const 段たち = boards
              .map((板) => Number(板 && 板.bands) * Number(板 && 板.marks_per_band))
              .filter((数) => Number.isInteger(数) && 数 >= 2 && 数 <= 40);
            const 行数 = 段たち.length === boards.length && 段たち.length ? Math.max(...段たち) : undefined;
            // 帯の数（板ごとに同じはず。違えば多いほう）。箱の中の行は帯の線で決めるので渡す
            const 帯たち = boards
              .map((板) => Number(板 && 板.bands))
              .filter((数) => Number.isInteger(数) && 数 >= 1);
            const 帯の数 = 行数 && 帯たち.length === boards.length ? Math.max(...帯たち) : undefined;
            if (箱たち.length === 生のteams.length) {
              // 箱の中の射手の列の数（people）が、最初の読みの行の数と違うなら（題の字を1人に
              // 数えた・名札の無い列を落とした）、人数を添えてもう一度だけ名前と並びを読ませる。
              // 箱は人数で等分するので、人数が違うと列が丸ごとずれる
              const 人数たち = boards.map((板) => Number(板 && 板.people));
              const 違う =
                人数たち.every((数) => Number.isInteger(数) && 数 >= 1) &&
                人数たち.some((人数, 番) => 人数 !== 生のteams[番].rows.length) &&
                人数たち.every((人数, 番) => Math.abs(人数 - 生のteams[番].rows.length) <= 2);
              if (違う) {
                console.log(
                  '[OCRRecordModal] 箱の中の人数が違うので読み直す:',
                  人数たち,
                  '最初',
                  生のteams.map((チーム) => チーム.rows.length)
                );
                try {
                  const 三度目 = teamsにする(
                    await 読ませる(
                      記録の指示文({
                        手がかり: buildNameHint(),
                        射数: shotsPerRound,
                        枚数: images.length,
                        向き,
                        列の数たち: 人数たち,
                      })
                    )
                  );
                  if (
                    三度目.length === 生のteams.length &&
                    三度目.every((チーム, 番) => チーム.rows.length === 人数たち[番])
                  ) {
                    生のteams = 三度目;
                  }
                } catch (誤り) {
                  console.log(
                    '[OCRRecordModal] 人数を添えた読み直しに失敗:',
                    String((誤り && 誤り.message) || 誤り)
                  );
                }
              }
              const 箱で = await 端末で(生のteams, 箱たち, 行数, 帯の数);
              if (箱で.読み取り元 === '端末') {
                差し替え = 箱で;
                console.log(
                  '[OCRRecordModal] 箱で読んだ:',
                  JSON.stringify(箱たち),
                  '段',
                  行数 || '(cells の数)'
                );
              } else {
                console.log('[OCRRecordModal] 箱でも読めなかった:', 箱で.訳 || '');
              }
            } else {
              console.log('[OCRRecordModal] 箱の数が板と合わない:', 箱たち.length, '/', 生のteams.length);
            }
          } catch (誤り) {
            console.log('[OCRRecordModal] 箱を聞けなかった:', String((誤り && 誤り.message) || 誤り));
            差し替え = {
              ...差し替え,
              訳:
                (差し替え.訳 ? 差し替え.訳 + '。' : '') +
                '範囲を聞き直せませんでした（' +
                (/429/.test(String((誤り && 誤り.message) || 誤り)) ? 'AIの利用制限' : '通信エラー') +
                '）',
            };
          }
        }
        if (差し替え.訳) console.log('[OCRRecordModal] 端末の読み取りを使わなかった:', 差し替え.訳);
        if (差し替え.組み直した)
          console.log('[OCRRecordModal] 板の数を端末に合わせて組み直した:', 差し替え.組み直した);
        set読み取り元(差し替え.読み取り元);
        set端末の断り(差し替え.読み取り元 === '端末' ? '' : String(差し替え.訳 || '端末で読めませんでした'));
        if (Array.isArray(差し替え.列の見当たち)) 端末の見当 = 差し替え.列の見当たち;
        {
          const 人数 = 差し替え.teams.reduce((計, チーム) => 計 + ((チーム && チーム.rows) || []).length, 0);
          const 見当 = 端末の見当 ? 端末の見当.reduce((甲, 乙) => 甲 + 乙, 0) : 0;
          // 端末のほうが多い（AI が名札の無い列を落とした）ときだけ断る。少ないのは小計の列を
          // 数え落としただけのことが多い
          set列の断り(
            見当 > 人数
              ? `写真には射手の列が${見当}本あるように見えますが、AI は${人数}人しか読めませんでした。名札の無い列や読めない列があれば、その人を記録表で足してください。`
              : ''
          );
        }
        const teams = 差し替え.teams;
        const rawRows = [];
        teams.forEach((チーム, チームの番) => {
          const 一マス = チーム && チーム.cellStyle === '1射' ? '1射' : '2射';
          // 縦の表（板・縦書きの紙）は下が1射目なので見た目の順を逆にする。
          // 横書きの紙（1行1人）は左が1射目なので、見た目の順のまま
          const 起点 = チーム && チーム.layout === '横' ? '上から' : '下から';
          const 立の人数 = Number(チーム && チーム.tachiPeople) > 0 ? Number(チーム.tachiPeople) : 0;
          (Array.isArray(チーム && チーム.rows) ? チーム.rows : []).forEach((行) => {
            // マスの見た目で返ってきたら、こちらで1射ずつに開く。
            // 開くところまで模型に任せると、射数が倍になったり全部○になった
            const marks =
              Array.isArray(行 && 行.cells) && 行.cells.length
                ? マスを開く(一射目からの順にする(行.cells, 起点), 一マス)
                : Array.isArray(行 && 行.marks)
                  ? 行.marks
                  : [];
            // 端末で読んだときは確からしさが付く。低いマスは確認画面で色を付ける
            const 迷い = Array.isArray(行 && 行.確からしさ)
              ? 迷いを開く(一射目からの順にする(行.確からしさ, 起点), 一マス)
              : [];
            // roster … Gemini が名簿と照合した表記（無ければ null、古い返事なら undefined）
            const roster =
              行 && 'roster' in 行
                ? typeof 行.roster === 'string' && 行.roster.trim()
                  ? 行.roster.trim()
                  : null
                : undefined;
            // 名前の前後の記号（†・* など。名札の汚れや印を字として拾う）は落とす
            const 名 = String((行 && 行.name) || '')
              .replace(/^[^\p{L}\p{N}（(]+/u, '')
              .replace(/[^\p{L}\p{N}）)]+$/u, '');
            rawRows.push({
              name: 名,
              roster,
              marks,
              迷い,
              チーム番号: チームの番,
              立の人数,
              チーム名: (チーム && チーム.name) || '',
            });
          });
        });
        // 氏名も的中も空の行は表の余白なので落とす
        const rows = rawRows.filter(
          (行) =>
            (行 && String(行.name || '').trim() !== '') ||
            (Array.isArray(行?.marks) && 行.marks.some((印) => normalizeMark(印) !== ''))
        );
        if (rows.length === 0) {
          setErrorMsg('記録表を検出できませんでした。表全体が入るように撮り直してください。');
          読み取りを取っておく({ 結果: '読めなかった', 知らせ: '記録表を検出できませんでした' });
          setStep('pick');
          return;
        }
        applyRecordMatching(rows);
        return;
      }

      const rawTachi = Array.isArray(parsed.tachi) ? parsed.tachi : [];
      if (rawTachi.length === 0) {
        setErrorMsg('立ち順表を検出できませんでした。写真を撮り直してください。');
        読み取りを取っておく({ 結果: '読めなかった', 知らせ: '立ち順表を検出できませんでした' });
        setStep('pick');
        return;
      }

      applyMatching(rawTachi);
    } catch (誤り) {
      console.error('[OCRRecordModal] Gemini analyze error:', 誤り);
      const msg = String(誤り?.message || 誤り);
      読み取りを取っておく({ 結果: '失敗', 誤り: msg.slice(0, 300) });
      if (msg.includes('429')) {
        setErrorMsg('AIの利用制限に達しました。しばらく待ってから再度お試しください。');
      } else if (msg.includes('503')) {
        // 模型が混んでいる（high demand）。中継とここで待って送り直したうえでの 503
        setErrorMsg('ただいまAIが混み合っています。しばらく待ってからもう一度お試しください。');
      } else if (msg.includes('401') || msg.includes('ログインしていない')) {
        setErrorMsg('ログインの証が確かめられませんでした。ログインし直してから再度お試しください。');
      } else if (/network|fetch|Failed to fetch/i.test(msg)) {
        setErrorMsg('通信エラーが発生しました。電波の良い場所で再度お試しください。');
      } else {
        setErrorMsg('画像の解析に失敗しました。再度お試しいただくか、手動で入力してください。');
      }
      setStep('pick');
    }
  };

  // ─────────────────────────────────────────
  // プロンプト構築
  // ─────────────────────────────────────────
  /**
   * 読み取りの候補になる名前を、指示文に渡せる形で作る。
   *
   * 渡さないと、模型は写真の字だけを頼りに書き起こす。手書きの氏名は
   * 誤読の主因で、「三山→大山」「篠田→簑田」のように崩れる。
   * 候補を先に見せると、迷ったときに名簿の側へ寄る。
   * 読み取ったあとの名寄せ（matchArcherName）は残す。両方効く。
   */
  const buildNameHint = () =>
    名簿の手がかり(
      members.map((部員) => formatMemberName(部員.name, members)).filter(Boolean),
      alumni.map((卒業生) => formatMemberName(卒業生.name, alumni)).filter(Boolean)
    );

  // 指示文そのものは src/ocrPrompts.js に置いてある。画面から切り離してあるので、
  // 実物の写真で試して正解と突き合わせられる（scripts/try-ocr.mjs）
  const buildRecordPrompt = () =>
    記録の指示文({ 手がかり: buildNameHint(), 射数: shotsPerRound, 枚数: images.length, 向き });

  const buildLineupPrompt = () => 立ち順の指示文({ 手がかり: buildNameHint(), 枚数: images.length, 向き });

  const buildPrompt = () => (mode === 'record' ? buildRecordPrompt() : buildLineupPrompt());

  // ─────────────────────────────────────────
  // 認識結果へのメンバー名寄せ適用
  // ─────────────────────────────────────────
  const applyMatching = (rawTachi) => {
    const matched = rawTachi.map((立) => {
      const seats = (Array.isArray(立.seats) ? 立.seats : []).map((rawText) => {
        const 当たり = matchArcherName(rawText, allCandidates);
        return { rawText: rawText || '', ...当たり };
      });
      return { seats };
    });
    最初の読み取り.current = matched.map((立) =>
      立.seats.map((席) => ({ 読んだ字: 席.rawText, 名前: 席.name || '', 状態: 席.status || '' }))
    );
    読み取りを取っておく({ 結果: '読んだ', 最初: 最初の読み取り.current });
    setTachiList(matched);
    setStep('preview');
  };

  // ─────────────────────────────────────────
  // 紙の記録：認識結果へのメンバー名寄せ適用
  // ─────────────────────────────────────────
  const applyRecordMatching = (rawRows) => {
    // 名寄せは Gemini の照合（roster）を主にし、同じ人に寄った2行目からは「もしかして」に落とす
    const 名寄せ = 重なりを外す(
      rawRows.map((行) => ({
        rawText: String(行?.name || ''),
        ...名簿で名寄せ(String(行?.name || ''), 行?.roster, allCandidates),
      }))
    );
    const rows = rawRows.map((行, 番) => {
      const rawText = String(行?.name || '');
      const 名寄せの結果 = 名寄せ[番];
      return {
        rawText,
        ...名寄せの結果,
        // 確認画面では写真で読めた射数のぶんを見せる（設定の射数で切らない）
        marks: normalizeMarks(
          行?.marks,
          Math.max(1, Array.isArray(行?.marks) ? 行.marks.length : 0, Number(記入済みの射数) || 0)
        ),
        // 端末の読み取りが迷ったマス（射ごと）。タップして直したら消える
        迷い: Array.from(
          {
            length: Math.max(1, Array.isArray(行?.marks) ? 行.marks.length : 0, Number(記入済みの射数) || 0),
          },
          (_, 番) => Boolean(行?.迷い?.[番])
        ),
        // AI が読み取った実際の列数。設定と食い違う場合に警告を出すため保持する
        detectedShots: Array.isArray(行?.marks) ? 行.marks.length : 0,
        // 板が2つ写っていたときの、どちらの板か。立の切れ目に「計」を入れるための人数
        チーム番号: Number(行?.チーム番号) || 0,
        立の人数: Number(行?.立の人数) || 0,
        // 板に書いてあったチーム名（大学名）。記録表の区切りに付ける
        チーム名: String(行?.チーム名 || '').trim(),
      };
    });
    最初の読み取り.current = rows.map((行) => ({
      読んだ字: 行.rawText,
      名前: 行.name || '',
      状態: 行.status || '',
      印: 行.marks,
      迷い: 行.迷い,
      チーム番号: 行.チーム番号,
      チーム名: 行.チーム名,
    }));
    読み取りを取っておく({ 結果: '読んだ', 最初: 最初の読み取り.current });
    setRecordRows(rows);
    setStep('preview');
  };

  // 射数は設定に縛らず、「写真で読めた射数」と「いまの記録表で埋まっている射数」の
  // 多いほうに合わせる（設定より多ければ記録表を広げ、少なければ縮める。埋まった
  // マスは消えない）。以前は設定の射数で切り捨てていて、20射の板を8射の設定で
  // 読むと後ろが落ちていた
  const 合わせる射数 = useMemo(() => {
    if (mode !== 'record' || recordRows.length === 0) return shotsPerRound;
    const 写真 = Math.max(0, ...recordRows.map((行) => Number(行.detectedShots) || 0));
    return Math.max(1, 写真, Number(記入済みの射数) || 0);
  }, [mode, recordRows, shotsPerRound, 記入済みの射数]);

  /** プレビュー上で ○ → × → 未記録 を切り替える */
  const toggleRecordMark = (rowIdx, markIdx) => {
    setRecordRows((prev) =>
      prev.map((row, 番) => {
        if (番 !== rowIdx) return row;
        const marks = [...row.marks];
        marks[markIdx] = marks[markIdx] === '' ? '○' : marks[markIdx] === '○' ? '×' : '';
        // 見た上で触ったので、迷いの色は消す
        const 迷い = Array.isArray(row.迷い)
          ? row.迷い.map((値, 番) => (番 === markIdx ? false : 値))
          : row.迷い;
        return { ...row, marks, 迷い };
      })
    );
  };

  const removeRecordRow = (rowIdx) => {
    setRecordRows((prev) => prev.filter((_, 番) => 番 !== rowIdx));
  };

  /** 記録モードで氏名セルにメンバー／ゲストを割り当てる */
  const assignRecordRow = (rowIdx, candidateOrNull) => {
    setRecordRows((prev) =>
      prev.map((row, 番) => {
        if (番 !== rowIdx) return row;
        if (candidateOrNull) {
          return {
            ...row,
            status: 'matched',
            match: candidateOrNull,
            rawText: candidateOrNull.name,
            fuzzy: false,
          };
        }
        return { ...row, status: 'guest', match: null };
      })
    );
  };

  // ─────────────────────────────────────────
  // プレビュー画面でのセル手動修正
  // ─────────────────────────────────────────
  const assignSeat = (tachiIdx, seatIdx, candidateOrNull) => {
    setTachiList((prev) => {
      const next = prev.map((立) => ({ seats: [...立.seats] }));
      if (candidateOrNull) {
        next[tachiIdx].seats[seatIdx] = {
          status: 'matched',
          match: candidateOrNull,
          rawText: candidateOrNull.name,
        };
      } else {
        next[tachiIdx].seats[seatIdx] = { status: 'empty', rawText: '' };
      }
      return next;
    });
    setPickerTarget(null);
    setPickerSearch('');
    setIsEnteringGuest(false);
    setGuestNameInput('');
  };

  const setSeatAsGuest = (tachiIdx, seatIdx, name) => {
    setTachiList((prev) => {
      const next = prev.map((立) => ({ seats: [...立.seats] }));
      next[tachiIdx].seats[seatIdx] = { status: 'guest', rawText: name };
      return next;
    });
    setPickerTarget(null);
    setPickerSearch('');
    setIsEnteringGuest(false);
    setGuestNameInput('');
  };

  // ─────────────────────────────────────────
  // 記録表への反映（空セルのスキップと、無駄な空セパレータ防止）
  // ─────────────────────────────────────────
  /**
   * 紙の記録から射手配列を作る。
   * 立ち順モードと違い「立」の概念がないため、セパレータは挟まず読み取った順に並べる。
   */
  /** 区切り・計の列を1つ作る */
  // 種 … "区切り"（チーム名を付けられる）、"計"（その立の合計）、"総計"（手前の計もまとめる。間隔で止まる）
  const 仕切りを作る = (種, チーム名) => ({
    id: generateUUID(),
    name: '区切り' === 種 ? '---' : 種,
    marks: Array(合わせる射数).fill(''),
    arrowLocations: Array(合わせる射数).fill(null),
    gender: '未設定',
    grade: 0,
    isGuest: false,
    isSeparator: '区切り' === 種,
    isTotalCalculator: '計' === 種 || '総計' === 種,
    またぐ合計: '総計' === 種,
    ...('区切り' === 種 && チーム名 ? { teamName: チーム名 } : null),
    lockedBlocks: {},
    lastModified: Date.now(),
  });

  const buildRecordArchersArray = () => {
    // 名前が読めなかった行でも、○×が入っていれば射手として足す（名札の無い人。
    // 前は名前の無い行を落としていて、確認画面には居たのに記録表に写らなかった）
    const 印がある = (row) => Array.isArray(row.marks) && row.marks.some((印) => normalizeMark(印) !== '');
    const 射手たち = recordRows
      .filter(
        (row) => row.status === 'matched' || (row.rawText && row.rawText.trim() !== '') || 印がある(row)
      )
      .map((row) => {
        const base = {
          id: generateUUID(),
          name: '',
          marks: normalizeMarks(row.marks, 合わせる射数),
          arrowLocations: Array(合わせる射数).fill(null),
          gender: '未設定',
          grade: 1,
          isGuest: false,
          isSeparator: false,
          isTotalCalculator: false,
          lockedBlocks: {},
          lastModified: Date.now(),
        };
        // 板の番号と立の人数は、名簿の人でもゲストでも付ける。前は名簿の人に付けておらず、
        // 全員が部員だと（本番の自校の板）区切りも計も入らなかった（検証環境ではゲストなので出ていた）
        const 組 = {
          チーム番号: row.チーム番号 || 0,
          立の人数: row.立の人数 || 0,
          チーム名: String(row.チーム名 || '').trim(),
        };
        if (row.status === 'matched' && row.match) {
          return {
            ...base,
            name: row.match.name,
            gender: row.match.gender || '未設定',
            grade: typeof row.match.grade === 'number' ? row.match.grade : 1,
            memberId: row.match.id,
            isGuest: false,
            ...組,
          };
        }
        return {
          ...base,
          name: row.rawText && row.rawText.trim() !== '' ? row.rawText : '（名前なし）',
          isGuest: true,
          ...組,
        };
      });

    // 記録表の組み方は、使う人が手で作る形に合わせる（2026-09-15、板 Bの期待図）：
    //   [チーム名の区切り] 大前…落 [計] 大前…落 [計] … [総計]
    // ・同じチーム（板の名前が同じ。名前の無い板どうしも同じ扱い＝自校）の板は続けて並べ、
    //   板の間に区切りは入れない。立（ふつう4人）ごとに「計」、立が2つ以上なら端に「総計」
    // ・チーム名が読めていれば、そのチームの先頭（画面では右端）に名前付きの区切りを置く。
    //   区切りより左の射手がそのチームの色になる仕組みなので、先頭に置けば全員に色が付く
    // ・別のチームが続くときは、そのチームの区切りが境目になる
    // 数字は読まない。並びから数え直すので、そのほうが確かめられる。
    //
    // 板の順は写真と逆に並べる。記録表は 1 人目（大前）を右端に置くので、teams の順
    //（写真の左の板から）のままだと、写真の左の板が画面の右に出て見比べにくい
    //（相手校の板 2 枚で「人の順序がおかしい」と言われた）。板ごとの中の並びはそのまま
    const 板ごと = [];
    for (const 射手 of 射手たち) {
      const 番 = 射手.チーム番号 || 0;
      const 尻 = 板ごと[板ごと.length - 1];
      if (尻 && 尻.番 === 番) 尻.人.push(射手);
      else 板ごと.push({ 番, 名: 射手.チーム名 || '', 人: [射手] });
    }
    // 同じ名前の板をチームにまとめる（並びで隣り合うものだけ）
    const チームごと = [];
    for (const 板 of 板ごと.slice().reverse()) {
      const 尻 = チームごと[チームごと.length - 1];
      if (尻 && 尻.名 === 板.名) 尻.板.push(板);
      else チームごと.push({ 名: 板.名, 板: [板] });
    }
    const 出 = [];
    チームごと.forEach((チーム, 番) => {
      // 名前が読めていれば名前付きの区切り。名前が無くても、前に別のチームが居れば
      // 境目として区切りを置く（先頭の自校には置かない）
      if (チーム.名 || 番 > 0) 出.push(仕切りを作る('区切り', チーム.名));
      let 立の数 = 0;
      for (const 板 of チーム.板) {
        let この立 = 0;
        let 立の人数 = 0;
        const 立を閉じる = () => {
          if (この立 > 0 && 立の人数 > 0) {
            出.push(仕切りを作る('計'));
            立の数++;
          }
          この立 = 0;
        };
        for (const 射手 of 板.人) {
          立の人数 = 射手.立の人数 || 0;
          // 射手そのものには、組み立て用の目印を残さない
          const { チーム番号, 立の人数: _人数, チーム名: _名, ...中身 } = 射手;
          出.push(中身);
          この立++;
          if (立の人数 > 0 && この立 >= 立の人数) 立を閉じる();
        }
        立を閉じる();
      }
      if (立の数 >= 2) 出.push(仕切りを作る('総計'));
    });
    return 出;
  };

  const buildArchersArray = () => {
    const activeTachiLists = [];

    tachiList.forEach((tachi) => {
      const listForThisTachi = [];
      tachi.seats.forEach((seat) => {
        // 空欄（statusがempty、または名前がない）は追加せず無視（何も入れない）
        if (seat.status === 'empty' || !seat.rawText || seat.rawText.trim() === '') {
          return;
        }

        const base = {
          id: generateUUID(),
          name: '',
          marks: Array(shotsPerRound).fill(''),
          arrowLocations: Array(shotsPerRound).fill(null),
          gender: '未設定',
          grade: 1,
          isGuest: false,
          isSeparator: false,
          isTotalCalculator: false,
          lockedBlocks: {},
          lastModified: Date.now(),
        };

        if (seat.status === 'matched' && seat.match) {
          listForThisTachi.push({
            ...base,
            name: seat.match.name,
            gender: seat.match.gender || '未設定',
            grade: typeof seat.match.grade === 'number' ? seat.match.grade : 1,
            memberId: seat.match.id,
            isGuest: false,
          });
        } else if ((seat.status === 'guest' || seat.status === 'ambiguous') && seat.rawText) {
          listForThisTachi.push({ ...base, name: seat.rawText, isGuest: true });
        }
      });
      activeTachiLists.push(listForThisTachi);
    });

    const result = [];
    // 有効なメンバーが入っている立ちのみを処理し、その間にセパレータを入れる
    const nonTransientTachi = activeTachiLists.filter((list) => list.length > 0);

    nonTransientTachi.forEach((list, idx) => {
      result.push(...list);
      if (idx < nonTransientTachi.length - 1) {
        result.push({
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
        });
      }
    });

    return result;
  };

  // 読み取った人は、いまの記録表の後ろに足す。何も消えないので確かめは要らない
  const 反映のしかた = '後ろに足す';
  const 確かめてから = (進む) => 進む();

  // 反映したとき、直したあとを取っておく。写真と最初の結果は読み取りの記録（元の読み取り）にある。待たない
  const 改善のために取っておく = (反映した射手たち) => {
    require('./improvementLog').改善のために取っておく('写真読み取り', {
      段階: '反映',
      元の読み取り: 読み取りの記録id.current,
      モード: mode,
      読み取り元,
      端末の断り: 端末の断り || '',
      直したあと: (反映した射手たち || [])
        .filter((射手) => 射手 && !射手.isSeparator && !射手.isTotalCalculator)
        .map((射手) => ({ 名前: 射手.name || '', 印: 射手.marks || [] })),
    });
  };

  const handleApply = () => {
    if (mode === 'record') {
      if (recordRows.some((行) => 行.status === 'ambiguous')) {
        Alert.alert(
          '確認が必要です',
          '候補が複数ある名前が残っています。該当の氏名を押して選択してください。'
        );
        return;
      }
      const archers = buildRecordArchersArray();
      if (archers.length === 0) {
        Alert.alert('反映できません', '読み取れた射手がいません。写真を撮り直してください。');
        return;
      }
      確かめてから(() => {
        // どちらの読み取りかを渡す。呼び出し側の知らせの文言が変わる。
        // 射数は、写真で読めた数といまの記録表で埋まっている数の多いほうに合わせる
        onApply && onApply(archers, 'record', 反映のしかた, 合わせる射数);
        改善のために取っておく(archers);
        handleClose();
      });
      return;
    }

    const hasAmbiguous = tachiList.some((立) => 立.seats.some((席) => 席.status === 'ambiguous'));
    if (hasAmbiguous) {
      Alert.alert('確認が必要です', '候補が複数ある名前が残っています。該当のマスを押して選択してください。');
      return;
    }
    const archers = buildArchersArray();
    確かめてから(() => {
      onApply && onApply(archers, 'tachi', 反映のしかた);
      改善のために取っておく(archers);
      handleClose();
    });
  };

  // ─────────────────────────────────────────
  // セルの色分け（ステータス別）
  // ─────────────────────────────────────────
  const seatColor = (seat) => {
    if (!seat) return '#F2F2F7';
    if (seat.status === 'matched') return seat.fuzzy ? '#FFF3CD' : '#E5F1FF';
    if (seat.status === 'ambiguous') return '#FFE5E5';
    if (seat.status === 'guest') return '#F0F0F0';
    return '#F9F9F9'; // empty
  };
  const seatLabel = (seat) => {
    if (!seat) return '選択';
    if (seat.status === 'matched') return seat.match.name;
    if (seat.status === 'ambiguous') return `${seat.rawText}(要選択)`;
    if (seat.status === 'guest') return seat.rawText ? `${seat.rawText}(ゲスト)` : '選択';
    return '選択';
  };

  // メンバーピッカー（アコーディオン表示用）
  const activeMembersSorted = useMemo(() => {
    return members
      .filter((部員) => (部員.grade || 0) < 5)
      .filter((部員) => !pickerSearch.trim() || normalize(部員.name).includes(normalize(pickerSearch)))
      .sort((甲, 乙) => {
        const gradeA = undefined === 甲.grade || null === 甲.grade ? 99 : Number(甲.grade);
        const gradeB = undefined === 乙.grade || null === 乙.grade ? 99 : Number(乙.grade);
        const 甲の順 = gradeA === 0 ? 99 : gradeA;
        const 乙の順 = gradeB === 0 ? 99 : gradeB;
        if (甲の順 !== 乙の順) return 甲の順 - 乙の順;
        const genderVal = (性別) => ('男子' === 性別 ? 0 : '女子' === 性別 ? 1 : 2);
        const genDiff = genderVal(甲.gender) - genderVal(乙.gender);
        return 0 !== genDiff ? genDiff : (甲.name || '').localeCompare(乙.name || '', 'ja');
      });
  }, [members, pickerSearch]);

  const activeGroups = useMemo(() => {
    const groups = {};
    activeMembersSorted.forEach((部員) => {
      const 学年 = undefined === 部員.grade || null === 部員.grade ? 0 : Number(部員.grade);
      groups[学年] || (groups[学年] = []);
      groups[学年].push(部員);
    });
    const sortedGrades = Object.keys(groups)
      .map(Number)
      .sort((甲, 乙) => {
        if (甲 === 0) return 1;
        if (乙 === 0) return -1;
        return 甲 - 乙;
      });
    return sortedGrades.map((学年) => ({
      grade: 学年,
      title: 学年 === 0 ? 'その他/ゲスト' : `${学年}年生`,
      members: groups[学年],
    }));
  }, [activeMembersSorted]);

  const alumniByTerm = useMemo(() => {
    const list = alumni.filter(
      (卒業生) => !pickerSearch.trim() || normalize(卒業生.name).includes(normalize(pickerSearch))
    );
    const termMap = {};
    list.forEach((卒業生) => {
      const term = 卒業生.termKi || 999;
      termMap[term] || (termMap[term] = []);
      termMap[term].push(卒業生);
    });
    return Object.keys(termMap)
      .sort((甲, 乙) => Number(乙) - Number(甲))
      .map((term) => ({
        term,
        members: termMap[term].sort((甲, 乙) => (甲.name || '').localeCompare(乙.name || '', 'ja')),
      }));
  }, [alumni, pickerSearch]);

  const toggleActiveGrade = (gStr) => {
    setExpandedActiveGrades((prev) => {
      const next = new Set(prev);
      next.has(gStr) ? next.delete(gStr) : next.add(gStr);
      return next;
    });
  };

  const toggleTerm = (termStr) => {
    setExpandedTerms((prev) => {
      const next = new Set(prev);
      next.has(termStr) ? next.delete(termStr) : next.add(termStr);
      return next;
    });
  };

  // ピッカーは立ち順モード（{tachiIdx, seatIdx}）と記録モード（{rowIdx}）で
  // 対象の指し方が違うため、ここで振り分ける
  const pickAssign = (candidateOrNull) => {
    if (!pickerTarget) return;
    if (pickerTarget.rowIdx != null) {
      assignRecordRow(pickerTarget.rowIdx, candidateOrNull);
      setPickerTarget(null);
      setPickerSearch('');
      return;
    }
    assignSeat(pickerTarget.tachiIdx, pickerTarget.seatIdx, candidateOrNull);
  };

  const pickAssignGuest = (name) => {
    if (!pickerTarget || !name) return;
    if (pickerTarget.rowIdx != null) {
      setRecordRows((prev) =>
        prev.map((row, 番) =>
          番 === pickerTarget.rowIdx ? { ...row, status: 'guest', match: null, rawText: name } : row
        )
      );
      setPickerTarget(null);
      setPickerSearch('');
      setIsEnteringGuest(false);
      setGuestNameInput('');
      return;
    }
    setSeatAsGuest(pickerTarget.tachiIdx, pickerTarget.seatIdx, name);
  };

  const submitGuest = () => {
    const name = guestNameInput.trim();
    if (name && pickerTarget) pickAssignGuest(name);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={戻るで閉じるとき}>
      <View style={styles.overlay}>
        <View
          style={[styles.container, getShadowStyle({ shadowOpacity: 0.15, shadowRadius: 12, elevation: 12 })]}
        >
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="camera" size={20} color="#007AFF" />
              <Text style={styles.headerTitle}>
                {mode === 'record' ? '画像から記録を読み取る' : '画像から立ち順を登録'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {step === 'pick' && (
            <ScrollView style={styles.body} contentContainerStyle={{ padding: 16 }}>
              <View style={styles.modeRow}>
                <TouchableOpacity
                  style={[styles.modeBtn, mode === 'lineup' && styles.modeBtnActive]}
                  onPress={() => {
                    setMode('lineup');
                    setErrorMsg('');
                  }}
                >
                  <Text style={[styles.modeBtnText, mode === 'lineup' && styles.modeBtnTextActive]}>
                    立ち順表
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeBtn, mode === 'record' && styles.modeBtnActive]}
                  onPress={() => {
                    setMode('record');
                    setErrorMsg('');
                  }}
                >
                  <Text style={[styles.modeBtnText, mode === 'record' && styles.modeBtnTextActive]}>
                    紙の記録
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.hint}>
                {mode === 'record'
                  ? `的中記録を撮影・選択してください。氏名と1射ごとの○×を読み取り、いまの記録表の後ろに足します。射数は、写真といまの記録表で多いほうに合わせます。1枚に収まらない場合は続けて追加できます。

※ 1射目はいちばん下のマス（横書きの紙は左端）として読みます。読み取った結果は次の画面で必ず確かめてください。`
                  : '立ち順表を撮影・選択してください。1枚に収まらない場合は続けて追加できます。'}
              </Text>

              {/* 大前がどちらの端かは道場や大会で違う。読み違えると並びが丸ごと逆になるので、
                  当てずっぽうにせず選んでもらう */}
              <Text style={styles.settingLabel}>大前はどちら側ですか</Text>
              <View style={styles.modeRow}>
                {[
                  { 値: '右から', 札: '右端が大前' },
                  { 値: '左から', 札: '左端が大前' },
                  { 値: '左右から', 札: '板が2つ（外側が大前）' },
                ].map((選択肢) => (
                  <TouchableOpacity
                    key={選択肢.値}
                    style={[styles.modeBtn, 向き === 選択肢.値 && styles.modeBtnActive]}
                    onPress={() => {
                      set向き(選択肢.値);
                      setErrorMsg('');
                    }}
                  >
                    <Text style={[styles.modeBtnText, 向き === 選択肢.値 && styles.modeBtnTextActive]}>
                      {選択肢.札}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.settingNote}>
                {向き === '左右から'
                  ? 'リーグの対戦などで、板が向かい合って2つ並んでいるときに選んでください。左の板は左から、右の板は右から読み、間に区切りを入れます。'
                  : '写真の中で、大前（一的）の人がどちら側に書かれているかを選んでください。'}
              </Text>

              {images.length > 0 && (
                <View style={styles.thumbRow}>
                  {images.map((img, idx) => (
                    <View key={idx} style={styles.thumbWrap}>
                      <Image source={{ uri: img.uri }} style={styles.thumb} />
                      <TouchableOpacity style={styles.thumbRemove} onPress={() => removeImage(idx)}>
                        <Ionicons name="close-circle" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                      <Text style={styles.thumbLabel}>{idx + 1}枚目</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.pickBtnRow}>
                <TouchableOpacity style={[styles.pickBtn, { flex: 1 }]} onPress={captureImage}>
                  <Ionicons name="camera-outline" size={22} color="#007AFF" />
                  <Text style={styles.pickBtnText}>撮影する</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.pickBtn, { flex: 1 }]} onPress={pickImage}>
                  <Ionicons name="images-outline" size={22} color="#007AFF" />
                  <Text style={styles.pickBtnText}>
                    {images.length === 0 ? '画像を選択' : '写真を追加する'}
                  </Text>
                </TouchableOpacity>
              </View>

              {!!errorMsg && (
                <View style={styles.errorBox}>
                  <Ionicons name="warning" size={16} color="#FF3B30" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.analyzeBtn, images.length === 0 && styles.analyzeBtnDisabled]}
                onPress={analyzeImages}
                disabled={images.length === 0}
              >
                <Ionicons name="sparkles" size={18} color="#FFF" />
                <Text style={styles.analyzeBtnText}>この画像で解析する</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {step === 'analyzing' && (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.centerText}>
                {混み待ち
                  ? 'AIが混み合っています。少し待ってからもう一度読みます...'
                  : mode === 'record'
                    ? 'AIが記録表を読み取っています...'
                    : 'AIが立ち順表を読み取っています...'}
              </Text>
            </View>
          )}

          {step === 'preview' && mode === 'record' && (
            <>
              <ScrollView style={styles.body} contentContainerStyle={{ padding: 16 }}>
                <Text style={styles.hint}>
                  内容を確認してください。氏名をタップすると変更、○×のマスをタップすると 「○ → × →
                  未記録」の順で切り替わります。
                </Text>
                {/* 検査が「端末で読めたか」を見るための印。画面には出ない */}
                <View
                  testID={読み取り元 === '端末' ? 'ocr-yomitori-tanmatsu' : 'ocr-yomitori-ai'}
                  style={{ height: 0 }}
                />
                {読み取り元 !== '端末' && mode === 'record' && (
                  <Text style={[styles.hint, { color: '#B25000' }]} testID="ocr-ai-kotowari">
                    ○×はAIが読みました（端末では読めませんでした：{端末の断り}
                    ）。AIは丸に線の向きを取り違えやすいので、○×をよく確かめてください。しばらくして撮り直すと端末で読めることがあります。
                  </Text>
                )}
                {!!列の断り && (
                  <Text style={[styles.hint, { color: '#B25000' }]} testID="ocr-retsu-kotowari">
                    {列の断り}
                  </Text>
                )}

                {合わせる射数 !== shotsPerRound && (
                  <Text style={styles.hint}>
                    射数を{shotsPerRound}射から{合わせる射数}射に合わせます（写真といまの記録表の多いほう）。
                  </Text>
                )}

                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#E5F1FF' }]} />
                    <Text style={styles.legendText}>一致</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#FFE5E5' }]} />
                    <Text style={styles.legendText}>要確認</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#F0F0F0' }]} />
                    <Text style={styles.legendText}>ゲスト</Text>
                  </View>
                  {recordRows.some((行) => Array.isArray(行.迷い) && 行.迷い.some(Boolean)) && (
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, styles.legendDotMayoi]} />
                      <Text style={styles.legendText}>読み取りが迷ったマス</Text>
                    </View>
                  )}
                </View>

                {recordRows.map((row, rIdx) => {
                  const hits = row.marks.filter((印) => 印 === '○').length;
                  const shots = row.marks.filter((印) => 印 !== '').length;
                  return (
                    <View key={rIdx} style={styles.recordRow}>
                      <View style={styles.recordRowHeader}>
                        <TouchableOpacity
                          style={[styles.recordNameChip, { backgroundColor: seatColor(row) }]}
                          onPress={() => {
                            setPickerTarget({ rowIdx: rIdx });
                            setPickerSearch(
                              row.status === 'ambiguous' || row.status === 'guest' ? row.rawText || '' : ''
                            );
                          }}
                        >
                          <Text style={styles.recordNameText} numberOfLines={1}>
                            {seatLabel(row)}
                          </Text>
                        </TouchableOpacity>
                        <Text style={styles.recordScoreText}>
                          {hits}/{shots || 合わせる射数}
                        </Text>
                        <TouchableOpacity
                          onPress={() => removeRecordRow(rIdx)}
                          style={styles.recordRemoveBtn}
                        >
                          <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.markRow}>
                        {row.marks.map((印, mIdx) => (
                          <TouchableOpacity
                            key={mIdx}
                            style={[
                              styles.markCell,
                              印 === '○' && styles.markCellHit,
                              印 === '×' && styles.markCellMiss,
                              Boolean(row.迷い?.[mIdx]) && styles.markCellMayoi,
                            ]}
                            testID={Boolean(row.迷い?.[mIdx]) ? 'ocr-mayoi-cell' : undefined}
                            onPress={() => toggleRecordMark(rIdx, mIdx)}
                          >
                            <Text
                              style={[
                                styles.markCellText,
                                印 === '○' && styles.markCellTextHit,
                                印 === '×' && styles.markCellTextMiss,
                              ]}
                            >
                              {印 || '－'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.previewFooter}>
                <TouchableOpacity style={styles.footerBtnSecondary} onPress={() => setStep('pick')}>
                  <Text style={styles.footerBtnSecondaryText}>撮り直す</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerBtnPrimary} onPress={handleApply}>
                  <Text style={styles.footerBtnPrimaryText}>記録表に反映する</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'preview' && mode !== 'record' && (
            <>
              <ScrollView style={styles.body} contentContainerStyle={{ padding: 16 }}>
                <Text style={styles.hint}>
                  内容を確認してください。色付きのセルはタップして修正できます。
                </Text>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#E5F1FF' }]} />
                    <Text style={styles.legendText}>一致</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#FFE5E5' }]} />
                    <Text style={styles.legendText}>要確認</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#F0F0F0' }]} />
                    <Text style={styles.legendText}>ゲスト</Text>
                  </View>
                </View>

                {tachiList.map((tachi, tIdx) => {
                  // 空欄（status === "empty"）のセルを除外した有効な的のみをカウント
                  const activeSeats = tachi.seats.filter((seat) => seat.status !== 'empty');
                  if (activeSeats.length === 0) return null; // 有効な的が1つもなければこの立ち自体を描画しない

                  return (
                    <View key={tIdx} style={styles.tachiBlock}>
                      <Text style={styles.tachiLabel}>{SHOT_LABELS[tIdx] || `${tIdx + 1}立目`}</Text>
                      <View style={styles.seatRow}>
                        {tachi.seats.map((seat, sIdx) => {
                          if (seat.status === 'empty') return null; // 空欄の的はプレビュー画面にも何も入れない（表示しない）
                          return (
                            <TouchableOpacity
                              key={sIdx}
                              style={[styles.seatChip, { backgroundColor: seatColor(seat) }]}
                              onPress={() => {
                                setPickerTarget({ tachiIdx: tIdx, seatIdx: sIdx });
                                // 要確認・ゲストのセルは、OCRが読み取った文字列をそのまま検索欄に入れて
                                // 候補（例：渡辺姓の複数人）をすぐ絞り込んだ状態で開く
                                setPickerSearch(
                                  seat.status === 'ambiguous' || seat.status === 'guest'
                                    ? seat.rawText || ''
                                    : ''
                                );
                              }}
                            >
                              <Text style={styles.seatChipText} numberOfLines={2}>
                                {seatLabel(seat)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.previewFooter}>
                <TouchableOpacity style={styles.footerBtnSecondary} onPress={() => setStep('pick')}>
                  <Text style={styles.footerBtnSecondaryText}>撮り直す</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerBtnPrimary} onPress={handleApply}>
                  <Text style={styles.footerBtnPrimaryText}>記録表に反映する</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      {!!pickerTarget && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPickerTarget(null)}
        >
          <View style={styles.pickerOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setPickerTarget(null)}
            />
            <View style={styles.pickerBox}>
              <Text style={styles.pickerTitle}>メンバーを選択</Text>

              {/* ゲスト登録切り替えエリア */}
              {isEnteringGuest ? (
                <View style={styles.guestInputRow}>
                  <TextInput
                    style={styles.guestInput}
                    placeholder="ゲスト名を入力"
                    value={guestNameInput}
                    onChangeText={setGuestNameInput}
                    autoFocus={true}
                    onSubmitEditing={submitGuest}
                  />
                  <TouchableOpacity onPress={submitGuest} style={styles.guestSubmitBtn}>
                    <Text style={styles.guestSubmitBtnText}>決定</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setIsEnteringGuest(false);
                      setGuestNameInput('');
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    <Ionicons name="close" size={24} color="#8E8E93" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.pickerToolbarRow}>
                  <TextInput
                    style={[styles.pickerSearchInput, { flex: 1, marginBottom: 0 }]}
                    placeholder="名前で検索"
                    value={pickerSearch}
                    onChangeText={setPickerSearch}
                    autoFocus={true}
                  />
                  <TouchableOpacity style={styles.guestToggleBtn} onPress={() => setIsEnteringGuest(true)}>
                    <Ionicons name="person-add-outline" size={18} color="#5856D6" />
                    <Text style={styles.guestToggleBtnText}>ゲスト</Text>
                  </TouchableOpacity>
                </View>
              )}

              <ScrollView style={styles.pickerList}>
                <TouchableOpacity style={styles.pickerRow} onPress={() => pickAssign(null)}>
                  <Text style={styles.pickerRowTextMuted}>（空欄にする）</Text>
                </TouchableOpacity>

                {/* 現役生グループアコーディオン */}
                {activeGroups.map((group) => {
                  const gStr = group.grade.toString();
                  // 検索中（要確認セルからの自動絞り込み含む）は、折りたたみ状態に関わらず候補を表示する
                  const isOpen = pickerSearch.trim() ? true : expandedActiveGrades.has(gStr);
                  return (
                    <React.Fragment key={`grade-${gStr}`}>
                      <TouchableOpacity
                        style={styles.accordionHeader}
                        onPress={() => toggleActiveGrade(gStr)}
                      >
                        <Text style={styles.accordionTitle}>
                          {group.title} ({group.members.length}人)
                        </Text>
                        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#8E8E93" />
                      </TouchableOpacity>
                      {isOpen &&
                        group.members.map((部員) => {
                          const isSelected = selectedMemberIds.has(部員.id);
                          const isMale = 部員.gender === '男子';
                          const isFemale = 部員.gender === '女子';
                          const textColor = isMale ? '#007AFF' : isFemale ? '#FF2D55' : '#1C1C1E';
                          return (
                            <TouchableOpacity
                              key={部員.id}
                              style={[
                                styles.pickerRowIndent,
                                isSelected && { backgroundColor: '#F0F0F5', opacity: 0.8 },
                              ]}
                              onPress={() => pickAssign(部員)}
                            >
                              <View
                                style={{
                                  flexDirection: 'row',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  width: '100%',
                                }}
                              >
                                <Text
                                  style={[
                                    styles.pickerRowText,
                                    { color: textColor },
                                    isSelected && { opacity: 0.5 },
                                  ]}
                                >
                                  {部員.name}
                                  {部員.termKi ? ` (${部員.termKi}期)` : ''}
                                </Text>
                                {isSelected && (
                                  <View style={styles.selectedBadge}>
                                    <Text style={styles.selectedBadgeText}>選択済</Text>
                                  </View>
                                )}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                    </React.Fragment>
                  );
                })}

                {/* 卒業生グループ期別アコーディオン */}
                {alumniByTerm.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.sectionDividerText}>卒業生</Text>
                    {alumniByTerm.map((group) => {
                      const tStr = group.term.toString();
                      const isOpen = pickerSearch.trim() ? true : expandedTerms.has(tStr);
                      return (
                        <React.Fragment key={`term-${tStr}`}>
                          <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleTerm(tStr)}>
                            <Text style={styles.accordionTitle}>
                              {tStr === '999' ? '期生不明' : `${tStr}期`} ({group.members.length}人)
                            </Text>
                            <Ionicons
                              name={isOpen ? 'chevron-up' : 'chevron-down'}
                              size={16}
                              color="#8E8E93"
                            />
                          </TouchableOpacity>
                          {isOpen &&
                            group.members.map((卒業生) => {
                              const isSelected = selectedMemberIds.has(卒業生.id);
                              const isMale = 卒業生.gender === '男子';
                              const isFemale = 卒業生.gender === '女子';
                              const textColor = isMale ? '#007AFF' : isFemale ? '#FF2D55' : '#1C1C1E';
                              return (
                                <TouchableOpacity
                                  key={卒業生.id}
                                  style={[
                                    styles.pickerRowIndent,
                                    isSelected && { backgroundColor: '#F0F0F5', opacity: 0.8 },
                                  ]}
                                  onPress={() => pickAssign(卒業生)}
                                >
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      width: '100%',
                                    }}
                                  >
                                    <Text
                                      style={[
                                        styles.pickerRowText,
                                        { color: textColor },
                                        isSelected && { opacity: 0.5 },
                                      ]}
                                    >
                                      {卒業生.name}
                                    </Text>
                                    {isSelected && (
                                      <View style={styles.selectedBadge}>
                                        <Text style={styles.selectedBadgeText}>選択済</Text>
                                      </View>
                                    )}
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                        </React.Fragment>
                      );
                    })}
                  </View>
                )}

                {!!pickerSearch.trim() && (
                  <TouchableOpacity
                    style={styles.pickerRow}
                    onPress={() => pickAssignGuest(pickerSearch.trim())}
                  >
                    <Text style={styles.pickerRowTextGuest}>「{pickerSearch.trim()}」をゲストとして登録</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
              <TouchableOpacity style={styles.pickerCloseBtn} onPress={() => setPickerTarget(null)}>
                <Text style={styles.pickerCloseBtnText}>閉じる</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

exports.OCRRecordModal = OCRRecordModal;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '88%',
    minHeight: '50%',
  },
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
  hint: { fontSize: 13, color: '#666', marginBottom: 12, lineHeight: 18 },
  settingLabel: { fontSize: 13, fontWeight: '600', color: '#000', marginBottom: 6 },
  settingNote: { fontSize: 12, color: '#8E8E93', marginBottom: 14, lineHeight: 17 },

  thumbRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  thumbWrap: { alignItems: 'center' },
  thumb: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#EEE' },
  thumbRemove: { position: 'absolute', top: -6, right: -6, backgroundColor: '#FFF', borderRadius: 10 },
  thumbLabel: { fontSize: 10, color: '#888', marginTop: 2 },
  pickBtnRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 14,
  },
  pickBtnText: { color: '#007AFF', fontSize: 15, fontWeight: '600' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: { color: '#FF3B30', fontSize: 13, flex: 1 },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
  },
  analyzeBtnDisabled: { backgroundColor: '#C7C7CC' },
  analyzeBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },

  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  centerText: { marginTop: 14, fontSize: 14, color: '#666' },
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 11, color: '#666' },
  tachiBlock: { marginBottom: 16 },
  tachiLabel: { fontSize: 13, fontWeight: 'bold', color: '#3C3C43', marginBottom: 6 },
  seatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  seatChip: {
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatChipText: { fontSize: 12, color: '#1C1C1E', textAlign: 'center' },

  // 読み取りモード切替（立ち順表 / 紙の記録）
  modeRow: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#FFFFFF' },
  modeBtnText: { fontSize: 14, color: '#8E8E93', fontWeight: '600' },
  modeBtnTextActive: { color: '#007AFF', fontWeight: 'bold' },

  // 紙の記録のプレビュー（1行＝1人）
  recordRow: { marginBottom: 14, padding: 10, backgroundColor: '#F9F9F9', borderRadius: 10 },
  recordRowHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  recordNameChip: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  recordNameText: { fontSize: 14, color: '#1C1C1E', fontWeight: '600' },
  recordScoreText: { fontSize: 13, color: '#8E8E93', fontWeight: 'bold', minWidth: 42, textAlign: 'right' },
  recordRemoveBtn: { padding: 4 },
  markRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  markCell: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markCellHit: { backgroundColor: '#E5F1FF', borderColor: '#007AFF' },
  markCellMiss: { backgroundColor: '#FFE5E5', borderColor: '#FF3B30' },
  // 端末の読み取りが迷ったマス。○×の文字色はそのまま、枠を太い黄色にして目に留める
  markCellMayoi: { borderWidth: 2, borderColor: '#FFB300', backgroundColor: '#FFF4CC' },
  legendDotMayoi: { backgroundColor: '#FFF4CC', borderWidth: 2, borderColor: '#FFB300' },
  markCellText: { fontSize: 16, color: '#C7C7CC', fontWeight: 'bold' },
  markCellTextHit: { color: '#007AFF' },
  markCellTextMiss: { color: '#FF3B30' },

  previewFooter: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#EEE' },
  footerBtnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  footerBtnSecondaryText: { color: '#007AFF', fontSize: 15, fontWeight: '600' },
  footerBtnPrimary: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
  },
  footerBtnPrimaryText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerBox: {
    width: '88%',
    maxWidth: 380,
    maxHeight: '70%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
  },
  pickerTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 10, color: '#1C1C1E' },
  pickerSearchInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 10,
  },
  pickerList: { maxHeight: 320 },
  pickerRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  pickerRowIndent: {
    paddingVertical: 12,
    paddingLeft: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  pickerRowText: { fontSize: 14, color: '#1C1C1E' },
  pickerRowTextMuted: { fontSize: 14, color: '#999' },
  pickerRowTextGuest: { fontSize: 14, color: '#FF9500', fontWeight: '600' },
  pickerCloseBtn: { marginTop: 10, paddingVertical: 10, alignItems: 'center' },
  pickerCloseBtnText: { color: '#8E8E93', fontSize: 14 },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  accordionTitle: { fontSize: 13, fontWeight: '600', color: '#666' },
  sectionDividerText: { fontSize: 12, fontWeight: 'bold', color: '#8E8E93', marginTop: 8, marginBottom: 4 },

  // ゲスト追加用新規スタイル
  pickerToolbarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  guestToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#5856D6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    height: 40,
  },
  guestToggleBtnText: { color: '#5856D6', fontSize: 12, fontWeight: '600' },
  guestInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  guestInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#5856D6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  guestSubmitBtn: {
    backgroundColor: '#5856D6',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    height: 40,
    justifyContent: 'center',
  },
  guestSubmitBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },

  selectedBadge: {
    backgroundColor: '#8E8E93',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  selectedBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
});
