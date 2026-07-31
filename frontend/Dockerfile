# ---------- build ----------
# node:20-slim (Debian), não node:20-alpine: a resolução de DNS da musl libc
# da Alpine já causou "npm error code E401 ... Sonatype Nexus Repository
# Manager" nesta VPS em outro projeto — o npm acaba resolvendo o registro
# pra um proxy Nexus interno em vez do registro público. Ver também
# frontend/.npmrc, que força explicitamente o registro público.
FROM node:20-slim AS build
WORKDIR /build

# Variáveis VITE_* são embutidas no bundle em tempo de BUILD (não em runtime) —
# por isso viram build args aqui, com o valor que o NAVEGADOR vai usar
# (endereços públicos, não os nomes de serviço da rede interna do compose).
ARG VITE_API_URL=http://localhost:8080
ARG VITE_KEYCLOAK_URL=http://localhost:8081
ARG VITE_KEYCLOAK_REALM=tetopro-obra
ARG VITE_KEYCLOAK_CLIENT_ID=tetopro-obra-frontend

COPY package.json package-lock.json* .npmrc ./
RUN npm install

COPY . .
RUN printf "VITE_API_URL=%s\nVITE_KEYCLOAK_URL=%s\nVITE_KEYCLOAK_REALM=%s\nVITE_KEYCLOAK_CLIENT_ID=%s\n" \
    "$VITE_API_URL" "$VITE_KEYCLOAK_URL" "$VITE_KEYCLOAK_REALM" "$VITE_KEYCLOAK_CLIENT_ID" > .env.production
RUN npm run build

# ---------- runtime ----------
FROM nginx:1.27-alpine
COPY --from=build /build/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
