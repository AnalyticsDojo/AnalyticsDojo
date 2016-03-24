FROM nodesource/node:5.5
ADD package.json package.json
RUN npm install
ADD . .

CMD ["node","server/production-start.js"]
EXPOSE 3000
