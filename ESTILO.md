# Estilo "Aprenda Como É Feito" (@aprendacomoefeitobr)

Base: 2 vídeos de referência enviados pelo dono (telhado, 2:45; sacada, 2:18). O formato é **"construa junto comigo"**:
o espectador ("você") constrói a coisa do zero, cada solução cria um problema novo, e cada peça ganha o nome técnico na hora em que aparece.

## Duração e ritmo (decisão do dono, 19/11: "todos saem no final, precisa ser mais curto e interessante")
**35 a 50 s** (nunca mais de 55 s), **~100–140 palavras**, **4 a 5 elos** da corrente. Vídeo curto que termina antes de cansar > vídeo completo que ninguém vê até o fim.
- **Escolher só os elos mais visuais e surpreendentes** da obra (o que racha, cai, vaza, explode de curiosidade). Elo "chato" (detalhe de acabamento, repetição) sai do roteiro.
- **Corte a cada 1–1,5 s**; nenhuma cena parada mais de 2 s. Nada de introdução lenta: a construção básica (ex.: parede subindo) acontece em ≤ 1,5 s, acelerada.
- **Sem pausa morta**: a narração emenda uma frase na outra; a animação já começa no quadro 0.

## Roteiro — a corrente "Mas… Então… Esse é o…"
Narrador fala com **você**, presente do indicativo, frases CURTAS (5–11 palavras), tom de conversa, sem "olá".

0. **Gancho nos primeiros 1,5 s (o mais importante)**: abrir já com a COISA DANDO ERRADO na tela (parede rachando, laje cedendo, água entrando) + uma frase que cria curiosidade. Ex.: "Essa trinca aparece em quase toda casa… e tem um motivo." / "Se você fizer a laje assim, ela cai." Proibido começar com a obra vazia ou com apresentação.
   **Promessa até o fim**: na 1ª ou 2ª frase, prometer algo que só aparece no final ("e o último truque quase ninguém faz") — e cumprir no último elo.
1. **Abertura "Se você…"** pode vir logo depois do gancho, em 1 frase.
2. **Elos da corrente** (4–5 vezes, cada elo = 2–3 frases curtas):
   - **Problema** (físico e visual: vaza, racha, enverga, enferruja, esquenta). **Variar a entrada — no máximo 2 "Mas" no vídeo inteiro** (feedback do dono 19/11: "muitos mas, enjoa"). Alternar: "Só que…", "Aí…", "O problema:", "E quando chove?" (pergunta), ou começar direto pela consequência ("A laje enverga.", "A água entra pela junta.").
   - **Solução**: ação concreta que dá pra animar. Também variar: "Então você…" no máximo 2 vezes; alternar com "A solução:", "Você coloca…", "Resolve com…" ou só o verbo ("Coloca escoras embaixo.").
   - **Nome + o que é, em palavras simples** (feedback do dono 19/11: "alguns termos são complicados de entender"): o nome técnico NUNCA vem sozinho. Falar junto o que ele é com palavras de todo dia: "Essa é a VERGA: uma viga em cima da janela." / "Isso é o ENCHIMENTO: bloco de isopor entre as vigas." Na tela: `OV.name('VERGA', a, 0.2, 'viga em cima da janela')` — nome amarelo + linha branca simples embaixo (≤ 5 palavras).
   - No máximo 1 **"É por isso que …"** no vídeo inteiro, no elo mais forte.
3. **Números reais e conferidos** (1–2 no vídeo, os mais impressionantes). Fonte anotada em `historias.md`.
4. **Fecho em 1 frase + loop**: a última frase fecha a promessa e, se possível, encaixa com a primeira (o Shorts recomeça e parece continuação). Ex.: "…e é por isso que essa trinca nunca mais aparece."
5. **CTA só ESCRITO** na tela nos últimos ~1,5 s ("QUAL A PRÓXIMA? 👇") com confete. **Não falar** "Parabéns, você construiu…" nem "Qual eu construo agora?" — falar no fim faz as pessoas saírem antes.
Regras: cada frase é uma imagem que dá pra animar; nunca abstração — sempre a consequência física; o nome técnico vem DEPOIS de entender por que a peça existe; nada inventado.

