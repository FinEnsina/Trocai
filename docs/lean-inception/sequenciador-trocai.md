# Sequenciador de Funcionalidades — **Trocaí**

> Atividade 8 da Lean Inception · As Ondas do MVP
> Board: https://www.figma.com/board/l38wvAOPWyFd29ancA8F7p/LDDM---Troca%C3%AD

---

## Registro da dinâmica

| Item | Como foi conduzido |
|---|---|
| Duração | 50 minutos (5 resgate dos dados + 25 distribuição + 10 validação das regras + 10 ajustes) |
| Entrada | As 36 funcionalidades classificadas na matriz de semáforo da Atividade 7 |
| Condução | O responsável pelo produto propôs a Onda 1; o time técnico interveio nas dependências e nas violações de regra |
| Saída | 3 ondas válidas + bloco de ondas futuras |

**Legenda:** 🟢 sabemos fazer · 🟡 precisamos pesquisar · 🔴 não sabemos fazer · 💰 valor de negócio · ❤️ valor de experiência · 🛠️ esforço

---

## Como as regras foram aplicadas

As três regras de ouro foram verificadas onda a onda:

| Regra | Verificação |
|---|---|
| Máximo 3 funcionalidades de esforço alto (🛠️🛠️🛠️) por onda | Onda 1: 0 · Onda 2: 0 · Onda 3: 1 |
| Máximo 1 funcionalidade amarela ou vermelha por onda | Onda 1: 1 · Onda 2: 1 · Onda 3: 1 |
| Toda dependência em onda anterior ou na mesma | Verificada item a item na seção de dependências |

### O problema que a segunda regra revelou

A matriz de semáforo produziu 7 funcionalidades amarelas e 3 vermelhas, somando 10 incertezas. Com o teto de uma por onda, três ondas comportam apenas três delas. Em vez de ignorar a regra, o time aplicou a orientação da própria dinâmica: quando uma funcionalidade concentra valor alto e incerteza alta, ela deve ser quebrada em algo mais simples primeiro.

Quatro funcionalidades foram simplificadas e passaram a verdes, antecipando a entrega de valor sem antecipar o risco:

| Funcionalidade original | Versão simplificada | Risco adiado |
|---|---|---|
| Conversar por chat interno em tempo real 🟡 🛠️🛠️🛠️ | Chat simples vinculado à troca, sem WebSocket 🟢 🛠️🛠️ | Mensageria em tempo real |
| Notificar por push 🟡 🛠️🛠️ | Aviso dentro do app, com contador na tela inicial 🟢 🛠️ | Firebase, tokens de dispositivo, permissões no iOS |
| Agendar data, hora e área comum 🟡 🛠️🛠️ | Campo de data e local combinados dentro do chat 🟢 🛠️ | Agenda com controle de ocupação |
| Visualizar Árvore de Talentos 🔴 🛠️🛠️🛠️ | Lista das habilidades mais pedidas sem oferta 🟢 🛠️ | Visualização hierárquica e índice de cobertura |

O síndico recebe a informação de lacunas desde a Onda 2; o que fica para depois é o gráfico, não o dado.

---

## 🌊 Onda 1 — O MVP

**Hipótese a validar:** moradores de um mesmo condomínio realizam trocas de habilidades quando existe um canal confiável e um registro justo de reciprocidade.

