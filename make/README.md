# Make — cenários compartilhados com o Juro Que É Verdade

O plano grátis do Make permite só 2 cenários ativos, então os dois canais usam os MESMOS 2 cenários,
com um roteador por canal (decisão do dono, 17/11/2026). O Juro Que É Verdade continua chamando do
mesmo jeito de antes (sem o campo `canal`) e cai na rota dele.

| Cenário | ID | Como chamar para ESTE canal |
|---|---|---|
| Publicar YouTube + Instagram | **7068350** | `scenarios_run` (ou POST `https://us2.make.com/api/v2/scenarios/7068350/run`) com `"canal":"aprenda"` + video_url, yt_url, thumb_url, cover_ms, title, description, caption, yt_privacy, instagram |
| Métricas + comentários | **7070590** (webhook 3074458) | `curl -sS -m 180 -X POST https://hook.us2.make.com/eyu8l7uumr8uiv2yyp6lrjir03vhyn6e -H 'Content-Type: application/json' -d '{"canal":"aprenda"}'` |

Resposta das métricas (canal=aprenda): `canal` (dados do canal), `youtube` (últimos 15 vídeos com statistics),
`youtube_comentarios` (últimos 50 comentários do canal), `instagram` (últimos 15 posts: likes, comments_count),
`instagram_comentarios` (até 20 comentários de cada post que tem comentário).

Conexões deste canal: YouTube 12385890 (canal "Aprenda como é Feito!", UCEh6WeZZykXawxv24uqVB6w, @aprendacomoefeitobr),
Facebook/Instagram 12385898, conta IG 17841453298372274 (@aprendacomoefeitobr). Categoria YouTube 27 (Educação).

**Cuidados**
- NUNCA mexer na rota do Juro Que É Verdade. Cópia dos cenários originais em `backup/` (para desfazer).
- Plano grátis: ~1.000 créditos/mês para os DOIS canais. Uma métrica deste canal gasta ~10–25 operações; uma publicação ~5. Não chamar à toa.
- Se o run der erro de rede, ANTES de repetir confira `executions_list` do 7068350 (não publicar 2 vezes).
