-- Permite que vendedor delete seus próprios eventos
create policy "agenda_vendedor_delete" on agenda
  for delete using (meu_perfil() = 'vendedor' and vendedor_id = meu_vendedor_id());
