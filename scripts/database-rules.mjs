/**
 * Realtime Database の決まり（database.rules.json）を作る（2026-11-26 S8。11/22 本人「ライブの決まりに枝の長さの上限と項目の検証を足す」）。
 *
 *   node scripts/database-rules.mjs          … database.rules.json を書き直す
 *   node scripts/database-rules.mjs --check  … 今のファイルと同じかだけ見る（違えば 1 で終わる）
 *
 * database.rules.json は手で直さず、ここを直して書き出す（test/databaseRulesFile.test.js が食い違いを止める）。
 * 盤面の形は 4 か所（ライブ・閲覧用の写し・取り消しの控えの前と後）に同じものが要るので、ここで 1 つにしてある。
 *
 * ■ 枝（$branch）：20 字以上（前から。src/liveSecret.js の 枝の最短）と、64 字まで（足した。団体の合言葉は 32 字・
 *   配った枝は 64 字。長い名前の枝をいくらでも作れないように）。書くときだけ見る（読むのは前のまま）
 * ■ 中身：書き込む形は全部洗った（11/26：アプリの書き込み 33 か所・本番と検証の Realtime Database の中身・本番の記録の
 *   射手の項目。本番に出ている版 1e09414 からライブの書き込みの形は変わっていない）。
 *   - 知っている項目は型と字数を見る（名前は 200 字まで。本番の最大は 103 字）
 *   - 知らない項目は、字（200 字まで）・数・真偽だけ通し、下に項目を持つ入れ物は断る。前の版が持っている項目
 *     （記録の射手の hits・totalShots など）や、これからの版が足す小さな項目では止まらない。大きな入れ物を置いて
 *     枠を埋めたり、盤面を読めない形にしたりはできない
 *   - 並び（射手・○×・矢所）は番号の桁で数を絞る（射手 999 人まで・○× と矢所は 9999 本まで）。
 *     射手の id で引く表（marks_by_id など）の数は決まりでは絞れない（1 つずつの大きさだけ絞る）
 * ■ 配る順：知らない入れ物を断るので、ライブに新しい「入れ物の項目」を足すときは、決まりを先に配る（いつもの
 *   「アプリが先、決まりが後」の逆）。字・数・真偽の項目なら決まりを直さなくても通る
 * ■ 前からの決まり（期限・印・置いた口座・移った先。B6）は、そのまま写してある
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 倉庫 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 道 = path.join(倉庫, 'database.rules.json');

// ── 式の部品 ──
const 字 = (上限) => `newData.isString() && newData.val().length <= ${上限}`;
const 数 = 'newData.isNumber()';
const 真偽 = 'newData.isBoolean()';
/** 知らない項目に許す値（入れ物は断る） */
const 小さい値 = `newData.isBoolean() || newData.isNumber() || (${字(200)})`;
const 葉 = (式) => ({ '.validate': 式 });
const だめ = { '.validate': false };
/** 並びの番号（0 から。桁で数を絞る） */
const 番 = (変数, 桁) => `${変数}.length <= ${桁} && ${変数}.matches(/^[0-9]+$/)`;
/** ○× の 1 ます（○・×・？・空） */
const 印 = (変数) => 葉(`${番(変数, 4)} && (${字(2)})`);

// ── 枝の決まり（前から）──
const 長さ = `$branch.length >= 20 && $branch.length <= 64`;
const 期限内 =
  "(!root.child('live_limits').child($branch).exists() || root.child('live_limits').child($branch).val() > now)";
const 読める = `auth != null && $branch.length >= 20 && ${期限内}`;
const 書ける = `auth != null && ${長さ} && (${期限内.slice(1, -1)} || !newData.exists())`;

/** 射手 1 人（盤面の archers・取り消しの控えの 前／後）。○× は控えにだけ入る（盤面は marks_by_id で別に送る） */
const 射手 = {
  '.validate': `${番('$i', 3)} && newData.hasChildren()`,
  id: 葉(字(64)),
  name: 葉(字(200)),
  gender: 葉(字(10)),
  grade: 葉(`${数} || (${字(4)})`),
  isSeparator: 葉(真偽),
  isTotalCalculator: 葉(真偽),
  isGuest: 葉(真偽),
  またぐ合計: 葉(真偽),
  teamName: 葉(字(100)),
  memberId: 葉(字(64)),
  lastModified: 葉(数),
  bowWeight: 葉(`${数} || (${字(10)})`),
  // 前の版の記録の射手が持っている（本番の記録の 670 人分。ライブを始めるときは手元の射手をそのまま書く）
  hits: 葉(数),
  totalShots: 葉(数),
  marks: { $j: 印('$j') },
  // 矢所は 1 本ずつ、空（''）か { x, y, targetType }
  arrowLocations: {
    $j: {
      '.validate': `${番('$j', 4)} && ((${字(2)}) || newData.hasChildren())`,
      x: 葉(数),
      y: 葉(数),
      targetType: 葉(字(20)),
      $k: 葉(小さい値),
    },
  },
  lockedBlocks: { $j: 葉(`$j.length <= 6 && ${真偽}`) },
  substitutions: { $j: 葉(`$j.length <= 20 && (${字(200)})`) },
  substitutionIds: { $j: 葉(`$j.length <= 20 && (${字(64)})`) },
  $f: 葉(小さい値),
};
const 射手たち = { $i: 射手 };

