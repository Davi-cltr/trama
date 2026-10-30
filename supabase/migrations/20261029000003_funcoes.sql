-- Operações que precisam passar por cima da RLS, cada uma com suas próprias checagens.
-- Erros de negócio usam errcode P0001 e a mensagem igual ao código que o app traduz.

create function criar_caderno(p_apelido text, p_tratamento text, p_nascimento date, p_rotulo text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_caderno uuid;
begin
  if v_uid is null or not exists (select 1 from perfis where id = v_uid) then
    raise exception 'sem_perfil' using errcode = 'P0001';
  end if;

  insert into cadernos (apelido, tratamento, nascimento, dona_id)
  values (trim(p_apelido), coalesce(p_tratamento, ''), date_trunc('month', p_nascimento)::date, v_uid)
  returning id into v_caderno;

  insert into membros (caderno_id, perfil_id, papel, rotulo, cor)
  values (v_caderno, v_uid, 'responsavel', trim(p_rotulo), 0);

  return v_caderno;
end;
$$;

create function aceitar_convite(p_token text) returns uuid
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_convite convites%rowtype;
  v_cor smallint;
begin
  if v_uid is null or not exists (select 1 from perfis where id = v_uid) then
    raise exception 'sem_perfil' using errcode = 'P0001';
  end if;

  select * into v_convite from convites
  where token_hash = encode(digest(p_token, 'sha256'), 'hex')
  for update;

  if not found or v_convite.usado_em is not null or v_convite.cancelado_em is not null or v_convite.expira_em < now() then
    raise exception 'convite_invalido' using errcode = 'P0001';
  end if;

  if exists (select 1 from membros where caderno_id = v_convite.caderno_id and perfil_id = v_uid and ativo)
     or exists (select 1 from cadernos where id = v_convite.caderno_id and dona_id = v_uid) then
    raise exception 'ja_membro' using errcode = 'P0001';
  end if;

  -- Trava as linhas ativas do caderno para duas aceitações simultâneas não pegarem a mesma cor.
  perform 1 from membros where caderno_id = v_convite.caderno_id and ativo for update;

  select min(c)::smallint into v_cor
  from generate_series(0, 5) c
  where c not in (select cor from membros where caderno_id = v_convite.caderno_id and ativo);

  if v_cor is null then
    raise exception 'sem_linha_livre' using errcode = 'P0001';
  end if;

  insert into membros (caderno_id, perfil_id, papel, rotulo, cor)
  values (v_convite.caderno_id, v_uid, v_convite.papel, v_convite.rotulo, v_cor);

  update convites set usado_em = now() where id = v_convite.id;

  return v_convite.caderno_id;
end;
$$;

create function apagar_minha_conta() returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'sem_sessao' using errcode = 'P0001';
  end if;
  if exists (select 1 from cadernos where dona_id = v_uid) then
    raise exception 'dona_de_caderno' using errcode = 'P0001';
  end if;

  update membros set ativo = false, perfil_id = null where perfil_id = v_uid;
  delete from perfis where id = v_uid;
  delete from auth.users where id = v_uid;
end;
$$;

revoke execute on function criar_caderno(text, text, date, text), aceitar_convite(text), apagar_minha_conta() from public, anon;
grant execute on function criar_caderno(text, text, date, text), aceitar_convite(text), apagar_minha_conta() to authenticated;
