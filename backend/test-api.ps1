# PowerShell script to test the NSDataLab API
# Make sure the server is running before executing this script

Write-Host "=== Testing NSDataLab Backend API ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
curl http://localhost:5000/health
Write-Host ""
Write-Host ""

# Test 2: Generate Dataset
Write-Host "2. Testing Dataset Generation..." -ForegroundColor Yellow
$body = @{
    topic = "E-commerce Products"
    description = "Sample product catalog for an online store"
    columns = @(
        @{ name = "product_name"; datatype = "string" }
        @{ name = "price"; datatype = "currency" }
        @{ name = "category"; datatype = "string" }
        @{ name = "in_stock"; datatype = "boolean" }
        @{ name = "rating"; datatype = "float" }
    )
    rowCount = 10
} | ConvertTo-Json

curl -X POST http://localhost:5000/api/generate `
  -H "Content-Type: application/json" `
  -d $body
Write-Host ""
Write-Host ""

# Test 3: Get All Datasets
Write-Host "3. Testing Get All Datasets..." -ForegroundColor Yellow
curl "http://localhost:5000/api/datasets?page=1&limit=5"
Write-Host ""
Write-Host ""

Write-Host "=== Tests Complete ===" -ForegroundColor Green
