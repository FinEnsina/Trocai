# Kick-off e Visão do Produto — **Trocaí**

> Sistema de troca de habilidades entre moradores de condomínios
> Economia colaborativa · Créditos virtuais · Fortalecimento de comunidade

| Campo | Conteúdo |
|---|---|
| Nome do produto | **Trocaí** (nomes alternativos avaliados: Vizinhô, TrocaLar, Elo Condomínio) |
| Slogan | *"O que você sabe fazer vale muito aqui do lado."* |
| Plataformas | Aplicativo mobile (morador) + Painel web (síndico/administração) |
| Moeda interna | **Elos** — créditos virtuais, sem valor monetário e sem conversão em dinheiro |
| Curso / Disciplina | Fatec Osasco — DSM |
| Entrega | Kick-off e Visão do Produto |
| Versão | 1.0 |

---

# PARTE 1 — KICK-OFF

## 1.1 Contexto e motivação

Condomínios verticais concentram, em poucos metros quadrados, uma diversidade enorme de competências: professores, desenvolvedores, cozinheiros, músicos, costureiras, estudantes de idiomas, cuidadores de animais. Ao mesmo tempo, esses mesmos moradores contratam serviços externos, pagam por aulas particulares e convivem com um índice baixíssimo de interação social — muitas vezes sem saber o nome do vizinho de porta.

Existe, portanto, um recurso ocioso e invisível dentro do condomínio: o conhecimento das pessoas. O Trocaí torna esse recurso visível, mensurável e trocável, sem envolver dinheiro real, usando um sistema de créditos que registra reciprocidade em vez de transação financeira.

## 1.2 Problema a ser resolvido

| Dor | Quem sente | Consequência atual |
|---|---|---|
| Não sei quem no meu prédio sabe fazer o que eu preciso | Morador | Contrata serviço externo, gasta dinheiro |
| Tenho uma habilidade útil, mas nenhum canal para oferecê-la aos vizinhos | Morador | Habilidade ociosa, zero reconhecimento |
| Grupos de WhatsApp viram bagunça, spam e conflito | Morador e síndico | Pedidos se perdem, ninguém modera |
| Não tenho como incentivar convivência nem medir engajamento | Síndico | Áreas comuns subutilizadas, comunidade fria |
| Não sei quais serviços faltam na comunidade | Síndico | Decisões de oficinas/eventos no "achismo" |
| Troca informal gera desconfiança ("e se a pessoa não retribuir?") | Morador | Ninguém dá o primeiro passo |

**Declaração do problema:** moradores de condomínio possuem habilidades complementares entre si, mas não dispõem de um ambiente confiável, organizado e justo para oferecê-las e solicitá-las, o que faz a comunidade recorrer ao mercado externo e perder oportunidades de convivência.

## 1.3 Objetivos

**Objetivo geral:** desenvolver um ecossistema (app + painel web) que viabilize a troca de habilidades entre moradores de um mesmo condomínio por meio de créditos virtuais, promovendo economia colaborativa e fortalecimento dos laços comunitários.

**Objetivos específicos**

1. Permitir que o morador cadastre habilidades que oferece e necessidades que possui.
2. Implementar um mecanismo de créditos (Elos) que registre e equilibre as trocas sem uso de dinheiro real.
3. Disponibilizar busca e recomendação de vizinhos por habilidade, disponibilidade e reputação.
4. Oferecer chat interno para combinar encontros nas áreas comuns.
5. Entregar ao síndico um painel com ranking de atividade, gestão de avisos e bloqueios, e a visualização "Árvore de Talentos".
6. Garantir segurança, moderação e conformidade com a LGPD, já que o público é identificável (unidade/apartamento).

## 1.4 O produto É — NÃO É — FAZ — NÃO FAZ (ENFN)

**Regra de classificação adotada:** substantivo ou adjetivo vai para **É / NÃO É**; verbo de ação vai para **FAZ / NÃO FAZ**.

### TROCAÍ

