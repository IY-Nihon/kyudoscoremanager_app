# メンバーIDログイン時のCSV書き出しバグ修正 - 実装計画

メンバーIDでログイン（個人用モード）している場合に、CSV書き出しモーダルで以下2つの不具合が発生している問題を修正する。

## 問題の概要

### バグ1: キーワード (タイトル・メモ) サジェストに参加していないセッションが含まれる
- **現象**: CSV書き出しモーダルの「キーワード (タイトル・メモ)」サジェストチップに、ログインしているメンバーが参加していないセッションのタイトルが表示される。
- **影響範囲**: `titleSuggestions` の `useMemo`、および `Ge` 関数内の `rSessions` フィルタ

### バグ2: 使用されているタグが「ありません」と表示される
- **現象**: タグが設定されているセッションが存在するにもかかわらず、CSV書き出しモーダルのタグ絞り込みセクションに「使用されているタグがありません」と表示される。
- **影響範囲**: `Oe`（使用中タグリスト）の `useMemo`

## 根本原因の分析

メンバーモードでのフィルタリングは `a.memberId === M`（`M` = `myMemberId`）のみで行われている。しかし：

1. **古いセッションデータ**: アプリ初期や旧バージョンで保存されたセッションでは、`archers` 配列内の各エントリに `memberId` が**設定されていない**場合がある。名前（`name`）のみで管理されている。
2. **結果**: `memberId` が未設定の archers は `a.memberId === M` に**一致しない**ため、自分が参加したセッションでもフィルタから漏れてしまう。

> [!IMPORTANT]
> この問題は `memberId` が未設定の古いデータがある場合にのみ発生する。`memberId` が正しく設定されている場合はフィルタが正常に動作する。

## 提案された変更点

各フィルタ箇所において、`memberId` での一致に加え、`memberId` が存在しない場合にはログイン名（`myMemberName`）と archer の名前が一致しているかどうかを判定するフォールバックロジックを追加する。

### [MODIFY] [JP_SettingsScreen_1023.js](file:///c:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_SettingsScreen_1023.js)

#### 1. `titleSuggestions` の `useMemo` フィルタ修正
```javascript
const src = 'member' === V && M ? sList.filter(s => s && s.archers && s.archers.some(a => a && (a.memberId === M || (H && !a.memberId && a.name && a.name.replace(/\s*\(\d+\)$/,'').trim() === H)))) : sList;
```

#### 2. `Oe`（使用中タグリスト）の `useMemo` フィルタ修正
```javascript
const src = 'member' === V && M ? sList.filter(s => s && s.archers && s.archers.some(a => a && (a.memberId === M || (H && !a.memberId && a.name && a.name.replace(/\s*\(\d+\)$/,'').trim() === H)))) : sList;
```

#### 3. `Ge` 関数内のセッション全体フィルタ（`rSessions`）修正
```javascript
const rSessions = n ? l.filter(e => e && e.archers && e.archers.some(t => t && (t.memberId === n || (H && !t.memberId && t.name && t.name.replace(/\s*\(\d+\)$/,'').trim() === H)))) : l;
```

#### 4. `Ge` 関数の標準形式でのarcherレベルフィルタ修正
```javascript
if(n){if(l.memberId!==n&&!(H&&!l.memberId&&l.name&&l.name.replace(/\s*\(\d+\)$/,'').trim()===H))return}
```

#### 5. `Ge` 関数の印刷向形式でのarcherレベルフィルタ修正
```javascript
if(n){if(t.memberId!==n&&!(H&&!t.memberId&&t.name&&t.name.replace(/\s*\(\d+\)$/,'').trim()===H))return}
```

## 検証計画

### 自動テスト
- `npx expo export --platform web` でエラーなくビルドが完了すること。

### 手動検証
- メンバーIDでログイン後、設定画面のCSV書き出しを開く。
- サジェストチップ及びタグ一覧が、自分が参加したセッションのもののみに絞り込まれていることを確認。
- 書き出したCSV（標準・印刷向）に自分以外のデータが含まれていないことを確認。
