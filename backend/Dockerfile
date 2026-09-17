# syntax=docker/dockerfile:1
#
# Image du backend (Express + Prisma). Process persistant : les tâches
# node-cron (emails J+1, remise à zéro de minuit, purges RGPD) tournent dans
# le même process, ce qu'un hébergement serverless ne permettrait pas.

FROM node:22-slim AS build
WORKDIR /app

# OpenSSL est requis par les moteurs Prisma.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Manifests + schéma d'abord (postinstall = `prisma generate` a besoin
# du schéma) → meilleure mise en cache des layers.
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# Toutes les dépendances : le CLI `prisma` (devDependency) sert à
# `prisma migrate deploy` avant le démarrage. Le postinstall lance prisma generate.
RUN npm ci

# Code source puis build (prisma generate && tsc → dist/).
COPY . .
RUN npm run build

ENV NODE_ENV=production
# L'hébergeur peut imposer le port via la variable PORT (4000 par défaut).
EXPOSE 4000

CMD ["node", "dist/server.js"]
