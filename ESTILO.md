# Estilo "Aprenda Como É Feito" (@aprendacomoefeitobr)

Base: 2 vídeos de referência enviados pelo dono (telhado, 2:45; sacada, 2:18). O formato é **"construa junto comigo"**:
o espectador ("você") constrói a coisa do zero, cada solução cria um problema novo, e cada peça ganha o nome técnico na hora em que aparece.

## Duração (decisão do dono)
**60 a 90 s**, ~170–240 palavras, **6 a 7 elos** da corrente. Pode crescer depois se as métricas mostrarem que vídeo longo retém bem e se o limite do plano permitir.

## Roteiro — a corrente "Mas… Então… Esse é o…"
Narrador fala com **você**, presente do indicativo, frases curtas (6–14 palavras), tom de conversa, sem "olá".

1. **Abertura "Se você…" com o jeito ingênuo e a consequência ruim/engraçada** (1–2 frases):
   "Se você levanta as paredes e fecha com uma laje reta, a chuva não tem pra onde ir." /
   "Se você pendurar uma laje na frente do quarto, você não tem uma vista pro mar. Tem uma visita ao hospital."
2. **Elos da corrente** (repetir 6–7 vezes, cada elo = 3 frases):
   - **Problema**: "Mas …" (o que dá errado com o que já existe — físico e visual: vaza, racha, enverga, enferruja, esquenta)
   - **Solução**: "Então você …" (ação concreta que dá pra animar: pregar, inclinar, encaixar, cobrir)
   - **Nome**: "Esse é o / Essa é a [NOME TÉCNICO]." (frase sozinha, nome aparece na tela em amarelo)
   - De vez em quando: **"É por isso que …"** ligando ao dia a dia (o degrauzinho da porta da sacada, a mancha escura embaixo da sacada velha).
3. **Números reais e conferidos** dentro dos elos (30% de inclinação = sobe 30 cm a cada metro; guarda-corpo ≥ 1,10 m com vãos ≤ 11 cm; telha a mais de 50 °C). Norma/fonte anotada em `historias.md`.
4. **Toque final**: um detalhe pequeno que completa ("Coloque uma porta de vidro, uma rede e um vaso de planta.").
5. **Fecho fixo e CURTO** (CTA longo derruba a retenção — decisão do dono): "Parabéns! Você construiu um(a) [COISA]."
   + CTA de no máximo 4 palavras (ver "CTA" abaixo). Nada depois disso.
Regras: cada frase é uma imagem que dá pra animar; nunca explicar com abstração ("isso gera tensões") — sempre a consequência física ("racha por cima"); o nome técnico vem DEPOIS de o espectador entender por que a peça existe; nada inventado — todo número conferido na web.

## Visual
- **3D low-poly colorido e limpo** ("brinquedo"): cores saturadas, céu azul com nuvens fofas, grama verde viva, árvores low-poly, luz de dia clara. Sem contorno preto.
- **Mascote "você" (marca registrada do canal — sempre o mesmo, `K.mascot`)**: cabeça grande, capacete LARANJA com o emblema "A" do canal, olhos grandes com pálpebras, sobrancelhas e BIGODE castanhos, costeletas e cabelo castanho na nuca, bochechas rosadas, camisa azul-petróleo de gola, COLETE AMARELO-LIMÃO aberto com 2 faixas refletivas e bolsos, luvas laranja com polegar, cinto de ferramentas com martelo e trena, calça jeans e botas marrons com sola. Reconhecível em miniatura (ver `marca/mascote/`). **As mãos nunca atravessam nada** (corpo, ferramentas, peças): martelo e trena ficam atrás do quadril; braços com cotovelo; conferir a pose na prévia (folha de poses em `marca/mascote/mascote_poses.jpg`). Convenção do kit: braço esquerdo abre com rotação z negativa, direito com positiva. Não mudar cores nem acessórios; ele reage aos problemas (poses scared, point, thumb, up, shrug, think, walk) e aparece INTEIRO em pelo menos 1 plano a cada ~10 s e na capa.
- **A obra é a protagonista**: cada elo mostra a peça nova entrando (cai do alto, desliza, encaixa), em camadas, com cortes/transparências pra ver por dentro.
- **Física visível**: gotas de chuva = esferas azuis; calor = esferas laranja; peso = setas vermelhas pra baixo; tração/compressão = setas verdes; rachaduras desenhadas.
- **Rótulos curtos dentro da cena**: pílula branca com ponto colorido ("• LAJE DE CONCRETO", "• 3 TONELADAS", "• +50 °C", "• 11 cm"); **nome técnico** em amarelo grosso inclinado quando é revelado ("TESOURAS", "RUFO").
- **Câmera**: troca de plano a cada 1–3 s; close na peça, plano geral da casa, vista de baixo, corte interno; leve órbita/movimento sempre.
- Fecho: cena comemorativa (confete) + CTA escrito no alto.