/** 盤面（live_sessions と live_view の {名前}/state。道しるべも同じ所に置く） */
const 盤面 = {
  archers: 射手たち,
  marks_by_id: {
    $id: { '.validate': `$id.length <= 64 && newData.hasChildren()`, $j: 印('$j') },
  },
  archer_timestamps: { $id: 葉(`$id.length <= 64 && ${数}`) },
  shotsPerRound: 葉(`${数} && newData.val() >= 0 && newData.val() <= 1000`),
  timestamp: 葉(数),
  updated_at: 葉(数),
  reset_at: 葉(数),
  history_at: 葉(数),
  history_len: 葉(`${数} && newData.val() >= 0`),
  history_max: 葉(`${数} && newData.val() >= 0`),
  history_kind: 葉(字(10)),
  status: 葉(字(20)),
  期限: 葉(数),
  共有の枝: 葉(字(64)),
  閲覧の枝: 葉(字(64)),
  // 期限のある枝では「移った先」を書けない（期限の無い置き場へ移して期限を逃れられない。B6 ③）
  移った先: 葉(`(${字(64)}) && !root.child('live_limits').child($branch).exists()`),
  移った先の閲覧枝: 葉(`(${字(64)}) && !root.child('live_limits').child($branch).exists()`),
  種: { 編集: 葉(字(64)), 閲覧: 葉(字(64)), $f: だめ },
  鍵が要るか: 葉(真偽),
  $f: 葉(小さい値),
};

/** 取り消しの控えの中の値（項目の差分の 前／後。字・数・真偽か、2 段までの入れ物：鍵・交代の表・矢所） */
const 差分の値 = {
  '.validate': `${小さい値} || newData.hasChildren()`,
  $a: {
    '.validate': `$a.length <= 64 && (${小さい値} || newData.hasChildren())`,
    $b: 葉(`$b.length <= 64 && (${小さい値})`),
  },
};

/** 取り消しの控え 1 手（live_history/{枝}/{名前}/{番号}。src/storeShared.js の 共有履歴へ積む） */
const 控え = {
  '.validate': `${番('$n', 7)} && newData.hasChildren()`,
  前: 射手たち,
  後: 射手たち,
  本数: 葉(数),
  at: 葉(数),
  差分: {
    $i: {
      '.validate': `${番('$i', 4)} && newData.hasChildren()`,
      射手: 葉(字(64)),
      射番: 葉(数),
      前: 葉(字(2)),
      後: 葉(字(2)),
      $x: だめ,
    },
  },
  項目: {
    $i: {
      '.validate': `${番('$i', 3)} && newData.hasChildren()`,
      射手: 葉(字(64)),
      項目: {
        $k: { '.validate': `$k.length <= 40 && newData.hasChildren()`, 前: 差分の値, 後: 差分の値, $y: だめ },
      },
      $x: だめ,
    },
  },
  射数: {
    前: 葉(数),
    後: 葉(数),
    切った: { $id: { '.validate': `$id.length <= 64 && newData.hasChildren()`, $j: 印('$j') } },
    $x: だめ,
  },
  $f: 葉(小さい値),
};

/** 読み書きの決まり（4 つの置き場で同じ）と、その下の形 */
const 置き場 = (下) => ({
  $branch: { '.read': 読める, '.write': 書ける, '.validate': 'newData.hasChildren()', ...下 },
});

export function 決まりを作る() {
  return {
    rules: {
      live_sessions: 置き場({ $name: { state: 盤面, $f: だめ } }),
      live_history: 置き場({ $name: { $n: 控え } }),
      live_presence: 置き場({
        $name: {
          $device: {
            '.validate': `$device.length <= 64 && newData.hasChildren(['at'])`,
            at: 葉(数),
            $f: だめ,
          },
        },
      }),
      live_view: 置き場({ $name: { state: 盤面, $f: だめ } }),
      live_limits: {
        $branch: {
          '.read': 'auth != null && $branch.length >= 20',
          '.write': `auth != null && ${長さ} && ((!data.exists() && newData.isNumber() && newData.val() > now && !root.child('live_groups').child($branch).exists()) || (newData.isNumber() && data.isNumber() && newData.val() <= data.val() && (!root.child('live_limit_owners').child($branch).exists() || root.child('live_limit_owners').child($branch).val() === auth.uid)) || (!newData.exists() && root.child('live_groups').child($branch).exists()) || (!newData.exists() && !root.child('live_sessions').child($branch).exists() && !root.child('live_view').child($branch).exists() && !root.child('live_history').child($branch).exists() && !root.child('live_presence').child($branch).exists() && ((!root.child('live_limit_owners').child($branch).exists() || root.child('live_limit_owners').child($branch).val() === auth.uid) || data.val() <= now)))`,
          '.validate': 'newData.isNumber() && newData.val() > 0',
        },
      },
      live_groups: {
        $branch: {
          '.read': 'auth != null && $branch.length >= 20',
          '.write': `auth != null && ${長さ} && !data.exists() && newData.val() === true && !root.child('live_limits').child($branch).exists()`,
        },
      },
      live_limit_owners: {
        $branch: {
          '.read': 'auth != null && $branch.length >= 20',
          '.write': `auth != null && ${長さ} && ((!data.exists() && newData.val() === auth.uid && !root.child('live_limits').child($branch).exists()) || (!newData.exists() && (data.val() === auth.uid || !root.child('live_limits').child($branch).exists())))`,
        },
      },
    },
  };
}

export const 書き出す形 = () => JSON.stringify(決まりを作る(), null, 2) + '\n';

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const 新 = 書き出す形();
  const 今 = fs.existsSync(道) ? fs.readFileSync(道, 'utf8').replace(/\r\n/g, '\n') : '';
  if (process.argv.includes('--check')) {
    if (今 !== 新) {
      console.error(
        'database.rules.json が scripts/database-rules.mjs と違います。node scripts/database-rules.mjs で書き直してください'
      );
      process.exit(1);
    }
    console.log('database.rules.json は scripts/database-rules.mjs と同じです');
  } else {
    fs.writeFileSync(道, 新);
    console.log('database.rules.json を書き直しました');
  }
}