| # | Funcionalidade | 🟢🟡🔴 | 💰 | ❤️ | 🛠️ |
|---|---|---|---|---|---|
| 1 | Cadastrar conta com unidade e código | 🟢 | 💰💰 | ❤️❤️ | 🛠️ |
| 2 | Validar morador pelo síndico | 🟢 | 💰💰💰 | ❤️❤️ | 🛠️ |
| 3 | Exibir perfil com habilidades | 🟢 | 💰💰 | ❤️❤️❤️ | 🛠️ |
| 4 | Cadastrar habilidade oferecida | 🟢 | 💰💰💰 | ❤️❤️❤️ | 🛠️ |
| 5 | Cadastrar necessidade procurada | 🟢 | 💰💰💰 | ❤️❤️ | 🛠️ |
| 6 | Buscar habilidade por palavra-chave | 🟢 | 💰💰💰 | ❤️❤️❤️ | 🛠️🛠️ |
| 7 | Enviar solicitação a um vizinho | 🟢 | 💰💰💰 | ❤️❤️❤️ | 🛠️🛠️ |
| 8 | Aceitar ou recusar solicitação | 🟢 | 💰💰💰 | ❤️❤️❤️ | 🛠️ |
| 9 | **Concluir a troca com dupla confirmação e transferir os créditos** | 🟡 | 💰💰💰 | ❤️❤️ | 🛠️🛠️ |
| 10 | Exibir saldo na tela inicial | 🟢 | 💰💰 | ❤️❤️❤️ | 🛠️ |
| 11 | Avaliar o vizinho com nota | 🟢 | 💰💰💰 | ❤️❤️ | 🛠️ |
| 12 | Chat simples vinculado à troca *(simplificada)* | 🟢 | 💰💰💰 | ❤️❤️❤️ | 🛠️🛠️ |

**Validação:** 0 de esforço alto · 1 incerteza · dependências satisfeitas.

A única incerteza admitida é a transação de créditos, que é o coração do produto: se o saldo divergir uma vez, a confiança acaba. Reservar para ela o único espaço de risco da onda é uma decisão deliberada.

---

## 🌊 Onda 2 — O Incremento

**Hipótese a validar:** oficinas abertas resolvem o problema de liquidez, e o síndico adota a ferramenta quando ela devolve informação de gestão.

| # | Funcionalidade | 🟢🟡🔴 | 💰 | ❤️ | 🛠️ |
|---|---|---|---|---|---|
| 1 | **Criar oficina com vagas limitadas** | 🟡 | 💰💰💰 | ❤️❤️❤️ | 🛠️🛠️ |
| 2 | Inscrever-se em oficina de vizinho | 🟢 | 💰💰💰 | ❤️❤️❤️ | 🛠️🛠️ |
| 3 | Listar habilidades em falta no prédio *(simplificada)* | 🟢 | 💰💰💰 | ❤️❤️ | 🛠️ |
| 4 | Aprovar cadastros no painel | 🟢 | 💰💰💰 | ❤️ | 🛠️ |
| 5 | Ranquear moradores por trocas | 🟢 | 💰💰 | ❤️❤️ | 🛠️ |
| 6 | Publicar e agendar avisos | 🟢 | 💰💰 | ❤️❤️ | 🛠️🛠️ |
| 7 | Bloquear trocas por período | 🟢 | 💰💰 | ❤️ | 🛠️🛠️ |
| 8 | Visualizar extrato de créditos | 🟢 | 💰💰 | ❤️❤️ | 🛠️🛠️ |
| 9 | Bloquear pedido abaixo do limite de dívida | 🟢 | 💰💰💰 | ❤️ | 🛠️ |
| 10 | Listar solicitações recebidas | 🟢 | 💰💰 | ❤️❤️❤️ | 🛠️ |
| 11 | Denunciar conduta inadequada | 🟢 | 💰💰💰 | ❤️❤️ | 🛠️ |
| 12 | Cancelar troca com justificativa | 🟢 | 💰 | ❤️❤️ | 🛠️ |
| 13 | Filtrar busca por categoria e bloco | 🟢 | 💰💰 | ❤️❤️ | 🛠️ |
| 14 | Aviso dentro do app *(simplificada)* | 🟢 | 💰💰 | ❤️❤️ | 🛠️ |

**Validação:** 0 de esforço alto · 1 incerteza · dependências satisfeitas.

As oficinas aparecem aqui e não na Onda 1 por uma razão de método: só faz sentido resolver o problema de liquidez depois de medir, no piloto, qual é o volume real de trocas um a um.

---

## 🌊 Onda 3 — O Futuro

**Hipótese a validar:** a visualização de lacunas muda a decisão do síndico, e a gamificação sustenta o uso no longo prazo.