| **O produto É** *(substantivos e adjetivos)* | **O produto NÃO É** |
|---|---|
| Um ecossistema digital: aplicativo mobile + painel web | Uma rede social aberta ao público |
| Uma rede fechada e verificada por condomínio | Um marketplace de serviços pagos |
| Um sistema de economia colaborativa | Uma plataforma de contratação de freelancers |
| Uma moeda de reciprocidade (créditos virtuais) | Uma criptomoeda ou meio de pagamento |
| Um catálogo vivo dos talentos do prédio | Um sistema de gestão condominial (boletos, atas, reservas) |
| Comunitário, local e de vizinhança | Um aplicativo de relacionamento ou paquera |
| Gratuito para o morador | Um classificado de compra e venda |
| Simples e acessível (inclusive para idosos) | Complexo ou voltado a público técnico |
| Moderado e transparente para a administração | Anônimo |
| Voluntário | Obrigatório ou imposto pela assembleia |

| **O produto FAZ** *(verbos de ação)* | **O produto NÃO FAZ** |
|---|---|
| Cadastra e valida moradores por unidade | Não processa pagamentos nem converte créditos em dinheiro |
| Divulga as habilidades que cada morador oferece | Não emite nota fiscal nem contrato de prestação de serviço |
| Registra as necessidades que cada morador procura | Não permite trocas entre condomínios diferentes |
| Conecta oferta e demanda dentro do mesmo condomínio | Não verifica antecedentes nem certifica profissionalmente |
| Credita e debita Elos ao concluir a troca | Não garante a qualidade técnica do serviço prestado |
| Retém os créditos em custódia até a dupla confirmação | Não permite transferir créditos fora de uma troca registrada |
| Aproxima vizinhos por meio do chat interno | Não expõe telefone, e-mail ou número do apartamento |
| Agenda encontros nas áreas comuns | Não reserva nem controla a ocupação dos espaços |
| Avalia reputação de forma mútua | Não julga nem arbitra conflitos automaticamente |
| Ranqueia os moradores mais ativos | Não premia com dinheiro, desconto ou abatimento de condomínio |
| Publica os avisos do síndico | Não substitui o aplicativo oficial da administradora |
| Bloqueia trocas em períodos definidos pela administração | Não cancela trocas já aceitas durante o bloqueio |
| Revela as habilidades em falta pela Árvore de Talentos | Não vende dados dos moradores nem exibe publicidade |
| Modera denúncias e suspende usuários | Não acompanha nem se responsabiliza pelo encontro presencial |

**Fora de escopo do MVP (avaliar em releases futuras):** videochamada nativa, integração com fechaduras/portaria, empréstimo de objetos, doação de Elos para causas do condomínio, versão multi-condomínio (bairro).

## 1.5 Stakeholders

| Stakeholder | Interesse | Influência |
|---|---|---|
| Morador ofertante | Reconhecimento, créditos, socialização | Alta |
| Morador solicitante | Resolver necessidade sem gastar | Alta |
| Síndico | Engajamento, ordem, redução de conflito | Alta (decisor de adoção) |
| Administradora / zeladoria | Uso das áreas comuns, agenda | Média |
| Conselho fiscal / assembleia | Aprovação da ferramenta | Média |
| Equipe de desenvolvimento | Entrega dentro do prazo acadêmico | Alta |
| Professor / orientador | Qualidade técnica e de processo | Alta |

## 1.6 Equipe e papéis

| Papel | Responsabilidade |
|---|---|
| Product Owner | Prioriza backlog, valida entregas, representa o síndico/morador |
| Scrum Master | Facilita cerimônias, remove impedimentos |
| Time de desenvolvimento (mobile) | App Flutter, integração com API |
| Time de desenvolvimento (web/back-end) | API, banco, painel administrativo |
| UX/UI | Protótipos de baixa e alta fidelidade, identidade visual |
| QA / DevOps | Testes, CI/CD, ambiente de homologação |

> Preencher com os nomes reais da equipe antes da entrega.

## 1.7 Premissas e restrições

**Premissas**
- Todos os usuários pertencem a um condomínio previamente cadastrado e validado pelo síndico.
- O condomínio possui área comum utilizável para os encontros.
- Os moradores possuem smartphone com acesso à internet.
- A adesão é voluntária e gratuita.

**Restrições**
- Prazo acadêmico do semestre (aproximadamente 4 sprints).
- Equipe reduzida e sem dedicação integral.
- Custo de infraestrutura próximo de zero (tiers gratuitos).
- Nenhuma funcionalidade pode envolver transação financeira real.
- Tratamento de dados pessoais sujeito à LGPD (Lei 13.709/2018).

