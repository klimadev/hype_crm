# Hype CRM

Next.js 16 CRM com lembretes automáticos via WhatsApp.

## Funcionalidades

- **Produtos/Serviços** com recorrência configurável
- **Lembretes automáticos** via WhatsApp (mock ou EvolutionAPI real)
- **Kanban** para gerenciamento de leads
- **Histórico de stage** por lead
- **API de lembretes** com monitoramento em tempo real

## Configuração de Lembretes

### Tipos de Recorrência

Os produtos podem ter os seguintes intervalos de recorrência:

- **minute_30**: A cada 30 minutos
- **hour_1, hour_2, hour_4, hour_8**: A cada 1, 2, 4 ou 8 horas
- **day_1, day_3, day_7, day_15, day_30, day_60, day_90**: A cada 1-90 dias
- **month_1, month_2, month_3, month_6**: A cada 1-6 meses

### Modo de Lembrete

- **Único**: Envia apenas uma vez quando o lead entra no estágio
- **Recorrente**: Envia repetidamente com o intervalo configurado

## ⚠️ Importante: Cron Job

O sistema de lembretes **NÃO roda automaticamente**. Você deve configurar uma forma de chamar o endpoint periodicamente:

### Opção 1: Cron no Servidor (Linux)

```bash
# Adicione ao crontab
crontab -e

# Adicione esta linha para rodar a cada minuto
* * * * * curl http://localhost:3000/api/recurrence/check > /dev/null 2>&1
```

### Opção 2: GitHub Actions (para deploy no Vercel)

Crie `.github/workflows/cron.yml`:

```yaml
name: Reminder Cron
on:
  schedule:
    - cron: '* * * * *'
  workflow_dispatch:

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Reminder Job
        run: curl https://seu-dominio.com/api/recurrence/check
```

### Opção 3: EasyCron ou Similar

1. Crie uma conta no [EasyCron](https://www.easycron.com)
2. Adicione um cron job apontando para: `https://seu-dominio.com/api/recurrence/check`
3. Configure para rodar a cada minuto

### Teste Manual

Na página de lembretes do produto, clique no botão **"Testar Job"** para executar manualmente.

## Variáveis de Ambiente

```env
# WhatsApp (Mock mode para testes)
WHATSAPP_MOCK=true

# EvolutionAPI (para produção)
EVOLUTION_API_URL=http://localhost:8888
EVOLUTION_API_KEY=sua-chave-api

# NextAuth
AUTH_SECRET=seu-secret-aqui
NEXTAUTH_URL=http://localhost:3000
```

## Variáveis de Mensagem

Ao criar lembretes, você pode usar:

- `{{leadName}}` - Nome do lead
- `{{leadPhone}}` - Telefone do lead
- `{{productName}}` - Nome do produto/serviço
- `{{stageName}}` - Nome do estágio atual

## Executando

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start
```

## Banco de Dados

O SQLite é usado automaticamente. Migrações são executadas na inicialização.

```bash
# Verificar dados diretamente no banco
node -e "
const Database = require('better-sqlite3');
const db = new Database('data/crm.db');
const logs = db.prepare('SELECT * FROM reminder_logs').all();
console.log(JSON.stringify(logs, null, 2));
"
```

## Desenvolvimento

### Padrões de Código

O projeto segue padrões rigorosos documentados em `AGENTS.md`:

- **UNIX Timestamps**: Use `unixepoch()` em queries SQLite para comparações de tempo consistentes
- **Atualização em vez de Duplicatas**: Para status changes, atualize registros existentes ao invés de inserir novos
- **Testes com Node**: Valide queries diretamente com `node -e`

### Validação

```bash
npm run lint && npm run build
```
