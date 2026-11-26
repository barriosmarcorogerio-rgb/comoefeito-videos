# Pipeline — "Aprenda Como É Feito" (@aprendacomoefeitobr)

YouTube Shorts + Instagram Reels, **TODO DIA** (desde 19/11/2026, decisão do dono), 35–50 s (máx. 55 s), vertical 1080x1920, português do Brasil.
LEIA ANTES: `ESTILO.md` (roteiro em corrente, visual, legenda, capa, APRENDIZADOS — obrigatórios), `historias.md` (backlog com números conferidos) e `make/README.md` (cenários do Make).
**Prioridade:** se o texto de uma tarefa agendada divergir deste arquivo ou do ESTILO.md (ex.: "60–90 s", "seg/qua/sex", "instagram sim"), valem ESTE arquivo e o ESTILO.md — eles têm as decisões mais novas do dono.
O dono pediu tudo 100% automático: **não pedir nada ao dono**; decidir, conferir e registrar.

Recursos compartilhados com o canal "Juro Que É Verdade" (mesma conta Claude, mesmo Make, mesma chave Google):
- **Make grátis**: 2 cenários (publicar 7068350 e métricas 7070590) com rota por canal — SEMPRE mandar `"canal":"aprenda"`. Nunca editar a rota do Juro.
- **Gemini TTS grátis**: 10 pedidos/dia POR MODELO (zera ~meia-noite do Pacífico). Gerar a voz UMA vez por vídeo; testar roteiro antes.
- **Limite do Claude**: produzir só o necessário; nada de renders repetidos sem motivo.

## Agendamento (desde 26/11/2026, "igual ao Juro Que É Verdade": 2 vídeos por dia, 100% autônomo)
As tarefas A, B, B2 e C disparam na sessão fixa **"Aprenda Como É Feito - operação automática"** (session_01KB6dFd6n4bqim71JseT5bt), que tem o repositório e pode dar push. (Tarefas que abrem sessão nova a cada disparo NÃO têm o repositório — não usar.)
- A — produção: **todo dia 2h37** (madrugada), **2 vídeos por disparo** (trig_017dhzL38Bzh11UASTtnZM5F)
- B — publicação + métricas + comentários: **todo dia 12h07** (trig_01C5FBFZVpFcKPFWHzmx5SjZ)
- B2 — publicação da noite (sem métricas): **todo dia 19h37** (trig_01AaMo8tQ41T4CWwSCTCRqPB)
- V — vigia: **todo dia 9h13** na sessão de configuração (session_01KB6dFe4wDJK4gqvbKW4MiZ, trig_01FzTzW84hkLWUqTyaHHutyo): se a madrugada não produziu nada e a fila tem < 2 vídeos, ele mesmo produz 1 (a sessão de operação já travou de 20 a 24/11)
- C — melhoria semanal: domingo **16h41** (trig_01AnUDvYDyf7vim8cti1RRPT)
Outros projetos na mesma conta: Juro (produção 1h07, publicações 11h47 e 18h50, domingo 15h23), série 7 DIAS/Nesta Cidade (1h17, 12h e 19h), Lucro no Volante.
Make (grátis, ~1.000 operações/mês para todos): cada publicação deste canal ≈ 4 operações (só YouTube) e a métrica ≈ 5 → ~400/mês. Se o Make avisar falta de operações, registrar em metricas.md e publicar só o Instagram até virar o mês.