## 1.8 Riscos do projeto

| # | Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | Baixa adesão inicial (efeito rede: app vazio não atrai ninguém) | Alta | Alto | Onboarding com bônus de Elos, campanha do síndico, meta de 15 cadastros antes do lançamento |
| R2 | Desequilíbrio de créditos (muitos pedindo, poucos oferecendo) | Média | Alto | Saldo inicial limitado, teto de dívida, destaque de habilidades em falta |
| R3 | Conflitos entre vizinhos por troca malsucedida | Média | Alto | Avaliação mútua, canal de denúncia, mediação pelo síndico, termo de uso claro |
| R4 | Uso indevido para serviço profissional pago por fora | Média | Médio | Termo de uso, moderação, limite de trocas por período |
| R5 | Exposição de dados pessoais (unidade, telefone) | Média | Alto | Exibir apenas nome + bloco/andar; contato só via chat interno |
| R6 | Escopo maior que o prazo do semestre | Alta | Médio | MVP enxuto, MoSCoW, corte de features não essenciais |
| R7 | Curva de aprendizado da equipe na stack | Média | Médio | Spike técnico na Sprint 0, pareamento |
| R8 | Assédio ou conduta inadequada no chat | Baixa | Alto | Denúncia em um toque, bloqueio de usuário, log de mensagens para moderação |

## 1.9 Stack tecnológica proposta

| Camada | Tecnologia | Justificativa |
|---|---|---|
| App mobile | Flutter (Dart) | Código único Android/iOS, domínio da equipe |
| Painel web | React + Vite + TypeScript | Ecossistema maduro, bibliotecas de gráficos |
| Back-end | Node.js + Express (REST) | Produtividade, mesma linguagem no front web |
| Banco de dados | PostgreSQL | Relacional, transações ACID para o saldo de Elos |
| Autenticação | JWT + verificação por código do síndico | Restringe acesso ao condomínio |
| Chat | WebSocket (Socket.IO) | Mensagens em tempo real |
| Notificações | Firebase Cloud Messaging | Push gratuito |
| Visualização | D3.js ou Recharts | Árvore de Talentos e gráficos do painel |
| Versionamento | Git + GitHub | Fluxo de PRs e code review |
| CI/CD | GitHub Actions | Testes e build automatizados |
| Gestão | GitHub Projects / Trello | Backlog e quadro Kanban |
| Design | Figma | Protótipos e design system |

## 1.10 Metodologia e acordos de trabalho

- **Framework:** Scrum adaptado, sprints de 2 semanas.
- **Cerimônias:** planning, daily assíncrona, review e retrospectiva.
- **Definition of Ready (DoR):** história com valor claro, critérios de aceitação, estimativa e dependências mapeadas.
- **Definition of Done (DoD):** código revisado por par, testes passando no CI, documentação atualizada, funcionalidade validada em homologação pelo PO.
- **Padrões:** Conventional Commits, branches `feature/`, `fix/`, `docs/`, PR obrigatório para a `main`.

## 1.11 Cronograma macro

| Sprint | Foco | Entregáveis |
|---|---|---|
| Sprint 0 | Kick-off, visão do produto, setup | Este documento, repositórios, protótipo de baixa fidelidade |
| Sprint 1 | Fundação | Cadastro/login, perfil, cadastro de habilidades, modelo de dados |
| Sprint 2 | Núcleo da troca | Busca, solicitação, aceite, conclusão, motor de créditos |
| Sprint 3 | Comunicação e comunidade | Chat interno, avaliações, notificações |
| Sprint 4 | Painel do síndico | Ranking, avisos, bloqueio de períodos, Árvore de Talentos |
| Sprint 5 | Fechamento | Testes, ajustes de UX, documentação final, apresentação |

---

# PARTE 2 — VISÃO DO PRODUTO

## 2.1 Preenchimento do template (dinâmica colaborativa)

A equipe foi dividida em grupos e cada grupo preencheu lacunas distintas do template. Resultado por lacuna:

