-- Agenda isolada: admin vê só os seus eventos, vendedor vê só os seus
-- Eventos do admin: vendedor_id IS NULL
-- Eventos do vendedor: vendedor_id = meu_vendedor_id()

drop policy if exists "agenda_admin_tudo" on agenda;

create policy "agenda_admin_proprios" on agenda
  for all using (meu_perfil() = 'admin' and vendedor_id is null);
