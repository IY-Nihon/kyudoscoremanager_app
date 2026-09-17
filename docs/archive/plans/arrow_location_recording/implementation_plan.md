# 矢所記録機能の要件定義および実装計画

本ドキュメントでは、ユーザーからの要望とフィードバックに基づき、矢所（矢の刺さった位置）を記録・確認する機能の実装要件を定義します。

## 1. 目的
的中記録（○/×）だけでなく、矢が的のどこに刺さったか（矢所）を視覚的に記録し、履歴や分析の詳細画面からも確認できるようにする。

## 2. 機能要件

### 2.1. 設定機能
- **設定画面**: 「矢所の記録をする」という項目のトグルボタンを追加し、機能のON/OFFを切り替えられるようにする。
- **的の種類・サイズ選択**: 射数の設定画面（または関連する設定箇所）に、使用する的の種類とサイズを選択する機能を追加する。
  - **選択肢**: 弓道の一般的な的に則り、「霞的（尺二: 36cm）」「星的（尺二: 36cm）」「星的（八寸: 24cm）」の3種類とする。
  - 選択時は各的のビジュアルモデル（画像やSVG）を表示し、直感的に選べるようにする。

### 2.2. 矢所の記録（入力）UI
- **自動ポップアップ**: 記録表のセルをタップして○または×を入力した際、矢所記録がONの場合は**0.5秒後**に**該当セルの近く**に矢所入力用の四角いモーダル/ポップアップを展開する。
- **閉じるボタン**: モーダルの右上に「×」ボタンを配置し、矢所を記録しない場合は入力をスキップ（閉じる）ことができるようにする。
- **的の表示**: ポップアップ内には、設定で選択された的のアイコンを中心に配置する。
- **タップ入力とマーク**: 的やその周りをタップすることで、タップした座標にマークを配置する。
  - **マークの数字**: そのセルが何射目か（例：2射目なら「②」）に連動させた数字を表示する。
- **入力制限の連動**:
  - 記録が **○（的中）** の場合：的の**内側**しかタップできない。
  - 記録が **×（羽分け/残念）** の場合：的の**外側**しかタップできない。
- **再編集**:
  - ポップアップが開いた状態で別の場所をタップした場合は、前に置いたマークが新しい場所に移動（上書き）される。
  - 既に○/×が入力されているセルを**長押し**した際、再度ポップアップを展開し、その射の矢所を編集できるようにする。

### 2.3. 履歴・分析画面での矢所表示 (NEW)
- **個人詳細画面**: 記録の「履歴」からの個人詳細画面だけでなく、「分析」タブの個人分析画面においても、入力された矢所データを的のグラフィック上に重ねて表示する。
- 1立（あるいは期間/セッション）分の矢所（①〜⑧など）を同じ的の上にプロットし、全体的な傾向（グルーピングなど）を視覚的に確認できるようにする。

## 3. 実装方針（アーキテクチャ）

1. **データ構造の拡張 (`useScoreStore`)**:
   - `archers` 内の各射手データに、`arrowLocations` (座標データの配列: `{x: number, y: number, shotIndex: number}`) を追加する。
   - 座標は的の中心を (0,0) とし、的の半径を 1 とした**相対座標（正規化座標）**で保存する（サイズや解像度に依存しないため）。
   - グローバル設定として `enableArrowLocation` (boolean) と `targetType` (string: kasumi36, hoshi36, hoshi24等) を追加。
2. **UIコンポーネント**:
   - 矢所入力モーダル (`ArrowLocationPopover`) を新規作成。タップされたセルの位置座標（X,Y）を受け取り、その近くに表示する実装とする。右上に閉じるボタンを実装。
   - `JP_ScoreCell` コンポーネントを改修し、タップ後のタイマー（0.5秒）と長押しイベント、自身の座標位置を取得する処理を追加。
   - `JP_SettingsScreen` に矢所記録のON/OFFトグルを追加。
   - 履歴詳細画面（`JP_HistoryScreen`）および個人分析画面（`JP_AnalysisScreen`）に、的と矢所をレンダリングするビューコンポーネント (`ArrowLocationView`) を追加。