| Lacuna | Preenchimento |
|---|---|
| **Para** | moradores de condomínios residenciais e para o síndico responsável pela convivência |
| **cujo** | problema é não conseguir identificar, acessar e retribuir de forma justa as habilidades que existem dentro do próprio prédio, recorrendo a serviços pagos externos e convivendo com uma comunidade desconectada |
| **O** | Trocaí |
| **é um** | ecossistema digital de economia colaborativa (aplicativo mobile para o morador e painel web para a administração) |
| **que** | permite anunciar o que se sabe fazer e o que se precisa, encontrar o vizinho certo e registrar a troca por meio de créditos virtuais (Elos), com chat interno para combinar os encontros nas áreas comuns |
| **diferentemente do** | grupo de WhatsApp do condomínio e dos marketplaces de serviços como GetNinjas ou Facebook Marketplace |
| **O nosso produto** | opera em uma rede fechada e verificada por condomínio, sem dinheiro envolvido, equilibrando as trocas por um sistema de créditos e oferecendo ao síndico dados de engajamento e uma Árvore de Talentos que revela quais habilidades faltam na comunidade |

### Frase única consolidada

> **Para** moradores de condomínios residenciais e para o síndico responsável pela convivência, **cujo** problema é não conseguir identificar, acessar e retribuir de forma justa as habilidades que já existem dentro do próprio prédio, **o Trocaí é um** ecossistema digital de economia colaborativa **que** permite anunciar o que se sabe fazer e o que se precisa, encontrar o vizinho certo e registrar cada troca por meio de créditos virtuais, com chat interno para combinar os encontros nas áreas comuns. **Diferentemente do** grupo de WhatsApp do condomínio e dos marketplaces de serviços pagos, **o nosso produto** funciona em uma rede fechada e verificada, sem envolver dinheiro real, equilibra as trocas por um sistema de créditos e entrega ao síndico indicadores de engajamento e uma Árvore de Talentos que mostra visualmente quais habilidades estão em falta na comunidade.

### Elevator pitch (versão curta para apresentação)

> Seu prédio tem um professor de violão no 4º andar, alguém que conserta computadores no 9º e uma vizinha que adora passear com cachorros. Ninguém sabe disso. O Trocaí transforma esse conhecimento em uma moeda de comunidade: você ensina algo, ganha Elos; precisa de algo, gasta Elos. Sem dinheiro, sem estranhos — só o seu condomínio.

## 2.2 Objetivos de negócio

| Objetivo | Indicador | Meta (piloto de 3 meses, 1 condomínio) |
|---|---|---|
| Ativar a base de moradores | % de unidades com ao menos 1 cadastro | ≥ 40% |
| Gerar trocas reais | Trocas concluídas por mês | ≥ 30 |
| Equilibrar a economia interna | % de usuários com saldo entre −2 e +10 Elos | ≥ 80% |
| Reter usuários | Usuários ativos mensais / cadastrados | ≥ 50% |
| Reduzir gasto externo | Serviços resolvidos internamente (autodeclarado) | ≥ 20 por trimestre |
| Fortalecer comunidade | NPS comunitário | ≥ 50 |
| Dar visibilidade ao síndico | Lacunas de habilidade identificadas e supridas | ≥ 3 por trimestre |

## 2.3 Personas

**Persona 1 — Camila, 29 anos, analista de marketing, apto 74B**
Trabalha em home office, mora sozinha, tem pouco tempo. Sabe revisar currículos e escrever bem. Precisa de alguém que conserte o notebook e adoraria aprender violão. Não conhece ninguém do prédio.
*Necessidade:* resolver problemas cotidianos sem gastar e conhecer pessoas sem se expor.
*Frustração:* grupos de WhatsApp com 300 pessoas e nenhuma resposta útil.

**Persona 2 — Seu Antônio, 63 anos, aposentado, apto 22A**
Ex-técnico em eletrônica, tem tempo de sobra e gosta de ser útil. Não tem intimidade com apps complexos.
*Necessidade:* sentir-se reconhecido e ocupar o tempo com propósito.
*Frustração:* interfaces pequenas, cadastros longos, medo de "cair em golpe".

**Persona 3 — Bruno, 17 anos, estudante, apto 51C**
Joga bem, entende de tecnologia, ajuda os pais com o celular. Quer aprender inglês para o vestibular.
*Necessidade:* trocar o que sabe (tecnologia) pelo que precisa (aulas), já que não tem renda própria.
*Frustração:* não é levado a sério pelos adultos do condomínio.

