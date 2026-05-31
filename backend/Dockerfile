# syntax=docker/dockerfile:1
#
# Image backend Plarya (Express + Prisma). Portable : Railway, Render,
# Fly.io, etc. Process long-running → les crons node-cron in-process
# (emails J+1, reset minuit, cleanup RGPD) tournent nativement, contrai-
# rement à un hébergement serverless. cf. docs/deploiement.md.

FROM node:22-slim AS build
WORKDIR /app

# OpenSSL est requis par les moteurs Prisma.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Manifests + schéma d'abord (postinstall = `prisma generate` a besoin
# du schéma) → meilleure mise en cache des layers.
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# `npm ci` installe TOUTES les deps (le CLI `prisma`, devDependency, est
# nécessaire pour `prisma migrate deploy` au pre-deploy) et déclenche le
# postinstall (prisma generate).
RUN npm ci

# Code source puis build (prisma generate && tsc → dist/).
COPY . .
RUN npm run build

ENV NODE_ENV=production
# Railway/Render injectent PORT ; le serveur lit process.env.PORT.
EXPOSE 4000

CMD ["node", "dist/server.js"]
