FROM node:24-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src

EXPOSE 6380 6381
CMD ["node", "src/index.js"]
