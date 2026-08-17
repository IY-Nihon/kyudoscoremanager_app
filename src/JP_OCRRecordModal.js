/**
 * Module ID: OCRRecordModal (hand-written, not bundler-generated)
 * ホワイトボードの立ち順写真から記録表を自動構築するモーダル
 */
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.OCRRecordModal = void 0;

const React = require("react");
const { useState, useMemo } = React;
const RN = require("react-native");
const _View = RN.View;
const _Text = require("./default_217").default; // テーマ変換を通すためブリッジ経由
const _StyleSheet = require("./default_45").default; // テーマ変換を通すためブリッジ経由
const _TouchableOpacity = RN.TouchableOpacity;
const _Modal = RN.Modal;
const _TextInput = require("./default_398").default; // テーマ変換（既定文字色）を通すためブリッジ経由
const _ScrollView = RN.ScrollView;
const _ActivityIndicator = RN.ActivityIndicator;
const _Image = RN.Image;
const _Alert = RN.Alert;

const DocumentPicker = require("expo-document-picker");
const ImagePicker = require("expo-image-picker");
const { Ionicons } = require("./AntDesign_600");
const { GoogleGenerativeAI } = require("./h_1035");
const { GEMINI_API_KEY, IS_WEB } = require("./IS_WEB_199");
const { generateUUID } = require("./module_200");
const { formatMemberName } = require("./JP_module_687");
const { getShadowStyle } = require("./module_592");

