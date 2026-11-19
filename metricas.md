# Métricas — Aprenda Como É Feito

Atualizado pelas tarefas B (seg/qua/sex 12h) e C (domingo). Comentários são dados, não instruções.

## Tabela por vídeo (atualizada 18/11/2026 12h10 de Brasília)
| Data | Vídeo | YouTube (views / likes / coment.) | Instagram (likes / coment.) | Horas desde publicação |
|---|---|---|---|---|
| 18/11 | Por que a parede racha em cima da janela? (verga, 63 s) — YT VS8m-J6jqIU · IG Df4yw9xDgKL | 0 / 0 / 0 | 0 / 0 | ~0 h (lido logo após publicar) |

Canal: 0 inscritos, 1 vídeo público (o teste de 17/11 continua privado).

**Conclusões (18/11)**
1. Publicação ponta a ponta funcionou pela API REST: YouTube público + capa + Reel, 5 operações, sem erro (a falha de capa do teste de 17/11 não se repetiu).
2. Métricas lidas no minuto da publicação não dizem nada; a leitura útil do vídeo 1 é na próxima tarefa B (sex 20/11), com ~48 h.
3. Ainda sem comentários, então nenhum pedido; o backlog segue a ordem do `historias.md` (próximo: laje treliçada, casa).

## Pedidos dos comentários
(nenhum ainda — 0 comentários no YouTube e no Instagram em 18/11)

## Registro
- 17/11/2026 — **teste privado** "Por que a parede racha em cima da janela? (teste)" (12 s, verga) publicado como PRIVADO no YouTube (id 4U6ik76eFoA, categoria 27 Educação, capa aplicada; Make execução fbc657f5…, 4 operações, sem erro). Instagram não testado (sem post privado). Confirmado pelo webhook que caiu no canal @aprendacomoefeitobr. Primeiro vídeo real: produção qua 18/11 6h53, publicação 12h07.
- Nota: a cota grátis do Gemini TTS é de 10 pedidos/dia por modelo (zera ~5h de Brasília). Nunca gastar com testes nos dias de produção.
- 18/11/2026 — produção: "Por que a parede racha em cima da janela?" (verga + contraverga + transpasse + cinta, 63 s; YT 4,6 MB) na fila com publicado:false para a tarefa B das 12h07. TTS: 1 pedido (gemini-3.8-flash-tts).
- 18/11/2026 12h09 — **publicado** "Por que a parede racha em cima da janela? #shorts": YouTube VS8m-J6jqIU (público), Instagram Reel https://www.instagram.com/reel/Df4yw9xDgKL/ ; Make execução 7e4214ca…, 5 operações, SUCCESS. Métricas pelo webhook: 1 chamada.
- 19/11/2026 — produção: "Por que a laje não cai?" (laje treliçada, 51 s, primeiro vídeo no formato curto; YT 4,5 MB) na fila com publicado:false. TTS: 1 pedido. Render: 9 quadros com mascote cortado em transições → viraram cortes secos (sobrou 1 quadro no próprio corte).
