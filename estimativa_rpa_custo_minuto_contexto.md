# Estimativa de custo de licenças RPA por minuto/robô — Contexto e racional

> Contexto: estimativa para cobrança de custos de licenças de robôs de automação (RPA) com base em custo anual total e tempo de execução disponível.

## 1) Entradas informadas

- **Custo anual total de licenças (base):** R$ 70.000,00 / ano  
- **Quantidade atual:** 51 robôs
- **Perfis de operação:**
  - **33 robôs** operam **24h/dia**
  - **18 robôs** operam **12h/dia**

## 2) Premissas adotadas (para viabilizar o cálculo)

1. **Ano com 365 dias**
2. Quando aplicamos **margem de 100%**, adotamos a interpretação padrão de mercado como **markup de 100% sobre custo**:
   - **Preço = 2 × custo**
   - Consequentemente, **preço por minuto = 2 × custo por minuto** e **preço por robô = 2 × custo por robô**.

## 3) Base de minutos (capacidade/tempo disponível)

### 3.1) Minutos por robô (por ano e por mês)

- **Robô 24h/dia**
  - Minutos/ano: (24 × 60 × 365) = **525.600**
  - Minutos/mês (média): (525.600/12) = **43.800**

- **Robô 12h/dia**
  - Minutos/ano: (12 × 60 × 365) = **262.800**
  - Minutos/mês (média): (262.800/12) = **21.900**

### 3.2) Minutos totais do parque atual (51 robôs)

- 33 robôs 24/7: 33 × 525.600 = **17.344.800** min/ano  
- 18 robôs 12h/dia: 18 × 262.800 = **4.730.400** min/ano  
- **Total:** **22.075.200** min/ano

> **Média (apenas referência)**: 22.075.200/51 ≈ **432.847** min/ano por robô (mistura perfis).

## 4) Rateio do custo total por minuto (cenário base atual)

### 4.1) Custo por minuto (sem margem)

- custo/min = 70.000 / 22.075.200 = **0,00317098 R$/min**
- custo/hora (equivalente) = 0,00317098 × 60 = **0,19026 R$/h**

### 4.2) Preço por minuto (com margem de 100% — markup)

- preço/min = 2 × 0,00317098 = **0,00634196 R$/min**
- preço/hora (equivalente) = 0,00634196 × 60 = **0,38052 R$/h**

## 5) Custo/preço por robô (com base em custo/minuto)

### 5.1) Sem margem

- **Robô 24/7**
  - Ano: 525.600 × 0,00317098 = **R$ 1.666,67/ano**
  - Mês: 1.666,67/12 = **R$ 138,89/mês**

- **Robô 12h/dia**
  - Ano: 262.800 × 0,00317098 = **R$ 833,33/ano**
  - Mês: 833,33/12 = **R$ 69,44/mês**

### 5.2) Com margem de 100% (markup)

- **Robô 24/7**
  - Ano: **R$ 3.333,33/ano**
  - Mês: **R$ 277,78/mês**

- **Robô 12h/dia**
  - Ano: **R$ 1.666,67/ano**
  - Mês: **R$ 138,89/mês**

## 6) Projeção de crescimento: +15 robôs por mês

### 6.1) Série de robôs por mês (12 meses)

Assumindo crescimento linear, adicionando **+15 robôs a cada mês**, iniciando com 51:

Mês 1 a 12:  
**51, 66, 81, 96, 111, 126, 141, 156, 171, 186, 201, 216**

- **Total de “bot-mês” no ano:** soma = **1.602 bot-mês**
- **Média de robôs no ano:** 1.602/12 = **133,5 robôs**

> Observação: esta forma de cálculo mede o “tamanho médio” do parque ao longo do ano.  
> Se você preferir considerar que no “final do 12º mês” já houve um incremento adicional (chegando a 231), a série muda. Nesta conversa, usamos a série acima.

## 7) Modelo de cobrança para a projeção

Como foi comentado que “**R$ 70.000 não é fixo**” o custo cresce proporcional ao nº de robôs (unitário constante)

Mantém-se o custo unitário médio atual:
- custo médio atual por robô/ano = 70.000/51 = **R$ 1.372,55**
- custo médio atual por robô/mês = 1.372,55/12 = **R$ 114,38**

#### Sem margem
- custo por robô/mês = **R$ 114,38**
- custo por robô/ano = **R$ 1.372,55**
- custo total anual projetado = 114,38 × 1.602 = **R$ 183.235,29/ano**

#### Com margem de 100% (markup)
- preço por robô/mês = **R$ 228,76**
- preço por robô/ano = **R$ 2.745,10**
- receita total anual alvo = 228,76 × 1.602 = **R$ 366.470,59/ano**

## 8) Resumo (números-chave)

**Base atual (51 robôs):**
- Total minutos/ano: **22.075.200**
- Custo/min (sem margem): **R$ 0,00317098**
- Preço/min (margem 100%): **R$ 0,00634196**
- Robô 24/7: **R$ 138,89/mês** (sem margem) | **R$ 277,78/mês** (com margem)
- Robô 12h/dia: **R$ 69,44/mês** (sem margem) | **R$ 138,89/mês** (com margem)

**Projeção +15 robôs/mês (média 133,5 robôs no ano):**
- Modelo A (pool fixo): **R$ 43,70/mês** por robô (sem margem) | **R$ 87,39/mês** (com margem)
- Modelo B (unitário constante): **R$ 114,38/mês** por robô (sem margem) | **R$ 228,76/mês** (com margem)
