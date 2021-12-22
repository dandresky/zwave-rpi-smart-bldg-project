# This will run on rPI with Raspian-Buster and node v16.13.1
FROM node:16

WORKDIR /app

COPY package.json /app/package.json
#COPY app.js /app/app.js
#COPY app_modules /app/app_modules
#COPY assets /app/assets

RUN npm install

COPY . .

CMD node app.js

EXPOSE 3001
