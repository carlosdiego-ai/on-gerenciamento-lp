#!/usr/bin/env bash
# Injeta ?v=<hash do conteudo> nas referencias de CSS e JS no index.html.
#
# Por que isso existe: os assets sao servidos com cache de um ano e
# "immutable", o que da o melhor desempenho possivel. So que o nome dos
# arquivos e fixo, entao sem o parametro de versao o navegador ficaria
# presoem uma versao antiga para sempre. Com o hash na URL, qualquer
# mudanca de conteudo vira uma URL nova e o navegador busca de novo.
#
# Rode antes de cada deploy:
#   bash ferramentas/versionar-assets.sh
set -euo pipefail
cd "$(dirname "$0")/.."

hash_de() { md5 -q "$1" 2>/dev/null || md5sum "$1" | cut -d' ' -f1; }

CSS=$(hash_de assets/styles.css | cut -c1-8)
JS=$(hash_de assets/app.js | cut -c1-8)

python3 - "$CSS" "$JS" <<'PY'
import re, sys
css, js = sys.argv[1], sys.argv[2]
p = "index.html"
s = open(p).read()
antes = s
s = re.sub(r'href="assets/styles\.css(\?v=[a-f0-9]+)?"', f'href="assets/styles.css?v={css}"', s)
s = re.sub(r'src="assets/app\.js(\?v=[a-f0-9]+)?"',      f'src="assets/app.js?v={js}"', s)
open(p, "w").write(s)
print(f"  styles.css -> ?v={css}")
print(f"  app.js     -> ?v={js}")
print("  index.html " + ("atualizado" if s != antes else "ja estava atualizado"))
PY