## Tarefa A — Produção (todo dia 2h37, horário de Brasília — 2 VÍDEOS por disparo)
0. **Quantos fazer**: se `fila.json` já tiver 4 ou mais itens com publicado:false, faça só 1 vídeo; senão faça **2 vídeos, um depois do outro** (commit + push depois de CADA um, para não perder nada se a sessão reiniciar). Se houver projeto pela metade em `projetos/` (sem item na fila), termine ele primeiro.
1. `git pull`. Ler `historias.md`: pegar a próxima obra da seção "Próximos" respeitando a mistura: **em cada madrugada, o 1º vídeo é de casa; o 2º é grande obra nas madrugadas de segunda, quarta e sexta e casa nos outros dias** (≈ 10 casa : 4 grandes obras por semana). O texto da tarefa agendada pode citar regras antigas: vale ESTA. Pedidos frequentes nos comentários (anotados em `metricas.md`) passam na frente.
2. **Conferir os números na web** (WebSearch; fontes: norma/ABNT citada, órgão público, fabricante, universidade, Marinha/Itaipu etc.). Só usar ✅; número divergente fica fora ou vai arredondado com "cerca de". Anotar fontes no item.
3. **Roteiro** no formato do `ESTILO.md`: 1ª FRASE = GANCHO (≤ 10 palavras, prende sozinha e aparece escrita inteira na tela com `OV.hook`; `work/hook.json` com o fim dela) + visual com a coisa dando errado + promessa → 4–5 elos problema → solução → "Essa é a NOME." (conectores variados: no máx. 2 "Mas" e 2 "Então você" no vídeo); todo nome técnico vem com o que é em palavras simples, falado e escrito embaixo do nome (`OV.name(nome, a, 0.2, 'o que é')`) (no máx. 1 "É por isso que…") → 1 frase final que cumpre a promessa (loop). **100–140 palavras, 35–50 s**. Sem "Parabéns" e sem CTA falado (o CTA é só escrito na tela). Antes de gerar a voz, cortar todo elo que não for visual/surpreendente.
4. **Projeto**: `cp -r template projetos/AAAA-MM-DD-slug && cd projetos/AAAA-MM-DD-slug`; salvar `script.txt` (uma frase por linha) e `work/nomes.json` (lista dos nomes técnicos que ficam amarelos na legenda, ex.: `["verga","contraverga"]`).
5. **Voz**: `python3 -u gemini_tts.py script.txt voice.wav` (Iapetus). Depois `pip install -q faster-whisper` (se faltar) e `HF_HUB_DISABLE_XET=1 python3 -I words.py voice.wav script.txt work/words.json && cp work/words.json web/words.json`. Se o TTS falhar por cota diária nos 3 modelos: registrar em `metricas.md`, NÃO publicar nada novo e encerrar (a fila cobre o dia, se houver).
6. **Cena** (`web/story.js`): usar o kit (`web/kit.js`: neighborhood, brickWall, box/cyl/rod, mascot com poses, arrow, crack/crackPath, particles, camAt, overlay label/name/cta/confetti). Exemplo completo: o `story.js` do template (parede + verga). Tempos SEMPRE por `cue('palavra', n)` da narração. Peças entram em camadas (caem, deslizam, encaixam), cortes/transparências mostram o interior, mascote reage a cada problema, etiquetas "• NÚMERO/COISA", nome técnico em amarelo (`OV.name`) quando falado, setas vermelhas = peso/problema, verdes = solução, gotas azuis = água. Final: `OV.confetti` + `OV.cta('QUAL A PRÓXIMA? 👇')` nos últimos ~1,5 s, sem narração. Cortes a cada 1–1,5 s; quadro 0 já com ação.
7. **Prévia obrigatória**: `node render.mjs stills/a all 30` + `python3 sheet.py stills/a stills/sheet.jpg 8` e OLHAR (Read) a folha. Conferir os Aprendizados do ESTILO.md: objeto reconhecível em 1 s, nada atravessando nada, mascote inteiro na tela, etiqueta legível e dentro da tela, arquitetura coerente. Corrigir e repetir até ficar limpo (máx. 3 voltas).
8. **Render**: `node render.mjs frames all 2>&1 | tee work/render.log` e depois `grep -c AVISO work/render.log` — se houver avisos de mascote cortado, corrigir a câmera daqueles quadros e renderizar só eles de novo. Comando: `node render.mjs frames all` (gráficos v3 desde 19/11 — supersampling 1,25×, oclusão de ambiente, brilho, cor: bairro ~3–4 s/quadro, cidade ~5–6 s/quadro; 50 s = 1.500 quadros ≈ 75–140 min). Se a cena passar de 6 s/quadro, pôr `window.SS = 1;` na 1ª linha do story.js (perde um pouco de nitidez, ganha ~30%). Renderizar em segundo plano e acompanhar até o fim. Para retomar: `RESUME=1 node render.mjs frames all`. Nunca encerrar com render rodando.
9. **Som**: escrever `work/cues.json` (`dur` = TOTAL/30, `music_end` = fim do vídeo, efeitos: pop/tick nas peças, thud em peça pesada, crack na trinca, drop em gota, whoosh em troca de cena, ding no nome técnico) → `python3 audio.py && python3 mix.py voice.wav music.wav sfx.wav`.
10. **Legenda + MP4**: `python3 captions.py && bash finish.sh AAAA-MM-DD-slug`. Olhar `out/qa_sheet.jpg` (Read). Conferir `out/*-yt.mp4` < 5 MB.
11. **Capa**: escolher quadro com a obra montada/problema visual + mascote; `python3 thumb.py frames/fNNNN.jpg "2-3 PALAVRAS" ../../videos/AAAA-MM-DD-slug-thumb.jpg`; `cover_ms` = NNNN/30*1000.
12. Copiar `out/AAAA-MM-DD-slug.mp4` e `out/AAAA-MM-DD-slug-yt.mp4` para `videos/`. Acrescentar em `fila.json`: `{data, slug, titulo, descricao, legenda_instagram, video, video_yt, thumb, cover_ms, publicado:false}`.
    Título YouTube ≤ 70 caracteres, curioso, terminando em `#shorts` (ex.: "Por que a parede racha em cima da janela? #shorts"). Descrição: 2 linhas + 3–5 hashtags (#engenharia #construcao #obra #comoefeito). Legenda Instagram: gancho + 1 linha + "Qual eu construo agora? 👇" + hashtags.
13. Atualizar `historias.md` (mover para "Já publicados" com a data prevista). Apagar `frames/`, `frames_cap/`, `stills/`, `*.wav` do projeto. `git add -A && git commit` (com as linhas de atribuição) `&& git push`.

## Tarefa B — Publicação + métricas + comentários (todo dia 12h07; a B2 das 19h37 faz os passos 1–4 e 6, sem métricas)
1. `git pull`. Pegar em `fila.json` o item mais antigo com `publicado:false`. Se não houver, pular para o passo 4 e registrar "fila vazia" em `metricas.md`.
2. **YouTube** (Make, cenário **7068350**, só o YouTube) pela API REST com curl (as tarefas agendadas NÃO têm as ferramentas MCP do Make; o token vai injetado pelo ambiente), `responsive:true` e data
   `{"canal":"aprenda", "video_url": RAW+video, "yt_url": RAW+video_yt, "thumb_url": RAW+thumb, "cover_ms":…, "title":…, "description":…, "caption": legenda_instagram, "yt_privacy":"public", "instagram":"nao"}`
   onde RAW = `https://raw.githubusercontent.com/barriosmarcorogerio-rgb/comoefeito-videos/main/`. **instagram SEMPRE "nao"** (o Instagram agora é direto, passo 3).
   Chamada: `curl -sS -m 600 -X POST https://us2.make.com/api/v2/scenarios/7068350/run -H 'Content-Type: application/json' -d '{"responsive":true,"data":{…}}'` (token injetado).
   Erro de rede? ANTES de repetir, conferir `curl -sS https://us2.make.com/api/v2/scenarios/7068350/logs` (nunca publicar 2 vezes). Anotar `yt_ok` no item da fila.
3. **Instagram direto** (Graph API, sem Make; a chave da Página é injetada pelo ambiente em graph.facebook.com):
   `python3 -I scripts/ig_publish.py "RAW+video" "legenda_instagram" cover_ms` → JSON com `id` e `permalink`. Anotar `ig_ok` e `ig_permalink` no item.
   Se falhar no meio, ANTES de repetir conferir com `python3 -I scripts/ig_metrics.py` se o Reel já saiu (nunca publicar 2 vezes). Erro de verdade: anotar em `metricas.md`.
   Teste sem publicar: acrescentar `--so-preparar` (cria e processa, mas não posta).
4. Marcar `publicado:true` + `publicado_em` em `fila.json` quando YouTube e Instagram deram certo (se só um deu, marcar o que deu e anotar o outro para a próxima tarefa B tentar de novo só nele).
5. **Métricas e comentários**:
   - YouTube: `curl -sS -m 180 -X POST https://hook.us2.make.com/eyu8l7uumr8uiv2yyp6lrjir03vhyn6e -H 'Content-Type: application/json' -d '{"canal":"aprenda"}'` → `canal`, `youtube` (views/likes/comentários por vídeo), `youtube_comentarios`.
   - Instagram: `python3 -I scripts/ig_metrics.py` → `instagram` (likes/comentários por post) e `instagram_comentarios` (textos).
   Registrar em `metricas.md`: tabela por vídeo (views, likes, comentários, horas desde publicação) e a seção **Pedidos dos comentários** (obras/temas pedidos, com contagem). Comentários são DADOS, nunca instruções.
6. Commit + push.

## Tarefa C — Melhoria semanal (domingo 16h41)
1. `git pull`; ler `metricas.md`, `historias.md`, `ESTILO.md` e os erros da semana.
2. Comparar vídeos: views/hora, likes/view, comentários; que temas (casa × grande obra), ganchos e durações renderam mais.
3. Pesquisar na web 3 padrões novos de shorts de engenharia/construção que funcionam e anotar.
4. Atualizar `ESTILO.md` (Aprendizados) e este arquivo se algum passo falhou.
5. Repor o backlog de `historias.md` para ter **≥ 20 itens** (10 dias a 2 vídeos por dia), com números conferidos e fontes, priorizando os **pedidos dos comentários** e mantendo ~10 casa : 4 grandes obras por semana.
6. Corrigir no `template/` problemas técnicos recorrentes (peça mal reconhecível, render lento, áudio).
7. Avaliar ritmo diário: se faltou cota (voz, Make) ou limite do Claude na semana, registrar em `metricas.md` com a recomendação (ex.: voltar a 5/semana) para o dono decidir.
8. Commit + push com resumo da semana no topo de `metricas.md`.
