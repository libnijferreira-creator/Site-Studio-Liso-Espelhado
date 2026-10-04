# Studio Liso Espelhado — imagem de produção
# Node 24 (o projeto usa node:sqlite, nativo do Node 22+)
FROM node:24-slim AS build

WORKDIR /app

# Endereço público usado pelo metadataBase durante a pré-renderização.
# Composto a partir de build.args em docker-compose.yml.
ARG SITE_URL
ENV SITE_URL=${SITE_URL}

ENV NEXT_TELEMETRY_DISABLED=1

# Dependências primeiro (cache de camada)
COPY package.json package-lock.json ./
RUN npm ci

# Código e build
COPY . .
RUN npm run build \
 && npm prune --omit=dev

# ------------------------------- imagem final -------------------------------
FROM node:24-slim

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=build /app ./

# data/ (SQLite) e public/uploads ficam em volumes — sobrevivem ao rebuild
VOLUME ["/app/data", "/app/public/uploads"]

EXPOSE 3000

CMD ["npm", "start"]
