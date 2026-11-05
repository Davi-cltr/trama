-- Desempenho apontado pelo linter do Supabase. As regras não mudam.
-- (select auth.uid()) é avaliado uma vez por consulta, e não uma vez por linha.

create index cadernos_dona on cadernos (dona_id);

alter policy perfis_ler on perfis using (id = (select auth.uid()));
alter policy perfis_criar on perfis with check (id = (select auth.uid()));
alter policy perfis_editar on perfis using (id = (select auth.uid())) with check (id = (select auth.uid()));

alter policy cadernos_editar on cadernos
  using (dona_id = (select auth.uid())) with check (dona_id = (select auth.uid()));
alter policy cadernos_apagar on cadernos using (dona_id = (select auth.uid()));

alter policy membros_editar on membros
  using (sou_dona(caderno_id) or perfil_id = (select auth.uid()));

alter policy pontos_criar on pontos with check (
  exists (
    select 1 from membros m
    where m.id = membro_id and m.caderno_id = pontos.caderno_id and m.perfil_id = (select auth.uid()) and m.ativo
  )
);
alter policy pontos_editar on pontos using (
  sou_membro(caderno_id) and (
    sou_dona(caderno_id)
    or exists (select 1 from membros m where m.id = membro_id and m.perfil_id = (select auth.uid()) and m.ativo)
  )
);
alter policy pontos_apagar on pontos using (
  sou_membro(caderno_id) and (
    sou_dona(caderno_id)
    or exists (select 1 from membros m where m.id = membro_id and m.perfil_id = (select auth.uid()) and m.ativo)
  )
);
