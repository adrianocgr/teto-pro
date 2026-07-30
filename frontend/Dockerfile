# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /build

# Variáveis VITE_* são embutidas no bundle em tempo de BUILD (não em runtime) —
# por isso viram build args aqui, com o valor que o NAVEGADOR vai usar
# (endereços públicos, não os nomes de serviço da rede interna do compose).
ARG VITE_API_URL=http://localhost:8080
ARG VITE_KEYCLOAK_URL=http://localhost:8081
ARG VITE_KEYCLOAK_REALM=tetopro-obra
ARG VITE_KEYCLOAK_CLIENT_ID=tetopro-obra-frontend

COPY package.json package-lock.json* ./
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