## Visual
- **3D low-poly colorido e limpo** ("brinquedo"): cores saturadas, céu azul com nuvens fofas, grama verde viva, árvores low-poly, luz de dia clara. Sem contorno preto.
- **Mascote "você" (marca registrada do canal — sempre o mesmo, `K.mascot`)**: cabeça grande, capacete LARANJA com o emblema "A" do canal, olhos grandes com pálpebras, sobrancelhas e BIGODE castanhos, costeletas e cabelo castanho na nuca, bochechas rosadas, camisa azul-petróleo de gola, COLETE AMARELO-LIMÃO aberto com 2 faixas refletivas e bolsos, luvas laranja com polegar, cinto de ferramentas com martelo e trena, calça jeans e botas marrons com sola. Reconhecível em miniatura (ver `marca/mascote/`). **As mãos nunca atravessam nada** (corpo, ferramentas, peças): martelo e trena ficam atrás do quadril; braços com cotovelo; conferir a pose na prévia (folha de poses em `marca/mascote/mascote_poses.jpg`). Convenção do kit: braço esquerdo abre com rotação z negativa, direito com positiva. Não mudar cores nem acessórios; ele reage aos problemas (poses scared, point, thumb, up, shrug, think, walk) e aparece INTEIRO em pelo menos 1 plano a cada ~10 s e na capa.
- **A obra é a protagonista**: cada elo mostra a peça nova entrando (cai do alto, desliza, encaixa), em camadas, com cortes/transparências pra ver por dentro.
- **Física visível**: gotas de chuva = esferas azuis; calor = esferas laranja; peso = setas vermelhas pra baixo; tração/compressão = setas verdes; rachaduras desenhadas.
- **Rótulos curtos dentro da cena**: pílula branca com ponto colorido ("• LAJE DE CONCRETO", "• 3 TONELADAS", "• +50 °C", "• 11 cm"); **nome técnico** em amarelo grosso inclinado quando é revelado ("TESOURAS", "RUFO").
- **Câmera**: troca de plano a cada 1–1,5 s; close na peça, plano geral da casa, vista de baixo, corte interno; leve órbita/movimento sempre.
- Fecho: cena comemorativa (confete) + CTA escrito no alto.

## CTA (curto — decisão do dono)
CTA longo ("se já sabia comente X, se não sabia comente Y") PERDE retenção. Usar no máximo 4 palavras, de preferência só ESCRITO na tela nos últimos 2 s:
- padrão (desde 19/11): **só na tela** "QUAL A PRÓXIMA? 👇" nos últimos ~1,5 s, sem falar nada
Os comentários com pedidos alimentam o backlog em `historias.md` (tarefa semanal).

## Legenda
Uma palavra por vez, centralizada a ~65% da altura, branca, fonte grossa, contorno preto; o **nome técnico** fica amarelo. Sincronizada palavra a palavra (faster-whisper).

## Som
Narração + trilha leve e alegre (baixa) + efeitos em cada ação (encaixe, martelada, gota, rachadura, "plim" no nome técnico).

## Voz (escolhida pelo dono)
Gemini TTS voz **Iapetus**. Mande só o texto (instrução de estilo é lida em voz alta). A entonação vem da pontuação: "...", "!", "?" e MAIÚSCULA para ênfase.
Chamar o TTS **uma vez por vez** (em paralelo dá erro 429 de cota no modelo novo); em 429, esperar e tentar de novo antes de cair para o modelo antigo.

## Capa / thumbnail
VERTICAL 1080x1920. Quadro da obra montada (ou do problema mais visual) com o mascote, + letreiro grosso amarelo/branco com contorno preto, 2–3 palavras em MAIÚSCULAS no terço de cima (ex.: "TELHADO POR DENTRO", "POR QUE NÃO CAI?"). Gerar com `template/thumb.py`. Capa do Reel = mesmo quadro (cover_ms), sem letreiro.

