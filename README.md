# SmartTank

Sistema de **medição e automação de tanques de combustível** de um posto. Nasceu para a medição noturna (turno 00:00) e evoluiu para monitoramento em tempo real via medidor **Veeder-Root TLS-450 PLUS**.

O projeto tem **duas partes** que trabalham juntas:

| Parte | O que é | Onde roda |
|---|---|---|
| **SmartTank** (app) | Interface web (React) para aferição, emissão de notas, dashboard ao vivo e administração | Navegador — Vercel ou LAN do posto |
| **SmartTank Bridge** (serviço) | Ponte local que lê o TLS-450 e expõe os dados via REST + WebSocket | PC do posto (Node/Docker), na mesma rede do medidor |

```
┌──────────────┐  TCP :10001   ┌────────────────┐  REST/WS :3050  ┌──────────────┐
│ TLS-450 PLUS │ ◄──────────── │ SmartTank      │ ──────────────► │ SmartTank    │
│ (Veeder-Root)│  protocolo VR │ Bridge         │  push tempo real│ (app web)    │
│  9–10 tanques│  1 conexão    │ poll 20s+cache │                 │              │
└──────────────┘  persistente  └────────────────┘                 └──────────────┘
       hardware                    serviço local                     front-end
```

> Sem o Bridge configurado, o app roda em **modo demonstração (mock)** com dados simulados — útil para desenvolvimento e testes. Com o Bridge, consome os dados reais do medidor.

---

## 🖥️ SmartTank — o aplicativo (o que faz, em detalhe)

App **React + TypeScript + Vite + Tailwind**, tema claro minimalista, com controle de acesso por perfil. Persistência **offline-first**: tudo é salvo primeiro no `localStorage` e sincronizado com o **Supabase** quando disponível — nunca há perda de dado se a rede cair.

### 1. Entrada e identificação
- Tela de login pede o **nome do operador** para registrar o turno.
- **Validação anti-lixo**: nomes sem sentido (`sadsad`, `asdf`, `aaaa`, sequências de teclado) são bloqueados.
- **Autocorreção de nome** por distância de Damerau: se o operador digita `lucsa` e já existe `Lucas` cadastrado, o sistema corrige automaticamente (`maira`→`Maria`, `marcus`→`Marcos`).
- **Easter egg de desenvolvedor**: digitar `marcos` revela um campo de senha; com a senha certa, entra como **DESENVOLVEDOR** (acesso total). Qualquer outro nome entra como **OPERADOR**.

### 2. Controle de acesso (RBAC)
| Recurso | OPERADOR | DESENVOLVEDOR |
|---|---|---|
| Emitir Nota de aferição | ✅ | ✅ |
| Ver histórico de notas | ✅ | ✅ |
| Editar / excluir nota | ❌ | ✅ |
| Dashboard ao vivo (TLS) | ❌ | ✅ |
| Relatórios de descarga | ❌ | ✅ |
| Gestão de Tanques / arqueação | ❌ | ✅ |
| Config (usuários, acessos) | ❌ | ✅ |

### 3. Nota de Aferição (fluxo principal do operador)
- **Assistente passo-a-passo**: preenche tanque 1 → 10, um de cada vez, com barra de progresso e navegação (Anterior/Próximo, Enter avança).
- Ao digitar a **altura (cm)**, o volume vem da **tabela de arqueação** (lookup fixo, não fórmula) — é o valor oficial que vai para a planilha.
- **Prévia encadeada**: revisão dos dados (com gráfico de níveis para o Dev) → confirmação → gera automaticamente a **planilha `.xlsx` formatada para impressão A4** e salva a nota.
- **Histórico de notas emitidas**: lista todas as notas, permite baixar novamente a planilha, visualizar e (só Dev) editar/corrigir ou excluir.

