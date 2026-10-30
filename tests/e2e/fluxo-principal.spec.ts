import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { linkMagico } from './helpers/email';

async function entrar(page: Page, email: string, nome: string) {
  await expect(page.getByRole('heading', { name: 'Entre na Trama' })).toBeVisible();
  const antes = new Date();
  await page.getByLabel('Seu e-mail').fill(email);
  await page.getByRole('button', { name: 'Enviar link' }).click();
  await expect(page.getByText(`Enviamos um link para ${email}.`)).toBeVisible();
  await page.goto(await linkMagico(email, antes));
  await expect(page.getByRole('heading', { name: 'Como você quer ser chamada?' })).toBeVisible();
  await page.getByLabel('Seu nome').fill(nome);
  await page.getByRole('button', { name: 'Continuar' }).click();
}

// CAPTURAS=pasta guarda imagens das telas para conferência visual.
async function capturar(page: Page, nome: string) {
  if (!process.env.CAPTURAS) return;
  await page.waitForTimeout(2500); // deixa o tecer terminar
  await page.screenshot({ path: `${process.env.CAPTURAS}/${nome}.png`, fullPage: true });
}

async function semViolacoes(page: Page) {
  const r = await new AxeBuilder({ page }).analyze();
  expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

test('criar caderno, convidar, aceitar, dar ponto, ver na semana e gerar o pôster', async ({ browser }) => {
  const id = Date.now();
  const ana = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const julia = await browser.newContext();
  const paginaAna = await ana.newPage();
  const paginaJulia = await julia.newPage();

  // 1. Ana entra pelo link mágico e cria o caderno do Theo.
  await paginaAna.goto('/');
  await entrar(paginaAna, `ana.${id}@exemplo.com`, 'Ana');
  await expect(paginaAna.getByRole('heading', { name: 'Seus cadernos' })).toBeVisible();
  await paginaAna.getByRole('link', { name: 'Novo caderno' }).click();
  await paginaAna.getByLabel('Apelido').fill('Theo');
  await paginaAna.getByRole('radio', { name: 'o Theo' }).check();
  await expect(paginaAna.getByLabel('Como você aparece na trama')).toHaveValue('Ana, mãe');
  await paginaAna.getByRole('button', { name: 'Criar caderno' }).click();
  await expect(paginaAna.getByRole('heading', { name: 'A semana do Theo' })).toBeVisible();
  await expect(paginaAna.getByText('Nenhum ponto nesta semana. Dê o primeiro.')).toBeVisible();
  await semViolacoes(paginaAna);
  const urlSemana = paginaAna.url();

  // 2. Ana convida a Júlia (Escola) e copia o link.
  await paginaAna.getByRole('link', { name: 'Pessoas da trama' }).click();
  await expect(paginaAna.getByRole('heading', { name: 'Pessoas' })).toBeVisible();
  await capturar(paginaAna, 'pessoas');
  await semViolacoes(paginaAna);
  await paginaAna.getByRole('button', { name: 'Convidar' }).click();
  const dialogo = paginaAna.getByRole('dialog');
  await dialogo.getByRole('radio', { name: 'Escola' }).check();
  await dialogo.getByLabel('Como a pessoa aparece').fill('Júlia, professora');
  await dialogo.getByRole('button', { name: 'Criar convite' }).click();
  await dialogo.getByRole('button', { name: 'Copiar link' }).click();
  await expect(dialogo.getByText('Link copiado.')).toBeVisible();
  const convite = await paginaAna.evaluate(() => navigator.clipboard.readText());
  expect(convite).toMatch(/\/convite#[A-Za-z0-9_-]{43}$/);

  // 3. Júlia abre o link, entra, informa o nome e cai na semana do Theo.
  await paginaJulia.goto(convite);
  await entrar(paginaJulia, `julia.${id}@exemplo.com`, 'Júlia');
  await expect(paginaJulia.getByRole('heading', { name: 'A semana do Theo' })).toBeVisible();

  // 4. Júlia dá um ponto "Funcionou" (cronometrado).
  const inicio = Date.now();
  await paginaJulia.getByRole('link', { name: 'Dar um ponto' }).click();
  await paginaJulia.getByRole('button', { name: /Funcionou/ }).click();
  await paginaJulia.getByLabel('Conte em poucas palavras (opcional)').fill('fone no recreio');
  await semViolacoes(paginaJulia);
  await capturar(paginaJulia, 'dar-ponto');
  await paginaJulia.getByRole('button', { name: 'Dar o ponto' }).click();
  await expect(paginaJulia.getByRole('heading', { name: 'Ponto dado.' })).toBeVisible();
  await capturar(paginaJulia, 'ponto-dado');
  expect(Date.now() - inicio).toBeLessThan(15_000);

  // 5. Ana recarrega a semana e encontra o ponto da Júlia.
  await paginaAna.goto(urlSemana);
  const pontoDaJulia = paginaAna.getByRole('button', { name: /^Funcionou, Júlia, professora, / });
  await expect(pontoDaJulia).toBeVisible();
  await capturar(paginaAna, 'semana');
  await pontoDaJulia.click();
  await expect(paginaAna.getByRole('dialog')).toContainText('fone no recreio');
  await paginaAna.keyboard.press('Escape');

  // 6. Ana abre o mês, gera o pôster e recebe um PNG.
  await paginaAna.getByRole('link', { name: 'Mês' }).click();
  await expect(paginaAna.getByRole('heading', { name: 'O mês do Theo' })).toBeVisible();
  await paginaAna.getByRole('button', { name: 'Compartilhar pôster' }).click();
  const [download] = await Promise.all([
    paginaAna.waitForEvent('download'),
    paginaAna.getByRole('dialog').getByRole('button', { name: 'Gerar pôster' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^trama-[a-zç]+-\d{4}\.png$/);

  await ana.close();
  await julia.close();
});
