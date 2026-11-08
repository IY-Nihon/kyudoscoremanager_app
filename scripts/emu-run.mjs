/**
 * scripts/e2e-emu.mjs が firebase emulators:exec の中で呼ぶ。中継の代わり（scripts/emu-chukei.mjs）を立ててから
 * Playwright を流し、終わったら中継の代わりを止める
 */
import { spawn, spawnSync } from 'node:child_process';

const 中継 = spawn(process.execPath, ['scripts/emu-chukei.mjs'], { stdio: 'inherit' });
// 立ち上がるのを待つ（/kojin 以外は 503 を返す）
for (let 回 = 0; 回 < 50; 回++) {
  try {
    await fetch('http://127.0.0.1:8788/');
    break;
  } catch {
    await new Promise((解く) => setTimeout(解く, 200));
  }
}
const 結果 = spawnSync('npx', ['playwright', 'test', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, FB_EMULATOR: '1', PW_DIST: 'dist-emu' },
  shell: true,
});
中継.kill();
process.exit(結果.status ?? 1);
