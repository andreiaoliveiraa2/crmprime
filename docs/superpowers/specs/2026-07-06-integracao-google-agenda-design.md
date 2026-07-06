# Integração Google Agenda (leitura) no CRM

**Data:** 2026-07-06
**Solicitado por:** Andreia (admin)

## Objetivo

Mostrar os compromissos da **Google Agenda** da Andreia dentro do CRM — na tela **Agenda** e no card **"Agenda"** do dashboard **Meu Dia** — junto com os compromissos que já existem no sistema. **Somente leitura**: o CRM mostra a agenda do Google, não a altera.

## Abordagem escolhida: link secreto iCal (ICS feed privado)

O Google Calendar oferece um **"endereço secreto no formato iCal"** (URL privada `.ics`) em *Configurações da agenda → Integrar agenda → Endereço secreto no formato iCal*. Essa URL retorna todos os eventos da agenda em texto (formato iCalendar).

- **Sem OAuth / sem login Google** — evita toda a complexidade de credenciais no Google Cloud, tela de consentimento, tokens.
- **Só leitura** — o feed ICS é read-only por natureza. Atende exatamente o pedido.
- A Andreia cola a URL uma vez numa config do sistema; o CRM lê o feed no servidor e mostra os eventos.

**Alternativa considerada e descartada (por ora):** conectar a conta Google via OAuth + Google Calendar API. Permitiria escrita (criar evento no CRM → Google) e sync bidirecional, mas exige projeto no Google Cloud, OAuth consent e refresh tokens. Fora de escopo agora (YAGNI); pode ser um passo futuro.

## Componentes

### 1. Guardar a URL secreta
- Nova tabela simples `integracoes` (ou `config_agenda`): `id`, `chave` (ex: `google_ical_url`), `valor` (a URL), `ativo`, `atualizado_em`. RLS: só `admin` lê/escreve.
- Alternativa mais enxuta: um campo `google_ical_url` na linha do usuário admin em `usuarios`. **Decisão:** tabela `integracoes` genérica (permite outras integrações no futuro sem migração nova). A definir no plano.

### 2. Ler e normalizar o feed (server-side)
- Função `getEventosGoogle(inicio, fim)` em `src/lib/googleAgenda.ts`:
  - Busca a URL salva; se vazia, retorna `[]` (integração desligada).
  - `fetch` da URL ICS.
  - Parse com lib **node-ical** (ou `ical.js`) → lista de eventos.
  - Normaliza para o mesmo formato usado na UI: `{ id, titulo (SUMMARY), data_hora (DTSTART), data_fim (DTEND), origem: 'google', local?, descricao? }`.
  - Trata eventos recorrentes (expandir ocorrências no período pedido) e all-day.
  - **Cache**: revalidar a cada ~10 min (o feed do Google atualiza com atraso de qualquer forma). Nunca expor a URL no client.
- **Erros**: se o fetch/parse falhar, logar e retornar `[]` — o CRM continua mostrando os eventos próprios, nunca quebra a tela.

### 3. Exibir
- **Tela Agenda** (`agenda/page.tsx` + `AgendaClient`): mesclar os eventos do Google (marcados visualmente como "Google", cor/etiqueta diferente, sem botões de editar/excluir) com os eventos do CRM.
- **Card "Agenda" do Meu Dia** (`dashboard/page.tsx`): incluir os eventos do Google de hoje na mesma lista de "Agenda hoje".
- Eventos do Google são **read-only** na UI (não abrem modal de edição do CRM).

### 4. Tela de configuração
- Em `/configuracoes` (admin), uma seção "Integração — Google Agenda":
  - Campo pra colar a URL secreta + botão **Salvar**.
  - Botão **Testar** (busca o feed e mostra "X compromissos encontrados" ou o erro).
  - Um passo-a-passo curto de onde pegar o link no Google.

## Não-objetivos (YAGNI)
- Sincronização bidirecional; criar/editar eventos do Google pelo CRM.
- Integração para vendedores (só a admin por ora).
- Escolher entre várias agendas do Google (usa a agenda do link fornecido).

## Segurança
- A URL secreta dá acesso de leitura à agenda inteira → tratar como segredo: guardar no banco com RLS admin, ler só no servidor, nunca enviar ao client nem logar.

## Critério de sucesso
Andreia cola o link secreto em Configurações; ao abrir **Agenda** e **Meu Dia**, vê os compromissos da Google Agenda dela junto com os do sistema, atualizando sozinho, sem poder bagunçar a agenda do Google.
