"""Publica um Reel no Instagram @aprendacomoefeitobr direto pela Graph API (sem Make).
A chave da Página fica no ambiente da nuvem: o proxy injeta o header Authorization em graph.facebook.com.
uso: python3 scripts/ig_publish.py VIDEO_URL "LEGENDA" COVER_MS [--so-preparar]
- VIDEO_URL: link público do MP4 (raw.githubusercontent.com/...); COVER_MS: milissegundo do quadro da capa.
- --so-preparar: cria e processa o container mas NÃO publica (para testes).
Imprime JSON com id do post e permalink. Sai com erro (código 1) se falhar; não tenta publicar duas vezes."""
import sys, json, time, urllib.request, urllib.parse, urllib.error
IG = "17841453298372274"; API = "https://graph.facebook.com/v21.0"
def call(method, path, params=None):
    data = urllib.parse.urlencode(params or {}).encode() if method == "POST" else None
    url = f"{API}/{path}" + ("?" + urllib.parse.urlencode(params) if method == "GET" and params else "")
    req = urllib.request.Request(url, data=data, method=method)
    try: return json.load(urllib.request.urlopen(req, timeout=120))
    except urllib.error.HTTPError as e: sys.exit(f"ERRO {e.code} em {path}: {e.read().decode(errors='ignore')[:400]}")
video, caption, cover = sys.argv[1], sys.argv[2], int(float(sys.argv[3]))
only_prepare = "--so-preparar" in sys.argv
c = call("POST", f"{IG}/media", {"media_type": "REELS", "video_url": video, "caption": caption, "share_to_feed": "true", "thumb_offset": cover})
cid = c["id"]; print("container", cid, flush=True)
for i in range(60):                                   # até ~10 min de processamento
    st = call("GET", cid, {"fields": "status_code,status"})
    print("status", st.get("status_code"), flush=True)
    if st.get("status_code") == "FINISHED": break
    if st.get("status_code") in ("ERROR", "EXPIRED"): sys.exit(f"ERRO no processamento: {json.dumps(st)}")
    time.sleep(10)
else: sys.exit("ERRO: processamento não terminou em 10 min (container " + cid + ")")
if only_prepare: print(json.dumps({"preparado": cid})); sys.exit(0)
p = call("POST", f"{IG}/media_publish", {"creation_id": cid})
info = call("GET", p["id"], {"fields": "permalink,timestamp"})
print(json.dumps({"id": p["id"], "permalink": info.get("permalink"), "timestamp": info.get("timestamp")}))
