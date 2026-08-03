#!/usr/bin/env bash
# =========================================================
# Aplica em um Keycloak JÁ EM PRODUÇÃO (realm já existente) as mudanças de
# identidade visual/idioma feitas em realm-tetopro-obra.json:
#   - displayName / displayNameHtml (marca no topo do login)
#   - loginTheme / accountTheme (tema "tetopro-obra")
#   - internationalization (pt-BR)
#
# Por quê este script existe: "--import-realm" (usado no boot do container,
# ver docker-compose.keycloak.yml) só importa um realm que AINDA NÃO existe —
# num realm já existente, o import é ignorado silenciosamente. Como o realm
# tetopro-obra já está em produção, essas configurações não chegam sozinhas
# só reiniciando o container.
#
# Este script faz um GET do realm atual e faz PUT de volta só com os campos
# acima sobrescritos — não mexe em clients, usuários, roles ou qualquer outra
# configuração já existente.
#
# Pré-requisito: os arquivos do tema (backend/src/main/resources/keycloak/
# themes/tetopro-obra) já precisam estar no volume montado do container
# (/opt/keycloak/themes/tetopro-obra) ANTES de rodar este script — senão o
# Keycloak vai rejeitar "loginTheme"/"accountTheme" apontando pra um tema
# que ele não enxerga. Ver instruções de deploy no repositório.
#
# Uso:
#   KEYCLOAK_URL=https://auth.tetopro.com \
#   KEYCLOAK_ADMIN_USER=admin \
#   KEYCLOAK_ADMIN_PASSWORD=<senha do admin do Keycloak existente> \
#   ./scripts/atualizar-tema-realm-keycloak.sh
# =========================================================
set -euo pipefail

: "${KEYCLOAK_URL:?defina KEYCLOAK_URL, ex.: https://auth.tetopro.com}"
: "${KEYCLOAK_ADMIN_USER:?defina KEYCLOAK_ADMIN_USER}"
: "${KEYCLOAK_ADMIN_PASSWORD:?defina KEYCLOAK_ADMIN_PASSWORD}"

REALM="tetopro-obra"

echo "Autenticando no realm master de $KEYCLOAK_URL..."
TOKEN=$(curl -sf -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" -d "client_id=admin-cli" \
  -d "username=$KEYCLOAK_ADMIN_USER" -d "password=$KEYCLOAK_ADMIN_PASSWORD" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo "Buscando configuração atual do realm $REALM..."
curl -sf "$KEYCLOAK_URL/admin/realms/$REALM" \
  -H "Authorization: Bearer $TOKEN" \
  -o /tmp/realm-atual.json

echo "Aplicando tema/idioma por cima da configuração atual..."
python3 - "$TOKEN" "$KEYCLOAK_URL" "$REALM" <<'PY'
import json, sys, urllib.request

token, url, realm = sys.argv[1], sys.argv[2], sys.argv[3]

with open("/tmp/realm-atual.json") as f:
    dados = json.load(f)

dados.update({
    "displayName": "TetoPro Obra",
    "displayNameHtml": "Teto<b>Pro</b> Obra",
    "loginTheme": "tetopro-obra",
    "accountTheme": "tetopro-obra",
    "internationalizationEnabled": True,
    "supportedLocales": ["pt-BR"],
    "defaultLocale": "pt-BR",
})

corpo = json.dumps(dados).encode("utf-8")
requisicao = urllib.request.Request(
    f"{url}/admin/realms/{realm}",
    data=corpo,
    method="PUT",
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    },
)
with urllib.request.urlopen(requisicao) as resposta:
    print(f"Realm atualizado (HTTP {resposta.status}).")
PY

echo "Pronto. Abra $KEYCLOAK_URL/realms/$REALM/account/ (ou a tela de login do app) pra conferir."
