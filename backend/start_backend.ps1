$VenvPython = "..\venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
    $VenvPython = "c:\Users\dkttr\OneDrive\Desktop\movierecomendationsystem\venv\Scripts\python.exe"
}

Write-Host "Starting Backend using: $VenvPython"
& $VenvPython app.py
