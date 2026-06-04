alter table leads add column if not exists atualizado_em timestamptz default now();
update leads set atualizado_em = criado_em where atualizado_em is null;

create or replace function set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_leads_atualizado_em on leads;
create trigger trg_leads_atualizado_em
  before update on leads
  for each row execute function set_atualizado_em();
