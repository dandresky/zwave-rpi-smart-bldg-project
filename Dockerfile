FROM arm32v7/node:17.4-buster
WORKDIR /zwave-app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 3001
CMD ["node", "app.js"]
