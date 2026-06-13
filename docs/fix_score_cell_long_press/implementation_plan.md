# スコアセルの長押し（矢所編集）機能のWeb対応 - 実装計画 (修正版)

デバッグログの結果、`TouchableOpacity`（`c.default`）において `onPressIn`、`onPressOut`、および `onContextMenu` イベントがWeb環境で全く発火していないことが判明しました。
これを解決するため、よりモダンでイベントの安定性が高い `Pressable`（`default_218`）コンポーネントに差し替え、イベントを確実に捕捉します。

## 提案される変更

### [MODIFY] [JP_ScoreCell_596.js](file:///c:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_ScoreCell_596.js)

#### 修正方針
1. `default_218`（Pressable）をインポートに追加します。
2. セルのコンポーネントを `TouchableOpacity` から `Pressable` に変更します。
3. `activeOpacity` は `Pressable` のスタイル関数内で `pressed` 状態に応じて opacity を適用することで、同様の視覚効果（タップ時に半透明になる）を再現します。

```javascript
// Pressable のインポートを追加
var pressable = e(require("./default_218"));

// 描画部分の変更
return (0, b.jsxs)(pressable.default, {
  onPress: handlePress,
  onPressIn: handlePressIn,
  onPressOut: handlePressOut,
  onContextMenu: handleContextMenu,
  disabled: p,
  // style を関数にして、押されている（pressed）状態のときに opacity を 0.7 にする
  style: ({ pressed }) => [
    m.cell,
    {
      width: W,
      height: E,
      backgroundColor: z,
      borderBottomWidth: B,
      borderBottomColor: '#000',
      borderRightWidth: 1,
      borderRightColor: '#000',
      borderLeftWidth: w,
      borderLeftColor: '#000',
      opacity: pressed ? 0.7 : 1 // activeOpacity の代替
    }
  ],
  children: [ ... ]
});
```

---

## 検証計画

### 自動テスト
- `npx expo export --platform web` でエラーなくビルドが完了することを確認する。

### 手動検証
- PCブラウザでセルを長押しし、コンソールに `[ScoreCell Debug] handlePressIn` 等のログが表示され、0.5秒後に矢所編集モーダルが正常に開くことを確認する。
- 通常のタップ時に重複発火しないことを確認する。