**Persona 4 — Rita, 45 anos, síndica há 2 anos**
Concilia o mandato com o trabalho. Quer reduzir conflitos e aumentar o uso das áreas comuns.
*Necessidade:* visão do que acontece na comunidade e controle sobre períodos críticos (obras, assembleias).
*Frustração:* toma decisões sem dado nenhum e apaga incêndio no WhatsApp.

## 2.4 Jornada do usuário (morador)

1. **Descoberta** — vê o cartaz no elevador / recebe o código do condomínio no informe do síndico.
2. **Cadastro** — baixa o app, informa nome, unidade e código; o síndico aprova.
3. **Onboarding** — recebe 3 Elos de boas-vindas e é convidado a cadastrar 1 habilidade e 1 necessidade.
4. **Exploração** — navega pela Árvore de Talentos do prédio e vê que Seu Antônio conserta eletrônicos.
5. **Solicitação** — envia um pedido informando o que precisa e o tempo estimado.
6. **Negociação** — os dois combinam pelo chat interno data, hora e local (salão de festas, sábado 15h).
7. **Encontro** — a troca acontece na área comum.
8. **Conclusão** — ambos confirmam no app; os Elos são transferidos automaticamente.
9. **Avaliação** — cada um avalia o outro (1 a 5 estrelas + comentário opcional).
10. **Retorno** — com saldo positivo, Camila solicita as aulas de violão e o ciclo recomeça.

## 2.5 Funcionalidades — App do Morador

| # | Funcionalidade | Descrição | Prioridade (MoSCoW) |
|---|---|---|---|
| F01 | Cadastro com validação de unidade | Vínculo ao condomínio via código + aprovação do síndico | Must |
| F02 | Perfil do morador | Foto, bio, bloco/andar, habilidades, reputação, saldo de Elos | Must |
| F03 | Cadastro de habilidades oferecidas | Título, categoria, descrição, custo em Elos, disponibilidade | Must |
| F04 | Cadastro de necessidades | O que a pessoa procura, com categoria e urgência | Must |
| F05 | Busca e filtros | Por categoria, palavra-chave, avaliação, disponibilidade, bloco | Must |
| F06 | Solicitação de troca | Envio, aceite, recusa e cancelamento com justificativa | Must |
| F07 | Carteira de Elos | Saldo, extrato de entradas e saídas, transações pendentes | Must |
| F08 | Confirmação dupla de conclusão | Só transfere Elos quando ambos confirmam | Must |
| F09 | Chat interno 1:1 | Mensagens em tempo real, vinculadas a uma troca | Must |
| F10 | Agendamento do encontro | Data, hora e área comum sugerida dentro do chat | Should |
| F11 | Avaliação mútua | Nota + comentário após a conclusão | Must |
| F12 | Notificações push | Novo pedido, mensagem, confirmação pendente, aviso do síndico | Should |
| F13 | Mural de avisos | Comunicados do síndico exibidos no app | Should |
| F14 | Árvore de Talentos (visão morador) | Mostra categorias em falta para incentivar novas ofertas | Should |
| F15 | Denúncia e bloqueio de usuário | Canal direto para a moderação | Must |
| F16 | Selos e conquistas | Gamificação: "Primeira troca", "Mentor do mês" | Could |
| F17 | Trocas em grupo / oficinas | Um ofertante para vários moradores | Could |
| F18 | Modo acessibilidade | Fonte ampliada e alto contraste (persona Antônio) | Should |

## 2.6 Funcionalidades — Painel Web (Síndico/ADM)

| # | Funcionalidade | Descrição | Prioridade |
|---|---|---|---|
| W01 | Login administrativo | Acesso restrito ao síndico e subsíndico | Must |
| W02 | Aprovação de cadastros | Valida se a pessoa realmente mora na unidade | Must |
| W03 | Dashboard de engajamento | Trocas do mês, usuários ativos, Elos em circulação | Must |
| W04 | Ranking de moradores mais ativos | Ordenado por trocas concluídas e avaliação média | Must |
| W05 | Gestão de avisos | Criar, agendar, fixar e expirar comunicados | Must |
| W06 | Bloqueio de período | Suspender novas trocas em intervalos definidos (ex.: semana de reforma) | Must |
| W07 | Árvore de Talentos | Visualização em árvore/mapa de calor por categoria: ramos fortes = habilidade abundante, ramos secos = habilidade em falta | Must |
| W08 | Relatório de lacunas | Lista de necessidades sem oferta correspondente | Should |
| W09 | Moderação | Fila de denúncias, histórico do usuário, suspensão | Must |
| W10 | Gestão de áreas comuns | Cadastro dos espaços disponíveis para encontros | Should |
| W11 | Exportação de relatórios | CSV/PDF para prestação de contas em assembleia | Could |
| W12 | Ajuste de parâmetros | Saldo inicial, teto de dívida, valor padrão por hora | Should |

