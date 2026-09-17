# タグ不整合バグ（#問題）に関する詳細調査報告 兼 実装計画書 (Implementation Plan)

本ドキュメントは、タグの保存時・編集時に「＃」表記やシャープの有無によって同一タグが二重登録されたり、別の文字として分裂して表示されてしまうバグについて、さらに踏み込んで徹底的に調査した結果と、それを一網打尽に解消するための具体的な実装計画をまとめたものです。

---

## 1. 徹底追加調査による「バグの発生メカニズムと根本原因」

全画面のコード（新規保存、編集、履歴、状態管理ストア）を詳細に解析した結果、タグの表記揺れおよび重複問題は、以下の「3つの画面・コンポーネント間の処理のギャップ」によって発生していることが判明しました。

### ① 新規保存画面（SaveSessionModal & RecordScreen）の連携ギャップ
* **対象ファイル**: 
  * [JP_SaveSessionModal_690.js](file:///c:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_SaveSessionModal_690.js)
  * [JP_RecordScreen_593.js](file:///c:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_RecordScreen_593.js)
* **メカニズム**:
  1. `SaveSessionModal` では、ユーザーが手入力したタグ文字列 `_` を読点やスペースで分割し、Zustandストアの `currentSessionTags` 配列（ステート `z`）に反映しています。
  2. しかし、テンプレートタグ（プリセット）のチップをタップした際、`toggleCurrentSessionTag(e)` が呼び出されます。このとき、プリセットに `#` が付いていない古いデータ（例: `"立"`）が含まれている場合、ステート `z` には `#` のない `"立"` がそのまま入ってしまいます。
  3. 保存ボタン押下時、`SaveSessionModal` は `z.join(' ')`（スペース区切りの文字列）を `onSave` の引数 `l` として `RecordScreen` に渡します。
  4. `RecordScreen` 側では、受け取った `l` に対して以下のパースをかけています：
     ```javascript
     const n = l.split(/[,\u3001\s]+/).map(e => e.startsWith('#') ? e : `#${e}`).map(e => e.trim()).filter(e => '#' !== e);
     ```
     これにより、新規保存フローを通過した直後のデータは、一時的に `["#立"]` のように綺麗な配列へと整形されてストアの `saveSession`（`U`）に送られます。
  5. **問題点**: プリセットタップ時に一時的に `#` のないタグがテキスト入力欄 `_` に同期されるため、画面表示上のプレビュー（ハッシュタグの有無）が揺れる原因になります。また、ストアの `tagTemplates` に登録されているプリセット自体が統一されていない場合、トグル処理の判定ロジックが正常に一致しなくなります。

### ② 編集画面（EditSessionModal）起動時における既存タグの非標準化読み込み（最悪の原因）
* **対象ファイル**: [JP_EditSessionModal_694.js](file:///c:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_EditSessionModal_694.js)
* **メカニズム**:
  1. `EditSessionModal` を起動した際、`useEffect` 内で既存セッションのタグ配列 `l.tags` をそのまま編集用ステート `D` にセットしています：
     ```javascript
     R([...l.tags || []]);
     ```
  2. **問題点**: もし過去に保存されたデータ（特にクラウド Firestore 上のデータ）の `tags` 配列の中に、表記揺れのあるもの（例: `"立"`, `"＃練習"`, `"#＃練習"`, あるいは前後の空白を含むもの）が含まれていた場合、**それらがそのまま未正規化の状態でステート `D` に読み込まれます**。
  3. タグの新規追加時、重複チェックは以下のように行われています：
     ```javascript
     const e = normalizeTag(P);
     if (e) {
       const normalizedD = D.map(normalizeTag).filter(Boolean);
       normalizedD.includes(e) || R([...D, e]);
     }
     ```
     ここでは重複チェックの時のみ `D` を `normalizeTag` して確認しているため、たしかに重複は防がれますが、**すでにステート `D` に混入していたシャープ無しの `"立"` や不正な `"＃練習"` 自体はクリーンアップされずにそのまま維持されます**。
  4. さらに、そのまま保存処理（`H`）を走らせると、未正規化 of タグが含まれた状態の配列 `D` がそのまま `tags` フィールドとしてデータベースに書き戻されてしまいます。これが、不整合データが永久に残り続け、増殖していく最大の元凶です。

### ③ クラウドデータベース（Firestore）の生データ同期ラグ
* **対象ファイル**: [JP_useScoreStore_174.js](file:///c:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_useScoreStore_174.js)
* **メカニズム**:
  1. ストア内には `cleanUpSessions` 処理があり、ハイドレーション時などにセッション全体のタグを標準化する仕組みがあります。
  2. **問題点**: しかし、リアルタイム同期リスナー（`listenToSessions` 等）でクラウドから直接ドキュメントを受信した際、あるいはFirestoreへのバッチ保存時に、この標準化が即座に同期・保存されません。結果として、ローカル状態だけで綺麗に見えても、クラウド側のデータは表記揺れしたままになり、他端末やブラウザのリロード時に再び表記揺れとなって出現します。

---

## 2. 完璧な解決のための「具体的な改善策」

このハッシュタグ問題を二度と発生させず、過去データも完全に自動クリーンアップするため、以下の3つの防衛線（ガード）を実装します。

### 共通正規化ロジックの再確認 (Tag Normalizer)
あらゆる不正な入力（全角シャープ、二重シャープ、前後の空白）を排除し、常に美しい半角シャープ付きの形式 `"#タグ名"` に変換します。
```javascript
const normalizeTag = (e) => {
    if ('string' != typeof e) return '';
    let t = e.trim().replace(/^[#＃\s]+/, '');
    t = t.replace(/＃/g, '#');
    return t ? `#${t}` : '';
};
```

---

## 3. コンポーネントごとの具体的な修正ステップ

### 【防衛線 1】 編集画面起動時の完全標準化（データ侵入の防止）
* **対象ファイル**: [JP_EditSessionModal_694.js](file:///c:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_EditSessionModal_694.js)
* **修正内容**: セッションのタグをステート `D` に読み込む際、必ずすべてのタグを `normalizeTag` で綺麗にパースし、重複を排除した状態で初期化します。これにより、クラウド上の古い表記揺れデータが編集画面に持ち込まれるのを完全にシャットアウトします。
* **具体的なコード修正箇所** (79行目付近):
  ```javascript
  // 修正前:
  R([...l.tags || []]);
  
  // 修正後:
  const cleanedTags = Array.from(new Set((l.tags || []).map(normalizeTag).filter(Boolean)));
  R(cleanedTags);
  ```

### 【防衛線 2】 定型タグ（プリセット）選択時の正規化適用の統一
* **対象ファイル**: [JP_SaveSessionModal_690.js](file:///c:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_SaveSessionModal_690.js) / [JP_EditSessionModal_694.js](file:///c:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_EditSessionModal_694.js)
* **修正内容**: テンプレートからタグをタップして選択・追加する際、テンプレート定義のシャープの有無に関わらず、必ず `normalizeTag` を通した統一タグで選択判定およびトグル操作（`toggleCurrentSessionTag` 等）を行います。

### 【防衛線 3】 バックグラウンドでの自動クリーンアップとクラウドへの保存同期
* **対象ファイル**: [JP_useScoreStore_174.js](file:///c:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_useScoreStore_174.js)
* **修正内容**: `cleanUpSessions` 処理をさらに強化し、表記揺れのあるセッションが検知された場合、ローカルのメモリ状態を美しくクリーンアップするだけでなく、自動的にクラウド（Firestore）にもクリーンアップ後のデータを同期・保存するようにします（過去データの自動クリーンアップ）。

---

## 4. 既存データの自動救済マイグレーションフロー

1. アプリケーションが起動されると、ZustandストアがローカルストレージおよびFirestoreからセッションデータをロードします。
2. ストアの `cleanUpSessions` が自動的に走り、全セッションの `tags` 配列を `normalizeTag` で一括整形し、重複を自動でマージします。
3. クリーンアップによって変更（表記揺れの補正）が発生したセッションについては、自動的に `lastLocalChange` が更新され、クラウド同期処理（`syncSessions`）を通じてFirestore上のドキュメントが正規化データに上書き保存されます。
4. このバックグラウンド救済処理により、ユーザーが特別な操作をすることなく、アプリを使用しているだけで古いデータが自動的に綺麗なハッシュタグ形式に置き換わります。

---

## 5. 動作検証計画 (Verification Plan)

### 手動検証手順 (想定フロー)
1. **新規保存テスト**:
   * 「記録」タブでスコアを入力し、「終了・保存」を押す。
   * タグ入力欄に `練習`（シャープなし）、`＃大会`（全角）、`#＃合宿`（全半角重複）を入力し、プリセットから `立` をタップして保存。
   * 「履歴」タブで、保存されたセッションのタグが `["#練習", "#大会", "#合宿", "#立"]` に美しく統一されているか検証。
2. **既存セッションの編集テスト**:
   * すでに `["#練習"]` が登録されているセッションの編集ボタン（鉛筆アイコン）を押す。
   * 新規追加欄に `練習` や `＃練習` を入力し、追加ボタンを押す。
   * 重複が完全に検知され、二重登録されないことを検証。
   * テンプレートから `練習試合` をタップした際、正しく `"#練習試合"` として追加されることを検証。
3. **分析・フィルタリングテスト**:
   * 履歴や分析画面のタグ絞り込みチップにて、表記揺れによるチップの分裂（`"#立"` と `"立"` が別々に表示されるなど）が完全に消滅しているか検証。
   * タップ時に完全一致ですべての該当記録が漏れなく抽出されるか検証。
