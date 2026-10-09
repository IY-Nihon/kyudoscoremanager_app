# 板のマスを見分ける網（CNN ＋ 写真で学習済みの MobileNet）（2026-10-09〜10）

アプリの板の読み取り（`src/ocr/yomu.js` の 板の印を読む）は、マスごとに ×・◎・○＼・○／ を見分ける。

- 全部のマスを、畳み込みの網（`omomi-tatami.json`・`scripts/ocr-cells/tatami.mjs`）で読む。
  重みの JSON の `形` が `'CNN'` なら yomu.js が畳み込みで読む。
- 畳み込みの網が迷ったマス（いちばん高い確からしさが 0.9 未満）だけ、写真で学習済みの MobileNetV3-small を
  9 段目で切った網 2 枚（`omomi-mobilenet.bin`・`scripts/ocr-cells/mobilenet.mjs`）の答えと混ぜる
  （畳み 1・写真 2 の重さで平均）。重みが取れなければ畳み込みの網だけで読む。

## 測り方（公平な物差し）

本物の正解つきのマス 1590（写真 17 枚・板の組 10）を、外した組で測る。外した組は一度も学習に使っていない。
学習には描いた板（26784 マス）を全部と、外さなかった組の本物を 8 回ずつ混ぜる。

- **板ごとに外す**（10 組）… 同じ日の別の板は学習に入る
- **日（部）ごとに外す**（5 組：9/6・9/13・9/20・9/27・10/4）… 初めての部の板に近い。こちらを主に見る

網は学ばせる回（種）ごとに当たりが揺れるので、**種を変えて 3〜5 回**学ばせ、全部を並べる。
読むのは 1 回だけ（少しずつずらして何度も読む「ずらし」は使わない）。

### 結果

| 候補 | 板ごとに外す（5 回） | 日ごとに外す（3 回・アプリと同じ切り抜き） |
|---|---|---|
| 畳み込みの網（幅 12 ＋ 形の特徴 92） | 1581〜1589 | 1569〜1577（98.7〜99.2%） |
| MobileNetV3-small 96px・9 段目で切る（重み 0.20M） | 1588〜1590 | 1587〜1590 |
| MobileNetV3-small 96px・全部（重み 1.52M） | 1585〜1590 | — |
| 64px に縮める（頭を小さく・9 段目・7 段目で切る。1 回ずつ） | 1584〜1586（だめ） | — |
| **畳み込み ＋ 迷ったマス（0.9 未満）だけ MobileNet 2 枚と混ぜる** | **1589〜1590** | **1590・1590・1590** |

- 10/9 に「MobileNet は 100%」と書いたのは、MobileNet だけずらしを 5 回して平均した数で、畳み込みは 1 回読みだった。
  そろえると板ごとでは差が小さく、日ごとに外すと差がはっきり出た（初めての部の書き方に強い）。
- 畳み込みの網の読み違いは確からしさ 0.89 以下にあった。境を 0.8 にすると 1589〜1590 に落ちる回がある。
- 迷ったマスは、学習に入った写真では 1〜3 マス、初めての部の板では 1 割ほど。
- int8 に丸めると 1 マスほど落ちる回があるので、重みは float16（0.79MB）。int6・int4 は大きく落ちる。
- 9 段目で切った 1 枚の読み違いは、渦のようにつながった ◎ を ○＼ と読むもの（10/4 の板。10/4 を学ぶと直る）。

### 速さと重さ

| | 畳み込みだけ | ＋ MobileNet（迷ったマスだけ） |
|---|---|---|
| 写真 1 枚を端末で読む（Chromium） | 1.7〜2.7 秒 | ＋0.1 秒 |
| 同じ・CPU 6 倍遅く | 11〜18 秒 | ＋0.3〜0.4 秒（初めての部の板なら ＋2〜3 秒の見込み） |
| WebKit | 3.0〜6.9 秒 | ＋0.2 秒 |
| 落とす量 | 0.06MB（束の中） | ＋0.79MB（写真の読み取りを使うときだけ。2 回目からは sw.js の控え） |

MobileNet を素の JS で動かすと 1 マス 6ms（2 枚で 12ms）。onnxruntime-web（WASM）なら速いが、WASM だけで
3.7MB（gzip）あるので使わない。全部のマスを MobileNet で読むと 320 マスで 4 秒（パソコン）かかる。

重みは Metro の asset（`metro.config.js` で bin を足した）で、束には入らない。読み取りを始めたときに
`src/ocr/shashinNoMou.js` が取りに行き、Gemini を待つあいだに届く（待つのは 8 秒まで）。

## 学び直し方

1. 正解を足す（名前入りなので倉庫に入れない。`kyudo-ocr-ag/.hakari/seikai-*.mjs`）
2. `DUMP_HEN=32 node scripts/ocr-cells/cnn/dump.mjs 120` … アプリと同じ切り抜きでマスを書き出す（`data/`。倉庫に入れない）。
   板ごとの比べには 40px の書き出し（`DUMP_HEN` なし）も使う
3. 比べる
   - `HI=1 DATA32=1 SEEDS=0,1,2 python scripts/ocr-cells/cnn/mb.py CNN,mb96t9` … 日ごとに外して測る（`probs/`・`models/`）
   - `python scripts/ocr-cells/cnn/mb_kumiawase.py mb96t9` … 組み合わせ（迷ったマスだけ回す）を数える
4. 本物を全部入れて学ぶ
   - 畳み込み：`python scripts/ocr-cells/cnn/prod.py scripts/ocr-cells/omomi-tatami.json 12 1 1`
   - MobileNet：`python scripts/ocr-cells/cnn/mb_prod.py ../omomi-mobilenet.bin 2`（`scripts/ocr-cells/cnn` で）。
     一緒にここへ書く `omomi-mobilenet.bin.mihon.json`（PyTorch の答え）を `test/ocrMobilenet.mihon.json` に写す
5. `kyudo-ocr-ag/.hakari/zenbu-1009.mjs`（`OCR_OMOMI`・`OCR_USUI` で重みを指す）で、これまでの写真ぜんぶを
   3 通り（Node・Chromium・WebKit の画素）で数え、落ちないことを見る

PyTorch（GPU）を使う。畳み込みの網は BatchNorm を畳み、層ごとに int8（omomi.mjs と同じ形）。
MobileNet は BatchNorm を畳み、最初の畳み込みに色の平均・幅を畳んで（はみ出しは 端 で直す）float16 にする。
JS と PyTorch の確からしさの差は、畳み込み 0.004 以内、MobileNet 0.0005 以内。

## 迷ったマス

確認画面の「迷ったマス」（混ぜたあとの確からしさ 0.55 未満）は、まれ。
