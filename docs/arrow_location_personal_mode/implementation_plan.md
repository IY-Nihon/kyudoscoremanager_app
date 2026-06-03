# 個人IDログイン時の矢所記録機能およびメンバー最優先表示の実装計画

本計画では、個人IDでログインしている場合（`member`ロール）でも、設定画面で矢所記録の設定を行えるようにし、さらに記録表のメンバー選択時にログインユーザー自身が最優先でリストの最上部に表示されるように変更します。

## 変更内容と方針

### 1. 設定画面での矢所記録設定の有効化
- **対象ファイル**: [JP_SettingsScreen_1023.js](file:///C:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_SettingsScreen_1023.js)
- **変更内容**: 
  現在、矢所記録セクションの表示条件として `member` ロール以外を対象とする `'member' !== V` という条件がついています。個人ID（`member`ロール）でのログイン時も有効にするため、この条件チェックを外します。
- **具体例**:
  ```diff
  - 'member'!==V&&Ye('\u77e2\u6240\u306e\u8a18\u9332', ... )
  + Ye('\u77e2\u6240\u306e\u8a18\u9332', ... )
  ```

### 2. メンバー選択時にログインユーザー（自分）を最上部に表示
- **対象ファイル**: [JP_ArcherActionModal_689.js](file:///C:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_ArcherActionModal_689.js)
- **変更内容**: 
  - `useScoreStore()` から `activeRole` と `myMemberId` を追加で取得します。
  - メンバー一覧を表示する `L` の `sort` 処理に条件を追加し、個人ID（`member`ロール）でのログイン中、かつ自身のメンバーIDが判定された場合、自分のメンバーID（`myMemberId`）に一致するメンバーを最優先してソート順の先頭にします。
- **具体例**:
  ```diff
    const j = ({ visible: e, archerId: s, archerOrigIdx: p, isSeparator: j_sep, isTotalCalculator: b, onClose: C, onSubstitution: I, onSetMember: S, onSetGuestName: v, onClearName: E, onDeleteArcher: z, onAddArcher: w, onAddSeparator: T, onAddTotal: k, existingArchers: A, isReadOnly = false }) => {
  -   const { members: B, alumni: alumniState, archers: H, setArcherMember: P, addArcher: R, addSeparator: W, addTotalCalculator: V, deleteArcher: D } = (0, m.useScoreStore)();
  +   const { members: B, alumni: alumniState, archers: H, setArcherMember: P, addArcher: R, addSeparator: W, addTotalCalculator: V, deleteArcher: D, activeRole, myMemberId } = (0, m.useScoreStore)();
  ```
  ```javascript
    const L = (0, t.useMemo)(() => B.filter(e => (e.grade || 0) < 5).filter(e => '' === O || e.name.includes(O)).sort((e, t) => {
      // ログイン中の自分自身を最優先で一番上に表示する
      if (activeRole === 'member' && myMemberId) {
        const isEMySelf = e.id === myMemberId;
        const isTMySelf = t.id === myMemberId;
        if (isEMySelf !== isTMySelf) return isEMySelf ? -1 : 1;
      }

      const isESelected = q.some(archer => archer.memberId === e.id);
      const isTSelected = q.some(archer => archer.memberId === t.id);
      // 選択済みかどうかを最優先 (選択済みを下に)
      if (isESelected !== isTSelected) return isESelected ? 1 : -1;
  ```

## 検証計画 (Verification Plan)
1. **構文チェック**
   - 設定画面およびアクションモーダル変更後、`node -c` でそれぞれのファイルの構文チェックを実行します。
2. **ビルド検証**
   - `npx expo export --platform web` を実行し、ビルドエラーが発生しないことを確認します。
