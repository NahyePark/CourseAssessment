@echo off
echo ===============================
echo 1. Installing React dependencies
cd OutcomeView
call npm install --legacy-peer-deps

echo ===============================
echo 2. Building React app
call npm run build

echo ===============================
echo 3. Installing server dependencies
cd ../server
call npm install --legacy-peer-deps

echo ===============================
echo 4. Starting server with pm2
call pm2 delete course-assessment || echo "No existing process found, continuing..."
call pm2 start server.js --name course-assessment

echo ===============================
echo ✅ Deployment Complete!
pause
