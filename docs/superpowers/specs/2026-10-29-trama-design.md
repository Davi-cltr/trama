# Trama — Spec de design do MVP

- **Data:** 29/10/2026
- **Status:** aguardando revisão
- **Conceito visual aprovado:** canvas "Trama — conceito visual" (telas: A semana do Theo, Dar um ponto, O mês do Theo)

---

## 1. Por que este projeto existe

### O que foi dito
- O autor quer criar algo útil, que pessoas usem de verdade, e ganhar reconhecimento como desenvolvedor. Monetizar é bem-vindo, mas não é o foco.
- Stack conhecida: React, JavaScript, Python e Ruby. Nível júnior.
- Público: pessoas comuns, não desenvolvedores. Área escolhida: saúde e educação.
- Quer algo visualmente nunca visto, com uma primeira impressão inacreditável.

### O que está sendo assumido
- O autor trabalha sozinho, nas horas livres.
- O projeto é open source.
- A primeira versão roda na web, como PWA, e é usada principalmente no celular.

### O problema
- Matrículas de alunos autistas na educação básica passaram de 636 mil para 918 mil entre 2023 e 2024 (Censo Escolar).
- Quase 40% dos autistas na escola não recebem apoio especializado, e a maioria faz até duas horas semanais de terapia (Mapa Autismo Brasil, 2026). Grande parte do cuidado acontece em casa e na escola.
- Em 96% dos casos quem cuida são pai ou mãe; destes, 92% são mães.
- A informação sobre a criança fica espalhada entre caderninho na mochila, grupos de WhatsApp e a memória de cada adulto. Ninguém enxerga o todo, então padrões passam despercebidos e a consulta começa com "como foi o mês?".
- Pesquisa de concorrência encontrou apenas protótipos acadêmicos para comunicação família–escola–terapeutas e softwares de clínica ABA estrangeiros focados em cobrança. Nenhum produto estabelecido para a família brasileira.

### A proposta
**Trama** é um caderno compartilhado da criança em que cada pessoa que cuida dela é uma linha colorida e cada registro é um ponto bordado. A semana vira um tecido; padrões aparecem a olho nu; o mês vira um pôster que a família pode compartilhar sem expor nada.

### Critérios de sucesso do MVP
1. **5 famílias** usando por **4 semanas seguidas**.
2. Em cada família, pelo menos **1 profissional** (professora, mediadora ou terapeuta) registra além da responsável.
3. Mediana de **3 ou mais registros por semana** por família.
4. Registrar um ponto leva **menos de 15 segundos** (medido no teste de usabilidade).
5. Pelo menos **2 famílias** levam o resumo para uma consulta ou reunião escolar.

---

## 2. Escopo

### Dentro do MVP
- Criar o caderno de uma criança (dona: a responsável).
- Convidar pessoas por link, com papel e cor de linha.
- Dar um ponto (registro rápido) com seis tipos.
- Ver a semana como trama, com detalhe de cada ponto.
- "Mostrar o padrão": leitura automática de padrões simples, explicável.
- Ver o mês como trama e exportar o pôster (PNG) para compartilhar.
- Resumo para consulta (texto gerado por IA, sob pedido e com consentimento).
- Gerenciar pessoas: remover acesso, mudar papel.
- Exportar todos os dados (JSON) e apagar o caderno.

### Fora do MVP (de propósito)
Áudio e fotos, bot de WhatsApp, notificações push, agenda de terapias, versão para clínicas, múltiplas crianças no mesmo caderno, modo offline completo, monetização. Entram só se as famílias pedirem.

---

## 3. Conceito e linguagem visual

### A metáfora
| Elemento do tecido | Significado no produto |
|---|---|
| Tear (fundo azul-jenipapo) | O caderno da criança |
| Faixa horizontal | Um dia, das 6h às 22h |
| Linha colorida | Uma pessoa que cuida |
| Trecho forte da linha | Horário em que a pessoa estava com a criança |
| Ponto bordado | Um registro |
| Formato do ponto | Tipo do registro |
| Fio branco tracejado | Padrão encontrado ligando pontos |

### Tipos de ponto
| Tipo | Formato | Uso |
|---|---|---|
| Crise | X grosso | Algo difícil aconteceu |
| Conquista | Losango cheio | Fez algo novo |
| Funcionou | Anel | Estratégia que ajudou |
| Sono | Traço contínuo (bem) ou traço partido (noite ruim) | Como foi a noite |
| Comida | Dois pontos | Refeição ou recusa |
| Nota | Traço vertical | Qualquer outra coisa |

A cor sempre indica **quem**; o formato sempre indica **o quê**. Assim a trama é legível para quem é daltônico.

