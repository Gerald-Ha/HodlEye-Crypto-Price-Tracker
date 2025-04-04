FROM node:18-alpine

WORKDIR /app

COPY server/package*.json ./server/
COPY server/newsfeed/package*.json ./server/newsfeed/

RUN cd server && npm install && npm install ws && npm install node-fetch@2
RUN cd server/newsfeed && npm install

COPY . /app

EXPOSE 3099 5001

CMD ["sh", "-c", "node server/server.js & node server/newsfeed/server.js"]
