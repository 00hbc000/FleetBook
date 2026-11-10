# Dépendances de compilation et de migration ; aucune valeur réelle dans l'image.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Image temporaire pour créer les tables via Drizzle.
FROM deps AS tooling
COPY drizzle.config.ts tsconfig.json ./
COPY src/db ./src/db
CMD ["npx", "drizzle-kit", "push", "--force"]

FROM deps AS builder
COPY . .
# Valeurs factices uniquement pendant la compilation, absentes de l'image finale.
RUN DATABASE_URL=postgresql://fake:fake@127.0.0.1:5432/fake \
    JWT_SECRET=FAKE_JWT_SECRET_BUILD_ONLY_32_CHARACTERS \
    NEXT_TELEMETRY_DISABLED=1 npm run build

FROM node:22-alpine AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
