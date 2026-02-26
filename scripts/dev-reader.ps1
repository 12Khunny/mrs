$connection = Get-NetTCPConnection -LocalPort 5261 -State Listen -ErrorAction SilentlyContinue
if ($connection) {
    Stop-Process -Id $connection.OwningProcess -Force
    Start-Sleep -Milliseconds 300
}

dotnet run --project services/MRS.ReaderService/MRS.ReaderService/MRS.ReaderService.csproj --launch-profile http
