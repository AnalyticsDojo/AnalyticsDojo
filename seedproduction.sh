cp .env sandbox.env
cp production.env .env
rm .seed/challenges/.DS_Store
npm run-script only-once
cp sandbox.env .env
NODE_ENV=production gulp build -p

