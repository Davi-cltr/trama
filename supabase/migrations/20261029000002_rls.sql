-- Regras de acesso. O frontend nunca é a barreira de segurança.

create function sou_membro(p_caderno uuid) returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from membros
    where caderno_id = p_caderno and perfil_id = auth.uid() and ativo
  );
$$;

create function sou_dona(p_caderno uuid) returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from cadernos where id = p_caderno and dona_id = auth.uid());
$$;

revoke execute on function sou_membro(uuid), sou_dona(uuid) from public, anon;
grant execute on function sou_membro(uuid), sou_dona(uuid) to authenticated, service_role;

alter table perfis enable row level security;
alter table cadernos enable row level security;
alter table membros enable row level security;
alter table convites enable row level security;
alter table pontos enable row level security;
alter table consentimentos_ia enable row level security;
alter table resumos_gerados enable row level security;

revoke all on perfis, cadernos, membros, convites, pontos, consentimentos_ia, resumos_gerados from anon;

-- perfis: cada pessoa só vê e edita o próprio.
create policy perfis_ler on perfis for select to authenticated using (id = auth.uid());
create policy perfis_criar on perfis for insert to authenticated with check (id = auth.uid());
create policy perfis_editar on perfis for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- cadernos: membro ativo lê; só a dona altera e apaga. Criação só por criar_caderno().
revoke insert on cadernos from authenticated;
create policy cadernos_ler on cadernos for select to authenticated using (sou_membro(id));
create policy cadernos_editar on cadernos for update to authenticated
  using (dona_id = auth.uid()) with check (dona_id = auth.uid());
create policy cadernos_apagar on cadernos for delete to authenticated using (dona_id = auth.uid());

-- membros: membro ativo lê; dona atualiza; a própria pessoa pode se desativar.
-- Inserção só por criar_caderno() e aceitar_convite().
revoke insert, delete on membros from authenticated;
create policy membros_ler on membros for select to authenticated using (sou_membro(caderno_id));
create policy membros_editar on membros for update to authenticated
  using (sou_dona(caderno_id) or perfil_id = auth.uid());

create function guardar_membro() returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_dona uuid;
begin
  -- Funções security definer e o service role passam direto.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  select dona_id into v_dona from cadernos where id = old.caderno_id;

  if new.caderno_id <> old.caderno_id or new.perfil_id is distinct from old.perfil_id or new.entrou_em <> old.entrou_em then
    raise exception 'so_a_dona' using errcode = 'P0001';
  end if;
  if old.perfil_id = v_dona and not new.ativo then
    raise exception 'dona_nao_sai' using errcode = 'P0001';
  end if;
  if not old.ativo and new.ativo then
    raise exception 'so_a_dona' using errcode = 'P0001';
  end if;
  if v_dona is distinct from auth.uid() then
    -- Quem não é dona só pode sair: ativo de true para false, e nada mais.
    if new.papel <> old.papel or new.rotulo <> old.rotulo or new.cor <> old.cor or new.ativo = old.ativo then
      raise exception 'so_a_dona' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger guardar_membro
before update on membros
for each row execute function guardar_membro();

-- convites: só a dona.
create policy convites_dona on convites for all to authenticated
  using (sou_dona(caderno_id)) with check (sou_dona(caderno_id));

-- pontos: membro ativo lê; insere com o próprio membro_id; autor ou dona editam e apagam.
create policy pontos_ler on pontos for select to authenticated using (sou_membro(caderno_id));
create policy pontos_criar on pontos for insert to authenticated with check (
  exists (
    select 1 from membros m
    where m.id = membro_id and m.caderno_id = pontos.caderno_id and m.perfil_id = auth.uid() and m.ativo
  )
);
create policy pontos_editar on pontos for update to authenticated using (
  sou_membro(caderno_id) and (
    sou_dona(caderno_id)
    or exists (select 1 from membros m where m.id = membro_id and m.perfil_id = auth.uid() and m.ativo)
  )
);
create policy pontos_apagar on pontos for delete to authenticated using (
  sou_membro(caderno_id) and (
    sou_dona(caderno_id)
    or exists (select 1 from membros m where m.id = membro_id and m.perfil_id = auth.uid() and m.ativo)
  )
);

-- consentimento da IA: só a dona.
create policy consentimentos_dona on consentimentos_ia for all to authenticated
  using (sou_dona(caderno_id)) with check (sou_dona(caderno_id));

-- resumos gerados: a dona lê; só a Edge Function (service role) insere.
revoke insert, update, delete on resumos_gerados from authenticated;
create policy resumos_ler on resumos_gerados for select to authenticated using (sou_dona(caderno_id));
