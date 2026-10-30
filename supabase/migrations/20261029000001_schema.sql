-- Trama: tabelas, índices e validação de pontos.
create extension if not exists pgcrypto with schema extensions;

create table perfis (
  id            uuid primary key references auth.users (id) on delete cascade,
  nome_exibicao text not null check (char_length(nome_exibicao) between 1 and 40),
  criado_em     timestamptz not null default now()
);

create table cadernos (
  id          uuid primary key default gen_random_uuid(),
  apelido     text not null check (char_length(apelido) between 1 and 30),
  tratamento  text not null default '' check (tratamento in ('o', 'a', '')),
  nascimento  date null check (nascimento is null or extract(day from nascimento) = 1),
  dona_id     uuid not null references perfis (id) on delete restrict,
  fuso        text not null default 'America/Sao_Paulo',
  criado_em   timestamptz not null default now()
);

create table membros (
  id          uuid primary key default gen_random_uuid(),
  caderno_id  uuid not null references cadernos (id) on delete cascade,
  perfil_id   uuid null references perfis (id) on delete set null,
  papel       text not null check (papel in ('responsavel', 'cuidador', 'escola', 'terapia')),
  rotulo      text not null check (char_length(rotulo) between 1 and 40),
  cor         smallint not null check (cor between 0 and 5),
  ativo       boolean not null default true,
  entrou_em   timestamptz not null default now()
);
create unique index membros_cor_ativa on membros (caderno_id, cor) where ativo;
create unique index membros_perfil_ativo on membros (caderno_id, perfil_id) where ativo;
create index membros_caderno_ativos on membros (caderno_id) where ativo;
create index membros_perfil on membros (perfil_id);

create table convites (
  id            uuid primary key default gen_random_uuid(),
  caderno_id    uuid not null references cadernos (id) on delete cascade,
  token_hash    text not null unique,
  papel         text not null check (papel in ('cuidador', 'escola', 'terapia')),
  rotulo        text not null check (char_length(rotulo) between 1 and 40),
  criado_em     timestamptz not null default now(),
  expira_em     timestamptz not null default now() + interval '7 days',
  usado_em      timestamptz null,
  cancelado_em  timestamptz null
);
create index convites_caderno on convites (caderno_id);

create table pontos (
  id          uuid primary key default gen_random_uuid(),
  caderno_id  uuid not null references cadernos (id) on delete cascade,
  membro_id   uuid not null references membros (id) on delete cascade,
  tipo        text not null check (tipo in ('crise', 'conquista', 'funcionou', 'sono', 'comida', 'nota')),
  sono_ruim   boolean null,
  texto       text null,
  ocorreu_em  timestamptz not null,
  criado_em   timestamptz not null default now(),
  editado_em  timestamptz null
);
create index pontos_caderno_ocorreu on pontos (caderno_id, ocorreu_em);
create index pontos_membro on pontos (membro_id);

create table consentimentos_ia (
  caderno_id   uuid primary key references cadernos (id) on delete cascade,
  aceito_em    timestamptz null,
  revogado_em  timestamptz null
);

create table resumos_gerados (
  id          uuid primary key default gen_random_uuid(),
  caderno_id  uuid not null references cadernos (id) on delete cascade,
  criado_em   timestamptz not null default now()
);
create index resumos_caderno_criado on resumos_gerados (caderno_id, criado_em);

-- Regras do ponto que o banco garante, venha o ponto de onde vier.
create function validar_ponto() returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and (new.membro_id <> old.membro_id or new.caderno_id <> old.caderno_id) then
    raise exception 'ponto_nao_muda_de_dono' using errcode = '23514';
  end if;

  -- Ao editar só o texto de um ponto antigo, o horário não é revalidado.
  if tg_op = 'INSERT' or new.ocorreu_em <> old.ocorreu_em then
    if new.ocorreu_em < now() - interval '7 days' or new.ocorreu_em > now() + interval '5 minutes' then
      raise exception 'ocorreu_em_fora_do_limite' using errcode = '23514';
    end if;
  end if;

  if (new.tipo = 'sono') <> (new.sono_ruim is not null) then
    raise exception 'sono_ruim_invalido' using errcode = '23514';
  end if;

  if new.texto is not null and char_length(new.texto) > 280 then
    raise exception 'texto_longo' using errcode = '23514';
  end if;

  if not exists (select 1 from membros m where m.id = new.membro_id and m.caderno_id = new.caderno_id) then
    raise exception 'membro_de_outro_caderno' using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' then
    new.editado_em := now();
  end if;
  return new;
end;
$$;

create trigger validar_ponto
before insert or update on pontos
for each row execute function validar_ponto();
