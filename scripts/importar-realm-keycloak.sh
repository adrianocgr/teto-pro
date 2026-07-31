#!/usr/bin/env bash
# =========================================================
# Importa o realm do TetoPro Obra numa instância de Keycloak JÁ EXISTENTE
# e rodando (outro serviço compartilhado) — equivalente, pro Keycloak, ao
# que scripts/bootstrap-postgres.sql e bootstrap-mongo.js fazem pros outros
# bancos. Não recria o container nem usa "--import-realm" (isso só funciona
# ao subir o Keycloak do zero); aqui a importação é feita via API Admin,
# com o Keycloak já no ar.
#
# IMPORTANTE: antes de rodar, troque o secret do client
# "tetopro-obra-backend" dentro de realm-tetopro-obra.json (hoje está com o
# valor de desenvolvimento "tetopro-obra-backend-secret-dev") por um valor
# forte — e configure esse MESMO valor em TETOPRO_OBRA_KEYCLOAK_ADMIN_SECRET
# no Dokploy.
#
# Uso:
#   KEYCLOAK_URL=https://auth.tetopro.com \
#   KEYCLOAK_ADMIN_USER=admin \
#   KEYCLOAK_ADMIN_PASSWORD=<senha do admin do Keycloak existente> \
#   ./scripts/importar-realm-keycloak.sh
# =========================================================
set -euo pipefail

: "${KEYCLOAK_URL:?defina KEYCLOAK_URL, ex.: https://auth.tetopro.com}"
: "${KEYCLOAK_ADMIN_USER:?defina KEYCLOAK_ADMIN_USER}"
: "${KEYCLOAK_ADMIN_PASSWORD:?defina KEYCLOAK_ADMIN_PASSWORD}"

DIRETORIO_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARQUIVO_REALM="$DIRETORIO_SCRIPT/../backend/src/main/resources/keycloak/realm-tetopro-obra.json"

echo "Autenticando no realm master de $KEYCLOAK_URL..."
TOKEN=$(curl -sf -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" -d "client_id=admin-cli" \
  -d "username=$KEYCLOAK_ADMIN_USER" -d "password=$KEYCLOAK_ADMIN_PASSWORD" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo "Importando o realm tetopro-obra..."
STATUS=$(curl -s -o /tmp/resposta-import-realm.json -w "%{http_code}" \
  -X POST "$KEYCLOAK_URL/admin/realms" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary "@$ARQUIVO_REALM")

if [ "$STATUS" = "201" ]; then
  echo "Realm importado com sucesso."
elif [ "$STATUS" = "409" ]; then
  echo "O realm 'tetopro-obra' já existe nesta instância — nada a fazer."
else
  echo "Falha ao importar (HTTP $STATUS):"
  cat /tmp/resposta-import-realm.json
  exit 1
fi
