FROM node:13

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV production
EXPOSE 3006

CMD ["node", "server/serveV2.mjs"]