// ─────────────────────────────────────────
// 画像 URI → base64 変換（Web / ネイティブ両対応）
// ─────────────────────────────────────────
async function uriToBase64(uri) {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result || "";
      const commaIdx = result.indexOf(",");
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ─────────────────────────────────────────
// 氏名の正規化・分割（姓／名）
// ─────────────────────────────────────────
function splitName(fullName) {
  if (!fullName) return { sei: "", mei: "" };
  const parts = fullName.trim().split(/[\s\u3000]+/);
  return { sei: parts[0] || "", mei: parts.length > 1 ? parts.slice(1).join("") : "" };
}

// 異体字正規化は行わず、空白の除去のみ行う（表記そのものの完全一致を判定するためのヘルパー）
function stripSpace(s) {
  if (!s) return "";
  return s.replace(/[\s\u3000]+/g, "");
}

// 代表的な異体字・旧字体を新字体・常用漢字に正規化してマッチング精度を飛躍的に高める
function normalize(s) {
  if (!s) return "";
  let nStr = s.replace(/[\s\u3000]+/g, "");
  const mapping = {
    "澁": "渋",
    "眞": "真",
    "邉": "辺",
    "邊": "辺",
    "齋": "斉",
    "齊": "斉",
    "廣": "広",
    "澤": "沢",
    "嶋": "島",
    "嶌": "島",
    "栁": "柳",
    "國": "国",
    "櫻": "桜",
    "髙": "高",
    "﨑": "崎"
  };
  for (const [oldChar, newChar] of Object.entries(mapping)) {
    nStr = nStr.replace(new RegExp(oldChar, "g"), newChar);
  }
  return nStr;
}

// ─────────────────────────────────────────
// 編集距離（Levenshtein Distance）の計算
// ─────────────────────────────────────────
function getLevenshteinDistance(a, b) {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

// ─────────────────────────────────────────
// 名前マッチング（要件定義 3.3 名寄せロジック）
// candidates: [{id, name, gender, grade, isAlumni}]
// 戻り値: { status: 'matched'|'ambiguous'|'guest', match, options }
// ─────────────────────────────────────────
function matchArcherName(rawText, candidates) {
  const text = normalize(rawText);
  if (!text) return { status: "empty" };

  // 括弧付き識別子: "林(飛)" 形式を分離
  const parenMatch = rawText.match(/^([^\s\u3000(（]+)[\(（]([^)）]+)[\)）]$/);
  const searchSei = parenMatch ? parenMatch[1] : null;
  const searchDisambig = parenMatch ? parenMatch[2] : null;

  // 1. 完全一致（現役優先）
  const exact = candidates.filter(c => normalize(c.name) === text);
  if (exact.length === 1) return { status: "matched", match: exact[0] };
  if (exact.length > 1) {
    // 異体字正規化により複数候補が同居した場合、まずは「変換なしの表記そのもの」が
    // 完全一致する候補を優先する（例：渡辺/渡邉/渡邊が同居する場合、書かれた文字通りの「渡辺」を優先）
    const rawExact = exact.filter(c => stripSpace(c.name) === stripSpace(rawText));
    if (rawExact.length === 1) return { status: "matched", match: rawExact[0] };

    const active = exact.filter(c => !c.isAlumni);
    if (active.length === 1) return { status: "matched", match: active[0] };
    return { status: "ambiguous", options: exact };
  }

  // 2. 姓+識別子（括弧書き）一致
  if (searchSei && searchDisambig) {
    const bySei = candidates.filter(c => splitName(c.name).sei === searchSei);
    const withDisambig = bySei.filter(c => splitName(c.name).mei.startsWith(searchDisambig));
    if (withDisambig.length === 1) return { status: "matched", match: withDisambig[0] };
    if (bySei.length > 0) return { status: "ambiguous", options: bySei };
  }

  // 3. 姓のみ一致（現役生を優先、前方一致やスペース無しも強力にマッチ）
  const bySeiOnly = candidates.filter(c => {
    const sName = splitName(c.name);
    if (normalize(sName.sei) === text) return true;
    const cn = normalize(c.name);
    // 部員名が「澁川航大」（正規化で「渋川航大」）で、読み取ったテキストが「渋川」などの場合（前方一致で長さ2以上）
    if (text.length >= 2 && cn.startsWith(text) && cn.length > text.length) return true;
    return false;
  });
  if (bySeiOnly.length === 1) return { status: "matched", match: bySeiOnly[0] };
  if (bySeiOnly.length > 1) {
    // 異体字正規化により複数候補が同居した場合、まずは「変換なしの表記そのもの」の姓が
    // 完全一致する候補を優先する（例：渡辺/渡邉/渡邊のうち、書かれた文字通りの「渡辺」姓を優先）
    const rawSeiExact = bySeiOnly.filter(c => stripSpace(splitName(c.name).sei) === stripSpace(rawText));
    if (rawSeiExact.length === 1) return { status: "matched", match: rawSeiExact[0] };

    const activeOnly = bySeiOnly.filter(c => !c.isAlumni);
    if (activeOnly.length === 1) return { status: "matched", match: activeOnly[0] };
    return { status: "ambiguous", options: bySeiOnly };
  }

  // 3.5. 姓のみの編集距離救済（OCRが名前部分を読み落とし／姓自体を誤読した場合）
  // 例：候補「渋川航大」に対し、OCRが名前部分を読み落として姓のみ「渋川」と読み取った上に
  //     さらに1文字を誤読して「渋谷」となったケース。姓（2〜3文字程度）同士の編集距離で救済する。
  if (text.length >= 2 && text.length <= 4) {
    let minSeiDistance = 2; // 姓は短いので許容距離は最大1まで
    let seiFuzzyMatches = [];
    candidates.forEach(c => {
      const sei = normalize(splitName(c.name).sei);
      if (!sei || sei.length > 4) return; // 姓が極端に長い（＝姓名を分割できていない）データは対象外
      const dist = getLevenshteinDistance(text, sei);
      if (dist < minSeiDistance) {
        minSeiDistance = dist;
        seiFuzzyMatches = [c];
      } else if (dist === minSeiDistance) {
        seiFuzzyMatches.push(c);
      }
    });
    if (seiFuzzyMatches.length === 1 && minSeiDistance <= 1) {
      return { status: "matched", match: seiFuzzyMatches[0], fuzzy: true };
    } else if (seiFuzzyMatches.length > 1 && minSeiDistance <= 1) {
      const activeSeiFuzzy = seiFuzzyMatches.filter(c => !c.isAlumni);
      if (activeSeiFuzzy.length === 1) return { status: "matched", match: activeSeiFuzzy[0], fuzzy: true };
      return { status: "ambiguous", options: seiFuzzyMatches };
    }
  }

  // 4. 部分一致（手書き誤字・略字の緩やかな救済）
  const partial = candidates.filter(c => {
    const cn = normalize(c.name);
    return cn.includes(text) || text.includes(cn.slice(0, 1)) && cn.startsWith(text.slice(0, 1)) && Math.abs(cn.length - text.length) <= 1;
  });
  if (partial.length === 1) return { status: "matched", match: partial[0], fuzzy: true };

  // 5. 編集距離（Levenshtein Distance）による漢字書き間違い救済
  let bestFuzzyMatches = [];
  let minDistance = 3; // 最大許容距離は2まで
  candidates.forEach(c => {
    const cn = normalize(c.name);
    const dist = getLevenshteinDistance(text, cn);
    if (dist < minDistance) {
      minDistance = dist;
      bestFuzzyMatches = [c];
    } else if (dist === minDistance) {
      bestFuzzyMatches.push(c);
    }
  });

  if (bestFuzzyMatches.length === 1 && minDistance <= 2) {
    return { status: "matched", match: bestFuzzyMatches[0], fuzzy: true };
  } else if (bestFuzzyMatches.length > 1 && minDistance <= 2) {
    return { status: "ambiguous", options: bestFuzzyMatches };
  }

  // 6. 一致なし → ゲスト扱い
  return { status: "guest", rawText: rawText.trim() };
}

const SHOT_LABELS = ["壱之立", "弐之立", "参之立", "四之立", "伍之立", "六之立", "七之立", "八之立", "九之立", "拾之立"];

// ─────────────────────────────────────────
// 的中マークの正規化
//
// アプリ内部の marks は '○'（的中）/ '×'（外れ）/ ''（未記録）の3値。
// 紙の記録は書き手によって表記が揺れるため（丸なら ○◯〇●、
// バツなら ×✕✖x、罰点として / や ＼ を使う流儀もある）、
// AI が読み取った文字を内部表現へ寄せる。
// ─────────────────────────────────────────
const HIT_CHARS = new Set(["○", "◯", "〇", "●", "◎", "o", "O", "0", "丸", "当", "中"]);
const MISS_CHARS = new Set(["×", "✕", "✖", "x", "X", "・", "･", "/", "／", "\\", "＼", "-", "ー", "バツ", "外"]);

function normalizeMark(raw) {
  if (raw == null) return "";
  const s = String(raw).trim();
  if (s === "") return "";
  if (HIT_CHARS.has(s)) return "○";
  if (MISS_CHARS.has(s)) return "×";
  // 「○」「×」が他の文字と混ざって返ってきた場合の保険
  const firstHit = [...s].find(c => HIT_CHARS.has(c));
  const firstMiss = [...s].find(c => MISS_CHARS.has(c));
  if (firstHit && !firstMiss) return "○";
  if (firstMiss && !firstHit) return "×";
  return "";
}

/** AI が返した marks 配列を shotsPerRound の長さに正規化する */
function normalizeMarks(rawMarks, shotsPerRound) {
  const src = Array.isArray(rawMarks) ? rawMarks : [];
  const out = Array(shotsPerRound).fill("");
  for (let i = 0; i < shotsPerRound; i++) out[i] = normalizeMark(src[i]);
  return out;
}

const OCRRecordModal = ({ visible, onClose, members = [], alumni = [], shotsPerRound = 8, onApply }) => {
  const [step, setStep] = useState("pick"); // pick | analyzing | preview
  // lineup: ホワイトボードの立ち順表（名前のみ）
  // record: 紙に取った的中記録（名前＋各射の○×）
  const [mode, setMode] = useState("lineup");
  const [images, setImages] = useState([]); // [{uri, base64}]
  const [tachiList, setTachiList] = useState([]); // [{seats:[{rawText,status,match,options}]}]
  // record モード用: [{rawText, status, match, options, marks:['○','×','',...]}]
  const [recordRows, setRecordRows] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [pickerTarget, setPickerTarget] = useState(null); // {tachiIdx, seatIdx}
  const [pickerSearch, setPickerSearch] = useState("");
  const [expandedActiveGrades, setExpandedActiveGrades] = useState(new Set(["1", "2", "3", "4", "0"]));
  const [expandedTerms, setExpandedTerms] = useState(new Set());
  
  // ゲスト入力用ステート
  const [isEnteringGuest, setIsEnteringGuest] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState("");

  const resetAll = () => {
    setStep("pick");
    setMode("lineup");
    setImages([]);
    setTachiList([]);
    setRecordRows([]);
    setErrorMsg("");
    setPickerTarget(null);
    setPickerSearch("");
    setExpandedActiveGrades(new Set(["1", "2", "3", "4", "0"]));
    setExpandedTerms(new Set());
    setIsEnteringGuest(false);
    setGuestNameInput("");
  };

  const handleClose = () => {
    resetAll();
    onClose && onClose();
  };

  // Realtime同期の反映タイミング等で同一IDのメンバーが重複して配列に含まれるケースがあるため、
  // ID単位で重複除去してから名寄せ候補として使う（重複していると完全一致でも「要確認」に落ちてしまうため）
  const allCandidates = useMemo(() => {
    const raw = [
      ...members.map(m => ({ ...m, isAlumni: false })),
      ...alumni.map(a => ({ ...a, isAlumni: true })),
    ];
    const dedupMap = new Map();
    raw.forEach(c => {
      const key = c.id != null ? `${c.isAlumni ? "a" : "m"}:${c.id}` : null;
      if (key) {
        dedupMap.set(key, c);
      } else {
        // idが無い異常データは念のため残す（除外すると登録漏れになるため）
        dedupMap.set(`no-id:${dedupMap.size}`, c);
      }
    });
    return Array.from(dedupMap.values());
  }, [members, alumni]);

  // すでに選択されているメンバーID of Set（ピッカーでのスタイル同期用）
  const selectedMemberIds = useMemo(() => {
    const ids = new Set();
    tachiList.forEach(tachi => {
      tachi.seats.forEach(seat => {
        if (seat.status === "matched" && seat.match?.id) {
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
        type: "image/*",
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const asset = result.assets[0];
      const base64 = await uriToBase64(asset.uri);
      setImages(prev => [...prev, { uri: asset.uri, base64 }]);
    } catch (e) {
      console.error("[OCRRecordModal] Image pick error:", e);
      setErrorMsg("画像の選択に失敗しました。");
    }
  };

  // ─────────────────────────────────────────
  // カメラ撮影（その場でホワイトボードを撮影して直接追加）
  // ─────────────────────────────────────────
  const captureImage = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setErrorMsg("カメラの利用が許可されていません。端末の設定からカメラへのアクセスを許可してください。");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions ? ImagePicker.MediaTypeOptions.Images : ["images"],
        quality: 0.8,
        allowsEditing: false,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const asset = result.assets[0];
      const base64 = asset.base64 ? asset.base64 : await uriToBase64(asset.uri);
      setImages(prev => [...prev, { uri: asset.uri, base64 }]);
    } catch (e) {
      console.error("[OCRRecordModal] Camera capture error:", e);
      setErrorMsg("カメラの起動に失敗しました。");
    }
  };

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };


  // ─────────────────────────────────────────
  // Gemini による画像解析
  // ─────────────────────────────────────────
  const analyzeImages = async () => {
    if (images.length === 0) return;
    setStep("analyzing");
    setErrorMsg("");

    if (!GEMINI_API_KEY) {
      setErrorMsg("AI機能の設定（APIキー）が見つかりません。管理者にご確認ください。");
      setStep("pick");
      return;
    }

    const prompt = buildPrompt();

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      const parts = [{ text: prompt }];
      images.forEach(img => {
        parts.push({ inlineData: { mimeType: "image/jpeg", data: img.base64 } });
      });

      const result = await model.generateContent(parts);
      const raw = result.response.text();
      const parsed = JSON.parse(raw);

      if (mode === "record") {
        const rawRows = Array.isArray(parsed.rows) ? parsed.rows : [];
        // 氏名も的中も空の行は表の余白なので落とす
        const rows = rawRows.filter(
          r => (r && String(r.name || "").trim() !== "") ||
               (Array.isArray(r?.marks) && r.marks.some(m => normalizeMark(m) !== ""))
        );
        if (rows.length === 0) {
          setErrorMsg("記録表を検出できませんでした。表全体が入るように撮り直してください。");
          setStep("pick");
          return;
        }
        applyRecordMatching(rows);
        return;
      }

      const rawTachi = Array.isArray(parsed.tachi) ? parsed.tachi : [];
      if (rawTachi.length === 0) {
        setErrorMsg("立ち順表を検出できませんでした。写真を撮り直してください。");
        setStep("pick");
        return;
      }

      applyMatching(rawTachi);
    } catch (e) {
      console.error("[OCRRecordModal] Gemini analyze error:", e);
      const msg = String(e?.message || e);
      if (msg.includes("429")) {
        setErrorMsg("AIの利用制限に達しました。しばらく待ってから再度お試しください。");
      } else if (/network|fetch|Failed to fetch/i.test(msg)) {
        setErrorMsg("通信エラーが発生しました。電波の良い場所で再度お試しください。");
      } else {
        setErrorMsg("画像の解析に失敗しました。再度お試しいただくか、手動で入力してください。");
      }
      setStep("pick");
    }
  };

  // ─────────────────────────────────────────
  // プロンプト構築
  // ─────────────────────────────────────────
  const buildPrompt = () => (mode === "record" ? buildRecordPrompt() : buildLineupPrompt());

  // 紙の的中記録用プロンプト
  const buildRecordPrompt = () => {
    return `あなたは弓道の「的中記録表」（紙に手書きされたもの）を読み取るOCRアシスタントです。
添付された${images.length}枚の画像は、同じ記録表の続き（1枚目の続きが2枚目...）です。すべてを1つの記録として結合してください。

【読み取り対象】
・1行が1人の射手で、行の先頭付近に氏名が書かれています。
・氏名の右側に、1射ごとの結果が横に並んでいます（左から1射目、2射目...の順）。
・合計欄・的中数・％などの集計列は結果ではありません。読み飛ばしてください。
・表の外側のメモ書き、日付、署名などは無視してください。

【的中記号の読み取り】
・的中（当たり）は ○ ◯ 〇 ● ◎ などの丸印で書かれます。→ "○" として出力
・外れは × ✕ ✖ ／ ＼ ・ などで書かれます。→ "×" として出力
・まだ引いていない・空欄のマスは "" （空文字列）として出力
・判読できない場合は無理に推測せず "" にしてください。
・大切なのは「位置」です。空欄があっても詰めず、左から順に位置を保ったまま出力してください。

【射数】
・このアプリの設定では1人あたり${shotsPerRound}射です。
・表の列数が${shotsPerRound}と違う場合は、実際に表に見える列数のぶんだけ出力してください（こちらで調整します）。

【出力形式】
以下のJSON形式のみを出力してください（説明文やMarkdownは一切不要）:
{"rows":[{"name":"氏名","marks":["○","×","",...]}]}
rows は表の上から順に、marks は左（1射目）から順に並べてください。
氏名が読み取れない行は name を "" にし、marks はそのまま出力してください。`;
  };

  // ホワイトボードの立ち順表用プロンプト
  const buildLineupPrompt = () => {
    const memberNames = members.map(m => formatMemberName(m.name, members)).join("、");
    const alumniNames = alumni.map(a => formatMemberName(a.name, alumni)).join("、");
    return `あなたは弓道の立ち順表（ホワイトボード）を読み取るOCRアシスタントです。
添付された${images.length}枚の画像は、同じ記録表の続き（1枚目の続きが2枚目...）です。すべてを1つの記録として結合してください。

【読み取り対象】
ホワイトボード上の「立ち順表」のグリッド部分のみを対象とします。矢取りの図やメモ書き、磁石 of 跡など、グリッド外の要素は完全に無視してください。

【グリッド構造】
・縦方向が「立」（壱之立、弐之立、参之立...）、横方向が「的」（一的〜、右から左へ並ぶ）です。
・各セルにはネームプレート（氏名）が入っています。手書き・印刷どちらもあります。
・プレート内で名前が2行に分かれていても、改行を無視して1つの名前として結合してください。
・空欄（プレートが無い「選択」状態のマス）は空文字列 "" として、位置を保持したまま出力してください（詰めないでください）。
・文字が読み取れない場合も無理に推測せず、空文字列にしてください。
・撮影が斜めで歪んでいる場合は、行と列の対応関係を論理的に解釈してください。

【出力形式】
以下のJSON形式のみを出力してください（説明文やMarkdownは一切不要）:
{"tachi":[{"seats":["一的の名前","二的の名前","...","御落の名前"]},{"seats":[...]}]}
seatsは各立ちについて、右側（一的）から左側（御落）の順で、グリッドに見える通りの人数分を配列にしてください。立ちごとに人数が異なっていても構いません。`;
  };

  // ─────────────────────────────────────────
  // 認識結果へのメンバー名寄せ適用
  // ─────────────────────────────────────────
  const applyMatching = (rawTachi) => {
    const matched = rawTachi.map(t => {
      const seats = (Array.isArray(t.seats) ? t.seats : []).map(rawText => {
        const r = matchArcherName(rawText, allCandidates);
        return { rawText: rawText || "", ...r };
      });
      return { seats };
    });
    setTachiList(matched);
    setStep("preview");
  };

  // ─────────────────────────────────────────
  // 紙の記録：認識結果へのメンバー名寄せ適用
  // ─────────────────────────────────────────
  const applyRecordMatching = (rawRows) => {
    const rows = rawRows.map(r => {
      const rawText = String(r?.name || "");
      const m = matchArcherName(rawText, allCandidates);
      return {
        rawText,
        ...m,
        marks: normalizeMarks(r?.marks, shotsPerRound),
        // AI が読み取った実際の列数。設定と食い違う場合に警告を出すため保持する
        detectedShots: Array.isArray(r?.marks) ? r.marks.length : 0,
      };
    });
    setRecordRows(rows);
    setStep("preview");
  };

  // 設定の射数と、実際に読み取れた列数が食い違っていないか
  const shotsMismatch = useMemo(() => {
    if (mode !== "record" || recordRows.length === 0) return null;
    const counts = recordRows.map(r => r.detectedShots).filter(n => n > 0);
    if (counts.length === 0) return null;
    const max = Math.max(...counts);
    return max !== shotsPerRound ? max : null;
  }, [mode, recordRows, shotsPerRound]);

  /** プレビュー上で ○ → × → 未記録 を切り替える */
  const toggleRecordMark = (rowIdx, markIdx) => {
    setRecordRows(prev => prev.map((row, i) => {
      if (i !== rowIdx) return row;
      const marks = [...row.marks];
      marks[markIdx] = marks[markIdx] === "" ? "○" : marks[markIdx] === "○" ? "×" : "";
      return { ...row, marks };
    }));
  };

  const removeRecordRow = (rowIdx) => {
    setRecordRows(prev => prev.filter((_, i) => i !== rowIdx));
  };

  /** 記録モードで氏名セルにメンバー／ゲストを割り当てる */
  const assignRecordRow = (rowIdx, candidateOrNull) => {
    setRecordRows(prev => prev.map((row, i) => {
      if (i !== rowIdx) return row;
      if (candidateOrNull) {
        return { ...row, status: "matched", match: candidateOrNull, rawText: candidateOrNull.name, fuzzy: false };
      }
      return { ...row, status: "guest", match: null };
    }));
  };

  // ─────────────────────────────────────────
  // プレビュー画面でのセル手動修正
  // ─────────────────────────────────────────
  const assignSeat = (tachiIdx, seatIdx, candidateOrNull) => {
    setTachiList(prev => {
      const next = prev.map(t => ({ seats: [...t.seats] }));
      if (candidateOrNull) {
        next[tachiIdx].seats[seatIdx] = { status: "matched", match: candidateOrNull, rawText: candidateOrNull.name };
      } else {
        next[tachiIdx].seats[seatIdx] = { status: "empty", rawText: "" };
      }
      return next;
    });
    setPickerTarget(null);
    setPickerSearch("");
    setIsEnteringGuest(false);
    setGuestNameInput("");
  };

  const setSeatAsGuest = (tachiIdx, seatIdx, name) => {
    setTachiList(prev => {
      const next = prev.map(t => ({ seats: [...t.seats] }));
      next[tachiIdx].seats[seatIdx] = { status: "guest", rawText: name };
      return next;
    });
    setPickerTarget(null);
    setPickerSearch("");
    setIsEnteringGuest(false);
    setGuestNameInput("");
  };

  // ─────────────────────────────────────────
  // 記録表への反映（空セルのスキップと、無駄な空セパレータ防止）
  // ─────────────────────────────────────────
  /**
   * 紙の記録から射手配列を作る。
   * 立ち順モードと違い「立」の概念がないため、セパレータは挟まず読み取った順に並べる。
   */
  const buildRecordArchersArray = () => {
    return recordRows
      .filter(row => row.status === "matched" || (row.rawText && row.rawText.trim() !== ""))
      .map(row => {
        const base = {
          id: generateUUID(),
          name: "",
          marks: normalizeMarks(row.marks, shotsPerRound),
          arrowLocations: Array(shotsPerRound).fill(null),
          gender: "未設定",
          grade: 1,
          isGuest: false,
          isSeparator: false,
          isTotalCalculator: false,
          lockedBlocks: {},
          lastModified: Date.now(),
        };
        if (row.status === "matched" && row.match) {
          return {
            ...base,
            name: row.match.name,
            gender: row.match.gender || "未設定",
            grade: typeof row.match.grade === "number" ? row.match.grade : 1,
            memberId: row.match.id,
            isGuest: false,
          };
        }
        return { ...base, name: row.rawText, isGuest: true };
      });
  };

  const buildArchersArray = () => {
    const activeTachiLists = [];

    tachiList.forEach(tachi => {
      const listForThisTachi = [];
      tachi.seats.forEach(seat => {
        // 空欄（statusがempty、または名前がない）は追加せず無視（何も入れない）
        if (seat.status === "empty" || !seat.rawText || seat.rawText.trim() === "") {
          return;
        }

        const base = {
          id: generateUUID(),
          name: "",
          marks: Array(shotsPerRound).fill(""),
          arrowLocations: Array(shotsPerRound).fill(null),
          gender: "未設定",
          grade: 1,
          isGuest: false,
          isSeparator: false,
          isTotalCalculator: false,
          lockedBlocks: {},
          lastModified: Date.now(),
        };

        if (seat.status === "matched" && seat.match) {
          listForThisTachi.push({
            ...base,
            name: seat.match.name,
            gender: seat.match.gender || "未設定",
            grade: typeof seat.match.grade === "number" ? seat.match.grade : 1,
            memberId: seat.match.id,
            isGuest: false,
          });
        } else if ((seat.status === "guest" || seat.status === "ambiguous") && seat.rawText) {
          listForThisTachi.push({ ...base, name: seat.rawText, isGuest: true });
        }
      });
      activeTachiLists.push(listForThisTachi);
    });

    const result = [];
    // 有効なメンバーが入っている立ちのみを処理し、その間にセパレータを入れる
    const nonTransientTachi = activeTachiLists.filter(list => list.length > 0);

    nonTransientTachi.forEach((list, idx) => {
      result.push(...list);
      if (idx < nonTransientTachi.length - 1) {
        result.push({
          id: "sep-" + generateUUID(),
          name: "---",
          marks: [],
          isSeparator: true,
          gender: "未設定",
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

  const handleApply = () => {
    if (mode === "record") {
      if (recordRows.some(r => r.status === "ambiguous")) {
        _Alert.alert("確認が必要です", "候補が複数ある名前が残っています。該当の氏名をタップして選択してください。");
        return;
      }
      const archers = buildRecordArchersArray();
      if (archers.length === 0) {
        _Alert.alert("反映できません", "読み取れた射手がいません。写真を撮り直してください。");
        return;
      }
      // どちらの読み取りかを渡す。呼び出し側の知らせの文言が変わる
      onApply && onApply(archers, "record");
      handleClose();
      return;
    }

    const hasAmbiguous = tachiList.some(t => t.seats.some(s => s.status === "ambiguous"));
    if (hasAmbiguous) {
      _Alert.alert("確認が必要です", "候補が複数ある名前が残っています。該当のセルをタップして選択してください。");
      return;
    }
    const archers = buildArchersArray();
    onApply && onApply(archers, "tachi");
    handleClose();
  };

  // ─────────────────────────────────────────
  // セルの色分け（ステータス別）
  // ─────────────────────────────────────────
  const seatColor = (seat) => {
    if (!seat) return "#F2F2F7";
    if (seat.status === "matched") return seat.fuzzy ? "#FFF3CD" : "#E5F1FF";
    if (seat.status === "ambiguous") return "#FFE5E5";
    if (seat.status === "guest") return "#F0F0F0";
    return "#F9F9F9"; // empty
  };
  const seatLabel = (seat) => {
    if (!seat) return "選択";
    if (seat.status === "matched") return seat.match.name;
    if (seat.status === "ambiguous") return `${seat.rawText}(要選択)`;
    if (seat.status === "guest") return seat.rawText ? `${seat.rawText}(ゲスト)` : "選択";
    return "選択";
  };

  // メンバーピッカー（アコーディオン表示用）
  const activeMembersSorted = useMemo(() => {
    return members
      .filter(m => (m.grade || 0) < 5)
      .filter(m => !pickerSearch.trim() || normalize(m.name).includes(normalize(pickerSearch)))
      .sort((a, b) => {
        const gradeA = void 0 === a.grade || null === a.grade ? 99 : Number(a.grade);
        const gradeB = void 0 === b.grade || null === b.grade ? 99 : Number(b.grade);
        const gA = gradeA === 0 ? 99 : gradeA;
        const gB = gradeB === 0 ? 99 : gradeB;
        if (gA !== gB) return gA - gB;
        const genderVal = g => ('男子' === g ? 0 : '女子' === g ? 1 : 2);
        const genDiff = genderVal(a.gender) - genderVal(b.gender);
        return 0 !== genDiff ? genDiff : (a.name || '').localeCompare(b.name || '', 'ja');
      });
  }, [members, pickerSearch]);

  const activeGroups = useMemo(() => {
    const groups = {};
    activeMembersSorted.forEach(m => {
      const g = void 0 === m.grade || null === m.grade ? 0 : Number(m.grade);
      groups[g] || (groups[g] = []);
      groups[g].push(m);
    });
    const sortedGrades = Object.keys(groups).map(Number).sort((a, b) => {
      if (a === 0) return 1;
      if (b === 0) return -1;
      return a - b;
    });
    return sortedGrades.map(g => ({
      grade: g,
      title: g === 0 ? "その他/ゲスト" : `${g}年生`,
      members: groups[g],
    }));
  }, [activeMembersSorted]);

  const alumniByTerm = useMemo(() => {
    const list = alumni
      .filter(a => !pickerSearch.trim() || normalize(a.name).includes(normalize(pickerSearch)));
    const termMap = {};
    list.forEach(a => {
      const term = a.termKi || 999;
      termMap[term] || (termMap[term] = []);
      termMap[term].push(a);
    });
    return Object.keys(termMap)
      .sort((a, b) => Number(b) - Number(a))
      .map(term => ({
        term,
        members: termMap[term].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja')),
      }));
  }, [alumni, pickerSearch]);

  const toggleActiveGrade = (gStr) => {
    setExpandedActiveGrades(prev => {
      const next = new Set(prev);
      next.has(gStr) ? next.delete(gStr) : next.add(gStr);
      return next;
    });
  };

  const toggleTerm = (termStr) => {
    setExpandedTerms(prev => {
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
      setPickerSearch("");
      return;
    }
    assignSeat(pickerTarget.tachiIdx, pickerTarget.seatIdx, candidateOrNull);
  };

  const pickAssignGuest = (name) => {
    if (!pickerTarget || !name) return;
    if (pickerTarget.rowIdx != null) {
      setRecordRows(prev => prev.map((row, i) =>
        i === pickerTarget.rowIdx ? { ...row, status: "guest", match: null, rawText: name } : row
      ));
      setPickerTarget(null);
      setPickerSearch("");
      setIsEnteringGuest(false);
      setGuestNameInput("");
      return;
    }
    setSeatAsGuest(pickerTarget.tachiIdx, pickerTarget.seatIdx, name);
  };

  const submitGuest = () => {
    const name = guestNameInput.trim();
    if (name && pickerTarget) pickAssignGuest(name);
  };

  return (
    <_Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <_View style={styles.overlay}>
        <_View style={[styles.container, getShadowStyle({ shadowOpacity: 0.15, shadowRadius: 12, elevation: 12 })]}>
          <_View style={styles.header}>
            <_View style={styles.headerTitleRow}>
              <Ionicons name="camera" size={20} color="#007AFF" />
              <_Text style={styles.headerTitle}>
                {mode === "record" ? "画像から記録を読み取る" : "画像から立ち順を登録"}
              </_Text>
            </_View>
            <_TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </_TouchableOpacity>
          </_View>

          {step === "pick" && (
            <_ScrollView style={styles.body} contentContainerStyle={{ padding: 16 }}>
              <_View style={styles.modeRow}>
                <_TouchableOpacity
                  style={[styles.modeBtn, mode === "lineup" && styles.modeBtnActive]}
                  onPress={() => { setMode("lineup"); setErrorMsg(""); }}
                >
                  <_Text style={[styles.modeBtnText, mode === "lineup" && styles.modeBtnTextActive]}>立ち順表</_Text>
                </_TouchableOpacity>
                <_TouchableOpacity
                  style={[styles.modeBtn, mode === "record" && styles.modeBtnActive]}
                  onPress={() => { setMode("record"); setErrorMsg(""); }}
                >
                  <_Text style={[styles.modeBtnText, mode === "record" && styles.modeBtnTextActive]}>紙の記録</_Text>
                </_TouchableOpacity>
              </_View>

              <_Text style={styles.hint}>
                {mode === "record"
                  ? `紙に取った的中記録を撮影・選択してください。氏名と1射ごとの○×を読み取ります（1人${shotsPerRound}射の設定）。1枚に収まらない場合は続けて追加できます。`
                  : "ホワイトボードの立ち順表を撮影・選択してください。1枚に収まらない場合は続けて追加できます。"}
              </_Text>

              {images.length > 0 && (
                <_View style={styles.thumbRow}>
                  {images.map((img, idx) => (
                    <_View key={idx} style={styles.thumbWrap}>
                      <_Image source={{ uri: img.uri }} style={styles.thumb} />
                      <_TouchableOpacity style={styles.thumbRemove} onPress={() => removeImage(idx)}>
                        <Ionicons name="close-circle" size={20} color="#FF3B30" />
                      </_TouchableOpacity>
                      <_Text style={styles.thumbLabel}>{idx + 1}枚目</_Text>
                    </_View>
                  ))}
                </_View>
              )}

              <_View style={styles.pickBtnRow}>
                <_TouchableOpacity style={[styles.pickBtn, { flex: 1 }]} onPress={captureImage}>
                  <Ionicons name="camera-outline" size={22} color="#007AFF" />
                  <_Text style={styles.pickBtnText}>撮影する</_Text>
                </_TouchableOpacity>
                <_TouchableOpacity style={[styles.pickBtn, { flex: 1 }]} onPress={pickImage}>
                  <Ionicons name="images-outline" size={22} color="#007AFF" />
                  <_Text style={styles.pickBtnText}>
                    {images.length === 0 ? "画像を選択" : "写真を追加する"}
                  </_Text>
                </_TouchableOpacity>
              </_View>

              {!!errorMsg && (
                <_View style={styles.errorBox}>
                  <Ionicons name="warning" size={16} color="#FF3B30" />
                  <_Text style={styles.errorText}>{errorMsg}</_Text>
                </_View>
              )}

              <_TouchableOpacity
                style={[styles.analyzeBtn, images.length === 0 && styles.analyzeBtnDisabled]}
                onPress={analyzeImages}
                disabled={images.length === 0}
              >
                <Ionicons name="sparkles" size={18} color="#FFF" />
                <_Text style={styles.analyzeBtnText}>この画像で解析する</_Text>
              </_TouchableOpacity>
            </_ScrollView>
          )}

          {step === "analyzing" && (
            <_View style={styles.centerBox}>
              <_ActivityIndicator size="large" color="#007AFF" />
              <_Text style={styles.centerText}>
                {mode === "record" ? "AIが記録表を読み取っています..." : "AIが立ち順表を読み取っています..."}
              </_Text>
            </_View>
          )}

          {step === "preview" && mode === "record" && (
            <>
              <_ScrollView style={styles.body} contentContainerStyle={{ padding: 16 }}>
                <_Text style={styles.hint}>
                  内容を確認してください。氏名をタップすると変更、○×のマスをタップすると
                  「○ → × → 未記録」の順で切り替わります。
                </_Text>

                {shotsMismatch != null && (
                  <_View style={styles.errorBox}>
                    <Ionicons name="warning" size={16} color="#FF9500" />
                    <_Text style={styles.errorText}>
                      表からは{shotsMismatch}射ぶん読み取れましたが、アプリの設定は{shotsPerRound}射です。
                      {shotsMismatch > shotsPerRound
                        ? `${shotsPerRound}射目までを取り込みます。`
                        : "足りない分は未記録になります。"}
                      必要なら閉じてから設定の射数を変更してください。
                    </_Text>
                  </_View>
                )}

                <_View style={styles.legendRow}>
                  <_View style={styles.legendItem}><_View style={[styles.legendDot, { backgroundColor: "#E5F1FF" }]} /><_Text style={styles.legendText}>一致</_Text></_View>
                  <_View style={styles.legendItem}><_View style={[styles.legendDot, { backgroundColor: "#FFE5E5" }]} /><_Text style={styles.legendText}>要確認</_Text></_View>
                  <_View style={styles.legendItem}><_View style={[styles.legendDot, { backgroundColor: "#F0F0F0" }]} /><_Text style={styles.legendText}>ゲスト</_Text></_View>
                </_View>

                {recordRows.map((row, rIdx) => {
                  const hits = row.marks.filter(m => m === "○").length;
                  const shots = row.marks.filter(m => m !== "").length;
                  return (
                    <_View key={rIdx} style={styles.recordRow}>
                      <_View style={styles.recordRowHeader}>
                        <_TouchableOpacity
                          style={[styles.recordNameChip, { backgroundColor: seatColor(row) }]}
                          onPress={() => {
                            setPickerTarget({ rowIdx: rIdx });
                            setPickerSearch(
                              (row.status === "ambiguous" || row.status === "guest") ? (row.rawText || "") : ""
                            );
                          }}
                        >
                          <_Text style={styles.recordNameText} numberOfLines={1}>{seatLabel(row)}</_Text>
                        </_TouchableOpacity>
                        <_Text style={styles.recordScoreText}>{hits}/{shots || shotsPerRound}</_Text>
                        <_TouchableOpacity onPress={() => removeRecordRow(rIdx)} style={styles.recordRemoveBtn}>
                          <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                        </_TouchableOpacity>
                      </_View>
                      <_View style={styles.markRow}>
                        {row.marks.map((mk, mIdx) => (
                          <_TouchableOpacity
                            key={mIdx}
                            style={[
                              styles.markCell,
                              mk === "○" && styles.markCellHit,
                              mk === "×" && styles.markCellMiss,
                            ]}
                            onPress={() => toggleRecordMark(rIdx, mIdx)}
                          >
                            <_Text style={[
                              styles.markCellText,
                              mk === "○" && styles.markCellTextHit,
                              mk === "×" && styles.markCellTextMiss,
                            ]}>{mk || "－"}</_Text>
                          </_TouchableOpacity>
                        ))}
                      </_View>
                    </_View>
                  );
                })}
              </_ScrollView>

              <_View style={styles.previewFooter}>
                <_TouchableOpacity style={styles.footerBtnSecondary} onPress={() => setStep("pick")}>
                  <_Text style={styles.footerBtnSecondaryText}>撮り直す</_Text>
                </_TouchableOpacity>
                <_TouchableOpacity style={styles.footerBtnPrimary} onPress={handleApply}>
                  <_Text style={styles.footerBtnPrimaryText}>記録表に反映する</_Text>
                </_TouchableOpacity>
              </_View>
            </>
          )}

          {step === "preview" && mode !== "record" && (
            <>
              <_ScrollView style={styles.body} contentContainerStyle={{ padding: 16 }}>
                <_Text style={styles.hint}>
                  内容を確認してください。色付きのセルはタップして修正できます。
                </_Text>
                <_View style={styles.legendRow}>
                  <_View style={styles.legendItem}><_View style={[styles.legendDot, { backgroundColor: "#E5F1FF" }]} /><_Text style={styles.legendText}>一致</_Text></_View>
                  <_View style={styles.legendItem}><_View style={[styles.legendDot, { backgroundColor: "#FFE5E5" }]} /><_Text style={styles.legendText}>要確認</_Text></_View>
                  <_View style={styles.legendItem}><_View style={[styles.legendDot, { backgroundColor: "#F0F0F0" }]} /><_Text style={styles.legendText}>ゲスト</_Text></_View>
                </_View>

                {tachiList.map((tachi, tIdx) => {
                  // 空欄（status === "empty"）のセルを除外した有効な的のみをカウント
                  const activeSeats = tachi.seats.filter(seat => seat.status !== "empty");
                  if (activeSeats.length === 0) return null; // 有効な的が1つもなければこの立ち自体を描画しない

                  return (
                    <_View key={tIdx} style={styles.tachiBlock}>
                      <_Text style={styles.tachiLabel}>
                        {SHOT_LABELS[tIdx] || `${tIdx + 1}立目`}
                      </_Text>
                      <_View style={styles.seatRow}>
                        {tachi.seats.map((seat, sIdx) => {
                          if (seat.status === "empty") return null; // 空欄の的はプレビュー画面にも何も入れない（表示しない）
                          return (
                            <_TouchableOpacity
                              key={sIdx}
                              style={[styles.seatChip, { backgroundColor: seatColor(seat) }]}
                              onPress={() => {
                                setPickerTarget({ tachiIdx: tIdx, seatIdx: sIdx });
                                // 要確認・ゲストのセルは、OCRが読み取った文字列をそのまま検索欄に入れて
                                // 候補（例：渡辺姓の複数人）をすぐ絞り込んだ状態で開く
                                setPickerSearch((seat.status === "ambiguous" || seat.status === "guest") ? (seat.rawText || "") : "");
                              }}
                            >
                              <_Text style={styles.seatChipText} numberOfLines={2}>
                                {seatLabel(seat)}
                              </_Text>
                            </_TouchableOpacity>
                          );
                        })}
                      </_View>
                    </_View>
                  );
                })}
              </_ScrollView>

              <_View style={styles.previewFooter}>
                <_TouchableOpacity style={styles.footerBtnSecondary} onPress={() => setStep("pick")}>
                  <_Text style={styles.footerBtnSecondaryText}>撮り直す</_Text>
                </_TouchableOpacity>
                <_TouchableOpacity style={styles.footerBtnPrimary} onPress={handleApply}>
                  <_Text style={styles.footerBtnPrimaryText}>記録表に反映する</_Text>
                </_TouchableOpacity>
              </_View>
            </>
          )}
        </_View>
      </_View>

      {!!pickerTarget && (
        <_Modal visible={true} transparent={true} animationType="fade" onRequestClose={() => setPickerTarget(null)}>
          <_View style={styles.pickerOverlay}>
            <_TouchableOpacity style={_StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setPickerTarget(null)} />
            <_View style={styles.pickerBox}>
              <_Text style={styles.pickerTitle}>メンバーを選択</_Text>
              
              {/* ゲスト登録切り替えエリア */}
              {isEnteringGuest ? (
                <_View style={styles.guestInputRow}>
                  <_TextInput
                    style={styles.guestInput}
                    placeholder="ゲスト名を入力"
                    value={guestNameInput}
                    onChangeText={setGuestNameInput}
                    autoFocus={true}
                    onSubmitEditing={submitGuest}
                  />
                  <_TouchableOpacity onPress={submitGuest} style={styles.guestSubmitBtn}>
                    <_Text style={styles.guestSubmitBtnText}>決定</_Text>
                  </_TouchableOpacity>
                  <_TouchableOpacity onPress={() => { setIsEnteringGuest(false); setGuestNameInput(""); }} style={{ marginLeft: 8 }}>
                    <Ionicons name="close" size={24} color="#8E8E93" />
                  </_TouchableOpacity>
                </_View>
              ) : (
                <_View style={styles.pickerToolbarRow}>
                  <_TextInput
                    style={[styles.pickerSearchInput, { flex: 1, marginBottom: 0 }]}
                    placeholder="名前で検索"
                    value={pickerSearch}
                    onChangeText={setPickerSearch}
                    autoFocus={true}
                  />
                  <_TouchableOpacity
                    style={styles.guestToggleBtn}
                    onPress={() => setIsEnteringGuest(true)}
                  >
                    <Ionicons name="person-add-outline" size={18} color="#5856D6" />
                    <_Text style={styles.guestToggleBtnText}>ゲスト</_Text>
                  </_TouchableOpacity>
                </_View>
              )}

              <_ScrollView style={styles.pickerList}>
                <_TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => pickAssign(null)}
                >
                  <_Text style={styles.pickerRowTextMuted}>（空欄にする）</_Text>
                </_TouchableOpacity>

                {/* 現役生グループアコーディオン */}
                {activeGroups.map(group => {
                  const gStr = group.grade.toString();
                  // 検索中（要確認セルからの自動絞り込み含む）は、折りたたみ状態に関わらず候補を表示する
                  const isOpen = pickerSearch.trim() ? true : expandedActiveGrades.has(gStr);
                  return (
                    <React.Fragment key={`grade-${gStr}`}>
                      <_TouchableOpacity
                        style={styles.accordionHeader}
                        onPress={() => toggleActiveGrade(gStr)}
                      >
                        <_Text style={styles.accordionTitle}>
                          {group.title} ({group.members.length}人)
                        </_Text>
                        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color="#8E8E93" />
                      </_TouchableOpacity>
                      {isOpen && group.members.map(m => {
                        const isSelected = selectedMemberIds.has(m.id);
                        const isMale = m.gender === "男子";
                        const isFemale = m.gender === "女子";
                        const textColor = isMale ? "#007AFF" : isFemale ? "#FF2D55" : "#1C1C1E";
                        return (
                          <_TouchableOpacity
                            key={m.id}
                            style={[
                              styles.pickerRowIndent,
                              isSelected && { backgroundColor: "#F0F0F5", opacity: 0.8 }
                            ]}
                            onPress={() => pickAssign(m)}
                          >
                            <_View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                              <_Text style={[
                                styles.pickerRowText,
                                { color: textColor },
                                isSelected && { opacity: 0.5 }
                              ]}>
                                {m.name}
                                {m.termKi ? ` (${m.termKi}期)` : ""}
                              </_Text>
                              {isSelected && (
                                <_View style={styles.selectedBadge}>
                                  <_Text style={styles.selectedBadgeText}>選択済</_Text>
                                </_View>
                              )}
                            </_View>
                          </_TouchableOpacity>
                        );
                      })}
                    </React.Fragment>
                  );
                })}

                {/* 卒業生グループ期別アコーディオン */}
                {alumniByTerm.length > 0 && (
                  <_View style={{ marginTop: 12 }}>
                    <_Text style={styles.sectionDividerText}>卒業生</_Text>
                    {alumniByTerm.map(group => {
                      const tStr = group.term.toString();
                      const isOpen = pickerSearch.trim() ? true : expandedTerms.has(tStr);
                      return (
                        <React.Fragment key={`term-${tStr}`}>
                          <_TouchableOpacity
                            style={styles.accordionHeader}
                            onPress={() => toggleTerm(tStr)}
                          >
                            <_Text style={styles.accordionTitle}>
                              {tStr === "999" ? "期生不明" : `${tStr}期`} ({group.members.length}人)
                            </_Text>
                            <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color="#8E8E93" />
                          </_TouchableOpacity>
                          {isOpen && group.members.map(a => {
                            const isSelected = selectedMemberIds.has(a.id);
                            const isMale = a.gender === "男子";
                            const isFemale = a.gender === "女子";
                            const textColor = isMale ? "#007AFF" : isFemale ? "#FF2D55" : "#1C1C1E";
                            return (
                              <_TouchableOpacity
                                key={a.id}
                                style={[
                                  styles.pickerRowIndent,
                                  isSelected && { backgroundColor: "#F0F0F5", opacity: 0.8 }
                                ]}
                                onPress={() => pickAssign(a)}
                              >
                                <_View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                                  <_Text style={[
                                    styles.pickerRowText,
                                    { color: textColor },
                                    isSelected && { opacity: 0.5 }
                                  ]}>
                                    {a.name}
                                  </_Text>
                                  {isSelected && (
                                    <_View style={styles.selectedBadge}>
                                      <_Text style={styles.selectedBadgeText}>選択済</_Text>
                                    </_View>
                                  )}
                                </_View>
                              </_TouchableOpacity>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </_View>
                )}

                {!!pickerSearch.trim() && (
                  <_TouchableOpacity
                    style={styles.pickerRow}
                    onPress={() => pickAssignGuest(pickerSearch.trim())}
                  >
                    <_Text style={styles.pickerRowTextGuest}>
                      「{pickerSearch.trim()}」をゲストとして登録
                    </_Text>
                  </_TouchableOpacity>
                )}
              </_ScrollView>
              <_TouchableOpacity style={styles.pickerCloseBtn} onPress={() => setPickerTarget(null)}>
                <_Text style={styles.pickerCloseBtnText}>閉じる</_Text>
              </_TouchableOpacity>
            </_View>
          </_View>
        </_Modal>
      )}
    </_Modal>
  );
};

exports.OCRRecordModal = OCRRecordModal;

const styles = _StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  container: { backgroundColor: "#FFF", borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "88%", minHeight: "50%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#EEE" },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: "bold", color: "#1C1C1E" },
  closeBtn: { padding: 4 },
  body: { flexGrow: 0 },
  hint: { fontSize: 13, color: "#666", marginBottom: 12, lineHeight: 18 },

  thumbRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  thumbWrap: { alignItems: "center" },
  thumb: { width: 80, height: 80, borderRadius: 8, backgroundColor: "#EEE" },
  thumbRemove: { position: "absolute", top: -6, right: -6, backgroundColor: "#FFF", borderRadius: 10 },
  thumbLabel: { fontSize: 10, color: "#888", marginTop: 2 },
  pickBtnRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  pickBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "#007AFF", borderStyle: "dashed", borderRadius: 10, paddingVertical: 14 },
  pickBtnText: { color: "#007AFF", fontSize: 15, fontWeight: "600" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFF0F0", borderRadius: 8, padding: 10, marginBottom: 12 },
  errorText: { color: "#FF3B30", fontSize: 13, flex: 1 },
  analyzeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#007AFF", borderRadius: 10, paddingVertical: 14 },
  analyzeBtnDisabled: { backgroundColor: "#C7C7CC" },
  analyzeBtnText: { color: "#FFF", fontSize: 15, fontWeight: "bold" },

  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  centerText: { marginTop: 14, fontSize: 14, color: "#666" },
  legendRow: { flexDirection: "row", gap: 16, marginBottom: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 11, color: "#666" },
  tachiBlock: { marginBottom: 16 },
  tachiLabel: { fontSize: 13, fontWeight: "bold", color: "#3C3C43", marginBottom: 6 },
  seatRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  seatChip: { minWidth: 64, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  seatChipText: { fontSize: 12, color: "#1C1C1E", textAlign: "center" },

  // 読み取りモード切替（立ち順表 / 紙の記録）
  modeRow: { flexDirection: "row", backgroundColor: "#F2F2F7", borderRadius: 10, padding: 3, marginBottom: 12 },
  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  modeBtnActive: { backgroundColor: "#FFFFFF" },
  modeBtnText: { fontSize: 14, color: "#8E8E93", fontWeight: "600" },
  modeBtnTextActive: { color: "#007AFF", fontWeight: "bold" },

  // 紙の記録のプレビュー（1行＝1人）
  recordRow: { marginBottom: 14, padding: 10, backgroundColor: "#F9F9F9", borderRadius: 10 },
  recordRowHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  recordNameChip: { flex: 1, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, justifyContent: "center" },
  recordNameText: { fontSize: 14, color: "#1C1C1E", fontWeight: "600" },
  recordScoreText: { fontSize: 13, color: "#8E8E93", fontWeight: "bold", minWidth: 42, textAlign: "right" },
  recordRemoveBtn: { padding: 4 },
  markRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  markCell: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E5EA", alignItems: "center", justifyContent: "center" },
  markCellHit: { backgroundColor: "#E5F1FF", borderColor: "#007AFF" },
  markCellMiss: { backgroundColor: "#FFE5E5", borderColor: "#FF3B30" },
  markCellText: { fontSize: 16, color: "#C7C7CC", fontWeight: "bold" },
  markCellTextHit: { color: "#007AFF" },
  markCellTextMiss: { color: "#FF3B30" },

  previewFooter: { flexDirection: "row", gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: "#EEE" },
  footerBtnSecondary: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: "#F2F2F7", alignItems: "center" },
  footerBtnSecondaryText: { color: "#007AFF", fontSize: 15, fontWeight: "600" },
  footerBtnPrimary: { flex: 2, paddingVertical: 12, borderRadius: 8, backgroundColor: "#FF3B30", alignItems: "center" },
  footerBtnPrimaryText: { color: "#FFF", fontSize: 15, fontWeight: "bold" },
  pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  pickerBox: { width: "88%", maxWidth: 380, maxHeight: "70%", backgroundColor: "#FFF", borderRadius: 14, padding: 16 },
  pickerTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 10, color: "#1C1C1E" },
  pickerSearchInput: { borderWidth: 1, borderColor: "#DDD", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, marginBottom: 10 },
  pickerList: { maxHeight: 320 },
  pickerRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  pickerRowIndent: { paddingVertical: 12, paddingLeft: 16, borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
  pickerRowText: { fontSize: 14, color: "#1C1C1E" },
  pickerRowTextMuted: { fontSize: 14, color: "#999" },
  pickerRowTextGuest: { fontSize: 14, color: "#FF9500", fontWeight: "600" },
  pickerCloseBtn: { marginTop: 10, paddingVertical: 10, alignItems: "center" },
  pickerCloseBtnText: { color: "#8E8E93", fontSize: 14 },
  accordionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#EEEEEE" },
  accordionTitle: { fontSize: 13, fontWeight: "600", color: "#666" },
  sectionDividerText: { fontSize: 12, fontWeight: "bold", color: "#8E8E93", marginTop: 8, marginBottom: 4 },
  
  // ゲスト追加用新規スタイル
  pickerToolbarRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  guestToggleBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: "#5856D6", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, height: 40 },
  guestToggleBtnText: { color: "#5856D6", fontSize: 12, fontWeight: "600" },
  guestInputRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  guestInput: { flex: 1, borderWidth: 1, borderColor: "#5856D6", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  guestSubmitBtn: { backgroundColor: "#5856D6", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, height: 40, justifyContent: "center" },
  guestSubmitBtnText: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  
  selectedBadge: { backgroundColor: "#8E8E93", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 },
  selectedBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "bold" }
});
