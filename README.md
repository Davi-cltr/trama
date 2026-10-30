# Trama

Um caderno compartilhado da criança: cada pessoa que cuida é uma linha colorida e cada registro é um ponto bordado. A semana vira um tecido, os padrões aparecem a olho nu e o mês vira um pôster que a família pode compartilhar sem expor nada.

PWA em React + Vite + TypeScript, com Supabase (Auth por link mágico, Postgres com RLS e uma Edge Function que chama a API do Claude para o resumo da consulta).

- Spec: `docs/superpowers/specs/2026-10-29-trama-design.md`
- Plano de implementação: `docs/superpowers/plans/2026-10-29-trama-mvp.md`
- Conceito visual: `docs/conceito/`

## Requisitos

- Node 20 ou mais novo
- Docker (para o Supabase local)

## Rodar localmente

```bash
npm install
npx supabase start
```

O `supabase start` imprime a `API URL` e a `anon key`. Copie para o `.env.local`:

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

Abra http://localhost:5173. Os e-mails com o link de entrada chegam no Mailpit: http://127.0.0.1:54324.

## Testes

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npx supabase test db
```

```bash
npx playwright test
```

- `npm test`: Vitest (funções puras da trama, padrões, componentes com Testing Library e axe).
- `npx supabase test db`: testes pgTAP das regras de acesso (RLS) e das funções do banco. Precisa do `npx supabase start`.
- `npx playwright test`: fluxo de ponta a ponta com duas pessoas (criar caderno, convidar, aceitar, dar ponto, ver na semana, gerar pôster). Precisa do Supabase local; sobe o Vite sozinho. Com `CAPTURAS=pasta` guarda imagens das telas.

## Publicar

### Supabase (produção)

1. Crie um projeto em https://supabase.com e anote o `project ref`.
2. Ligue o projeto local ao remoto e aplique as migrations:

```bash
npx supabase link --project-ref SEU_PROJECT_REF
```

```bash
npx supabase db push
```

3. Publique a função do resumo e configure a chave da API do Claude (fica só no servidor):

```bash
npx supabase functions deploy gerar-resumo
```

```bash
npx supabase secrets set ANTHROPIC_API_KEY=sua-chave
```

Opcional: `npx supabase secrets set ANTHROPIC_MODEL=...` (padrão `claude-sonnet-5-5`).

4. Em Authentication → URL Configuration, defina o **Site URL** com o endereço do app (ex. `https://trama.vercel.app`) e adicione `https://trama.vercel.app/**` em **Redirect URLs**. Sem isso o link mágico não volta para o app.

### Vercel (frontend)

1. Importe o repositório na Vercel (framework: Vite).
2. Configure as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os valores do projeto Supabase.
3. Publique. O `vercel.json` manda todas as rotas para o `index.html`.

## Privacidade

Registros sobre a saúde de uma criança são dados pessoais sensíveis. O app pede só apelido e, se a família quiser, mês e ano de nascimento; não usa analytics de terceiros; a IA só é chamada sob pedido da responsável, com consentimento separado e revogável, e com nomes trocados por papéis. Veja a página `/privacidade` do app.

## Licença

AGPL-3.0. Veja `LICENSE`.