## CTA (curto — decisão do dono)
CTA longo ("se já sabia comente X, se não sabia comente Y") PERDE retenção. Usar no máximo 4 palavras, de preferência só ESCRITO na tela nos últimos 2 s:
- padrão: falado "Qual eu construo agora?" + na tela "QUAL A PRÓXIMA? 👇"
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
- **Estilo aprovado pelo dono (teste da verga, 17/11/2026)**: 3D brinquedo colorido, mascote de capacete laranja, parede subindo fiada por fiada, trincas pretas, setas vermelhas/verdes, etiqueta em pílula branca, nome técnico em amarelo. Manter este estilo.
- **Material tem que ser reconhecível (feedback do dono: "não enxergo o concreto")**: concreto SEMPRE com `K.concreteBox` (cinza com brita e poros), nunca cinza liso; argamassa é bege; aço/armadura cor de ferrugem; madeira com tom de madeira. Dois materiais vizinhos nunca com a mesma cor.
- **Peça nova ganha destaque**: quando a narração fala dela, `K.highlight(peça, pulso)` + câmera em CLOSE (≥ 1 s) mostrando a textura + etiqueta com o material ("• VIGA DE CONCRETO").
- **Dois cenários prontos no kit**: `K.neighborhood` (bairro: casas, grama, terra) para obras de CASA e `K.city` (cidade: prédios com janelas, rua com faixa de pedestre, calçada, postes, semáforo, carros, tapume da obra) para PRÉDIOS e obras urbanas. Grandes obras de natureza (ponte, represa, túnel) podem montar o próprio terreno, mas sempre com `K.sky` (céu cheio: sol, nuvens em 3 distâncias, morros, pássaros) — céu vazio é proibido.
- **Poses e caras (feedback do dono)**: usar as poses do kit, que já trocam a expressão: `idle` (sorriso), `point` (braço para o lado com dedo), `pointUp`, `thumb` (joinha + sorriso aberto), `wave`, `up` (comemora), `shrug` (ombros + preocupado), `scared` (mãos no rosto + boca "O"), `think` (mão no queixo + "hmm"), `walk`. Conferir na prévia que a pose lê em 1 s e que nenhuma mão atravessa nada.
- **Cenário nunca liso nem simplório (feedback do dono)**: `K.neighborhood` já põe grama com textura, tufos, flores, pedrinhas, terra batida na área da obra (`site`), calçada e meio-fio, casas de fundo com telhado de duas águas, janelas com moldura, porta, chaminé e arbustos, e árvores que NUNCA atravessam casas. Passar `site` com a área da obra. Não colocar objetos soltos sem conferir sobreposição.
- **Troca de peças dentro da parede**: tijolos que saem precisam de argamassa própria (sem placa bege sobrando) — ver ABOVE/aboveMortar no story.js do template.
- **Objeto reconhecível em 1 segundo.** Usar a forma ICÔNICA (telha colonial com a curva, tesoura de telhado em triângulo, calha em U). Conferir em close ANTES do render; se não der pra dizer o que é, refazer.
- **Nada atravessa nada.** Peça encaixa encostando, não entrando; telhado não corta janela; gota não atravessa telha; personagem não entra na parede.
- **Arquitetura coerente.** Telhado acima das paredes com beiral pra fora; portas e janelas proporcionais; sacada presa na laje do piso; escada com degraus iguais.
- **Prévia obrigatória** (folha de quadros com o meio de cada plano) antes do render longo, olhando especialmente as peças novas.
- Personagem: tronco único + membros simples; roupa sem volumes estranhos.
