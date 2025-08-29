#!/bin/bash

echo "Start build React"
cd OutcomeView
npm install --legacy-peer-deps
npm run build

echo "Starting server with pm2"
cd ../server
npm install --legacy-peer-deps
pm2 delete course-assessment 2>/dev/null
pm2 start server.js --name course-assessment

echo "Deployment Complete. Server is running."
pm2 save