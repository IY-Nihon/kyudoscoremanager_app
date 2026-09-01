/**
 * 的中の型（statsRules の 型を並べる）を目で確かめるための記録を、
 * 検証環境の団体100001へ入れる。
 *
 *   node scripts/seed-pattern-check.mjs
 *
 * 既存の記録には触れない。新しいID（ses-100001-型検証）で足すだけなので、
 * 何度流しても同じ1件を上書きするだけで増えていかない。
 *
 * 入れる中身は、型の一覧で見たいものを全部踏むように選んである：
 *   ・同じ中り数の中に複数の型（三中が3通り）→ 並び順と割合の分母
 *   ・要点がいちばん長くなる羽分（2本抜き）→ 細い画面での省略
 *   ・一中（中った側を言う）と、皆中・残念（要点を出さない）
 *   ・4射に満たない端数 → 断り書きが出るか
 *   ・立ちの途中で交代 → どちらの型にも数えないこと
 */
import { configFor, signIn, setDoc } from './fb-rest.mjs';

const { apiKey, projectId } = configFor('stg');
if (!apiKey || projectId !== 'kyudoscoremanager-stg') {
  console.error('停止：.env.development.local が検証環境を指していません');
  process.exit(1);
}

const 団体 = '100001';
const PW = 'StgTest!2026';
const 人 = (i) => `mem-${団体}-${String(i).padStart(3, '0')}`;

/** 4文字の型を並べて marks にする */
const 型で並べる = (...型たち) => 型たち.flatMap((x) => x.split(''));

// ── 部員3：型の一覧をひととおり踏む ──────────────────
// 期待する見え方（同じ中り数の中での割合）：
//   皆中 2立   ○○○○ 2立 100%
//   三中 5立   ○○○× 3立 60% 留矢を抜いた／○○×○ 1立 20% 3本目を抜いた／×○○○ 1立 20% 初矢を抜いた
//   羽分 1立   ○×○× 1立 100% 2本目・留矢を抜いた   ← 要点がいちばん長い
//   一中 1立   ○××× 1立 100% 初矢だけ中った
//   残念 1立   ×××× 1立 100%
//   端数 2射の断り書き
const 部員3の印 = 型で並べる(
  '○○○○', '○○○○',
  '○○○×', '○○○×', '○○○×',
  '○○×○',
  '×○○○',
  '○×○×',
  '○×××',
  '××××'
).concat(['○', '×']); // 端数2射

// ── 部員4：立ちの途中で交代 ────────────────────────
// 3射目（添字2）から部員5へ交代する。
//   立0（添字0-3）… 交代をまたぐので、部員4の型にも部員5の型にも数えない
//   立1（添字4-7）… ぜんぶ部員5のものなので、部員5の三中として数える
const 部員4の印 = 型で並べる('○○○×', '○○×○');

const いま = Date.now();
const 記録 = {
  id: `ses-${団体}-型検証`,
  date: いま,
  title: '型の確認用',
  note: '的中の型を目で確かめるための合成データ（scripts/seed-pattern-check.mjs）',
  // 表示の枠。marks の長さ（42）が収まるように多めに取る
  shotCount: 44,
  includeInStats: true,
  tags: ['#正規練習'],
  archerNames: ['部員3', '部員4'],
  archers: [
    { id: 'p3', name: '部員3', memberId: 人(3), marks: 部員3の印 },
    {
      id: 'p4',
      name: '部員4',
      memberId: 人(4),
      marks: 部員4の印,
      substitutions: { 2: '部員5' },
      substitutionIds: { 2: 人(5) },
    },
  ],
  lastModified: いま,
};

const token = await signIn(apiKey, 'nihonu.kouka@gmail.com', PW);
await setDoc(projectId, `/groups/${団体}/sessions/${記録.id}`, 記録, token);

console.log(`${projectId} / 団体${団体} に「${記録.title}」を入れました`);
console.log(`  部員3 … ${部員3の印.length}射（10立と端数2射）`);
console.log(`  部員4 … ${部員4の印.length}射（3射目から部員5へ交代）`);
console.log('');
console.log('  ほかの記録には触れていません。同じIDなので、流し直しても増えません。');
