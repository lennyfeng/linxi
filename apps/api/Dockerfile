FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY src/ ./src/

EXPOSE 3100

CMD ["npx", "tsx", "src/main.ts"]
