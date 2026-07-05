# SmartTank Bridge

Serviço local que conecta um medidor de tanques **Veeder-Root TLS-450 PLUS** ao app **SmartTank**, expondo os dados de inventário via REST + WebSocket na rede do posto.

**Status: validado em produção** — leituras conferidas campo a campo contra a tela do console e o relatório impresso do equipamento (9 tanques, posto real).

```
┌──────────────┐   TCP :10001    ┌────────────────┐   REST :3050    ┌────────────┐
│ TLS-450 PLUS │ ◄────────────── │     Bridge     │ ──────────────► │ SmartTank  │
│ (Veeder-Root)│  protocolo VR   │  poll + cache  │   WS (push)     │  (web/app) │
└──────────────┘  1 conexão      └────────────────┘                 └────────────┘
                  persistente
```

## Como funciona

- Mantém **uma única conexão persistente** com o TLS-450 (o console aceita 1 cliente por porta) e enfileira comandos — nunca há comandos sobrepostos no equipamento.
- Faz **polling** do inventário (`i20100`, protocolo serial Veeder-Root) a cada 20s e guarda em **cache em memória**. O SmartTank nunca fala com o equipamento — só com o cache.
- Expõe REST para consulta e WebSocket para push em tempo real.
- Reconecta sozinho com backoff exponencial (até 60s) se a rede ou o equipamento caírem.
- Marca o dado como **stale** se ficar 3× o intervalo sem leitura boa — o front deve exibir aviso.

## Requisitos

- Windows, Linux ou macOS na **mesma rede** do TLS-450
- Node.js 18+ (portátil serve — não precisa de admin) **ou** Docker
- TLS-450 com porta *Comando de Série* TCP habilitada (padrão: 10001)

## Instalação

### Opção A — Node nativo (sem admin, recomendado para PC de PDV)

```powershell
# Node portátil (se a máquina não tem Node)
curl.exe -Lo "$env:TEMP\node.zip" "https://nodejs.org/dist/v22.14.0/node-v22.14.0-win-x64.zip"
Expand-Archive "$env:TEMP\node.zip" -DestinationPath "$env:USERPROFILE\node" -Force
[Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path","User") + ";$env:USERPROFILE\node\node-v22.14.0-win-x64", "User")
$env:Path += ";$env:USERPROFILE\node\node-v22.14.0-win-x64"

# Projeto
cd C:\smarttank-bridge
copy .env.example .env    # e edite (ver Configuração)
npm install --omit=optional
npm start
```

> Se o PowerShell reclamar de *execução de scripts desabilitada*:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (sem admin) — ou use `npm.cmd` no lugar de `npm`.

### Opção B — Docker

```bash
docker compose up -d --build
docker logs -f smarttank-bridge
```

O `docker-compose.yml` já traz `restart: unless-stopped` e rotação de log (10 MB × 3).

## Configuração (`.env`)

| Variável | Padrão | Descrição |
|---|---|---|
| `TLS_TRANSPORT` | `tcp` | `tcp` ou `serial` |
| `TLS_HOST` | — | IP do TLS-450 (menu Configuração → Comunicação no console) |
| `TLS_PORT` | `10001` | Porta *Comando de Série* TCP |
| `TLS_SERIAL_PATH` | `COM3` | Porta COM (só modo serial) |
| `TLS_BAUD_RATE` | `9600` | Baud rate 8N1 (só modo serial) |
| `POLL_INTERVAL_MS` | `20000` | Intervalo entre leituras. **Mínimo 10000** |
| `COMMAND_TIMEOUT_MS` | `8000` | Timeout de resposta de um comando |
| `API_PORT` | `3050` | Porta da API REST/WS |
| `BRIDGE_TOKEN` | — | Token da API. Gere: `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"` |
| `CORS_ORIGINS` | `*` | Origens permitidas, separadas por vírgula. Restrinja em produção |
| `PRODUCT_LABELS` | — | Mapa código→nome, varia por posto. Ex.: `1:Diesel S500,4:Gas. Aditivada,7:Diesel S10` |

> **PRODUCT_LABELS**: o código de produto é um número que cada posto cadastra como quer no console. Descubra os nomes reais na tela *Descrição Geral → Tanque* ou no relatório impresso de inventário. Códigos não mapeados aparecem como `"Produto N"`.

## API

Autenticação: header `x-api-key: <BRIDGE_TOKEN>` (REST) ou query `?token=` (WS). `/health` é aberto.

### `GET /health`

```json
{ "ok": true, "uptimeSec": 52, "connected": true, "stale": false,
  "lastReadAt": "2026-07-03T06:40:09.491Z", "consecutiveFailures": 0, "lastError": null }
```

### `GET /tanques`

`200` payload abaixo · `503` bridge de pé mas ainda sem leitura (trate como *loading*) · `401` token inválido.

