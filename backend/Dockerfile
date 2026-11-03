# Étape 1 : installer uniquement les dépendances nécessaires à l'exécution.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# Étape 2 : image minimale, sans outil de compilation ni secret opérationnel.
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node db ./db
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