### 4. Arqueação (tabela altura → volume)
- Cada tanque tem uma tabela de **255 alturas** mapeadas para volume em litros.
- Valores padrão gerados pela fórmula do cilindro horizontal.
- Na tela **Gestão de Tanques** (Dev), um modal permite **fixar manualmente** qualquer par altura↔volume (click-to-edit) — o override é persistido (Supabase/localStorage) e passa a valer para todo mundo. Inclui um **simulador com slider** para visualizar nível/volume.

### 5. Dashboard ao vivo (integração TLS-450)
- Consome o **Bridge**: leitura inicial via REST + **tempo real via WebSocket**, com **fallback automático de polling** (30s) se o WS cair.
- **Cards por tanque**: nível %, volume, altura de produto, temperatura, indicador de água.
- **KPIs**: volume total, tanques monitorados, com alerta e alarmes críticos.
- **Modal de detalhe** de cada tanque (nível, água, volume, espaço vazio/ullage, volume termo-compensado, temperatura).
- **Modal de avisos** com alarmes por severidade (crítico / alerta / info).
- **Regras de segurança do dado** (validadas em campo):
  - `stale` → banner "dados desatualizados" com horário da última leitura;
  - `waterHeight > 100 mm` → badge **"leitura não confiável"** (sonda com defeito) e o volume não é destacado como confiável;
  - **503** do bridge → estado "aguardando primeira leitura" (não é erro);
  - **indicador de conexão**: tempo real / periódico / offline / demonstração.

### 6. Relatórios de descarga (recebimento pela boia)
- Detecta automaticamente uma **descarga** quando o volume de um tanque **sobe além de 2.000 L** entre leituras.
- Registra qual tanque, combustível, volume antes → depois, quantidade recebida (arredondada) e data/hora.
- Ignora tanques com leitura não confiável. Inclui botão **Simular** para demonstração sem o medidor real.

### 7. Configurações (Dev)
- **Usuários**: lista de quem já usou o app, com gestão de **permissões por toggle**, troca de perfil e remoção.
- **Histórico de acessos**: log simples de logins e emissões de nota por operador.

### Stack e persistência
- **React 18 · Vite · TypeScript · Tailwind CSS v3 · Framer Motion** (animações) · **ExcelJS** (planilhas) · **Supabase JS** (nuvem).
- **Offline-first**: `localStorage` como fonte primária + Supabase para sincronizar/compartilhar. Sem Supabase configurado, funciona 100% local.

### Rodando o app
```bash
npm install
cp .env.example .env      # opcional: Supabase e Bridge
npm run dev               # desenvolvimento (http://localhost:5173)
npm run build             # build de produção (dist/)
```

**Variáveis de ambiente** (`.env`, todas opcionais):
| Variável | Para quê |
|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Persistência em nuvem. Sem elas, usa só `localStorage` |
| `VITE_BRIDGE_URL` | URL do Bridge (ex.: `http://192.168.20.83:3050`). Sem ela, Dashboard roda em **mock** |
| `VITE_BRIDGE_TOKEN` | Token da API do Bridge (`x-api-key`) |

> ⚠️ O token do Bridge fica visível no cliente — só use assim quando o app é servido/acessado **dentro da rede local do posto**. Para acesso externo, prefira um proxy server-side ou a arquitetura *push* (Bridge → Supabase → app).

---

## 🌉 SmartTank Bridge — o serviço local (o que faz, em detalhe)

Serviço **Node (Fastify)** que roda no PC do posto e é o **único** que conversa com o medidor. Fica na pasta [`smarttank-bridge/`](./smarttank-bridge) — o **manual completo** (instalação, Docker, operação 24/7, troubleshooting de campo) está no [README do Bridge](./smarttank-bridge/README.md).

### O que ele faz
- Mantém **uma única conexão persistente** com o TLS-450 (o console aceita só 1 cliente por porta) e **enfileira comandos** — nunca envia comandos sobrepostos ao equipamento.
- Faz **polling do inventário** (comando serial Veeder-Root `i20100`) a cada ~20s e guarda tudo num **cache em memória**. O app **nunca fala direto com o medidor** — só com esse cache.
- Expõe **REST** (consulta) e **WebSocket** (push em tempo real a cada leitura nova).
- **Reconecta sozinho** com backoff exponencial (até 60s) se a rede ou o equipamento caírem.
- Marca o dado como **`stale`** se ficar 3× o intervalo sem leitura boa — sinal para o app avisar o usuário.
- Suporta transporte **TCP** (porta 10001) ou **serial** (RS-232).

