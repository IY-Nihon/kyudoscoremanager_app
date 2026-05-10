$ErrorActionPreference = "Stop"

$workflowFilter = "build-ipa.yml"
Write-Host "Fetching the latest run for workflow: $workflowFilter ..." -ForegroundColor Cyan

# Fetch the latest run information in JSON format
$latestRunJson = gh run list --workflow $workflowFilter --limit 1 --json databaseId,status,conclusion,headSha,createdAt
$latestRun = $latestRunJson | ConvertFrom-Json

if ($null -eq $latestRun -or $latestRun.Length -eq 0) {
    Write-Host "No runs found for workflow $workflowFilter." -ForegroundColor Red
    exit 1
}

$run = $latestRun[0]
$runId = $run.databaseId
$status = $run.status
$conclusion = $run.conclusion
$commitSha = $run.headSha.Substring(0, 7)
$createdAt = $run.createdAt

Write-Host "----------------------------------------"
Write-Host "📌 Latest Run ID : $runId"
Write-Host "📝 Commit SHA    : $commitSha"
Write-Host "🕒 Created At    : $createdAt"
Write-Host "🔄 Status        : $status"
Write-Host "🏁 Conclusion    : $conclusion"
Write-Host "----------------------------------------"

if ($status -eq "in_progress" -or $status -eq "queued") {
    Write-Host "⏳ The build is still running. Please wait and try again." -ForegroundColor Yellow
}

# Always fetch logs for analysis if the run finished, especially if it failed
if ($conclusion -eq "failure" -or $status -eq "completed") {
    Write-Host "`n🔍 Downloading build logs for analysis..." -ForegroundColor Cyan
    
    # Store logs to a temporary file
    $logFile = "latest_build_run.log"
    gh run view $runId --log > $logFile 2>$null

    if (-not (Test-Path $logFile)) {
        Write-Host "Failed to download logs. Logs might have expired or not exist." -ForegroundColor Red
        exit 1
    }

    Write-Host "Logs downloaded successfully. Searching for critical errors...`n" -ForegroundColor Green

    # Patterns to catch various build and compilation errors in Xcode/React Native.
    # Exclude warnings (unless explicitly asked) to keep it concise.
    $errorPatterns = @(
        "fatal error:",
        "error:",
        "FAILED",
        "BUILD FAILED",
        "Multiple commands produce",
        "Undefined symbol:",
        "✖"
    )

    $patternRegex = ($errorPatterns | ForEach-Object { [regex]::Escape($_) }) -join "|"

    # Search the logs, grab lines containing errors and a few context lines.
    # We will grab a summary instead of the entire giant log.
    $errorBlocks = Select-String -Path $logFile -Pattern $patternRegex -Context 1, 2 | Select-Object -First 30

    if ($errorBlocks) {
        Write-Host "🚨 ERROR SUMMARY FOUND IN LOGS:`n" -ForegroundColor Red
        $errorBlocks | ForEach-Object {
            # Format context nicely
            Write-Host "----------------------------------------" -ForegroundColor DarkGray
            if ($_.Context.PreContext) {
                $_.Context.PreContext | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
            }
            Write-Host "➤ $($_.Line)" -ForegroundColor Red
            if ($_.Context.PostContext) {
                $_.Context.PostContext | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
            }
        }
        Write-Host "----------------------------------------" -ForegroundColor DarkGray
        Write-Host "`n💡 Showing up to the first 30 error occurrences. If you need more, inspect '$logFile' manually." -ForegroundColor Yellow
    } else {
        if ($conclusion -eq "failure") {
            Write-Host "⚠️ Run failed, but no standard error patterns were found in the log." -ForegroundColor Yellow
            Write-Host "Check the end of the log manually:" -ForegroundColor Yellow
            Get-Content $logFile -Tail 20
        } else {
            Write-Host "✅ No syntax/compilation errors detected." -ForegroundColor Green
        }
    }

    # Clean up
    Remove-Item $logFile -Force
}

Write-Host "`nDone." -ForegroundColor Cyan
