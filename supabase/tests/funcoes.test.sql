begin;
create extension if not exists pgtap with schema extensions;
select plan(26);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@exemplo.com'),
  ('00000000-0000-0000-0000-00000000000b', 'julia@exemplo.com'),
  ('00000000-0000-0000-0000-00000000000c', 'ze@exemplo.com');
insert into perfis (id, nome_exibicao) values
  ('00000000-0000-0000-0000-00000000000a', 'Ana'),
  ('00000000-0000-0000-0000-00000000000b', 'Júlia'),
  ('00000000-0000-0000-0000-00000000000c', 'Zé');

create function pg_temp.como(p uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;
create table pg_temp.ids (nome text primary key, id uuid);
grant all on pg_temp.ids to authenticated;

-- criar_caderno
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
insert into pg_temp.ids values ('theo', criar_caderno('Theo', 'o', '2019-03-01', 'Ana, mãe'));
select isnt((select id from pg_temp.ids where nome = 'theo'), null, 'criar_caderno devolve o id');
select is((select count(*) from cadernos), 1::bigint, 'dona vê o caderno criado');
select is((select row(papel, cor, rotulo)::text from membros), row('responsavel', 0::smallint, 'Ana, mãe')::text, 'dona vira a linha pau-brasil');
select is((select tratamento from cadernos), 'o', 'guarda o tratamento');
reset role;

-- convites
insert into convites (caderno_id, token_hash, papel, rotulo, usado_em, cancelado_em, expira_em)
select (select id from pg_temp.ids where nome = 'theo'), encode(extensions.digest(t, 'sha256'), 'hex'), 'escola', 'Júlia, professora', u, c, e
from (values
  ('valido', null::timestamptz, null::timestamptz, now() + interval '7 days'),
  ('token-da-ana', null, null, now() + interval '7 days'),
  ('usado', now() - interval '1 day', null, now() + interval '6 days'),
  ('expirado', null, null, now() - interval '1 minute'),
  ('cancelado', null, now(), now() + interval '7 days')
) v(t, u, c, e);

insert into cadernos (id, apelido, dona_id) values ('11111111-0000-0000-0000-0000000000ff', 'Cheio', '00000000-0000-0000-0000-00000000000b');
insert into membros (caderno_id, perfil_id, papel, rotulo, cor)
select '11111111-0000-0000-0000-0000000000ff', case when i = 0 then '00000000-0000-0000-0000-00000000000b'::uuid end,
       case when i = 0 then 'responsavel' else 'cuidador' end, 'Pessoa ' || i, i
from generate_series(0, 5) i;
insert into convites (caderno_id, token_hash, papel, rotulo)
values ('11111111-0000-0000-0000-0000000000ff', encode(extensions.digest('cheio', 'sha256'), 'hex'), 'cuidador', 'Mais uma');

select pg_temp.como('00000000-0000-0000-0000-00000000000a');
select throws_ok($$ select aceitar_convite('token-da-ana') $$, 'P0001', 'ja_membro', 'dona abrindo o próprio convite');
reset role;

select pg_temp.como('00000000-0000-0000-0000-00000000000c');
select throws_ok($$ select aceitar_convite('usado') $$, 'P0001', 'convite_invalido', 'convite usado');
select throws_ok($$ select aceitar_convite('expirado') $$, 'P0001', 'convite_invalido', 'convite expirado');
select throws_ok($$ select aceitar_convite('cancelado') $$, 'P0001', 'convite_invalido', 'convite cancelado');
select throws_ok($$ select aceitar_convite('nao-existe') $$, 'P0001', 'convite_invalido', 'convite inexistente');
select throws_ok($$ select aceitar_convite('cheio') $$, 'P0001', 'sem_linha_livre', 'caderno com 6 linhas');
select is(aceitar_convite('valido'), (select id from pg_temp.ids where nome = 'theo'), 'aceita e devolve o caderno');
select is((select cor from membros where perfil_id = '00000000-0000-0000-0000-00000000000c'), 1::smallint, 'recebe a menor cor livre');
select is((select papel || '|' || rotulo from membros where perfil_id = '00000000-0000-0000-0000-00000000000c'), 'escola|Júlia, professora', 'papel e rótulo vêm do convite');
select throws_ok($$ select aceitar_convite('valido') $$, 'P0001', 'convite_invalido', 'convite é de uso único');
reset role;

-- apagar_minha_conta
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
select throws_ok($$ select apagar_minha_conta() $$, 'P0001', 'dona_de_caderno', 'dona não apaga a conta');
reset role;
select is((select count(*) from cadernos where id = (select id from pg_temp.ids where nome = 'theo')), 1::bigint, 'nada foi apagado');
select is((select count(*) from perfis where id = '00000000-0000-0000-0000-00000000000a'), 1::bigint, 'perfil da dona continua');

select pg_temp.como('00000000-0000-0000-0000-00000000000c');
select lives_ok($$ select apagar_minha_conta() $$, 'membro apaga a própria conta');
reset role;
select is((select count(*) from auth.users where id = '00000000-0000-0000-0000-00000000000c'), 0::bigint, 'usuário some do auth');
select is((select count(*) from membros where rotulo = 'Júlia, professora' and not ativo and perfil_id is null), 1::bigint, 'linha fica inativa e sem perfil');

-- validar_ponto
insert into pg_temp.ids select 'ana', id from membros where perfil_id = '00000000-0000-0000-0000-00000000000a' and caderno_id = (select id from pg_temp.ids where nome = 'theo');
prepare ponto(text, boolean, text, timestamptz) as
  insert into pontos (caderno_id, membro_id, tipo, sono_ruim, texto, ocorreu_em)
  values ((select id from pg_temp.ids where nome = 'theo'), (select id from pg_temp.ids where nome = 'ana'), $1, $2, $3, $4);
select throws_ok($$ execute ponto('nota', null, null, now() - interval '8 days') $$, '23514', null, 'ponto antigo demais');
select throws_ok($$ execute ponto('nota', null, null, now() + interval '6 minutes') $$, '23514', null, 'ponto no futuro');
select throws_ok($$ execute ponto('sono', null, null, now()) $$, '23514', null, 'sono sem bem/ruim');
select throws_ok($$ execute ponto('crise', true, null, now()) $$, '23514', null, 'só sono tem noite ruim');
select throws_ok($$ execute ponto('nota', null, repeat('a', 281), now()) $$, '23514', null, 'texto acima de 280');
select throws_ok($$ insert into pontos (caderno_id, membro_id, tipo, ocorreu_em) select '11111111-0000-0000-0000-0000000000ff', id, 'nota', now() from pg_temp.ids where nome = 'ana' $$,
  '23514', null, 'membro de outro caderno');

select * from finish();
rollback;
