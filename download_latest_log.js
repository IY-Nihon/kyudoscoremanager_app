const { execSync } = require('child_process');
const fs = require('fs');

try {
  // gh run list の結果を取得
  const output = execSync('gh run list -L 1').toString();
  console.log("Output:");
  console.log(output);
  
  // ID（10桁前後の数字）を抽出
  const match = output.match(/\b(24\d{8,10})\b/);
  if (match) {
    const runId = match[1];
    console.log(`Found Run ID: ${runId}`);
    
    // ログをダウンロード 
    console.log(`Downloading log for run ${runId}...`);
    try {
      const log = execSync(`gh run view ${runId} --log-failed`).toString();
      fs.writeFileSync('latest_failed_log.txt', log);
      console.log("Saved failed log to latest_failed_log.txt");
    } catch (e) {
      console.log("Failed to get log via gh run view.", e.message);
    }
  } else {
    console.log("Could not find Run ID in the output.");
  }
} catch (error) {
  console.error("Error:", error.message);
}