### Detalhamento da Árvore de Talentos

Visualização hierárquica em três níveis:

- **Tronco:** o condomínio.
- **Ramos:** categorias de habilidade (Educação, Tecnologia, Saúde e Bem-estar, Casa e Reparos, Pets, Culinária, Arte e Música, Serviços Administrativos).
- **Folhas:** habilidades específicas.

Cada folha recebe uma cor conforme o índice de cobertura = (ofertas ativas ÷ demandas registradas):

| Cor | Situação | Leitura para o síndico |
|---|---|---|
| Verde | Cobertura ≥ 1,0 | Habilidade abundante |
| Amarelo | 0,3 ≤ cobertura < 1,0 | Demanda parcialmente atendida |
| Vermelho / folha seca | Cobertura < 0,3 | **Habilidade em falta** — oportunidade de campanha ou oficina |
| Cinza | Sem oferta e sem demanda | Categoria adormecida |

Ao clicar em uma folha vermelha, o síndico vê quantos moradores pediram aquilo e pode disparar um aviso segmentado: *"Alguém sabe consertar computador? 6 vizinhos estão procurando."*

## 2.7 Regras de negócio dos créditos (Elos)

| Regra | Definição |
|---|---|
| RN01 | 1 Elo equivale a 30 minutos de dedicação. Referência sugerida, negociável entre as partes. |
| RN02 | Todo novo morador aprovado recebe 3 Elos de boas-vindas. |
| RN03 | Elos não têm valor monetário, não podem ser comprados, vendidos nem convertidos em dinheiro. |
| RN04 | O débito e o crédito só ocorrem após a confirmação de ambas as partes. |
| RN05 | O saldo pode ficar negativo até o limite de −3 Elos; abaixo disso o morador só pode ofertar, não solicitar. |
| RN06 | Elos ficam retidos (em custódia) desde o aceite da troca até a conclusão ou o cancelamento. |
| RN07 | Cancelamento antes do encontro devolve integralmente os Elos retidos. |
| RN08 | Divergência na confirmação abre um chamado para mediação do síndico. |
| RN09 | Elos são pessoais e intransferíveis fora de uma troca registrada (transferência direta bloqueada no MVP). |
| RN10 | Elos não expiram durante o piloto; política de expiração pode ser avaliada depois. |
| RN11 | Durante um período bloqueado pelo síndico, novas solicitações ficam indisponíveis; trocas já aceitas permanecem válidas. |
| RN12 | Teto de 10 trocas concluídas por morador por mês, para evitar profissionalização disfarçada. |

## 2.8 Requisitos não funcionais

| Categoria | Requisito |
|---|---|
| Segurança | Senhas com hash bcrypt; autenticação JWT com expiração; acesso restrito a moradores validados |
| Privacidade / LGPD | Consentimento explícito no cadastro; exibição pública apenas de nome e bloco/andar; direito à exclusão de conta e anonimização do histórico |
| Desempenho | Resposta da API abaixo de 500 ms em 95% das requisições; entrega de mensagem no chat abaixo de 1 s |
| Disponibilidade | 99% no horário de 6h às 23h |
| Usabilidade | Cadastro completo em até 3 minutos; fluxo principal em no máximo 4 toques |
| Acessibilidade | Contraste conforme WCAG 2.1 AA, suporte a leitor de tela, fonte escalável |
| Confiabilidade | Operações de saldo executadas em transação atômica no banco, com log imutável de movimentações |
| Portabilidade | Android 8+ e iOS 13+; painel web responsivo em navegadores atualizados |
| Manutenibilidade | Cobertura mínima de 60% de testes no back-end; código padronizado por linter |
| Escalabilidade | Modelo multi-tenant preparado para múltiplos condomínios |

## 2.9 MVP Canvas