## Aprendizados de qualidade (obrigatórios)
- **Gráficos v3 (19/11, pedido do dono: "melhorias massivas")**: o kit agora renderiza com supersampling 1,25× (bordas lisas, sem tremor), oclusão de ambiente GTAO (cantos, encostos e juntas escurecem — dá volume), brilho suave nas partes claras, cor um pouco mais viva e quente, vinheta leve, luz de preenchimento fria, sombra 4096 e tijolos com quina arredondada (cara de brinquedo). Câmera com balanço leve automático (`story.sway = 0` desliga). Não desligar esses efeitos para ganhar tempo; só `window.SS = 1` em cena muito pesada.
- **Sem palavra difícil solta (feedback do dono 19/11)**: todo termo que um leigo não conhece (verga, transpasse, empuxo, barbacã, EPS, capa, cura, baldrame…) vem explicado na MESMA frase ou na seguinte, em palavras simples, e escrito embaixo do nome na tela. Termos técnicos SÃO BEM-VINDOS (é o que o canal ensina — decisão do dono 19/11), desde que cada um venha explicado; sigla também pode, com a explicação ("EPS, o isopor"). Teste: uma pessoa que nunca viu uma obra entende cada frase sem pausar?
- **Os primeiros 3 s decidem tudo (retenção do Reel da laje, 19/11: metade sai nos primeiros 4–5 s; quem passa, fica até o fim; 94% das views vêm da aba Reels, onde a pessoa arrasta rápido)**:
  - **Quadro 0 = o problema em CLOSE, óbvio sem som**: a peça já trincando/cedendo/vazando ocupando metade da tela (nada de plano geral de cima com o objeto pequeno no alto). Ex.: laje vista de baixo enverga com setas vermelhas; parede já com a trinca abrindo.
  - **A 1ª FRASE é o gancho e aparece ESCRITA INTEIRA na tela enquanto é falada (decisão do dono, 19/11)**: `OV.hook('Por que a parede *racha* em cima da janela?', a)` no alto (palavra-chave entre *asteriscos* fica amarela). Muita gente vê sem som. A frase tem que prender sozinha: pergunta curiosa, erro comum ou consequência forte, **≤ 10 palavras**, entendível em 1 leitura (ex.: "Por que a parede racha em cima da janela?", "Essa laje vai desabar. Sabe por quê?", "Quase toda casa erra isso no muro."). Some ao fim da frase.
  - Enquanto o gancho está escrito, a legenda palavra a palavra fica desligada: gravar `work/hook.json` com `{"end": fim_da_1ª_frase_em_seg}` (o `captions.py` lê).
  - Movimento desde o quadro 0 (câmera aproximando ou algo caindo); primeira fala começa em ≤ 0,2 s.
