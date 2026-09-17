# 個人IDログイン時における履歴・分析・設定画面のフィルタリング改善実装計画（改訂版）

## 目的
個人ID（`member`ロール）でログインしている際、自身が参加していない（記録がない）期間（年度・月）や、自身の記録に紐づいていないタグが、履歴タブ・分析タブ・設定タブ（CSVエクスポート）のフィルター選択肢に表示されないように改善します。

前回の修正に加え、他タブに切り替えて戻った際に他人のタグが再度表示されてしまうバグ（同期処理によるストアデータの汚染および Firestore `onSnapshot` 監視における古い認証状態のキャプチャ問題）を根本的に解決します。

## 解決方針・変更点

### 1. ストア (`src/JP_useScoreStore_174.js`) のリアルタイム監視の修正
- **対象箇所**: `listenToSessions` メソッド内の `onSnapshot` 処理（Line 2032付近）
- **内容**: コールバック内で、開始時に固定されたクロージャ変数 `i` (activeRole) と `n` (myMemberId) を使うのではなく、常に最新の状態を参照できる `s().activeRole` と `s().myMemberId` を使用してフィルタリング判定を行うように修正します。
  ```javascript
  const currentRole = s().activeRole;
  const currentMemberId = s().myMemberId;
  'member' === currentRole && currentMemberId && (u = d.filter(e => e.archers?.some(e => e.memberId === currentMemberId) || Object.values(e.substitutionIds || {}).includes(currentMemberId)));
  ```

### 2. ストア (`src/JP_useScoreStore_174.js`) の同期・フェッチ処理の修正
- **対象箇所**: `syncSessions` (Line 1585付近) および `fetchAndOverwriteFromCloud` (Line 1793付近)
- **内容**: クラウドからセッション一覧を取得し、ローカルの `sessions` ストアを上書き更新する箇所で、ログイン中のユーザーがメンバー（`activeRole === 'member'`）である場合、自分の参加しているセッション（代役含む）のみに絞り込むフィルタリング処理を追加します。これにより、他タブ遷移時のデータ同期によって全員分のセッションデータがストアに混入するのを防ぎます。
  ```javascript
  const role = s().activeRole;
  const memberId = s().myMemberId;
  if ('member' === role && memberId) {
    // 自分のセッションのみにフィルタリング
    sessions = sessions.filter(e => e.archers?.some(a => a.memberId === memberId) || Object.values(e.substitutionIds || {}).includes(memberId));
  }
  ```

### 3. 分析画面 (`src/JP_AnalysisScreen_1000.js`) のタグフィルタ判定の強化
- **対象箇所**: タグフィルター `ge` (Line 148付近)
- **内容**: 自分が参加しているセッションを絞り込む際、履歴画面と同様に代役（`substitutionIds`）での参加も考慮するように判定条件を強化します。
  ```javascript
  const src = 'member' === k && B
    ? E.filter(s => s && s.archers && (s.archers.some(a => a && a.memberId === B) || Object.values(s.substitutionIds || {}).includes(B)))
    : E;
  ```

---

## 安全性の検証
- 本改修は画面表示時およびエクスポート条件の選択肢（`useMemo` による絞り込み処理）、ならびにメンバーログイン端末での表示用セッションキャッシュの絞り込みのみを変更するものであり、オリジナルデータ（ストアの保存データやクラウド同期内容）を破損・誤削除する処理は一切含まれないため、**データ消失や上書き破壊が発生するリスクはございません。**

## 検証計画 (Verification Plan)
1. **構文チェック**
   - 修正対象ファイル (`src/JP_useScoreStore_174.js`, `src/JP_AnalysisScreen_1000.js`) に対し `node -c` で構文エラーがないことを確認します。
2. **ビルド検証**
   - `npx expo export --platform web` を実行し、Webビルドがエラーなく成功することを確認します。
3. **挙動確認**
   - メンバーIDログイン時に他タブへ遷移して戻った場合にも、その人の記録があるタグのみが正しく表示され続けることを確認します。