| Bloco | Conteúdo |
|---|---|
| **Proposta do MVP** | Validar que moradores de um condomínio realizam trocas de habilidades quando existe um sistema de créditos justo e um canal confiável de contato |
| **Personas segmentadas** | Camila (usuária ativa digital), Seu Antônio (ofertante com tempo), Rita (síndica) |
| **Jornadas** | Ofertar habilidade → ser encontrado → combinar → concluir → receber Elos / Buscar → solicitar → combinar → concluir → gastar Elos |
| **Funcionalidades do MVP** | F01–F09, F11, F15, W01–W07, W09 |
| **Resultado esperado** | 30 trocas concluídas em 3 meses, com 40% das unidades ativas e nota média ≥ 4,2 |
| **Métricas para validar** | Trocas concluídas, taxa de conclusão pós-aceite, saldo médio, retenção mensal, lacunas supridas |
| **Custo e cronograma** | 5 sprints de 2 semanas, infraestrutura em tier gratuito, custo direto próximo de zero |

## 2.10 Sequenciador (releases)

| Release | Conteúdo | Objetivo |
|---|---|---|
| **R1 — Fundação** | Cadastro validado, perfil, habilidades, necessidades, busca | Popular o catálogo de talentos |
| **R2 — Economia** | Solicitação, custódia, confirmação dupla, carteira, extrato | Fazer a primeira troca acontecer |
| **R3 — Comunidade** | Chat, agendamento, avaliação, notificações, denúncia | Dar confiança e fluidez |
| **R4 — Gestão** | Dashboard, ranking, avisos, bloqueio, Árvore de Talentos, moderação | Entregar valor ao síndico |
| **R5 — Engajamento** | Selos, oficinas em grupo, relatórios exportáveis | Sustentar o uso no longo prazo |

## 2.11 Análise competitiva

| Solução | Foco | Limitação frente ao Trocaí |
|---|---|---|
| Grupo de WhatsApp do condomínio | Comunicação informal | Sem organização, sem histórico, sem reciprocidade, alto ruído |
| GetNinjas / Habitissimo | Contratação de serviços | Envolve dinheiro, profissionais externos, sem vínculo comunitário |
| Facebook Marketplace / OLX | Compra e venda | Transacional, público aberto, sem segurança de vizinhança |
| Apps de condomínio (uCondo, Superlógica, Área Nobre) | Gestão administrativa | Focam em boletos, reservas e atas; não tratam habilidades nem economia de trocas |
| Bancos de tempo (Timerepublik, Time Bank) | Troca de tempo | Não são segmentados por condomínio, não têm painel para síndico, adesão baixa no Brasil |
| Nextdoor | Rede de vizinhança | Escopo de bairro, sem sistema de créditos, indisponível no Brasil |

**Diferencial competitivo:** a combinação de rede fechada verificada por condomínio + moeda de reciprocidade sem dinheiro + inteligência de lacunas de habilidade para a gestão. Nenhum concorrente entrega os três simultaneamente.

## 2.12 Métricas de acompanhamento (framework AARRR)

| Etapa | Métrica |
|---|---|
| Aquisição | Cadastros aprovados / unidades do condomínio |
| Ativação | % de novos usuários que cadastram ao menos 1 habilidade em 7 dias |
| Retenção | Usuários ativos mensais / total de cadastrados |
| Receita (valor social) | Elos movimentados por mês e horas de serviço trocadas |
| Recomendação | NPS e convites enviados a vizinhos |
| Saúde da economia | Índice de cobertura médio na Árvore de Talentos |
| Confiança | Avaliação média e taxa de denúncias por 100 trocas |

## 2.13 Glossário

| Termo | Definição |
|---|---|
| **Elo** | Unidade de crédito virtual do Trocaí; 1 Elo ≈ 30 minutos de dedicação |
| **Troca** | Ciclo completo: solicitação, aceite, encontro, confirmação dupla e avaliação |
| **Custódia** | Estado em que os Elos ficam retidos entre o aceite e a conclusão |
| **Árvore de Talentos** | Visualização das habilidades do condomínio por categoria, com destaque para as que estão em falta |
| **Índice de cobertura** | Razão entre ofertas ativas e demandas registradas em uma habilidade |
| **Período bloqueado** | Intervalo definido pelo síndico em que novas trocas ficam suspensas |
| **Lacuna de habilidade** | Habilidade com demanda registrada e nenhuma ou pouca oferta |

---