### Tokens
**Cores**
| Nome | Hex | Uso |
|---|---|---|
| Jenipapo | `#1C2238` | Texto principal, fundo do tear |
| Névoa | `#E9ECF0` | Fundo das telas |
| Pau-brasil | `#E8678C` (no tear) / `#B3264E` (em fundo claro) | Linha 1 |
| Anil | `#6E8BFF` / `#3552C4` | Linha 2 |
| Cúrcuma | `#F2B33D` / `#8A5E07` | Linha 3 |
| Erva | `#4CC392` / `#226B4C` | Linha 4 |
| Urucum | `#F08A4B` / `#9A4413` | Linha 5 |
| Ipê | `#B98CF2` / `#7A4FC0` | Linha 6 |
| Linha antiga | `#8D96B8` / `#5A6080` | Pontos de quem saiu do caderno |

Cada linha tem um tom para o tear escuro e um para fundos claros; todos os pares foram conferidos com contraste mínimo de 4,7:1 contra o fundo onde aparecem. Máximo de 6 linhas ativas por caderno no MVP.

> Ajuste em relação ao protótipo: o pau-brasil do tear (`#E0517A`, 4,2:1) ficou abaixo do mínimo e foi clareado; cúrcuma, erva e urucum ganharam tons mais escuros para fundos claros.

**Tipografia**
- Títulos: Young Serif.
- Interface e texto: Atkinson Hyperlegible (400 e 700), escolhida pela legibilidade.
- Corpo mínimo 15px; rótulos mínimos 11px no tear (apenas dias e horas).

**Movimento**
- Um único momento orquestrado: ao abrir a semana, as linhas se tecem (cerca de 1,1s) e os pontos aparecem dia a dia.
- "Mostrar o padrão" escurece o resto em 0,45s.
- Ao dar um ponto, o fio se estende e o ponto é bordado.
- Com `prefers-reduced-motion`, tudo aparece pronto, sem animação.

---

## 4. Usuários e permissões

| Papel | Quem | Pode |
|---|---|---|
| Responsável (dona) | Mãe, pai ou responsável legal | Tudo: convidar, remover, editar caderno, exportar, apagar, pedir resumo por IA |
| Cuidador | Avó, outro familiar, babá | Ver a trama, dar pontos, editar e apagar os próprios pontos |
| Escola | Professora, mediadora, AEE | Igual a cuidador |
| Terapia | Fono, TO, psicóloga etc. | Igual a cuidador |

Os papéis de cuidador, escola e terapia têm as mesmas permissões no MVP; o papel serve para a legenda e para o resumo ("a escola observou…"). Só há uma dona por caderno.

---

## 5. Fluxos

### 5.1 Entrar
1. Pessoa informa o e-mail e recebe um link mágico (Supabase Auth). Sem senha.
2. No primeiro acesso, informa como quer ser chamada ("Ana").

### 5.2 Criar o caderno
1. "Para quem é este caderno?" Apelido da criança (obrigatório) e mês/ano de nascimento (opcional).
2. A responsável recebe a primeira linha (pau-brasil).
3. Tela vazia da semana: o tear sem pontos e o convite "Dê o primeiro ponto".

Nenhum CPF, sobrenome, diagnóstico ou laudo é pedido.

### 5.3 Convidar
1. Responsável toca em "Convidar", escolhe o papel e escreve como a pessoa aparece ("Júlia, professora").
2. O app gera um link de uso único, válido por 7 dias, e oferece "Enviar pelo WhatsApp" (link `wa.me` com texto pronto) e "Copiar link".
3. A convidada abre o link, entra com o e-mail e já cai na trama. A cor da linha é atribuída automaticamente, na ordem da paleta.
4. A responsável pode cancelar convites pendentes.

### 5.4 Dar um ponto (objetivo: menos de 15 segundos)
1. Botão "Dar um ponto" na cor da linha de quem está usando.
2. Escolher o tipo (um toque). Para sono: "Dormiu bem" ou "Noite ruim".
3. Texto opcional de até 280 caracteres.
4. Horário: "Agora" por padrão; pode mudar para outro horário do dia ou de até 7 dias atrás.
5. "Dar o ponto" salva e mostra "Ponto dado." com a animação do fio.

Pontos podem ser editados ou apagados apenas por quem os criou, ou pela responsável.

### 5.5 Ver a semana
- Uma faixa por dia, de segunda a domingo, das 6h às 22h. Pontos antes das 6h vão para a borda esquerda, depois das 22h para a direita, com indicação no detalhe.
- Os trechos fortes de cada linha são derivados dos próprios pontos: para cada pessoa e dia, do primeiro ao último ponto, com margem de 30 minutos. Não existe cadastro de horário de presença no MVP.
- Tocar num ponto abre o detalhe: quem, quando, tipo e texto.
- Setas para semanas anteriores.

