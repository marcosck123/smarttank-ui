# smarttank-ui
# SmartTank UI 🚀

O **SmartTank UI** é uma aplicação web moderna e responsiva desenvolvida para automatizar o processo diário de medição física e controle volumétrico de tanques subterrâneos em postos de combustíveis. 

O sistema foi desenhado especificamente para substituir planilhas manuais de arqueamento preenchidas à meia-noite (00:00), eliminando erros humanos de digitação por meio de cálculos geométricos em tempo real, fornecendo uma interface nativa em modo noturno (Dark Mode) e gerando relatórios formatados prontos para impressão em folha A4.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React.js (com Vite) + TypeScript
- **Estilização:** Tailwind CSS (Interface otimizada para operação noturna)
- **Componentes de UI:** Radix UI / Shadcn UI
- **Geração de Relatórios:** ExcelJS (Exportação direta no cliente para formato `.xlsx` formatado)
- **Persistência de Dados:** Banco de dados relacional via Supabase (Histórico persistente)

## 📌 Funcionalidades Principais

1. **Sessão do Operador:** Tela de identificação inicial simples para gravação do nome do responsável pela medição (vinculado automaticamente aos relatórios emitidos).
2. **Navegação Dinâmica:** Sidebar fixa com transição suave entre as telas de *Lançamento Atual* e *Histórico de Medições*.
3. **Cálculo Geométrico em Tempo Real:** Processamento instantâneo da cubagem do tanque no evento de digitação (`onChange`), validando limites físicos estritos (0 a 255 cm).
4. **Gráficos de Nível Interativos:** Exibição visual do volume atual do tanque no painel de conferência pré-emissão.
5. **Histórico Auditável e Editável:** Registro cronológico de lançamentos com suporte a reemissão de downloads e correção de erros passados de digitação.

## 📐 Parâmetros de Engenharia (Geometria dos Tanques)

Todos os tanques do estabelecimento possuem formato cilíndrico horizontal com **raio fixo de 1,275 metros** (Altura Máxima Operacional de **255 cm**). O cálculo volumétrico varia unicamente em função do comprimento físico nominal de cada tanque:

| Identificador do Tanque | Comprimento ($L$) | Capacidade Volumétrica Máxima |
| :--- | :---: | :---: |
| **Tanques 1, 2, 3, 4, 8 e 9** | 12 metros | ~61.261 Litros |
| **Tanques 5 e 10** | 6 metros | ~30.630 Litros |
| **Tanque 7** | 4 metros | ~20.420 Litros |
| **Tanque 6** | 2 metros | ~10.210 Litros |

### Fórmula de Cubagem Utilizada (JavaScript)

```javascript
const R = 1.275; // Raio em metros
const h = alturaCm / 100; // Conversão para metros

const termoAcos = Math.max(-1, Math.min(1, (R - h) / R));
const termoRaiz = Math.max(0, 2 * R * h - Math.pow(h, 2));

const areaSegmento = (Math.pow(R, 2) * Math.acos(termoAcos)) - (R - h) * Math.sqrt(termoRaiz);
const volumeLitros = comprimentoTanque * 1000 * areaSegmento;
