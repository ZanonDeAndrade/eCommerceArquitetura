# ===== Build =====
FROM node:18-alpine AS build
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma ./prisma
RUN npm run prisma:generate

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
COPY --from=build /usr/src/app/prisma ./prisma

RUN chown -R node:node /usr/src/app
USER node

CMD sh -lc "node --input-type=module -e \"import { Kafka } from 'kafkajs'; const brokers=(process.env.KAFKA_BROKERS||'kafka:29092').split(','); const kafka=new Kafka({clientId:'order-service-seed-waiter', brokers}); const admin=kafka.admin(); let attempt=0; const wait=async()=>{while(attempt<15){try{await admin.connect(); await admin.disconnect(); console.log('Kafka disponível, seguindo...'); return;}catch(err){attempt++; console.log('Kafka indisponível, tentativa', attempt, '-', err?.message||err); await new Promise(r=>setTimeout(r,3000));}} console.error('Kafka não ficou pronto a tempo.'); process.exit(1);}; await wait();\" && npx prisma db push && npm run seed && node dist/index.js"
