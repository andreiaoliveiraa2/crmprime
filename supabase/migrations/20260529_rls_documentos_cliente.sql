-- supabase/migrations/20260529_rls_documentos_cliente.sql
-- Habilita RLS em documentos_cliente espelhando as policies de clientes:
-- admin vê tudo; vendedor acessa apenas documentos dos próprios clientes.
-- Também cria storage policies para o bucket clientes-documentos.

-- ── Tabela documentos_cliente ──
alter table documentos_cliente enable row level security;

create policy "documentos_admin_tudo" on documentos_cliente
  for all
  using (meu_perfil() = 'admin')
  with check (meu_perfil() = 'admin');

create policy "documentos_vendedor_proprios" on documentos_cliente
  for select
  using (
    meu_perfil() = 'vendedor'
    and exists (
      select 1 from clientes c
      where c.id = documentos_cliente.cliente_id
        and c.vendedor_id = meu_vendedor_id()
    )
  );

create policy "documentos_vendedor_insert" on documentos_cliente
  for insert
  with check (
    meu_perfil() = 'vendedor'
    and exists (
      select 1 from clientes c
      where c.id = documentos_cliente.cliente_id
        and c.vendedor_id = meu_vendedor_id()
    )
  );

create policy "documentos_vendedor_delete" on documentos_cliente
  for delete
  using (
    meu_perfil() = 'vendedor'
    and exists (
      select 1 from clientes c
      where c.id = documentos_cliente.cliente_id
        and c.vendedor_id = meu_vendedor_id()
    )
  );

-- ── Storage: bucket clientes-documentos ─────────────────────────────────────
-- Arquivos são armazenados no caminho: {cliente_id}/{nome_arquivo}
-- Admin: acesso total ao bucket

create policy "storage_documentos_admin_select" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'clientes-documentos'
    and meu_perfil() = 'admin'
  );

create policy "storage_documentos_admin_insert" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'clientes-documentos'
    and meu_perfil() = 'admin'
  );

create policy "storage_documentos_admin_update" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'clientes-documentos'
    and meu_perfil() = 'admin'
  );

create policy "storage_documentos_admin_delete" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'clientes-documentos'
    and meu_perfil() = 'admin'
  );

-- Vendedor: acessa apenas arquivos do próprio cliente
-- O caminho é {cliente_id}/{arquivo}, então split_part(name,'/',1) = cliente_id

create policy "storage_documentos_vendedor_select" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'clientes-documentos'
    and meu_perfil() = 'vendedor'
    and exists (
      select 1 from clientes c
      where c.id::text = split_part(name, '/', 1)
        and c.vendedor_id = meu_vendedor_id()
    )
  );

create policy "storage_documentos_vendedor_insert" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'clientes-documentos'
    and meu_perfil() = 'vendedor'
    and exists (
      select 1 from clientes c
      where c.id::text = split_part(name, '/', 1)
        and c.vendedor_id = meu_vendedor_id()
    )
  );

create policy "storage_documentos_vendedor_delete" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'clientes-documentos'
    and meu_perfil() = 'vendedor'
    and exists (
      select 1 from clientes c
      where c.id::text = split_part(name, '/', 1)
        and c.vendedor_id = meu_vendedor_id()
    )
  );