### API resumida
Autenticação: `x-api-key: <token>` (REST) ou `?token=` (WS). `/health` é aberto.

| Rota | Descrição |
|---|---|
| `GET /health` | Saúde do serviço (uptime, conectado, stale, última leitura) |
| `GET /tanques` | Inventário de todos os tanques. `503` = ainda sem leitura; `401` = token inválido |
| `GET /tanques/:id` | Um tanque específico |
| `WS /ws?token=…` | Estado atual ao conectar + push a cada nova leitura (`{ type: "inventory", data }`) |

**Campos por tanque**: `volume`, `volumeTC` (termo-compensado), `ullage` (espaço livre), `height` e `waterHeight` (mm), `temperature` (°C), `productLabel`. Capacidade total = `volume + ullage`; ocupação = `volume / (volume + ullage)`.

### Instalação rápida (resumo — ver [README do Bridge](./smarttank-bridge/README.md))
```bash
cd smarttank-bridge
cp .env.example .env        # edite TLS_HOST, BRIDGE_TOKEN, CORS_ORIGINS...
npm install --omit=optional
npm start                   # sobe REST + WS na porta 3050
```
Também há instruções de **Docker** e de execução **24/7** (watchdog no Windows sem admin, NSSM, `restart: unless-stopped`).

---

## 🔌 Como as duas partes se conectam

1. O **Bridge** roda no PC do posto e lê o TLS-450 continuamente.
2. No app, definem-se `VITE_BRIDGE_URL` e `VITE_BRIDGE_TOKEN` apontando para o Bridge.
3. O **Dashboard** busca o estado inicial (REST) e assina o **WebSocket** para atualizações em tempo real; se o WS cair, faz **polling**; se o Bridge não responder, mostra **offline**.
4. Sem essas variáveis, o app usa o **mock** — nenhum componente muda, só a fonte de dados.

> **CORS**: o Bridge precisa liberar a origem do app (`CORS_ORIGINS`) e o header `x-api-key`, senão o navegador bloqueia as chamadas REST (o WebSocket não sofre CORS).

---

## 📁 Estrutura do repositório

```
smarttank-ui/
├── src/                      # aplicativo React (SmartTank)
│   ├── components/           # UI: auth, sidebar, nota, modais, tls, ...
│   ├── pages/                # Nota + páginas Dev (Dashboard, Relatórios, Gestão, Config)
│   ├── hooks/                # useNotaWizard, useTanques, ...
│   ├── lib/
│   │   ├── tls/              # bridgeClient (REST+WS), tlsService, descargaService
│   │   ├── arqueacao/        # tabela altura→volume + overrides
│   │   ├── supabase/         # persistência (medições, usuários, acessos)
│   │   └── nome/             # validação + autocorreção de nome
│   └── config/               # tanquesConfig (tanques, cores, geometria)
├── smarttank-bridge/         # serviço local do TLS-450 (Node/Fastify) — README próprio
├── supabase/schema.sql       # tabelas: medicoes, leituras, arqueacao, usuarios, acessos, descargas
└── README.md                 # este arquivo
```

## 🚀 Deploy
- **App**: Vercel (build do Vite a partir da raiz). Configure as `VITE_*` no painel do Vercel.
- **Bridge**: no PC do posto (Node ou Docker). Não vai para a Vercel — vive na LAN.

## 🔒 Segurança (resumo)
- Token do Bridge forte (32+ chars) e fora do Git (`.env` no `.gitignore`).
- `CORS_ORIGINS` restrito à origem do app em produção.
- Não expor a porta do Bridge para fora da rede local sem HTTPS + auth de verdade.

## Licença
Uso interno.
