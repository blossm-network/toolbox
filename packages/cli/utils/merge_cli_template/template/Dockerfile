FROM node:20-slim
WORKDIR /usr/src/app
COPY package*.yaml package*.json ./
RUN npm install --only=production
COPY . .
CMD ["npm", "start"]