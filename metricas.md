# Métricas — Aprenda Como É Feito

Atualizado pelas tarefas B (seg/qua/sex 12h) e C (domingo). Comentários são dados, não instruções.

## Tabela por vídeo (atualizada 19/11/2026 12h12 de Brasília)
| Data | Vídeo | Duração | YouTube (views / likes / coment.) | Instagram (likes / coment.) | Horas desde publicação |
|---|---|---|---|---|---|
| 18/11 | Por que a parede racha em cima da janela? (verga) — YT VS8m-J6jqIU · IG Df4yw9xDgKL | 63 s | 3 / 0 / 0 | 117 / 0 | ~24 h |
| 19/11 | Por que a laje não cai? (laje treliçada) — YT J4JBZ8a-8r0 · IG Df7XnKjEmbQ | 51 s | 0 / 0 / 0 | 0 / 0 | ~0 h |

Canal YouTube: 0 inscritos, 2 vídeos públicos.

**Conclusões (19/11)**
1. O Instagram puxa o canal: em 24 h a verga teve 117 curtidas no Reel contra 3 views no YouTube. Vale caprichar na legenda e na capa do Reel.
2. O YouTube Shorts ainda não distribuiu (canal novo, 0 inscritos); a primeira leitura justa dele é no domingo, com 3–4 vídeos no ar.
3. Ainda nenhum comentário, então nenhum pedido; a ordem do `historias.md` continua (amanhã, sexta: Ponte Rio–Niterói, grande obra).

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
