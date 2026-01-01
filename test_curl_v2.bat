@echo off
echo Testing Unauthenticated Access (Should fail with 401)...
curl -i http://localhost:3001/api/quiz/list
echo.
echo.
echo Logging in...
curl -c cookies.txt -X POST -H "Content-Type: application/json" -d "{\"id\":\"admin\",\"password\":\"1234\"}" http://localhost:3001/api/admin/login
echo.
echo.
echo Testing Authenticated Access (Should succeed)...
curl -b cookies.txt http://localhost:3001/api/quiz/list
echo.
