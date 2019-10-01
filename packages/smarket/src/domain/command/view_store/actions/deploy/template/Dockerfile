FROM node:10
WORKDIR /usr/src/app

COPY package*.yaml package*.json ./

ARG convertPackage=true;

RUN if [ "$convertPackage" = "true" ]; then npm install -g any-json && any-json package.yaml package.json; fi

RUN npm install --only=production

COPY . .

EXPOSE 3000

CMD [ "npm", "start" ]