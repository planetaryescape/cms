FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lock* ./
COPY turbo.json ./
COPY biome.json ./
COPY tsconfig.json ./

COPY client ./client
COPY server ./server
COPY shared ./shared

RUN bun install

RUN bun run build:single

EXPOSE 3000

CMD ["bun", "run", "start:single"]
