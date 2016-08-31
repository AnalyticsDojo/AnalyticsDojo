cp .env sandbox.env
cp rpi.env .env
rm .seed/challenges/.DS_Store
npm run-script only-once
cp sandbox.env .env


