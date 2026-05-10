import { execSync } from 'child_process';
import fs from 'fs';

console.log("\x1b[36m%s\x1b[0m", "Fetching the latest run for workflow: build-ipa.yml...");

try {
  const listCmd = 'gh run list --workflow build-ipa.yml --limit 1 --json databaseId,status,conclusion,headSha,createdAt';
  const latestRunStr = execSync(listCmd, { encoding: 'utf-8' }).trim();
  const latestRuns = JSON.parse(latestRunStr);

  if (!latestRuns || latestRuns.length === 0) {
    console.error("\x1b[31m%s\x1b[0m", "No runs found for workflow build-ipa.yml.");
    process.exit(1);
  }

  const run = latestRuns[0];
  console.log("----------------------------------------");
  console.log(`📌 Latest Run ID : ${run.databaseId}`);
  console.log(`📝 Commit SHA    : ${run.headSha.substring(0, 7)}`);
  console.log(`🕒 Created At    : ${run.createdAt}`);
  console.log(`🔄 Status        : ${run.status}`);
  console.log(`🏁 Conclusion    : ${run.conclusion || "N/A"}`);
  console.log("----------------------------------------");

  if (run.status === "in_progress" || run.status === "queued") {
    console.log("\x1b[33m%s\x1b[0m", "⏳ The build is still running. Please wait and try again.");
  }

  if (run.conclusion === "failure" || run.status === "completed") {
    console.log("\x1b[36m%s\x1b[0m", "\n🔍 Downloading build logs for analysis...");
    
    // Download logs
    const logFile = "latest_build_run.log";
    try {
      execSync(`gh run view ${run.databaseId} --log > ${logFile} 2> nul`, { stdio: 'ignore' });
    } catch(e) { /* ignore execSync error if grep fails etc, we just want the file */ }

    if (!fs.existsSync(logFile) || fs.statSync(logFile).size === 0) {
      console.error("\x1b[31m%s\x1b[0m", "Failed to download logs. Logs might have expired or not exist.");
      process.exit(1);
    }

    console.log("\x1b[32m%s\x1b[0m", "Logs downloaded successfully. Searching for critical errors...\n");

    const logs = fs.readFileSync(logFile, 'utf-8').split('\n');
    const errorPatterns = [
      /fatal error:/i,
      /error:/i,
      /FAILED/i,
      /BUILD FAILED/i,
      /Multiple commands produce/i,
      /Undefined symbol:/i,
      /✖/
    ];

    let foundErrors = false;
    let matchCount = 0;

    for (let i = 0; i < logs.length; i++) {
      if (matchCount >= 30) break; // Limit output

      const line = logs[i];
      if (errorPatterns.some(p => p.test(line))) {
        if (!foundErrors) {
          console.log("\x1b[31m%s\x1b[0m", "🚨 ERROR SUMMARY FOUND IN LOGS:\n");
          foundErrors = true;
        }

        console.log("\x1b[90m%s\x1b[0m", "----------------------------------------");
        if (i > 0) console.log("\x1b[90m%s\x1b[0m", `  ${logs[i-1]}`);
        console.log("\x1b[31m%s\x1b[0m", `➤ ${line}`);
        if (i < logs.length - 1) console.log("\x1b[90m%s\x1b[0m", `  ${logs[i+1]}`);
        
        matchCount++;
      }
    }

    if (foundErrors) {
      console.log("\x1b[90m%s\x1b[0m", "----------------------------------------");
      console.log("\x1b[33m%s\x1b[0m", `\n💡 Showing up to the first 30 error occurrences. If you need more, inspect '${logFile}' manually.`);
    } else {
      if (run.conclusion === "failure") {
        console.log("\x1b[33m%s\x1b[0m", "⚠️ Run failed, but no standard error patterns were found in the log.");
        console.log("\x1b[33m%s\x1b[0m", "Check the end of the log manually:");
        console.log(logs.slice(-20).join('\n'));
      } else {
        console.log("\x1b[32m%s\x1b[0m", "✅ No syntax/compilation errors detected.");
      }
    }

    // Cleanup
    try { fs.unlinkSync(logFile); } catch(e) {}
  }

} catch (error) {
  console.error("An error occurred during log fetching:", error.message);
}

console.log("\x1b[36m%s\x1b[0m", "\nDone.");
