# 公開の帳面を絞る配信の手順

`group_accounts/{団体}` は**認証なしで誰でも読める**。ログインが「団体ID→メール
アドレス」を認証前に引く必要があるためで、ここは開けたままにするしかない。

だから、置いてよいのは**ログインに要る2つ（`id` と `email`）だけ**。団体名・登録日・
同意の記録は `group_accounts/{団体}/private/` へ置く。

この形へ移す作業は、**順序を間違えると本番が壊れる**。以下は 2026-09-03 に実測した
うえで整理したもの。

---

## いまの状態（2026-09-03 時点）

| | |
|---|---|
| 本番の決まり | `create` は `hasOnly(['id','email'])`（2026-09-02 に配信） |
| 本番のアプリ | **古い**。7項目を書く（未配信） |
| 本番のデータ | 4団体とも `name`・`createdAt`・同意の記録が公開の帳面に残っている |
| **結果** | **新規団体の登録が 2026-09-02 から停止している** |

認証なしで実際に読める中身の例：

```
団体 265294
  name        : 学習院大学弓道部
  email       : mak***@gmail.com
  同意の取り方 : 口頭（2026-08-31 版の内容を説明のうえ同意。前の記録は 2026-08-28）
```

---

## 順序

```
1. アプリを配信
2. 移行A（name と createdAt を private へ）
3. 全団体が新しいアプリで開いたことを確認
4. 移行B（同意の記録を private へ）
5. 決まりを配信（update にも hasOnly が掛かる）
```

### なぜこの順序か

**アプリが先**（1 が 5 より前）

古いアプリは7項目を書く。決まりを先に配ると `create` で弾かれ、新規登録が止まる。
実際、2026-08-27 と 2026-09-02 の2回、この形で本番が止まっている。

**移行が決まりより先**（2・4 が 5 より前）

`setDoc(..., { merge: true })` は、決まりの判定では**重ねた結果ぜんぶ**が見られる。
検証環境で実測した：

```
はじめ                        id・email
管理者が name を足す          → 200
持ち主が email だけを merge   → 403 ★
```

つまり余分な項目が残ったまま決まりを配ると、**メールアドレスの変更が 403 で失敗する**。

**A と B を分ける**（3 の待ちが要るのは B だけ）

古いアプリは「同意の版が無い」ときだけ、公開の帳面へ静かに書き戻す：

```js
const n = (s.data() || {}).同意の版;
if (!n) return void await setDoc(e, o.口頭での同意の記録(), { merge: true });
```

同意画面は出ない。**気づかないうちに移行が巻き戻る。**
`name` と `createdAt` は書き戻されないので、A は待たずにできる。
B は全団体が新しいアプリになるまで待つ。

---

## 各段の手順

### 1. アプリを配信

```bash
npm run deploy:web
```

`scripts/verify-hosting-bundle.mjs` が predeploy で走り、`dist/` の接続先と配り先が
食い違っていれば止まる（終了コード1）。検証環境向けに書き出したまま本番へ配る事故を防ぐ。

配信後、`src/WhatsNewModal.js` の `最後に配信した版` を `NOTICE_VERSION` に合わせて
更新し、押し込む。忘れると次回以降 `check-release-state.mjs` の確認が食い違う。

### 2. 移行A

```bash
node scripts/move-consent-to-private.mjs prod          # 数えるだけ
node scripts/move-consent-to-private.mjs prod 写す
node scripts/move-consent-to-private.mjs prod 消す
```

`updateMask.fieldPaths` は**消す項目**を並べる仕組み。残す項目を並べても何も消えず、
それでも HTTP 200 が返る。日本語の項目名は逆引用符で囲む必要があり、囲まないと
その項目だけ黙って残る（どちらも実際に踏んだ）。

### 3. 全団体が新しいアプリで開いたか

本番の団体は4つ（265294 / 698098 / 897977 / 910280）。
`private/consent` に新しいアプリだけが書く形の記録が入っていれば、開かれた証拠になる。

### 4. 移行B

A と同じ手順。同意の記録が private へ移る。

### 5. 決まりを配信

```bash
npm run deploy:rules
```

---

## 確認

配信の前後で、次を確かめる。

```bash
node scripts/check-release-state.mjs
node scripts/check-group-account-rules.mjs
curl -s "https://firestore.googleapis.com/v1/projects/kyudoscoremanager/databases/(default)/documents/group_accounts/265294"
```

最後の1つは、認証なしで何が読めるかを実際に見るもの。`id` と `email` だけになって
いれば移行は済んでいる。

---

## 再発を防ぐ検査

`test/publicGroupDocFields.test.js` が、`firestore.rules` の `hasOnly` と `src` が
`setDoc` へ渡す項目を突き合わせる。`npm test` で毎回走る。

わざと壊して、捕まえることを確認済み：

| 壊し方 | 結果 |
|---|---|
| アプリが `name` と `createdAt` を足す（8/27 と同じ） | 検知 |
| 決まりの `update` から `hasOnly` を外す（9/2 以前） | 検知 |

新規登録は検査でも e2e でも通らない道（本番の団体を作ることになる）なので、
走らせて見つけることができない。だから走らせずに読み比べる。
