FROM node:24.22.1-slim
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile
COPY . .
CMD ["npm", "start"]
