@echo off
curl -c cookies.txt -X POST -H "Content-Type: application/json" -d "{\"id\":\"admin\",\"password\":\"1234\"}" http://localhost:3001/api/admin/login
echo.
curl -b cookies.txt http://localhost:3001/api/quiz/list
echo.
