# This will run on rPI with Raspian-Buster and node v16.13.1
FROM node:16.13.1-buster-slim

WORKDIR /docker-build

COPY package.json /docker-build/package.json
COPY app.js /docker-build/app.js
COPY app_modules /docker-build/app_modules
COPY assets /docker-build/assets

RUN npm install

CMD node app.js

EXPOSE 3001
