-- Remove policy "for all to authenticated" que permite DELETE de tipos_agenda.
-- Mantém leitura para todos autenticados; escrita (INSERT/UPDATE/DELETE) apenas admin.

drop policy if exists "tipos_agenda_todos"   on tipos_agenda;
drop policy if exists "tipos_agenda_leitura" on tipos_agenda;
drop policy if exists "tipos_agenda_admin"   on tipos_agenda;

-- Leitura para todos autenticados (necessário para exibir lista no formulário)
create policy "tipos_agenda_leitura" on tipos_agenda
  for select
  to authenticated
  using (true);

-- Escrita exclusiva para admin
create policy "tipos_agenda_admin" on tipos_agenda
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');
