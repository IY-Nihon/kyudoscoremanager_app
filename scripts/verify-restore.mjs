/**
 * 書き戻した先の中身を数えて、控えと合っているかを見る。読むだけ。
 *
 *   FIREBASE_SERVICE_ACCOUNT_KEY=<鍵ファイルの道> node scripts/verify-restore.mjs
 *
 * 「復元できた」と言うには、書けたことではなく**戻っていること**を見る必要がある。
 * 団体ごとの下位の集まりの件数を、控えの中身と突き合わせて出す。
 */
import { 鍵を読む, 控えを読む, 置き場を拾う, 道具を読む } from './restore-common.mjs';

// 読むだけなので本番の確認は要らないが、鍵の確認は先に済ませる
const 鍵 = 鍵を読む();

const { initializeApp, cert } = await 道具を読む('firebase-admin/app');
const { getFirestore } = await 道具を読む('firebase-admin/firestore');
const app = initializeApp({ credential: cert(鍵) });
const db = getFirestore();

/** 控えの側の件数を数える */
function 控えの件数(控え) {
  const 出 = {};
  for (const [集まり, 書類たち] of Object.entries(控え.firestore || {})) {
    出[集まり] = { 件数: 書類たち.length, 下位: {} };
    for (const d of 書類たち)
      for (const [名, 子たち] of Object.entries(d._collections || {}))
        出[集まり].下位[名] = (出[集まり].下位[名] || 0) + 子たち.length;
  }
  return 出;
}

async function main() {
  console.log(`\n書き戻した先を確かめます（先: ${鍵.project_id}）\n`);
  const 控え = 控えを読む(置き場を拾う());
  const 期待 = 控えの件数(控え);

  let 食い違い = 0;
  for (const [集まり, 中身] of Object.entries(期待)) {
    const 実際 = (await db.collection(集まり).listDocuments()).length;
    const 印 = 実際 === 中身.件数 ? '○' : '×';
    if (実際 !== 中身.件数) 食い違い++;
    console.log(`  ${印} ${集まり.padEnd(18)} 控え ${中身.件数} / 先 ${実際}`);

    for (const [名, 期] of Object.entries(中身.下位)) {
      let 合計 = 0;
      for (const 参照 of await db.collection(集まり).listDocuments())
        合計 += (await 参照.collection(名).listDocuments()).length;
      const 印2 = 合計 === 期 ? '○' : '×';
      if (合計 !== 期) 食い違い++;
      console.log(`      ${印2} ${名.padEnd(22)} 控え ${期} / 先 ${合計}`);
    }
  }

  console.log(`\n${食い違い === 0 ? '食い違いはありません。' : `★ ${食い違い} 件が食い違っています。`}\n`);
  await app.delete();
  process.exit(食い違い === 0 ? 0 : 1);
}

main().catch(async (e) => {
  console.error('失敗:', e.message);
  await app.delete().catch(() => {});
  process.exit(1);
});