> Mudança em relação ao protótipo: no conceito, os trechos fortes mostravam turnos completos (ex.: escola das 8h às 12h30). Isso exigiria cadastrar agendas, o que está fora do MVP. A versão derivada dos pontos mantém o efeito visual sem trabalho extra para as famílias.

### 5.6 Mostrar o padrão
- O cartão abaixo da trama mostra o padrão mais forte da semana, se houver.
- Botão "Mostrar o padrão" escurece o resto e liga os pontos envolvidos com o fio branco.
- Os padrões vêm de **regras fixas, calculadas no próprio app** (ver 7.3), não de IA. Por isso o texto do cartão diz "Leitura automática dos registros. Não substitui avaliação profissional."
- Sem padrão na semana: o cartão some.

### 5.7 Ver o mês e compartilhar
- Mesma trama, uma faixa por dia do mês, mais compacta.
- "Compartilhar pôster" gera um PNG de 1080×1350 com: título "{Mês} do {apelido}", o número de pontos, a legenda de linhas (só nomes de exibição) e "Feito no Trama".
- O pôster **nunca** inclui o texto dos registros nem os tipos por extenso.
- Antes de gerar, opção "Esconder nomes" (substitui por "mãe", "escola" etc.) e "Esconder o apelido".

### 5.8 Resumo para a consulta
1. Responsável escolhe o período (semana, 2 semanas, mês).
2. Na primeira vez, um aviso explica: o texto dos registros do período será enviado a um serviço de IA para gerar o resumo; nomes são trocados por papéis; nada é guardado pelo serviço para treino. Ela aceita ou não. O consentimento fica registrado e pode ser revogado.
3. O resumo traz: visão geral, crises (quantas, quando, o que veio antes), conquistas, o que funcionou, observações de cada papel e os padrões automáticos encontrados.
4. Página pronta para imprimir ou salvar em PDF pelo navegador, com aviso de que não é diagnóstico.

### 5.9 Pessoas, exportação e exclusão
- Tela "Pessoas": lista linhas, papéis e convites pendentes. A responsável remove acessos; a pessoa removida deixa de ver o caderno, mas seus pontos continuam na trama, desenhados na cor "linha antiga" e identificados pelo rótulo. A cor dela fica livre para um novo convite.
- "Exportar dados": baixa um JSON com caderno, pessoas e pontos.
- "Apagar caderno": confirmação digitando o apelido da criança; apaga tudo em definitivo.
- Qualquer pessoa pode sair de um caderno e apagar a própria conta.

---

## 6. Arquitetura

### Visão geral
```
Celular (PWA React)
  │  supabase-js (Auth + Postgres via PostgREST, protegido por RLS)
  ▼
Supabase
  ├─ Auth (link mágico por e-mail)
  ├─ Postgres + Row Level Security
  └─ Edge Functions
       ├─ aceitar-convite
       └─ gerar-resumo ──► API do Claude
```

- **Frontend:** React 19, Vite, TypeScript, React Router, TanStack Query para dados do servidor, CSS Modules com os tokens em variáveis CSS. PWA com `vite-plugin-pwa` (instalável; cache do app, não dos dados).
- **Backend:** Supabase. Toda regra de acesso vive no banco (RLS); o frontend nunca é a barreira de segurança.
- **IA:** API do Claude chamada só pela Edge Function `gerar-resumo`, com a chave guardada como secret do Supabase.
- **Hospedagem:** Vercel (frontend) e Supabase (plano gratuito no MVP).
- **Licença:** AGPL-3.0, para que versões derivadas hospedadas por terceiros continuem abertas.

### Unidades e fronteiras
Cada unidade tem uma responsabilidade e pode ser testada sozinha.

| Unidade | Faz | Entrada → Saída | Depende de |
|---|---|---|---|
| `domain/` | Tipos e regras do domínio (tipos de ponto, papéis, paleta) | — | nada |
| `tapestry/layout` | Converte pontos em geometria da trama | `(pontos, pessoas, período, dimensões)` → `{faixas, trechos, pontos posicionados}` | `domain` |
| `tapestry/patterns` | Detecta padrões | `(pontos, pessoas, período)` → `Padrao[]` | `domain` |
| `tapestry/render` | Componentes SVG da semana e do mês | geometria → SVG | `layout` |
| `poster/` | Gera o PNG do pôster | geometria do mês + opções → `Blob` | `render` |
| `data/` | Acesso ao Supabase (queries e mutations) | — | supabase-js |
| `features/*` | Telas: entrar, caderno, dar ponto, semana, mês, pessoas, resumo | — | todas acima |
| Edge `aceitar-convite` | Valida token e cria o vínculo | token + usuário → membro | Postgres |
| Edge `gerar-resumo` | Monta o prompt pseudonimizado e chama a IA | caderno + período → texto | Postgres, API do Claude |