- **Sem pausa depois do gancho (indício da retenção do Reel da laje, 19/11)**: a queda veio aos ~7 s, quando o vídeo cortou da laje desabando para o mascote parado dizendo a promessa. A frase de promessa vai com a OBRA na tela e algo acontecendo (peça entrando, câmera andando); o mascote reage em canto/plano curto, nunca num plano parado de 2–3 s logo no começo.
- **Conectores variados (feedback do dono 19/11: "muitos mas, enjoa")**: a corrente não pode soar como lista. Máx. 2 "Mas" e 2 "Então você" por vídeo; conferir no script.txt antes de gerar a voz (`grep -ci '^mas' script.txt`).
- **Chão não pode tremer (feedback do dono 19/11)**: texturas de grama/terra com detalhe fino de alto contraste piscam quando a câmera anda. O kit agora suaviza (`soften`) e usa anisotropia; não criar textura nova com pontinhos de 1–3 px de alto contraste — usar manchas maiores e suaves.
- **Estilo aprovado pelo dono (teste da verga, 17/11/2026)**: 3D brinquedo colorido, mascote de capacete laranja, parede subindo fiada por fiada, trincas pretas, setas vermelhas/verdes, etiqueta em pílula branca, nome técnico em amarelo. Manter este estilo.
- **Material tem que ser reconhecível (feedback do dono: "não enxergo o concreto")**: concreto SEMPRE com `K.concreteBox` (cinza com brita e poros), nunca cinza liso; argamassa é bege; aço/armadura cor de ferrugem; madeira com tom de madeira. Dois materiais vizinhos nunca com a mesma cor.
- **Destaque NUNCA pisca (feedback do dono: "parece bug")**: `K.highlight(peça, K.glow(t, início, fim))` — acende e apaga devagar, uma vez. Proibido usar seno/pulso rápido no brilho.
- **Céu sempre vivo**: nuvens andam e pássaros voam sozinhos (o motor anima via `K.TICK`); não congelar o céu.
- **Mascote sem 'bug' (feedback do dono)**: poses mudam com transição suave automática (~0,3 s) — chamar `guy.pose(nome, t)` em todo quadro; nada de tremedeira rápida. O render avisa `AVISO mascote cortado na borda f=...` quando ele sai parcialmente da tela: na prévia/render, se aparecer esse aviso, ajustar a câmera (mascote inteiro ou totalmente fora).
- **Peça nova ganha destaque**: quando a narração fala dela, `K.highlight(peça, K.glow(...))` + câmera em CLOSE (≥ 1 s) mostrando a textura + etiqueta com o material ("• VIGA DE CONCRETO").
- **Dois cenários prontos no kit**: `K.neighborhood` (bairro: casas, grama, terra) para obras de CASA e `K.city` (cidade v2: prédios residenciais com sacadas, comerciais de vidro espelhado em tons variados e sobrados antigos com cornija; térreo com lojas, toldos e placas; telhados com caixa-d'água, ar-condicionado e antena; rua com faixas, bueiros, faixa de pedestre, ponto de ônibus, bancos, lixeiras, hidrante, semáforo, postes, carros modelados e skyline na névoa; nada fica na frente da obra) para PRÉDIOS e obras urbanas. Grandes obras de natureza (ponte, represa, túnel) podem montar o próprio terreno, mas sempre com `K.sky` (céu cheio: sol, nuvens em 3 distâncias, morros, pássaros) — céu vazio é proibido.
- **Poses e caras (feedback do dono)**: usar as poses do kit, que já trocam a expressão: `idle` (sorriso), `point` (braço para o lado com dedo), `pointUp`, `thumb` (joinha + sorriso aberto), `wave`, `up` (comemora), `shrug` (ombros + preocupado), `scared` (mãos no rosto + boca "O"), `think` (mão no queixo + "hmm"), `walk`. Conferir na prévia que a pose lê em 1 s e que nenhuma mão atravessa nada.
- **Objetos do cenário também precisam ser reconhecíveis (feedback do dono: "hidrante péssimo")**: nada de cilindro/caixa genérica representando um objeto. Modelar os detalhes que fazem a coisa ser ela (hidrante: base com parafusos, anéis, cúpula com porca, saídas com tampas — ver `K.hydrant`). Todo objeto novo passa por um close na prévia antes de entrar no vídeo.
- **Texto no cenário só o essencial (feedback do dono)**: o único texto escrito na cena é o que ensina (etiquetas, nome técnico, "OBRA" no tapume). Lojas usam ÍCONES, nunca palavras, e prédios logo atrás da obra ficam sem lojas (`shops: false`). Nada de texto repetido ou competindo com as etiquetas.
- **Cenário nunca liso nem simplório (feedback do dono)**: `K.neighborhood` já põe grama com textura, tufos, flores, pedrinhas, terra batida na área da obra (`site`), calçada e meio-fio, casas de fundo com telhado de duas águas, janelas com moldura, porta, chaminé e arbustos, e árvores que NUNCA atravessam casas. Passar `site` com a área da obra. Não colocar objetos soltos sem conferir sobreposição.
- **Troca de peças dentro da parede**: tijolos que saem precisam de argamassa própria (sem placa bege sobrando) — ver ABOVE/aboveMortar no story.js do template.
- **Objeto reconhecível em 1 segundo.** Usar a forma ICÔNICA (telha colonial com a curva, tesoura de telhado em triângulo, calha em U). Conferir em close ANTES do render; se não der pra dizer o que é, refazer.
- **Nada atravessa nada.** Peça encaixa encostando, não entrando; telhado não corta janela; gota não atravessa telha; personagem não entra na parede.
- **Arquitetura coerente.** Telhado acima das paredes com beiral pra fora; portas e janelas proporcionais; sacada presa na laje do piso; escada com degraus iguais.
- **Prévia obrigatória** (folha de quadros com o meio de cada plano) antes do render longo, olhando especialmente as peças novas.
- Personagem: tronco único + membros simples; roupa sem volumes estranhos.
