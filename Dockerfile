FROM node:20-slim AS base

RUN apt-get update && apt-get install -y \
    libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 \
    libpango-1.0-0 libcairo2 libasound2 libxshmfence1 libx11-xcb1 \
    libxcomposite1 libxdamage1 libxrandr2 libatspi2.0-0 libcups2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

RUN npx playwright install chromium --with-deps 2>/dev/null || true

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