`layout` e `patterns` são funções puras: sem React, sem rede. É ali que mora a lógica mais delicada, e é onde os testes mais pesam.

---

## 7. Dados

### 7.1 Tabelas
```sql
perfis
  id            uuid  pk  = auth.users.id
  nome_exibicao text  not null  (1–40)
  criado_em     timestamptz

cadernos
  id            uuid pk
  apelido       text not null  (1–30)
  nascimento    date null       -- apenas mês/ano; dia fixo em 1
  dona_id       uuid not null → perfis.id
  fuso          text not null default 'America/Sao_Paulo'
  criado_em     timestamptz

membros
  id            uuid pk
  caderno_id    uuid → cadernos.id  on delete cascade
  perfil_id     uuid → perfis.id    null  -- null depois que a pessoa sai e apaga a conta
  papel         text check in ('responsavel','cuidador','escola','terapia')
  rotulo        text not null  (1–40)  -- "Júlia, professora"
  cor           smallint not null check 0..5
  ativo         boolean not null default true
  unique (caderno_id, cor) where ativo
  unique (caderno_id, perfil_id) where ativo

convites
  id            uuid pk
  caderno_id    uuid → cadernos.id on delete cascade
  token_hash    text not null unique   -- só o hash é guardado
  papel, rotulo
  expira_em     timestamptz not null   -- criado_em + 7 dias
  usado_em      timestamptz null
  cancelado_em  timestamptz null

pontos
  id            uuid pk
  caderno_id    uuid → cadernos.id on delete cascade
  membro_id     uuid → membros.id
  tipo          text check in ('crise','conquista','funcionou','sono','comida','nota')
  sono_ruim     boolean null  -- obrigatório quando tipo = 'sono', nulo nos demais
  texto         text null  (≤ 280)
  ocorreu_em    timestamptz not null  -- entre agora - 7 dias e agora + 5 min
  criado_em, editado_em

consentimentos_ia
  caderno_id    uuid pk → cadernos.id on delete cascade
  aceito_em     timestamptz null
  revogado_em   timestamptz null
```

### 7.2 Regras de acesso (RLS)
- `cadernos`: lê quem é membro ativo; altera e apaga só a dona.
- `membros`: lê quem é membro ativo do caderno; insere só via Edge Function `aceitar-convite` (com service role) ou na criação do caderno; atualiza e desativa só a dona; a própria pessoa pode se desativar.
- `convites`: só a dona lê, cria e cancela.
- `pontos`: lê quem é membro ativo; insere quem é membro ativo, apenas com o próprio `membro_id`; edita e apaga o autor ou a dona.
- `consentimentos_ia`: só a dona.
- Uma função `sou_membro(caderno_id)` com `security definer` concentra a checagem, para evitar recursão de políticas.

### 7.3 Padrões automáticos (MVP)
Cada regra devolve os pontos envolvidos (para o fio branco) e uma frase pronta. Só aparece se houver **pelo menos 3 ocorrências** no período.

1. **Noite ruim → crise:** ponto de sono marcado como noite ruim e ponto de crise no mesmo dia, antes das 18h.
   *"Nas {n} vezes em que dormiu mal, o {apelido} teve crise no mesmo dia."*
2. **Horário de crise:** 3 ou mais crises dentro da mesma janela de 2 horas.
   *"{n} das crises da semana foram entre {h1} e {h2}."*
3. **O que funcionou se repete:** a mesma pessoa marcou "funcionou" em 3 ou mais dias.
   *"{rótulo} marcou o que funcionou em {n} dias. Vale todos tentarem."*

Prioridade de exibição: 1, depois 2, depois 3. O cartão mostra só o primeiro encontrado; os demais entram no resumo.

### 7.4 Pseudonimização para a IA
Antes de chamar a API, a Edge Function troca o apelido por "a criança" e cada rótulo pelo papel ("responsável", "escola 1", "terapia 1"). O texto livre dos pontos é enviado como está, por isso o aviso de consentimento explica isso. A resposta volta com os papéis, e o app recoloca os rótulos só na tela.

---

## 8. Erros e estados vazios

