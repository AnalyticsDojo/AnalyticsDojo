cp .env sandbox.env
cp production.env .env
find  ./seed/challenges/ -name ".DS_Store" -delete
npm run-script only-once
cp sandbox.env .env