## Anexo A — Como transportar para o template do Mural/Canva

O template exigido na atividade tem sete lacunas. Use exatamente o conteúdo da seção 2.1 nesta ordem:

1. **Para:** moradores de condomínios residenciais e o síndico
2. **cujo:** problema é não conseguir identificar, acessar e retribuir de forma justa as habilidades que existem no próprio prédio
3. **O:** Trocaí
4. **é um:** ecossistema digital de economia colaborativa (app + painel web)
5. **que:** permite ofertar e solicitar habilidades entre vizinhos usando créditos virtuais, com chat interno para combinar encontros nas áreas comuns
6. **diferentemente do:** grupo de WhatsApp do condomínio e dos marketplaces de serviços pagos
7. **O nosso produto:** funciona em rede fechada e verificada, sem dinheiro real, equilibra as trocas por créditos e mostra ao síndico quais habilidades faltam na comunidade

No quadro do Mural, registre também as três rodadas da dinâmica (um grupo por conjunto de lacunas) antes da frase consolidada — a atividade valoriza o processo colaborativo, não apenas o resultado.

## Anexo B — Checklist da entrega

- [ ] Frase da visão do produto consolidada e homogênea
- [ ] Template preenchido no Mural ou Canva, com link público de visualização
- [ ] Registro fotográfico ou print da dinâmica em grupo
- [ ] Nomes e papéis da equipe preenchidos na seção 1.6
- [ ] Documento publicado (GitHub Pages, PDF ou link do Canva) e postado na atividade

---

## Anexo C — Transposição para o board Lean Inception (Mural)

### C.1 Onde cada entrega já feita se encaixa no board

| Coluna do board | Conteúdo deste documento |
|---|---|
| Kick-off | Parte 1 (seções 1.1 a 1.11) |
| Atividade 1: Visão do Produto | Seção 2.1 — três canvas, um por grupo, e a frase consolidada |
| Atividade 2: É – Não é – Faz – Não faz | Seção 1.4 — canvas 1 e 2, um por grupo |
| Atividade 3: Objetivos do Produto | Seção 2.2 |
| Atividade 4: Personas | Seção 2.3 |
| Atividade 5: Jornada do Usuário | Seção 2.4 |
| Atividade 6: Brainstorming de Funcionalidades | Seções 2.5 e 2.6 |
| Atividade 7: Revisão Técnica, de Negócio e UX | A fazer — usar a matriz de esforço/valor sobre as funcionalidades |
| Atividade 8: Sequenciador | Seção 2.10 |
| Atividade 9: Canvas MVP | Seção 2.9 |

### C.2 Convenção de cores do template

Cada grupo da dinâmica usa uma cor fixa de post-it em todas as atividades: **grupo 1 = rosa, grupo 2 = azul, grupo 3 = verde**. Amarelo fica reservado para as atividades de brainstorm individual. A cor identifica quem escreveu, não o tema — o agrupamento por afinidade (passo 4) é feito pela posição das notas dentro do quadrante, aproximando as afins.

### C.3 Post-its do quadrante ENFN (máximo por quadrante)

O grid 2×2 do template comporta cerca de 6 a 8 notas por quadrante. Seleção prioritária:

**É** (superior esquerdo)
`App mobile + painel web` · `Rede fechada do condomínio` · `Economia colaborativa` · `Créditos virtuais (Elos)` · `Catálogo de talentos do prédio` · `Gratuito` · `Voluntário`

**NÃO É** (superior direito)
`Rede social aberta` · `Marketplace pago` · `Plataforma de freelancers` · `Gestão condominial` · `Criptomoeda` · `Anônimo` · `Obrigatório`

**FAZ** (inferior esquerdo)
`Conecta oferta e demanda` · `Credita e debita Elos` · `Aproxima vizinhos pelo chat` · `Agenda encontros na área comum` · `Avalia reputação` · `Mostra habilidades em falta` · `Publica avisos do síndico`

**NÃO FAZ** (inferior direito)
`Não processa pagamento` · `Não emite nota fiscal` · `Não checa antecedentes` · `Não garante qualidade do serviço` · `Não expõe contato pessoal` · `Não substitui a administradora` · `Não vende dados`

As notas que sobraram das listas completas da seção 1.4 podem ir para o **Parking-lot** do board, que existe exatamente para isso.
