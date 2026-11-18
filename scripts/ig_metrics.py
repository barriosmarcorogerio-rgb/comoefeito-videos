"""Métricas e comentários do Instagram @aprendacomoefeitobr direto pela Graph API (sem Make).
uso: python3 scripts/ig_metrics.py  -> JSON {"instagram": [...posts com likes/comentários...], "instagram_comentarios": [...]}"""
import json, urllib.request, urllib.parse
IG = "17841453298372274"; API = "https://graph.facebook.com/v21.0"
q = urllib.parse.urlencode({"fields": "id,caption,timestamp,permalink,like_count,comments_count,comments.limit(25){text,username,timestamp,like_count}", "limit": 25})
d = json.load(urllib.request.urlopen(f"{API}/{IG}/media?{q}", timeout=120))
posts, coms = [], []
for m in d.get("data", []):
    for c in (m.pop("comments", {}) or {}).get("data", []): coms.append({"media_id": m["id"], **c})
    posts.append(m)
print(json.dumps({"instagram": posts, "instagram_comentarios": coms}, ensure_ascii=False, indent=1))
