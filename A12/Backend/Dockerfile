FROM node:lts

WORKDIR /usr/src/app

COPY src/ .

RUN npm install

EXPOSE 8080

CMD ["node", "server.js"]
