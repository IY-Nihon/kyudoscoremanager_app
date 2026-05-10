$runId = '24278570096'
Write-Host "Monitoring Run ID: $runId"
while($true) {
    $res = gh run view $runId
    if ($res -match 'completed' -or $res -match 'success' -or $res -match 'failure' -or $res -match 'cancelled') {
        if ($res -match 'in_progress') {
            # Still in progress
        } else {
            Write-Host "Run completed!"
            break
        }
    }
    Start-Sleep -Seconds 30
    Write-Host '.' -NoNewline
}
