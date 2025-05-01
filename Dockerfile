FROM node:20-alpine

WORKDIR /src

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3010

CMD ["npm","run","start:dev"]