## 4. 具体的なコード設計（実装イメージ）

### 4.1. データ構造の拡張 (`JP_useScoreStore_174.js`)
Storeに矢所設定と座標配列を追加します。
```javascript
// 初期状態の追加
enableArrowLocation: false,
arrowTargetType: 'kasumi36', // 'kasumi36', 'hoshi36', 'hoshi24'

// archers配列内の射手オブジェクト拡張
const newArcher = {
  ...archer,
  marks: ['', '', '', ...], // 既存の○×記録
  arrowLocations: [null, null, null, ...] // 追加: {x: 0.5, y: -0.2} のような正規化座標
};

// アクション
updateArrowLocation: (archerId, shotIndex, location) => {
  set((state) => {
    const archers = state.archers.map(a => {
      if (a.id === archerId) {
        const newLocations = [...(a.arrowLocations || [])];
        newLocations[shotIndex] = location;
        return { ...a, arrowLocations: newLocations };
      }
      return a;
    });
    // undo対応
    return { archers, historyStack: [...state.historyStack, state.archers], redoStack: [] };
  });
}
```

### 4.2. タイマーとポップアップ連動 (`JP_ScoreCell_596.js`)
セルタップ時に0.5秒のタイマーを仕込みます。
```javascript
// setTimeoutの管理用Ref
const timerRef = useRef(null);

const handlePress = () => {
  // まず通常の○/×トグルを実行
  onToggle(archerId, index);

  // 矢所記録がONの場合、0.5秒後にポップアップを開く
  if (enableArrowLocation) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // 自身の座標を取得してポップアップコンポーネントを呼び出す処理
      openArrowLocationPopover(archerId, index);
    }, 500);
  }
};

const handleLongPress = () => {
  if (enableArrowLocation && mark) { // すでに記録がある場合
    openArrowLocationPopover(archerId, index);
  }
};
```

### 4.3. 座標計算とタップ判定 (`ArrowLocationPopover.js`)
的の画像を円形とみなし、中心からの距離で内側・外側を判定します。
```javascript
const handleTargetPress = (event) => {
  const { locationX, locationY } = event.nativeEvent;
  // targetSizeは描画する的のピクセルサイズ（例: 200px）
  const radius = targetSize / 2;
  
  // 中心を(0,0)とした相対座標に変換
  const relativeX = locationX - radius;
  const relativeY = locationY - radius;
  
  // 的の半径を1.0とした正規化座標（-1.0 〜 1.0）
  const normalizedX = relativeX / radius;
  const normalizedY = relativeY / radius;
  
  // 中心からの距離（ピタゴラスの定理）
  const distance = Math.sqrt(normalizedX ** 2 + normalizedY ** 2);
  const isInside = distance <= 1.0; // 1.0以内なら的の中

  // 記録との整合性チェック
  if (currentMark === '○' && !isInside) {
    Alert.alert("エラー", "的中(○)の場合は的の内側をタップしてください");
    return;
  }
  if (currentMark === '×' && isInside) {
    Alert.alert("エラー", "外れ(×)の場合は的の外側をタップしてください");
    return;
  }

  // 座標をStoreに保存
  updateArrowLocation(archerId, shotIndex, { x: normalizedX, y: normalizedY });
};
```

## 5. 検証計画 (Verification Plan)
- 設定画面でのON/OFF切り替えと、射数設定画面での的選択（3種類）の動作確認。
- 記録セルタップ後0.5秒でのポップアップ表示、右上の×ボタンでのキャンセル、該当セル付近への的確な表示位置の確認。
- ○入力時は的内のみ、×入力時は的外のみタップできるバリデーション。
- マークの数字が射数（インデックス）と一致していること。
- ポップアップ内での上書き移動、および長押しでの再編集。
- 履歴の詳細画面および分析の個人分析画面で、記録した矢所が正しくレンダリングされること。
