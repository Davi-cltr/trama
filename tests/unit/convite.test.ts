import { gerarToken, hashToken, linkDoConvite, linkWhatsApp, mensagemDeErro, ehErroDeRede } from '../../src/data/convite';

it('token tem 32 bytes em base64url e não se repete', () => {
  const a = gerarToken();
  expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(gerarToken()).not.toBe(a);
});

it('hash igual ao do pgcrypto', async () => {
  expect(await hashToken('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

it('token vai no fragmento da URL', () => {
  expect(linkDoConvite('tok', 'https://trama.app')).toBe('https://trama.app/convite#tok');
});

it('link do WhatsApp com texto pronto e artigo certo', () => {
  const texto = decodeURIComponent(linkWhatsApp('https://x/convite#t', 'Júlia', { apelido: 'Maria', tratamento: 'a' }));
  expect(texto).toContain('trama da Maria');
  expect(texto).toContain('o dia a dia dela junto');
  expect(texto).toContain('https://x/convite#t');
  expect(linkWhatsApp('l', 'J', { apelido: 'Kim', tratamento: '' })).toMatch(/^https:\/\/wa\.me\/\?text=/);
  expect(decodeURIComponent(linkWhatsApp('l', 'J', { apelido: 'Kim', tratamento: '' }))).toContain('dele ou dela');
});

it('mapeia erros do banco para frases do spec', () => {
  expect(mensagemDeErro({ message: 'convite_invalido' })).toBe('Este convite não vale mais. Peça um novo para quem te convidou.');
  expect(mensagemDeErro({ message: 'sem_linha_livre' })).toBe('Este caderno já tem 6 linhas. Remova alguém para convidar outra pessoa.');
  expect(mensagemDeErro({ message: 'ja_membro' })).toBe('Você já faz parte desta trama.');
  expect(mensagemDeErro({ message: 'dona_de_caderno' })).toBe('Antes de apagar sua conta, apague os cadernos em que você é a responsável.');
  expect(mensagemDeErro(new Error('qualquer coisa'))).toBe('Algo deu errado. Tente de novo.');
});

it('reconhece falha de rede', () => {
  expect(ehErroDeRede(new TypeError('Failed to fetch'))).toBe(true);
  expect(ehErroDeRede({ message: 'TypeError: NetworkError when attempting to fetch resource.' })).toBe(true);
  expect(ehErroDeRede({ message: 'convite_invalido' })).toBe(false);
});
