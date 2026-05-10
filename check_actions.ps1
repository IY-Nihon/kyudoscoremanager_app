$ErrorActionPreference = "Stop"
try {
    # Windows Credential Manager から GitHub トークンを取得
    $wc = New-Object System.Net.WebClient
    $wc.Credentials = [System.Net.CredentialCache]::DefaultCredentials
    
    # git config から認証情報を取得
    $remoteUrl = git remote get-url origin
    Write-Output "Remote URL: $remoteUrl"
    
    # git credential を使ってトークン取得
    $credInput = "protocol=https`nhost=github.com`nusername=gitcredential`n"
    $credInput | git credential fill 2>&1 | Tee-Object -Variable credOutput
    
    $token = ($credOutput | Where-Object { $_ -match "^password=" }) -replace "^password=", ""
    
    if ($token) {
        Write-Output "Token found, querying API..."
        $headers = @{
            "Authorization" = "token $token"
            "Accept" = "application/vnd.github.v3+json"
        }
        $runs = Invoke-RestMethod -Uri "https://api.github.com/repos/nitidaikouka/RecordApp/actions/runs?per_page=5" -Headers $headers
        foreach ($run in $runs.workflow_runs) {
            Write-Output ("#{0}: {1}" -f $run.run_number, $run.name)
            Write-Output ("  Status: {0}, Conclusion: {1}" -f $run.status, $run.conclusion)
            Write-Output ("  URL: {0}" -f $run.html_url)
            Write-Output ""
        }
    } else {
        Write-Output "Token not found. Please set GH_TOKEN environment variable."
    }
} catch {
    Write-Output "Error: $_"
}
