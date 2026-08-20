#!/usr/bin/env bash
# Baixa os posts mais recentes de @ongerenciamento e prepara as imagens
# do carrossel. Rode a partir da raiz do projeto:
#   bash ferramentas/atualizar-instagram.sh
#
# O script apenas BAIXA e PREPARA os arquivos em assets/img/. Os textos
# de cada card continuam sendo editados à mão em assets/app.js, porque
# a legenda do Instagram é longa demais para caber no card.
set -euo pipefail

PERFIL="${1:-ongerenciamento}"
QTD="${2:-6}"
TMP="$(mktemp -d)"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"

echo "Buscando posts de @$PERFIL"
curl -s "https://i.instagram.com/api/v1/users/web_profile_info/?username=$PERFIL" \
  -H "x-ig-app-id: 936619743392459" -H "User-Agent: $UA" -o "$TMP/perfil.json"

python3 - "$TMP" "$QTD" <<'PY'
import json, sys, os, subprocess
tmp, qtd = sys.argv[1], int(sys.argv[2])
d = json.load(open(tmp + "/perfil.json"))
u = d.get("data", {}).get("user")
if not u:
    print("Sem dados. O Instagram pode ter mudado o endpoint ou o perfil está privado.")
    raise SystemExit(1)
edges = u["edge_owner_to_timeline_media"]["edges"]
print(f"@{u['username']}: {len(edges)} posts recebidos, usando os {qtd} primeiros\n")
for i, e in enumerate(edges[:qtd], 1):
    n = e["node"]
    ce = n.get("edge_media_to_caption", {}).get("edges", [])
    cap = (ce[0]["node"]["text"].replace("\n", " ").strip() if ce else "")
    print(f"{i}. https://www.instagram.com/p/{n['shortcode']}/")
    print(f"   {cap[:120]}")
    subprocess.run(["curl","-s","-L","--max-time","30",
                    "-H","User-Agent: Mozilla/5.0","-H","Referer: https://www.instagram.com/",
                    "-o", f"{tmp}/raw-{i:02d}.jpg", n["display_url"]], check=False)
PY

echo
echo "Convertendo para 4:5 e otimizando"
python3 - "$TMP" "$QTD" <<'PY'
from PIL import Image, ImageOps
import sys, os
tmp, qtd = sys.argv[1], int(sys.argv[2])
for i in range(1, qtd + 1):
    src = f"{tmp}/raw-{i:02d}.jpg"
    if not os.path.exists(src) or os.path.getsize(src) < 5000:
        print(f"  obra-{i:02d}: pulado, download falhou"); continue
    im = ImageOps.exif_transpose(Image.open(src).convert("RGB"))
    w, h = im.size; alvo = 4 / 5
    if abs(w / h - alvo) > 0.02:
        nh = int(w / alvo)
        if nh <= h:
            top = int((h - nh) * 0.25); im = im.crop((0, top, w, top + nh))
        else:
            nw = int(h * alvo); left = (w - nw) // 2; im = im.crop((left, 0, left + nw, h))
    im = im.resize((900, 1125), Image.LANCZOS)
    out = f"assets/img/obra-{i:02d}.jpg"
    im.save(out, "JPEG", quality=80, optimize=True, progressive=True)
    print(f"  {out}  {os.path.getsize(out)//1024} KB")
PY

rm -rf "$TMP"
echo
echo "Pronto. Ajuste os titulos e links em assets/app.js e faca commit."
