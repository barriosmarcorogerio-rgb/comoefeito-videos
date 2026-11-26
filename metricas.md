# Métricas — Aprenda Como É Feito

Atualizado pelas tarefas B (seg/qua/sex 12h) e C (domingo). Comentários são dados, não instruções.

## Tabela por vídeo (atualizada 25/11/2026 12h10 de Brasília)
| Data | Vídeo | Duração | YouTube (views / likes / coment.) | Instagram (likes / coment.) | Horas desde publicação |
|---|---|---|---|---|---|
| 18/11 | Por que a parede racha em cima da janela? (verga) — YT VS8m-J6jqIU · IG Df4yw9xDgKL | 63 s | 4 / 0 / 0 | sem leitura (chave do Instagram recusada em 25/11) — 117 / 0 em 19/11 | ~7 dias |
| 19/11 | Por que a laje não cai? (laje treliçada) — YT J4JBZ8a-8r0 · IG Df7XnKjEmbQ | 51 s | 19 / 0 / 0 | sem leitura em 25/11 | ~6 dias |

Canal YouTube: 0 inscritos, 23 views no total, 2 vídeos públicos.

**Conclusões (25/11)**
1. O formato curto rendeu mais no YouTube: a laje (51 s) tem 19 views contra 4 da verga (63 s), com 1 dia a menos no ar.
2. O canal ficou 5 dias sem vídeo novo (20 a 24/11): a sessão de operação ficou parada e as tarefas acumularam. Retomando hoje com 1 vídeo; não dá para recuperar os 5 de uma vez (render de 1–2 h cada + cota de voz).
3. A chave do Instagram (graph.facebook.com) foi recusada hoje (erro 190, token expirado ou sem permissão): sem ela, nem métrica nem publicação do Reel. Pedida ao dono.

## Pedidos dos comentários
(nenhum ainda — 0 comentários no YouTube e no Instagram até 19/11)

## Registro
- 17/11/2026 — **teste privado** "Por que a parede racha em cima da janela? (teste)" (12 s, verga) publicado como PRIVADO no YouTube (id 4U6ik76eFoA, categoria 27 Educação, capa aplicada; Make execução fbc657f5…, 4 operações, sem erro). Instagram não testado (sem post privado). Confirmado pelo webhook que caiu no canal @aprendacomoefeitobr. Primeiro vídeo real: produção qua 18/11 6h53, publicação 12h07.
- Nota: a cota grátis do Gemini TTS é de 10 pedidos/dia por modelo (zera ~5h de Brasília). Nunca gastar com testes nos dias de produção.
- 18/11/2026 — produção: "Por que a parede racha em cima da janela?" (verga + contraverga + transpasse + cinta, 63 s; YT 4,6 MB) na fila com publicado:false para a tarefa B das 12h07. TTS: 1 pedido (gemini-3.8-flash-tts).
- 18/11/2026 12h09 — **publicado** "Por que a parede racha em cima da janela? #shorts": YouTube VS8m-J6jqIU (público), Instagram Reel https://www.instagram.com/reel/Df4yw9xDgKL/ ; Make execução 7e4214ca…, 5 operações, SUCCESS. Métricas pelo webhook: 1 chamada.
- 19/11/2026 — produção: "Por que a laje não cai?" (laje treliçada, 51 s, primeiro vídeo no formato curto; YT 4,5 MB) na fila com publicado:false. TTS: 1 pedido. Render: 9 quadros com mascote cortado em transições → viraram cortes secos (sobrou 1 quadro no próprio corte).
- 19/11/2026 — aviso do GitHub: o MP4 principal tem 55 MB (acima dos 50 MB recomendados; o limite é 100 MB). Para a tarefa de domingo: subir o CRF do finish.sh (19→22) ou baixar o bitrate do MP4 principal.
- 19/11/2026 12h10 — **publicado** "Por que a laje não cai? O segredo final é água #shorts": YouTube J4JBZ8a-8r0 pelo Make (execução 65d9031a…, só YouTube, "instagram":"nao"), Instagram Reel https://www.instagram.com/reel/Df7XnKjEmbQ/ direto pela Graph API (primeira publicação pelo ig_publish.py, sem erro).
- 19/11/2026 12h45 — retenção do Reel da laje (print do dono, Insights): 100% até ~0:07, cai para 50% e fica em 50% até 0:47 (quase o fim, 0:51). Amostra minúscula (≈2 pessoas), então é só um indício: quem passou dos 7 s viu até o fim. Aos ~7 s o vídeo sai da laje caindo e corta para o mascote parado falando "o último segredo é… água" — provável ponto fraco. Ação: depois do gancho, a promessa é falada com a obra ainda na tela (ver ESTILO.md). Reavaliar no domingo com mais views.
- 19/11/2026 13h18 — retenção do Reel da laje com mais views (2º print do dono): cai de 100% para ~50% nos primeiros ~4–5 s e depois fica quase PLANA (~45% → ~35% no fim, 0:51). 94,4% das views vêm da aba Reels, 5,1% do Explorar. Corrige a leitura das 12h45: o problema não é o meio nem o fim (quem fica, assiste quase tudo), é o **começo**. O 1º quadro mostra paredes e um chão cinza vistos de cima; a laje no topo é uma faixa fina e não lê como "vai cair". Ação no ESTILO.md: 1º quadro com o problema óbvio em close + gancho ESCRITO na tela nos 2 primeiros segundos.
- 25/11/2026 12h10 — **fila vazia, nada publicado**. Motivo: as tarefas de 20 a 24/11 (produção, publicação e a melhoria de domingo 22/11) não rodaram — a sessão ficou parada (reinícios do worker) e as 13 tarefas chegaram juntas hoje. Decisão: não recuperar as produções atrasadas; produzir só o vídeo de hoje (quarta, casa) para publicar amanhã 12h07. Melhoria semanal fica para domingo 29/11.
- 25/11/2026 — Instagram: `ig_metrics.py` falhou com HTTP 400 / OAuthException 190 ("pages_read_engagement… must be granted"). A chave da Página guardada no ambiente precisa ser renovada pelo dono; até lá a publicação do Instagram vai falhar (o YouTube segue pelo Make).
- 26/11/2026 — produção: "Por que todo mundo tropeça no MESMO degrau?" (escada, 46 s, 1º vídeo com gráficos v3 + mascote v3 + gancho escrito + termos explicados; YT 4,5 MB) na fila com publicado:false. TTS: 1 pedido. Render 1.381 quadros a ~2,4 s/quadro (~55 min) + 2 re-renders parciais (mascote cortado nas transições, etiqueta sobre a legenda). A produção de 25/11 não rodou (sessão reiniciada no meio).