```json
{
  "deviceTimestamp": "2607030240",
  "readAt": "2026-07-03T06:40:09.491Z",
  "tanks": [
    { "tank": 1, "productCode": 7, "productLabel": "Diesel S10", "statusBits": "0000",
      "volume": 56726.88, "volumeTC": 56266.4, "ullage": 4557.74, "height": 2224.55,
      "waterHeight": 0, "temperature": 30.02, "waterVolume": 0 }
  ],
  "status": { "connected": true, "stale": false, "lastReadAt": "…",
              "consecutiveFailures": 0, "lastError": null }
}
```

Unidades: volumes em **litros**, alturas em **mm**, temperatura em **°C**. `ullage` = espaço livre; capacidade total = `volume + ullage`; `volumeTC` = volume termo-compensado.

### `GET /tanques/:id`

Um tanque específico. `404` se não existir.

### `WS /ws?token=…`

Envia o estado atual ao conectar e push a cada leitura nova:

```json
{ "type": "inventory", "data": { …mesmo payload do GET /tanques… } }
```

## Regras de negócio para o consumidor

| Sinal | Tratamento obrigatório no front |
|---|---|
| `status.stale === true` | Aviso "dados desatualizados" + horário de `lastReadAt`. Nunca exibir como atual |
| `waterHeight > 100` (mm) | Badge "leitura não confiável — possível sonda com defeito". Caso real: tanque com sonda defeituosa reportando ~19.750 L de "água" |
| REST `503` | "Aguardando primeira leitura" — é boot, não erro |
| WS caiu | Fazer fallback de polling REST e indicar modo degradado |

## Rodando 24/7

### Sem admin (watchdog + inicialização por logon)

`start-bridge.bat` na pasta do projeto:

```bat
@echo off
cd /d "%~dp0"
:loop
node src\index.js >> bridge.log 2>&1
echo [watchdog] bridge caiu, reiniciando em 5s... >> bridge.log
timeout /t 5 /nobreak > nul
goto loop
```

`start-bridge-oculto.vbs` (roda sem janela):

```vbs
CreateObject("Wscript.Shell").Run """" & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\start-bridge.bat""", 0, False
```

Atalho do `.vbs` na pasta `shell:startup` (Win+R → `shell:startup`). Limitação: processo de usuário morre no logoff — mantenha o PC logado ou configure auto-login.

### Com admin

NSSM (`nssm install SmartTankBridge …`) ou Docker com `restart: unless-stopped` + Docker Desktop iniciando no logon.

## Operação

```powershell
Get-Content bridge.log -Tail 30 -Wait                     # acompanhar log (modo nativo)
docker logs -f smarttank-bridge                            # (modo Docker)
curl.exe http://localhost:3050/health                      # saúde
curl.exe -H "x-api-key: TOKEN" http://localhost:3050/tanques
```

## Troubleshooting (problemas reais de campo)

| Sintoma | Causa | Solução |
|---|---|---|
| `ECONNREFUSED <ip>:10001` | IP errado no `.env` (ex.: exemplo não editado) | IP real: console → Configuração → Comunicação |
| Scan da rede não acha o TLS | Timeout curto ou porta ocupada por outro cliente | Confirme IP no console; teste `Test-NetConnection <ip> -Port 10001` |
| Porta conecta mas comando fica mudo | Não é o TLS (conversor/VM) **ou** código de segurança serial habilitado | Identifique pelo MAC (`00:50:83` = Gilbarco VR) e pela interface web do console |
| `401` na API | Header sem dois-pontos (`x-api-key: token`) ou token divergente do `.env` | Confira `type .env \| findstr BRIDGE_TOKEN` |
| `503` logo após subir | Primeira leitura ainda não aconteceu | Aguarde 1 ciclo de poll |
| `[poller] Falha #1` no boot | Poller dispara antes do handshake TCP | Ruído conhecido e inofensivo |
| `Empty reply from server` | curl disparado antes do server abrir | Aguarde ~5s após subir |
| `npm.ps1 … execução de scripts desabilitada` | ExecutionPolicy do PowerShell | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` ou `npm.cmd` |
| Reconexões TCP em ciclo no log | Outro software disputando a porta do TLS | Porta dedicada no console, ou modo conectar/ler/desconectar |
| Água altíssima num tanque (`waterVolume` gigante) | Sonda com defeito — o console reporta isso mesmo | Chamado técnico Veeder-Root; front marca leitura não confiável |

## Segurança

- Token forte obrigatório (32+ chars aleatórios); rede de posto tem PDV, câmeras e wifi de terceiros.
- `CORS_ORIGINS` restrito à origem do SmartTank em produção.
- Não exponha a porta 3050 pra fora da rede local sem HTTPS + auth de verdade (para acesso externo, prefira a arquitetura *push*: bridge → Supabase → app).
- O `.env` contém o token: mantenha o projeto fora de pastas públicas (Desktop compartilhado) e fora do Git (`.gitignore`).

## Roadmap

- [ ] Primeira leitura disparada no `connect` (elimina a falha falsa de boot)
- [ ] Push das leituras para Supabase (histórico + acesso externo via app na Vercel)
- [ ] Rotação de log embutida no modo nativo
- [ ] Suporte a código de segurança serial do console

## Licença

Uso interno.
