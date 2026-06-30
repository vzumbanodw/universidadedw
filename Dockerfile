# =============================================================================
# Universidade Dataweb — imagem de produção (Next.js 15)
# =============================================================================

# ---- Build stage ------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Instala dependências (inclui devDependencies, necessárias para o build)
COPY package*.json ./
RUN npm ci

# Argumentos de build: variáveis NEXT_PUBLIC_* precisam estar disponíveis
# no momento do `next build`, pois são embutidas no bundle do client.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_TELEMETRY_DISABLED=1

# Copia o restante das fontes e gera o build
COPY . .
RUN npm run build

# ---- Production stage -------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=80

# Instala apenas as dependências de produção
COPY package*.json ./
RUN npm ci --omit=dev

# Copia o resultado do build e os arquivos públicos
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js

EXPOSE 80

CMD ["npm", "run", "start"]
