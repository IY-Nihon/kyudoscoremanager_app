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
const _Text = RN.Text;
const _StyleSheet = RN.StyleSheet;
const _TouchableOpacity = RN.TouchableOpacity;
const _Modal = RN.Modal;
const _TextInput = RN.TextInput;
const _ScrollView = RN.ScrollView;
const _ActivityIndicator = RN.ActivityIndicator;
const _Image = RN.Image;
const _Alert = RN.Alert;

const DocumentPicker = require("expo-document-picker");
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

function normalize(s) {
  return (s || "").replace(/[\s\u3000]+/g, "");
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
    if (sName.sei === text) return true;
    const cn = normalize(c.name);
    // 部員名が「渋川航大」で、読み取ったテキストが「渋川」などの場合（前方一致で長さ2以上）
    if (text.length >= 2 && cn.startsWith(text) && cn.length > text.length) return true;
    return false;
  });
  if (bySeiOnly.length === 1) return { status: "matched", match: bySeiOnly[0] };
  if (bySeiOnly.length > 1) {
    const activeOnly = bySeiOnly.filter(c => !c.isAlumni);
    if (activeOnly.length === 1) return { status: "matched", match: activeOnly[0] };
    return { status: "ambiguous", options: bySeiOnly };
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

const OCRRecordModal = ({ visible, onClose, members = [], alumni = [], shotsPerRound = 8, onApply }) => {
  const [step, setStep] = useState("pick"); // pick | analyzing | preview
  const [images, setImages] = useState([]); // [{uri, base64}]
  const [tachiList, setTachiList] = useState([]); // [{seats:[{rawText,status,match,options}]}]
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
    setImages([]);
    setTachiList([]);
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

  const allCandidates = useMemo(() => [
    ...members.map(m => ({ ...m, isAlumni: false })),
    ...alumni.map(a => ({ ...a, isAlumni: true })),
  ], [members, alumni]);

  // すでに選択されているメンバーIDのSet（ピッカーでのスタイル同期用）
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
  const buildPrompt = () => {
    const memberNames = members.map(m => formatMemberName(m.name, members)).join("、");
    const alumniNames = alumni.map(a => formatMemberName(a.name, alumni)).join("、");
    return `あなたは弓道の立ち順表（ホワイトボード）を読み取るOCRアシスタントです。
添付された${images.length}枚の画像は、同じ記録表の続き（1枚目の続きが2枚目...）です。すべてを1つの記録として結合してください。

【読み取り対象】
ホワイトボード上の「立ち順表」のグリッド部分のみを対象とします。矢取りの図やメモ書き、磁石の跡など、グリッド外の要素は完全に無視してください。

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
    const hasAmbiguous = tachiList.some(t => t.seats.some(s => s.status === "ambiguous"));
    if (hasAmbiguous) {
      _Alert.alert("確認が必要です", "候補が複数ある名前が残っています。該当のセルをタップして選択してください。");
      return;
    }
    const archers = buildArchersArray();
    onApply && onApply(archers);
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

  const submitGuest = () => {
    const name = guestNameInput.trim();
    if (name && pickerTarget) {
      setSeatAsGuest(pickerTarget.tachiIdx, pickerTarget.seatIdx, name);
    }
  };

  return (
    <_Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <_View style={styles.overlay}>
        <_View style={[styles.container, getShadowStyle({ shadowOpacity: 0.15, shadowRadius: 12, elevation: 12 })]}>
          <_View style={styles.header}>
            <_View style={styles.headerTitleRow}>
              <Ionicons name="camera" size={20} color="#007AFF" />
              <_Text style={styles.headerTitle}>画像から立ち順を登録</_Text>
            </_View>
            <_TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </_TouchableOpacity>
          </_View>

          {step === "pick" && (
            <_ScrollView style={styles.body} contentContainerStyle={{ padding: 16 }}>
              <_Text style={styles.hint}>
                ホワイトボードの立ち順表を撮影・選択してください。1枚に収まらない場合は続けて追加できます。
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

              <_TouchableOpacity style={styles.pickBtn} onPress={pickImage}>
                <Ionicons name="add-circle-outline" size={22} color="#007AFF" />
                <_Text style={styles.pickBtnText}>
                  {images.length === 0 ? "画像を選択" : "写真を追加する"}
                </_Text>
              </_TouchableOpacity>

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
              <_Text style={styles.centerText}>AIが立ち順表を読み取っています...</_Text>
            </_View>
          )}

          {step === "preview" && (
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
                              onPress={() => { setPickerTarget({ tachiIdx: tIdx, seatIdx: sIdx }); setPickerSearch(""); }}
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
                  onPress={() => assignSeat(pickerTarget.tachiIdx, pickerTarget.seatIdx, null)}
                >
                  <_Text style={styles.pickerRowTextMuted}>（空欄にする）</_Text>
                </_TouchableOpacity>

                {/* 現役生グループアコーディオン */}
                {activeGroups.map(group => {
                  const gStr = group.grade.toString();
                  const isOpen = expandedActiveGrades.has(gStr);
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
                        return (
                          <_TouchableOpacity
                            key={m.id}
                            style={[
                              styles.pickerRowIndent,
                              isSelected && { backgroundColor: "#F0F0F5", opacity: 0.8 }
                            ]}
                            onPress={() => assignSeat(pickerTarget.tachiIdx, pickerTarget.seatIdx, m)}
                          >
                            <_Text style={[styles.pickerRowText, isSelected && { color: "#8E8E93" }]}>{m.name}</_Text>
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
                      const isOpen = expandedTerms.has(tStr);
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
                            return (
                              <_TouchableOpacity
                                key={a.id}
                                style={[
                                  styles.pickerRowIndent,
                                  isSelected && { backgroundColor: "#F0F0F5", opacity: 0.8 }
                                ]}
                                onPress={() => assignSeat(pickerTarget.tachiIdx, pickerTarget.seatIdx, a)}
                              >
                                <_Text style={[styles.pickerRowText, isSelected && { color: "#8E8E93" }]}>{a.name}</_Text>
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
                    onPress={() => setSeatAsGuest(pickerTarget.tachiIdx, pickerTarget.seatIdx, pickerSearch.trim())}
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
  pickBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "#007AFF", borderStyle: "dashed", borderRadius: 10, paddingVertical: 14, marginBottom: 16 },
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
  guestSubmitBtnText: { color: "#FFF", fontSize: 14, fontWeight: "bold" }
});
