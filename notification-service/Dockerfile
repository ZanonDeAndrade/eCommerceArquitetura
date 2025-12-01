# ===== Build =====
FROM node:18-alpine AS build
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev

# ===== Runtime =====
FROM node:18-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package*.json ./

RUN chown -R node:node /usr/src/app
USER node

CMD ["node", "dist/index.js"]
