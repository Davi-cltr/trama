begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

-- Pessoas: Ana (dona), Júlia (membro), Zé (estranho)
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@exemplo.com'),
  ('00000000-0000-0000-0000-00000000000b', 'julia@exemplo.com'),
  ('00000000-0000-0000-0000-00000000000c', 'ze@exemplo.com');
insert into perfis (id, nome_exibicao) values
  ('00000000-0000-0000-0000-00000000000a', 'Ana'),
  ('00000000-0000-0000-0000-00000000000b', 'Júlia'),
  ('00000000-0000-0000-0000-00000000000c', 'Zé');
insert into cadernos (id, apelido, tratamento, dona_id) values
  ('11111111-0000-0000-0000-000000000001', 'Theo', 'o', '00000000-0000-0000-0000-00000000000a');
insert into membros (id, caderno_id, perfil_id, papel, rotulo, cor) values
  ('22222222-0000-0000-0000-00000000000a', '11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'responsavel', 'Ana, mãe', 0),
  ('22222222-0000-0000-0000-00000000000b', '11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b', 'escola', 'Júlia, professora', 1);
insert into pontos (id, caderno_id, membro_id, tipo, texto, ocorreu_em) values
  ('33333333-0000-0000-0000-00000000000a', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-00000000000a', 'nota', 'da Ana', now() - interval '1 hour'),
  ('33333333-0000-0000-0000-00000000000b', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-00000000000b', 'crise', 'da Júlia', now() - interval '2 hours');
insert into convites (caderno_id, token_hash, papel, rotulo) values
  ('11111111-0000-0000-0000-000000000001', 'hash-qualquer', 'terapia', 'Rafa, fono');

create function pg_temp.como(p uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

-- Zé, estranho
select pg_temp.como('00000000-0000-0000-0000-00000000000c');
select is((select count(*) from pontos), 0::bigint, 'estranho não lê pontos');
select is((select count(*) from cadernos), 0::bigint, 'estranho não lê cadernos');
select is((select count(*) from membros), 0::bigint, 'estranho não lê membros');
select throws_ok($$ insert into cadernos (apelido, dona_id) values ('X', '00000000-0000-0000-0000-00000000000c') $$, '42501', null, 'caderno só nasce pela função criar_caderno');
select throws_ok($$ insert into membros (caderno_id, perfil_id, papel, rotulo, cor) values ('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000c', 'cuidador', 'Zé', 2) $$, '42501', null, 'ninguém se insere como membro direto');
reset role;

-- Júlia, membro
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
select is((select count(*) from pontos), 2::bigint, 'membro lê os pontos do caderno');
select is_empty($$ update pontos set texto = 'x' where id = '33333333-0000-0000-0000-00000000000a' returning 1 $$, 'membro não edita ponto alheio');
select is_empty($$ delete from pontos where id = '33333333-0000-0000-0000-00000000000a' returning 1 $$, 'membro não apaga ponto alheio');
select is((select count(*) from convites), 0::bigint, 'membro não lê convites');
select throws_ok($$ insert into pontos (caderno_id, membro_id, tipo, ocorreu_em) values ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-00000000000a', 'nota', now()) $$,
  '42501', null, 'não dá ponto em nome de outra pessoa');
select lives_ok($$ insert into pontos (caderno_id, membro_id, tipo, ocorreu_em) values ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-00000000000b', 'nota', now()) $$,
  'membro dá ponto com a própria linha');
select throws_ok($$ update membros set cor = 5 where id = '22222222-0000-0000-0000-00000000000b' $$, 'P0001', 'so_a_dona', 'membro não muda a própria cor');
select is_empty($$ update membros set rotulo = 'x' where id = '22222222-0000-0000-0000-00000000000a' returning 1 $$, 'membro não altera outra pessoa');
reset role;

-- Ana, dona
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
select is((select count(*) from convites), 1::bigint, 'dona lê convites');
select lives_ok($$ update pontos set texto = 'editado pela dona' where id = '33333333-0000-0000-0000-00000000000b' $$, 'dona edita ponto de outra pessoa');
select throws_ok($$ update membros set ativo = false where id = '22222222-0000-0000-0000-00000000000a' $$, 'P0001', 'dona_nao_sai', 'dona não remove a própria linha');
select lives_ok($$ update membros set ativo = false where id = '22222222-0000-0000-0000-00000000000b' $$, 'dona remove');
reset role;

-- Júlia, removida
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
select is((select count(*) from pontos), 0::bigint, 'removida perde acesso aos pontos');
select is((select count(*) from cadernos), 0::bigint, 'removida perde acesso ao caderno');
reset role;

select is((select count(*) from pontos where membro_id = '22222222-0000-0000-0000-00000000000b'), 2::bigint, 'pontos de quem saiu continuam na trama');

select * from finish();
rollback;