| Situação | O que a pessoa vê |
|---|---|
| Sem internet ao dar um ponto | O ponto fica guardado no aparelho como rascunho e aparece "Sem conexão. O ponto será dado quando a internet voltar." com botão "Tentar agora". |
| Convite expirado ou usado | "Este convite não vale mais. Peça um novo para quem te convidou." |
| Removida de um caderno | O caderno some da lista e aparece "Você não tem mais acesso ao caderno do {apelido}." |
| Semana sem pontos | O tear vazio e "Nenhum ponto nesta semana. Dê o primeiro." |
| Falha ao gerar resumo | "Não foi possível gerar o resumo agora. Seus registros estão salvos. Tente de novo em alguns minutos." |
| Seis linhas ativas | "Este caderno já tem 6 linhas. Remova alguém para convidar outra pessoa." |

---

## 9. Privacidade e LGPD
- Registros sobre a saúde de uma criança são **dados pessoais sensíveis**. A base legal é o consentimento específico da responsável legal, coletado na criação do caderno com texto simples.
- Minimização: só apelido e, opcionalmente, mês/ano de nascimento.
- Exportação e exclusão completas pela própria responsável (seção 5.9).
- IA apenas sob pedido, com consentimento separado e revogável (5.8 e 7.4).
- Sem analytics de terceiros no MVP. Métricas de sucesso vêm de consultas agregadas no próprio banco.
- Página de privacidade em linguagem simples antes do lançamento com famílias.

---

## 10. Testes
1. **Funções puras (Vitest):** `layout` (posições, bordas antes das 6h/depois das 22h, trechos derivados) e `patterns` (cada regra com casos que disparam e que não disparam). Escritas antes do código (TDD).
2. **Regras de acesso:** testes SQL com pgTAP rodando no Supabase local, cobrindo: não membro não lê nada; membro não edita ponto alheio; pessoa removida perde acesso; só a dona convida e apaga.
3. **Componentes (Testing Library):** dar um ponto, cartão de padrão, convite.
4. **Ponta a ponta (Playwright):** criar caderno → convidar → aceitar → dar ponto → ver na semana do outro → exportar pôster.
5. **Acessibilidade:** axe nos testes de componente; navegação por teclado no fluxo de dar ponto; contraste conferido pelos tokens.
6. **Usabilidade:** cronometrar 5 pessoas dando um ponto; meta abaixo de 15 segundos.

---

## 11. Semana 0: validação antes do código
Conversar com 3 a 5 mães ou pais de crianças autistas e 1 a 2 professoras de AEE ou mediadoras. Mostrar o canvas do conceito só no fim da conversa.

**Roteiro (20 minutos)**
1. Conte como foi a última semana do seu filho. Quem esteve com ele?
2. Como você fica sabendo do que aconteceu na escola ou na terapia?
3. Onde essas informações ficam hoje? (caderno, WhatsApp, cabeça)
4. Quando foi a última vez que você percebeu um padrão? Como percebeu?
5. Como você se prepara para uma consulta?
6. (Mostrar o conceito) O que você entende desta tela? O que faria primeiro?
7. Você mostraria o pôster do mês para alguém? Para quem?

**Sinais de que vale seguir:** ao menos 3 pessoas descrevem informação espalhada como um problema real, e ao menos 2 entendem a trama sem explicação.
**Sinais de alerta:** ninguém se prepara para consultas, ou a escola se recusa a usar qualquer ferramenta fora das oficiais.

---

## 12. Riscos
| Risco | Mitigação |
|---|---|
| Professoras não aderem (falta de tempo, regra da escola) | Registro em menos de 15s; convite pelo WhatsApp; a trama funciona mesmo só com a família |
| A trama confunde em vez de ajudar | Legenda sempre visível; detalhe ao tocar; validação na semana 0 |
| Padrões sugerem relação causal indevida | Texto descritivo ("nas 3 noites… teve crise"), nunca causal; aviso de que não substitui avaliação |
| Vazamento de dados sensíveis | RLS testada; segredos só no servidor; nada sensível no pôster |
| Custo da IA | Resumo só sob pedido; limite de 10 resumos por caderno por mês no MVP |
| Escopo cresce | Lista "fora do MVP" é regra; novidades só após as 4 semanas |

---

## 13. Fontes
- Censo Escolar 2024 (MEC/Inep), via Extra Classe: matrículas de autistas.
- Mapa Autismo Brasil (Instituto Autismos, 2026), via IntraMed, IstoÉ Dinheiro e Meu Tudo: apoio escolar, terapias e cuidadores.
- SBC (SBSI 2024) e ERBASE 2020: protótipos acadêmicos de comunicação família–escola–terapia.
