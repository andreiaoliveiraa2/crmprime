alter table leads add column atualizado_em timestamptz default now();
update leads set atualizado_em = criado_em;

create or replace function set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_leads_atualizado_em
  before update on leads
  for each row execute function set_atualizado_em();
