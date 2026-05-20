import 'dotenv/config';
import { query } from '../config/database';
import { logger } from '../utils/logger';

// ─── QUESTIONS ────────────────────────────────────────────────────────────────
const questions = [
  // PORTUGUÊS — Interpretação
  { subject: 'Português', topic: 'Interpretação Textual', difficulty: 'Fácil', statement: '(FAETEC/COSEAC) "A tecnologia avança em ritmo acelerado, transformando não apenas a forma como trabalhamos, mas também como nos relacionamos." Qual é a ideia central do texto?', options: ['O trabalho está desaparecendo com a tecnologia', 'A tecnologia transforma o trabalho e os relacionamentos', 'A tecnologia só afeta o ambiente de trabalho', 'Os relacionamentos são mais importantes que o trabalho'], correct_index: 1, explanation: 'A ideia central abrange os dois aspectos citados: trabalho e relacionamentos. O texto usa "não apenas... mas também", conectando os dois.' },
  { subject: 'Português', topic: 'Interpretação Textual', difficulty: 'Médio', statement: '(FAETEC/COSEAC) "Embora chovesse muito, os atletas completaram a prova." A conjunção "embora" indica:', options: ['Causa', 'Concessão', 'Consequência', 'Finalidade'], correct_index: 1, explanation: '"Embora" é conjunção concessiva: introduz uma ideia que contraria a principal, mas não impede sua realização.' },
  { subject: 'Português', topic: 'Interpretação Textual', difficulty: 'Médio', statement: '(FAETEC/COSEAC) "Pedro parou de mentir para seus pais." Essa frase pressupõe que Pedro:', options: ['Vai mentir no futuro', 'Mentia antes', 'Nunca mentiu', 'Mente ocasionalmente'], correct_index: 1, explanation: '"Parar de" pressupõe que a ação já ocorria. "Parou de mentir" implica que ele mentia antes.' },
  { subject: 'Português', topic: 'Interpretação Textual', difficulty: 'Fácil', statement: '(FAETEC/COSEAC) "Os jovens que não estudam hoje terão dificuldades amanhã." Essa frase transmite:', options: ['Uma certeza absoluta sobre o futuro', 'Uma relação de causa e consequência', 'Uma suposição sem base real', 'Uma ordem para os jovens estudarem'], correct_index: 1, explanation: 'A estrutura "quem não faz X hoje terá problema Y amanhã" estabelece relação de causa e consequência.' },
  // PORTUGUÊS — Concordância
  { subject: 'Português', topic: 'Concordância', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Qual alternativa está de acordo com a norma culta?', options: ['Havia muitas pessoas na fila', 'Haviam muitas pessoas na fila', 'Houveram muitas pessoas na fila', 'Haverão muitas pessoas na fila'], correct_index: 0, explanation: '"Haver" no sentido de existir é impessoal — não vai ao plural. Correto: "Havia muitas pessoas" (singular).' },
  { subject: 'Português', topic: 'Concordância', difficulty: 'Médio', statement: '(FAETEC/COSEAC) "Faz dois anos que ele partiu." O verbo "faz" está:', options: ['Errado; deveria ser "fazem"', 'Correto; verbo impessoal fica no singular', 'Errado; deveria ser "fizeram"', 'Correto apenas na linguagem informal'], correct_index: 1, explanation: '"Fazer" indicando tempo decorrido é impessoal e fica no singular: "Faz dois anos", "Faz três meses".' },
  { subject: 'Português', topic: 'Concordância', difficulty: 'Difícil', statement: '(FAETEC/COSEAC) Em qual alternativa há ERRO de concordância?', options: ['As casas estão limpas e arrumadas', 'A situação está crítica', 'Necessário paciência e dedicação', 'Eles ficaram quietos e atentos'], correct_index: 2, explanation: '"Necessário paciência" está errado. O adjetivo deve concordar com o sujeito posposto: "Necessárias paciência e dedicação".' },
  // PORTUGUÊS — Crase
  { subject: 'Português', topic: 'Crase', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Em qual alternativa o uso da crase está CORRETO?', options: ['Fui à cidade de manhã', 'Entreguei o documento à ele', 'Refiro-me à assuntos sérios', 'Cheguei à pé'], correct_index: 0, explanation: '"Fui à cidade": preposição "a" + artigo feminino "a" = à. As outras estão erradas: pronome pessoal, masculino e locução masculina não admitem crase.' },
  { subject: 'Português', topic: 'Crase', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Nunca há crase antes de:', options: ['Substantivos femininos com artigo', 'Locuções adverbiais femininas', 'Verbos no infinitivo', 'Pronome demonstrativo "aquela"'], correct_index: 2, explanation: 'Verbo não aceita artigo, portanto nunca há encontro preposição + artigo. Nunca: "à ajudar".' },
  { subject: 'Português', topic: 'Crase', difficulty: 'Médio', statement: '(FAETEC/COSEAC) "Minha casa fica à direita." A crase ocorre porque:', options: ['"Direita" é especial', 'Fusão de "a" (preposição) com "a" (artigo) na locução adverbial', 'A crase é facultativa aqui', 'Não há crase; é erro'], correct_index: 1, explanation: '"À direita", "à esquerda", "à noite", "à tarde" = locuções adverbiais femininas com crase obrigatória.' },
  // PORTUGUÊS — Figuras de Linguagem
  { subject: 'Português', topic: 'Figuras de Linguagem', difficulty: 'Fácil', statement: '(FAETEC/COSEAC) "Morro de saudade de você." Que figura de linguagem está presente?', options: ['Metáfora', 'Hipérbole', 'Metonímia', 'Eufemismo'], correct_index: 1, explanation: 'Hipérbole = exagero intencional para intensificar. "Morro de saudade" é exagero — não há morte literal.' },
  { subject: 'Português', topic: 'Figuras de Linguagem', difficulty: 'Médio', statement: '(FAETEC/COSEAC) "A vida é uma viagem sem volta." Que figura de linguagem está presente?', options: ['Comparação', 'Metonímia', 'Metáfora', 'Ironia'], correct_index: 2, explanation: 'Metáfora = comparação implícita, sem "como". "A vida É uma viagem" (sem "como").' },
  { subject: 'Português', topic: 'Figuras de Linguagem', difficulty: 'Médio', statement: '(FAETEC/COSEAC) "Li todo Machado de Assis." "Machado de Assis" no lugar de suas obras é:', options: ['Metáfora', 'Hipérbole', 'Metonímia', 'Eufemismo'], correct_index: 2, explanation: 'Metonímia = substituição por relação real. Autor pelas obras é metonímia clássica.' },
  // PORTUGUÊS — Regência
  { subject: 'Português', topic: 'Regência', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Qual frase usa corretamente a regência verbal?', options: ['Aspiro o cargo de gerente', 'Aspiro ao cargo de gerente', 'Aspiro no cargo de gerente', 'Aspiro pelo cargo de gerente'], correct_index: 1, explanation: '"Aspirar" no sentido de desejar é transitivo indireto com "a": "aspirar a algo".' },
  { subject: 'Português', topic: 'Regência', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Marque a alternativa correta quanto à regência:', options: ['Prefiro café mais que chá', 'Prefiro café do que chá', 'Prefiro café a chá', 'Prefiro mais café que chá'], correct_index: 2, explanation: '"Preferir X a Y" — nunca "mais que" ou "do que".' },
  { subject: 'Português', topic: 'Regência', difficulty: 'Médio', statement: '(FAETEC/COSEAC) "Assisti ___ jogo ontem." Complete corretamente:', options: ['o', 'ao', 'no', 'com o'], correct_index: 1, explanation: '"Assistir" no sentido de "ver/presenciar" é transitivo indireto com "a": "assisti ao jogo".' },
  // PORTUGUÊS — Ortografia
  { subject: 'Português', topic: 'Ortografia', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Qual das frases está CORRETA segundo o Acordo Ortográfico?', options: ['A idéia surgiu de repente', 'A ideia surgiu de repente', 'A idêia surgiu de repente', 'A ideya surgiu de repente'], correct_index: 1, explanation: 'Após o Acordo Ortográfico (2009), ditongos abertos em paroxítonas perderam o acento: "ideia" (antes "idéia").' },
  { subject: 'Português', topic: 'Ortografia', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Qual é o uso correto de "por que / porque"?', options: ['Não sei porque ele saiu (em pergunta)', 'Por que você saiu? (pergunta direta)', 'Ele foi embora, eu não sei porque (final, sem acento)', 'O porquê é: ele estava com sono (sem acento)'], correct_index: 1, explanation: '"Por que" (separado, sem acento) = em perguntas diretas ou indiretas.' },
  // MATEMÁTICA — Porcentagem
  { subject: 'Matemática', topic: 'Porcentagem', difficulty: 'Fácil', statement: '(FAETEC/COSEAC) Qual é 25% de 200?', options: ['25', '50', '75', '100'], correct_index: 1, explanation: '25% de 200 = 0,25 × 200 = 50.' },
  { subject: 'Matemática', topic: 'Porcentagem', difficulty: 'Fácil', statement: '(FAETEC/COSEAC) Um produto custa R$ 80,00 e tem 20% de desconto. Qual é o preço final?', options: ['R$ 16,00', 'R$ 60,00', 'R$ 64,00', 'R$ 70,00'], correct_index: 2, explanation: 'Desconto de 20% → multiplica por 0,80. 80 × 0,80 = R$ 64,00.' },
  { subject: 'Matemática', topic: 'Porcentagem', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Um salário de R$ 2.000,00 teve aumento de 15%. Qual é o novo salário?', options: ['R$ 2.150,00', 'R$ 2.200,00', 'R$ 2.300,00', 'R$ 2.350,00'], correct_index: 2, explanation: 'Aumento de 15% → multiplica por 1,15. 2.000 × 1,15 = R$ 2.300,00.' },
  { subject: 'Matemática', topic: 'Porcentagem', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Um produto foi aumentado de R$ 40,00 para R$ 50,00. Qual foi o percentual de aumento?', options: ['10%', '20%', '25%', '30%'], correct_index: 2, explanation: 'Aumento = 10. Percentual = (10/40) × 100 = 25%.' },
  { subject: 'Matemática', topic: 'Porcentagem', difficulty: 'Difícil', statement: '(FAETEC/COSEAC) Uma loja aumentou o preço em 10% e depois deu 10% de desconto. O resultado final é:', options: ['Igual ao original', '1% maior', '1% menor', '10% menor'], correct_index: 2, explanation: '1,10 × 0,90 = 0,99. O preço final é 99% do original = 1% menor.' },
  // MATEMÁTICA — Equações
  { subject: 'Matemática', topic: 'Equações do 1º Grau', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Resolva: 3x + 5 = 20', options: ['x = 3', 'x = 4', 'x = 5', 'x = 6'], correct_index: 2, explanation: '3x = 20 - 5 = 15. x = 15/3 = 5.' },
  { subject: 'Matemática', topic: 'Equações do 1º Grau', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Resolva: 4(x - 2) = 2x + 6', options: ['x = 5', 'x = 6', 'x = 7', 'x = 8'], correct_index: 2, explanation: '4x - 8 = 2x + 6. 4x - 2x = 6 + 8. 2x = 14. x = 7.' },
  { subject: 'Matemática', topic: 'Equações do 1º Grau', difficulty: 'Médio', statement: '(FAETEC/COSEAC) A soma de dois números consecutivos é 47. Qual é o menor?', options: ['22', '23', '24', '25'], correct_index: 1, explanation: 'n + (n+1) = 47. 2n + 1 = 47. 2n = 46. n = 23.' },
  { subject: 'Matemática', topic: 'Equações do 2º Grau', difficulty: 'Difícil', statement: '(FAETEC/COSEAC) Resolva: x² - 5x + 6 = 0', options: ['x = 2 e x = 3', 'x = 1 e x = 6', 'x = −2 e x = −3', 'x = −1 e x = −6'], correct_index: 0, explanation: 'Fatorando: (x-2)(x-3) = 0. x = 2 ou x = 3.' },
  { subject: 'Matemática', topic: 'Equações do 2º Grau', difficulty: 'Difícil', statement: '(FAETEC/COSEAC) Usando Bhaskara: x² - 7x + 10 = 0', options: ['x = 2 e x = 5', 'x = 3 e x = 4', 'x = 1 e x = 10', 'x = −2 e x = −5'], correct_index: 0, explanation: 'Δ = 49 - 40 = 9. x = (7 ± 3)/2. x₁ = 5; x₂ = 2.' },
  // MATEMÁTICA — Geometria
  { subject: 'Matemática', topic: 'Geometria Plana', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Qual é a área de um quadrado com lado de 7 cm?', options: ['28 cm²', '42 cm²', '49 cm²', '56 cm²'], correct_index: 2, explanation: 'Área do quadrado = lado² = 7² = 49 cm².' },
  { subject: 'Matemática', topic: 'Geometria Plana', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Num triângulo retângulo, os catetos medem 6 e 8. Qual é a hipotenusa?', options: ['9', '10', '12', '14'], correct_index: 1, explanation: 'h² = 6² + 8² = 36 + 64 = 100. h = √100 = 10.' },
  { subject: 'Matemática', topic: 'Geometria Plana', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Qual é a área de um triângulo com base 10 cm e altura 8 cm?', options: ['40 cm²', '80 cm²', '45 cm²', '50 cm²'], correct_index: 0, explanation: 'Área do triângulo = (base × altura)/2 = (10 × 8)/2 = 40 cm².' },
  { subject: 'Matemática', topic: 'Geometria Plana', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Um círculo tem raio de 5 cm. Qual é a área? (π ≈ 3,14)', options: ['15,7 cm²', '31,4 cm²', '78,5 cm²', '157 cm²'], correct_index: 2, explanation: 'Área = π × r² = 3,14 × 25 = 78,5 cm².' },
  // MATEMÁTICA — Estatística
  { subject: 'Matemática', topic: 'Estatística', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Calcule a média aritmética de: 4, 8, 6, 10, 12.', options: ['7', '8', '9', '10'], correct_index: 1, explanation: 'Média = (4+8+6+10+12)/5 = 40/5 = 8.' },
  { subject: 'Matemática', topic: 'Estatística', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Qual é a mediana dos valores: 3, 7, 5, 9, 1?', options: ['3', '4', '5', '7'], correct_index: 2, explanation: 'Ordenados: 1, 3, 5, 7, 9. A mediana (valor central) é 5.' },
  { subject: 'Matemática', topic: 'Estatística', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Ao lançar um dado, qual é a probabilidade de sair número par?', options: ['1/6', '1/3', '1/2', '2/3'], correct_index: 2, explanation: 'Números pares: 2, 4, 6 (3 casos). Total: 6. P = 3/6 = 1/2.' },
  // MATEMÁTICA — Juros
  { subject: 'Matemática', topic: 'Juros Simples', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Calcule o juro simples de R$ 2.000,00 a 5% ao mês por 3 meses.', options: ['R$ 200,00', 'R$ 250,00', 'R$ 300,00', 'R$ 350,00'], correct_index: 2, explanation: 'J = P × i × t = 2.000 × 0,05 × 3 = R$ 300,00.' },
  { subject: 'Matemática', topic: 'Juros Simples', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Qual é o montante de R$ 1.500,00 aplicado a 8% ao ano por 2 anos?', options: ['R$ 1.620,00', 'R$ 1.740,00', 'R$ 1.700,00', 'R$ 1.800,00'], correct_index: 1, explanation: 'J = 1.500 × 0,08 × 2 = 240. M = 1.500 + 240 = R$ 1.740,00.' },
  // MATEMÁTICA — Razão e Proporção
  { subject: 'Matemática', topic: 'Razão e Proporção', difficulty: 'Fácil', statement: '(FAETEC/COSEAC) A razão entre 15 e 5 é:', options: ['2', '3', '5', '10'], correct_index: 1, explanation: 'Razão = 15/5 = 3.' },
  { subject: 'Matemática', topic: 'Razão e Proporção', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Divida R$ 120,00 na razão 1:2:3. Qual é a maior parte?', options: ['R$ 20,00', 'R$ 40,00', 'R$ 60,00', 'R$ 80,00'], correct_index: 2, explanation: 'Total = 6 partes. Cada parte = 120/6 = 20. Maior (3 partes) = R$ 60,00.' },
  { subject: 'Matemática', topic: 'Razão e Proporção', difficulty: 'Médio', statement: '(FAETEC/COSEAC) O valor de x na proporção 4/6 = x/9 é:', options: ['4', '5', '6', '7'], correct_index: 2, explanation: '4 × 9 = 6 × x → 36 = 6x → x = 6.' },
  // MATEMÁTICA — Regra de Três
  { subject: 'Matemática', topic: 'Regra de Três', difficulty: 'Fácil', statement: '(FAETEC/COSEAC) Se 3 trabalhadores fazem uma obra em 12 dias, 6 trabalhadores fazem em:', options: ['6 dias', '4 dias', '8 dias', '3 dias'], correct_index: 0, explanation: 'Inversamente proporcional. 3 × 12 = 6 × x → x = 36/6 = 6 dias.' },
  { subject: 'Matemática', topic: 'Regra de Três', difficulty: 'Médio', statement: '(FAETEC/COSEAC) Um carro percorre 300 km em 4 horas. Em 7 horas percorre:', options: ['500 km', '525 km', '600 km', '650 km'], correct_index: 1, explanation: 'Diretamente proporcional. 300/4 = x/7 → x = 525 km.' },
  // MATEMÁTICA — Álgebra
  { subject: 'Matemática', topic: 'Álgebra', difficulty: 'Difícil', statement: '(FAETEC/COSEAC) Qual é o resultado de (a + b)²?', options: ['a² + b²', 'a² + 2ab + b²', 'a² − 2ab + b²', '2a + 2b'], correct_index: 1, explanation: 'Produto notável: (a+b)² = a² + 2ab + b².' },
  { subject: 'Matemática', topic: 'Álgebra', difficulty: 'Difícil', statement: '(FAETEC/COSEAC) Fatore: x² − 25', options: ['(x−5)²', '(x+5)(x−5)', '(x+5)²', 'x(x−25)'], correct_index: 1, explanation: 'Diferença de quadrados: x² − 25 = (x+5)(x−5).' },
  { subject: 'Matemática', topic: 'Álgebra', difficulty: 'Difícil', statement: '(FAETEC/COSEAC) Resolva o sistema: x + y = 10 e x − y = 4', options: ['x = 6, y = 4', 'x = 7, y = 3', 'x = 8, y = 2', 'x = 5, y = 5'], correct_index: 1, explanation: 'Somando: 2x = 14 → x = 7. Substituindo: y = 3.' },
];

// ─── THEORY ────────────────────────────────────────────────────────────────────
const theories = [
  {
    subject: 'Português', title: 'Interpretação Textual', slug: 'interpretacao-textual', order_index: 1,
    content: `## Interpretação Textual\n\nA banca COSEAC exige que você identifique o tipo textual e compreenda o propósito comunicativo.\n\n### Tipos de Texto\n- **Narrativo:** personagens, tempo, espaço e enredo\n- **Descritivo:** caracteriza seres, objetos ou lugares\n- **Dissertativo-argumentativo:** defende uma tese com argumentos *(mais cobrado!)*\n- **Expositivo:** informa sem defender posição\n- **Injuntivo:** instrui, orienta (receitas, manuais)\n\n### Estratégia de Leitura\n1. Leia o título antes do texto\n2. Identifique quem fala, para quem e com que objetivo\n3. Grife palavras de relação: *mas, porém, portanto, embora, porque*\n4. Resuma cada parágrafo em uma frase`,
    summary: 'Tipo textual = forma de organização. Gênero textual = materialização social. Identifique o propósito comunicativo antes de responder.',
    common_errors: ['Confundir tema com tese do autor', 'Ignorar ironia e sentido conotativo', 'Responder com conhecimento prévio, não com o texto'],
    examples: ['Texto narrativo: conto com narrador em 1ª pessoa', 'Dissertação: editorial de jornal com tese clara'],
  },
  {
    subject: 'Português', title: 'Concordância Verbal', slug: 'concordancia-verbal', order_index: 2,
    content: `## Concordância Verbal\n\nO verbo concorda em número e pessoa com o sujeito.\n\n### Casos Especiais Mais Cobrados\n\n**Haver (existir) = impessoal:** sempre singular\n- ✅ "Havia muitas pessoas"\n- ❌ "Haviam muitas pessoas"\n\n**Fazer (tempo) = impessoal:** sempre singular\n- ✅ "Faz dois anos que ele partiu"\n\n**Sujeito composto antes do verbo:** plural\n- ✅ "João e Maria foram ao evento"\n\n**Partícula SE com VTI:** singular\n- ✅ "Precisa-se de funcionários"\n- ✅ "Vendem-se casas" (partícula apassivadora)`,
    summary: 'HAVER e FAZER indicando existência/tempo = sempre singular. Sujeito composto antes do verbo = plural.',
    common_errors: ['"Haviam muitas pessoas" está errado', '"Fazem dois anos" está errado', 'Confundir partícula apassivadora com índice de indeterminação'],
    examples: ['"Havia muitos candidatos" ✓', '"Faz três meses" ✓', '"Vendem-se apartamentos" ✓'],
  },
  {
    subject: 'Português', title: 'Crase', slug: 'crase', order_index: 3,
    content: `## Crase\n\nA crase é a fusão da preposição **"a"** com o artigo feminino **"a"**.\n\n### Quando HAÁ crase (obrigatória)\n- Antes de substantivo feminino com artigo quando há preposição exigida\n- Locuções adverbiais femininas: à noite, à tarde, à vontade, à direita\n- Antes de "aquele/aquela/aquilo": àquele, àquela, àquilo\n- Horas: às 8h, às 14h\n\n### Quando NÃO há crase\n- Antes de verbos (infinitivo): "Estou pronto **a** ajudar"\n- Antes de pronomes pessoais: "Entreguei **a** ele"\n- Antes de nomes masculinos: "Fui **a** pé"\n- Antes de "que" e "quem"`,
    summary: 'Teste: substitua por palavra masculina — se aparecer "ao", haverá crase no feminino.',
    common_errors: ['"à ele" está errado (pronome pessoal)', '"à pé" está errado (locução masculina)', '"à verbos" nunca ocorre'],
    examples: ['"Fui à escola" ✓', '"Às 14h chegamos" ✓', '"Refiro-me àquele caso" ✓'],
  },
  {
    subject: 'Matemática', title: 'Porcentagem', slug: 'porcentagem', order_index: 1,
    content: `## Porcentagem\n\n**Porcentagem = fração com denominador 100**\n25% = 25/100 = 0,25\n\n### Cálculo Direto\nP% de N = (P/100) × N\n\nEx: 30% de 200 = 0,30 × 200 = **60**\n\n### Fator Multiplicador\n- Aumento de 20% → multiplica por **1,20**\n- Desconto de 15% → multiplica por **0,85**\n- Aumento de 7,5% → multiplica por **1,075**\n\n### Percentual de Variação\n% = (valor novo - valor antigo) / valor antigo × 100\n\n### Sequência de Porcentagens ⚠️\nAumento de 10% + desconto de 10% ≠ zero!\n1,10 × 0,90 = 0,99 → desconto final de **1%**`,
    summary: 'P% de N = N × (P/100). Aumento = × (1 + P/100). Desconto = × (1 − P/100). Sequências: multiplique os fatores.',
    common_errors: ['Somar percentuais sequenciais (errado!)', 'Calcular percentual sobre valor errado', 'Confundir aumento com desconto no fator'],
    examples: ['25% de 200 = 50', 'Desconto de 30% em R$100 = 100 × 0,70 = R$70', 'Aumento de 20%: R$50 × 1,20 = R$60'],
  },
  {
    subject: 'Matemática', title: 'Equações do 1º Grau', slug: 'equacoes-1-grau', order_index: 2,
    content: `## Equações do 1º Grau\n\n**Forma geral: ax + b = 0**\n\n**Regra de ouro:** O que faz de um lado desfaz do outro.\n\n### Passo a Passo\n1. Eliminar parênteses (distribuição)\n2. Agrupar termos com x de um lado, números do outro\n3. Dividir pelo coeficiente de x\n\n**Exemplo:** 3x + 5 = 20\n→ 3x = 20 - 5 = 15\n→ x = 15/3 = **5**\n\n### Sistemas 2×2\nMétodo da substituição:\n1. Isola uma variável em uma equação\n2. Substitui na outra\n3. Resolve e encontra as duas variáveis\n\n**Exemplo:** x + y = 10 e x − y = 4\n→ Somando: 2x = 14 → x = 7; y = 3`,
    summary: 'ax+b=0 → x=−b/a. Distribuir parênteses. Agrupar semelhantes. Verificar sempre.',
    common_errors: ['Esquecer de distribuir o sinal ao abrir parênteses com negativo', 'Não verificar a resposta na equação original'],
    examples: ['3x+5=20 → x=5', '4(x-2)=2x+6 → x=7', 'Sistema x+y=10, x-y=4 → x=7, y=3'],
  },
  {
    subject: 'Matemática', title: 'Geometria Plana', slug: 'geometria-plana', order_index: 3,
    content: `## Geometria Plana\n\n### Fórmulas Essenciais\n\n**Quadrado** (lado = l)\n- Área = l² | Perímetro = 4l\n\n**Retângulo** (base b, altura h)\n- Área = b × h | Perímetro = 2(b + h)\n\n**Triângulo** (base b, altura h)\n- Área = (b × h) / 2\n- Soma dos ângulos internos = 180°\n\n**Círculo** (raio r, π ≈ 3,14)\n- Área = π × r²\n- Circunferência = 2 × π × r\n\n### Teorema de Pitágoras\nh² = a² + b²\n\nTernas pitagóricas clássicas: **3-4-5**, 5-12-13, 8-15-17\n\n### Soma dos Ângulos Internos\nS = (n − 2) × 180°`,
    summary: 'Triângulo: A=bh/2. Círculo: A=πr². Pitágoras: h²=a²+b². Ângulos internos: (n−2)×180°.',
    common_errors: ['Esquecer de dividir por 2 na área do triângulo', 'Confundir raio com diâmetro no círculo', 'Usar a fórmula do quadrado para o retângulo'],
    examples: ['Quadrado lado 7: A=49cm²', 'Triângulo base 10, altura 8: A=40cm²', 'Catetos 6 e 8: hipotenusa = 10'],
  },
];

// ─── VIDEOS ────────────────────────────────────────────────────────────────────
const videos = [
  { subject: 'Português', topic: 'Interpretação Textual', title: 'Interpretação de Texto — Noslen', youtube_id: 'VIhEXVYE9Bk', duration: '28:00', professor: 'Prof. Noslen', order_index: 1 },
  { subject: 'Português', topic: 'Concordância', title: 'Concordância Verbal e Nominal — Noslen', youtube_id: 'x5R_0sXJUMY', duration: '45:00', professor: 'Prof. Noslen', order_index: 2 },
  { subject: 'Matemática', topic: 'Porcentagem', title: 'Porcentagem do Zero — Ferretto', youtube_id: '8JoMBsHhCkI', duration: '32:00', professor: 'Prof. Ferretto', order_index: 1 },
  { subject: 'Matemática', topic: 'Equações do 1º Grau', title: 'Equações do 1º Grau — Ferretto', youtube_id: '2qe8MIExhWs', duration: '28:00', professor: 'Prof. Ferretto', order_index: 2 },
  { subject: 'Matemática', topic: 'Geometria Plana', title: 'Geometria Plana — Áreas e Perímetros', youtube_id: 'qh0g9JWJSSY', duration: '35:00', professor: 'Prof. Ferretto', order_index: 3 },
  { subject: 'Matemática', topic: 'Estatística', title: 'Estatística Básica — Ferretto', youtube_id: 'v3BU5P3JXBU', duration: '22:40', professor: 'Prof. Ferretto', order_index: 4 },
  { subject: 'Matemática', topic: 'Juros Simples', title: 'Juros Simples — Ferretto', youtube_id: 'N6iBDMG_b8U', duration: '20:00', professor: 'Prof. Ferretto', order_index: 5 },
];

async function seed() {
  logger.info('Starting seed...');

  // Questions
  for (const q of questions) {
    await query(
      `INSERT INTO questions (subject, topic, difficulty, statement, options, correct_index, explanation, exam_board)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`,
      [q.subject, q.topic, q.difficulty, q.statement, JSON.stringify(q.options), q.correct_index, q.explanation, 'FAETEC/COSEAC']
    );
  }
  logger.info(`Seeded ${questions.length} questions`);

  // Theory
  for (const t of theories) {
    await query(
      `INSERT INTO theory (subject, title, slug, content, summary, common_errors, examples, order_index)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (slug) DO NOTHING`,
      [t.subject, t.title, t.slug, t.content, t.summary, t.common_errors, t.examples, t.order_index]
    );
  }
  logger.info(`Seeded ${theories.length} theory articles`);

  // Videos
  for (const v of videos) {
    const thumb = `https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`;
    await query(
      `INSERT INTO videos (subject, topic, title, youtube_id, duration, professor, thumbnail_url, order_index)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`,
      [v.subject, v.topic, v.title, v.youtube_id, v.duration, v.professor, thumb, v.order_index]
    );
  }
  logger.info(`Seeded ${videos.length} videos`);

  logger.info('Seed completed!');
  process.exit(0);
}

seed().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