| # | Funcionalidade | 🟢🟡🔴 | 💰 | ❤️ | 🛠️ |
|---|---|---|---|---|---|
| 1 | **Visualizar Árvore de Talentos completa** | 🔴 | 💰💰💰 | ❤️❤️❤️ | 🛠️🛠️🛠️ |
| 2 | Conceder selos por participação | 🟢 | 💰 | ❤️❤️ | 🛠️🛠️ |
| 3 | Ordenar resultados por avaliação | 🟢 | 💰 | ❤️❤️ | 🛠️ |
| 4 | Destacar novos ofertantes na tela inicial | 🟢 | 💰💰 | ❤️❤️ | 🛠️ |
| 5 | Marcar período indisponível | 🟢 | 💰 | ❤️❤️ | 🛠️ |
| 6 | Informar duração estimada da troca | 🟢 | 💰💰 | ❤️❤️ | 🛠️ |
| 7 | Exportar relatório para a assembleia | 🟢 | 💰💰 | ❤️ | 🛠️🛠️ |

**Validação:** 1 de esforço alto · 1 incerteza · dependências satisfeitas.

A Árvore de Talentos completa é o caso clássico que a dinâmica descreve: valor altíssimo para o negócio e para a experiência, conhecimento vermelho e esforço alto. Antecipá-la atrasaria o MVP inteiro. Ela entra depois que a versão simples, entregue na Onda 2, provar que o síndico usa a informação.

---

## Ondas futuras (fora das três primeiras)

A regra de incerteza impede que estas entrem nas ondas acima. Elas permanecem no backlog, cada uma reservando o espaço de risco de uma onda posterior.

| Funcionalidade | 🟢🟡🔴 | 🛠️ | Por que ficou fora |
|---|---|---|---|
| Reter créditos em custódia | 🟡 | 🛠️🛠️🛠️ | Protege um caso de borda (gastar crédito com troca pendente) que, com 38 usuários no piloto, é raro |
| Conversar por chat em tempo real | 🟡 | 🛠️🛠️🛠️ | A versão simples entrega quase todo o valor de experiência |
| Notificar por push | 🟡 | 🛠️🛠️ | Depende de configuração de Firebase e permissões no iOS |
| Sugerir pares automaticamente | 🔴 | 🛠️🛠️🛠️ | Base de 38 usuários é pequena demais para qualquer abordagem estatística |
| Integrar cadastro à administradora | 🔴 | 🛠️🛠️🛠️ | Depende de negociação comercial externa ao projeto |

---

## Dependências mapeadas

| Funcionalidade | Depende de | Onda da dependência | Situação |
|---|---|---|---|
| Buscar habilidade | Cadastrar habilidade oferecida | Onda 1 | Mesma onda, ordem respeitada |
| Enviar solicitação | Buscar habilidade + Exibir perfil | Onda 1 | Mesma onda, ordem respeitada |
| Concluir troca e transferir créditos | Aceitar solicitação | Onda 1 | Mesma onda, ordem respeitada |
| Avaliar o vizinho | Concluir a troca | Onda 1 | Mesma onda, ordem respeitada |
| Exibir saldo | Transferir créditos | Onda 1 | Mesma onda, ordem respeitada |
| Visualizar extrato | Transferir créditos | Onda 1 | Onda anterior |
| Inscrever-se em oficina | Criar oficina | Onda 2 | Mesma onda, ordem respeitada |
| Listar habilidades em falta | Cadastrar necessidade procurada | Onda 1 | Onda anterior |
| Ranquear moradores | Concluir troca | Onda 1 | Onda anterior |
| Bloquear trocas por período | Enviar solicitação | Onda 1 | Onda anterior |
| Árvore de Talentos completa | Listar habilidades em falta | Onda 2 | Onda anterior |
| Reter créditos em custódia | Transferir créditos | Onda 1 | Onda anterior |

---

## Observação sobre as regras do template

O quadro do Lean Inception traz, no próprio canvas do sequenciador, um conjunto de regras mais restritivo que o do enunciado desta atividade: máximo de três cartões por onda, soma de esforço até cinco e soma de valor mínima por onda. Aplicadas à risca, essas regras produziriam cerca de doze ondas em vez de três.

Esta entrega segue as regras do enunciado — três ondas, teto de três funcionalidades pesadas e uma incerteza por onda — e registra a divergência para que a escolha fique explícita. Se a avaliação exigir o formato do template, cada onda aqui se desdobra em quatro ondas menores preservando a mesma ordem de precedência.
