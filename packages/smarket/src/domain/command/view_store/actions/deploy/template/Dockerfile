FROM node:10
WORKDIR /usr/src/app

COPY package*.yaml package*.json ./

ARG convertPackage=true;

RUN npm install --only=production

COPY . .

EXPOSE 3000

CMD [ "npm", "start" ]