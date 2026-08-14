/**
 * 検証環境の団体が、いまどうなっているかを一覧で見る。
 *
 *   npm run stg:status
 *
 * 台帳（stg-fixtures.mjs）に書いてある「こうあるべき」と、実際の中身を並べる。
 * 検証を始める前にこれを見ておけば、他の検証が壊した／壊されたことに
 * 気づかないまま進むことがない。
 *
 * 読むだけ。何も書き換えない。
 */
import { configFor, signIn, req } from './fb-rest.mjs';
import { 団体たち, 合言葉 as PW } from './stg-fixtures.mjs';

const { apiKey, projectId } = configFor('stg');
if (!apiKey || projectId !== 'kyudoscoremanager-stg') {
  console.error('停止：.env.development.local が検証環境を指していません');
  process.exit(1);
}

/** その入れ物に何件あるか。読めなければ null */
async function 数える(道, token) {
  const r = await req(projectId, 道, { token, query: '?pageSize=300' });
  if (r.status !== 200 || !r.json) return null;
  return (r.json.documents || []).length;
}

console.log(`検証環境（${projectId}）の団体\n`);
console.log('  ID      名前                       部員  記録  持ち主');
console.log('  ' + '─'.repeat(74));

const ズレ = [];

for (const g of 団体たち) {
  let 部員 = '?';
  let 記録 = '?';
  let 備考 = '';
  try {
    const token = await signIn(apiKey, g.email, PW);
    const m = await 数える(`/groups/${g.id}/members`, token);
    const s = await 数える(`/groups/${g.id}/sessions`, token);
    部員 = m === null ? '—' : String(m);
    記録 = s === null ? '—' : String(s);

    // 台帳に「こうあるべき」が書いてあれば、実物と突き合わせる
    if (g.期待) {
      if (typeof g.期待.部員 === 'number' && m !== null && m !== g.期待.部員) {
        ズレ.push(`${g.id} ${g.名}：部員が ${g.期待.部員}人のはずが ${m}人`);
        備考 = ' ←ズレ';
      }
      if (typeof g.期待.記録 === 'number' && s !== null && s !== g.期待.記録) {
        ズレ.push(`${g.id} ${g.名}：記録が ${g.期待.記録}件のはずが ${s}件`);
        備考 = ' ←ズレ';
      }
    }
  } catch (e) {
    備考 = ' ←入れませんでした';
  }
  console.log(
    `  ${g.id}  ${g.名.padEnd(24, '　').slice(0, 24)}  ${部員.padStart(4)}  ${記録.padStart(4)}  ${g.持ち主}${備考}`
  );
}

if (ズレ.length) {
  console.log('\n■ 台帳と違うところ');
  for (const z of ズレ) console.log(`  ・${z}`);
  console.log('  持ち主のスクリプトを流し直すか、台帳の期待値を直してください。');
}

console.log('\n用途');
for (const g of 団体たち) console.log(`  ${g.id}  ${g.用途}`);
console.log('\n※ 300件までしか数えていません（規模検証の団体は「300」と出ることがあります）');
