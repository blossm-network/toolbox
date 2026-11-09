FROM node:24.22.1-slim@sha256:be8204d4bd327363357f532187b752ff62759c31bedf98e9e18fc08c9cbd605c
WORKDIR /usr/src/app
COPY package*.yaml package*.json ./
RUN npm install --only=production
COPY . .
CMD ["npm", "start"]