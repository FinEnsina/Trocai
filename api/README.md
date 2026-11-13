# API do Trocaí

Node.js + Express + PostgreSQL. Concentra toda a regra de negócio do produto:
o aplicativo e o painel web são clientes sem lógica de domínio, para que as
regras dos Elos sejam idênticas nas duas interfaces.

## Como rodar

```bash
npm install
cp .env.example .env          # ajuste as credenciais do PostgreSQL
createdb trocai
npm run migrar                # cria o esquema e os dados de exemplo
npm start                     # http://localhost:3000/api
```

Para ver o produto funcionando **sem instalar PostgreSQL**:

```bash
npm run demonstracao
```

O script sobe a API sobre o banco em memória dos testes e percorre uma troca
inteira — cadastro, aprovação do síndico, busca, pedido, aceite, chat, dupla
confirmação, extrato, auditoria e avaliação — imprimindo o que acontece com os
saldos a cada passo.

## Testes

```bash
npm test                      # tudo, com cobertura
npm run test:unitarios        # serviços de domínio, sem banco
npm run test:integracao       # endpoints de ponta a ponta
```

Resultado da última execução:

```
Test Suites: 4 passed, 4 total
Tests:       76 passed, 76 total
Cobertura:   90,52% instruções · 78,29% ramos · 97,50% funções · 92,27% linhas
```

Os testes de integração exercitam rota, middleware, controlador, serviço e
repositório de ponta a ponta usando `testes/bancoFake.js`, uma implementação
em memória que reproduz o comportamento transacional do PostgreSQL: em caso de
exceção o estado volta ao ponto anterior ao `BEGIN`. É o que permite verificar
a reversão de uma transferência interrompida sem subir um banco real.

**A camada `src/repositorios/` fica fora da medição de cobertura.** Ela é SQL
puro e só executa contra o PostgreSQL; é verificada pelo roteiro de testes
manuais da Entrega 5, contra o banco real. Medir o que os testes não alcançam
produziria um número alto sem significado.

## Organização

```
src/
  rotas/           definição dos endpoints, validação e permissão por rota
  middlewares/     autenticação JWT, papéis, validação de formato, erro
  controladores/   um caso de uso por método; não contêm regra
  servicos/        regra de negócio (TrocaService, CarteiraService, …)
  repositorios/    acesso ao banco; recebem o client da transação
  db/              pool, transação e migrações SQL
testes/
  unitarios/       serviços de domínio, sem banco
  integracao/      endpoints contra o banco de teste
scripts/
  demonstracao.js  percorre uma troca inteira pela API
```

A separação entre serviço e repositório existe por um motivo prático: os
serviços recebem a transação (`tx`) de quem os chama, nunca o pool. É isso que
garante que débito e crédito de uma troca caibam na mesma transação e que a
regra continue testável sem infraestrutura.

## Endpoints

Tudo sob `/api`. Exceto `/saude`, `/auth/cadastro` e `/auth/login`, toda rota
exige `Authorization: Bearer <token>`.

| Método e rota | Função | Caso de uso |
|---|---|---|
| `GET /saude` | Verificação de disponibilidade | — |
| `POST /auth/cadastro` | Cria conta pendente de aprovação | UC01 |
| `POST /auth/login` | Autentica e devolve token JWT | — |
| `GET /auth/eu` | Dados do morador do token | — |
| `GET /categorias` | Categorias para o filtro da busca | UC04 |
| `GET /moradores/:id` | Perfil público do vizinho | UC04 |
| `GET /habilidades?q=&categoria=` | Busca com filtros | UC04 |
| `GET /habilidades/minhas` | Habilidades que eu publiquei | UC02 |
| `POST /habilidades` | Publica habilidade oferecida | UC02 |
| `DELETE /habilidades/:id` | Despublica uma habilidade | UC02 |
| `GET /necessidades` | O que o condomínio procura | UC03 |
| `POST /necessidades` | Registra necessidade procurada | UC03 |
| `GET /trocas?papel=&status=` | Minhas trocas | UC06 |
| `POST /trocas` | Solicita troca a um vizinho | UC05 |
| `PATCH /trocas/:id/aceitar` | Aceita e reserva os créditos | UC06 |
| `PATCH /trocas/:id/recusar` | Recusa sem movimentar créditos | UC06 |
| `PATCH /trocas/:id/confirmar` | Registra confirmação de uma parte | UC07 |
| `PATCH /trocas/:id/cancelar` | Cancela e devolve o que estava retido | UC06 |
| `GET /trocas/:id/mensagens` | Chat da troca | UC08 |
| `POST /trocas/:id/mensagens` | Envia mensagem no chat | UC08 |
| `POST /trocas/:id/avaliacao` | Avalia a outra parte | UC09 |
| `POST /denuncias` | Registra denúncia de conduta | UC16 |
| `GET /carteira` | Saldo, custódia e extrato | UC10 |
| `GET /carteira/auditoria` | Confere o saldo contra o livro-razão | UC10 |
| `GET /admin/cadastros` | Cadastros pendentes | UC11 |
| `PATCH /admin/cadastros/:id` | Aprova ou recusa cadastro | UC11 |
| `PATCH /admin/moradores/:id/suspender` | Suspende um morador | UC12 |
| `GET /admin/painel` | Indicadores, ranking e Árvore de Talentos | UC14 |
| `POST /admin/bloqueios` | Suspende as trocas do condomínio | UC13 |
| `PATCH /admin/bloqueios/:id/liberar` | Encerra a suspensão | UC13 |
| `GET /admin/denuncias` | Denúncias em aberto | UC16 |
| `PATCH /admin/denuncias/:id` | Registra a decisão do síndico | UC15, UC16 |

As rotas `/admin` exigem papel de síndico, verificado no token.

## Códigos de resposta

| Código | Quando |
|---|---|
| 401 | Token ausente, inválido, cadastro pendente, suspenso, sem permissão ou operação fora das suas trocas |
| 404 | Recurso inexistente |
| 409 | Registro duplicado |
| 422 | Regra de negócio recusada — saldo, estado da troca, campo obrigatório |
| 500 | Falha nossa; o detalhe fica no log, não na resposta |

Dentro de `/api`, uma rota inexistente responde 401 a quem não apresentou
token, antes de dizer se ela existe: responder 404 permitiria mapear a API de
fora.

## Decisões que valem explicação

**PostgreSQL em vez de base NoSQL gerenciada.** A carteira precisa de
transação ACID. Sem ela, uma falha no meio da transferência deixaria Elos
debitados de um lado sem crédito do outro — e, perdida a confiança no saldo, o
produto acaba.

**Elos em custódia entre o aceite e a conclusão.** O valor sai do saldo de
quem pediu, mas só chega a quem ofereceu depois que as duas partes confirmam.
Entre os dois momentos ele não pertence a ninguém, e por isso não pode ser
gasto duas vezes.

**Travas em ordem crescente de identificador.** Duas trocas simultâneas entre
as mesmas duas pessoas travariam as mesmas linhas em ordens opostas e ficariam
em impasse. Ordenar o `SELECT ... FOR UPDATE` pelo id elimina o problema.

**Livro-razão imutável.** `movimentacao_elos` só aceita inserção. Não há
`UPDATE` nem `DELETE` em nenhum ponto do código, e uma trigger barra os dois
no banco caso alguém tente por outro caminho. É o que torna a auditoria
possível: `GET /carteira/auditoria` reconstrói saldo e custódia a partir dos
lançamentos e compara com as colunas materializadas.

**Custo derivado da duração, não digitado.** Um Elo a cada trinta minutos
(RN01). Deixar o morador escolher o número abriria espaço para a mesma hora de
trabalho valer valores diferentes conforme quem anuncia.

**Denúncia não suspende ninguém automaticamente.** Ela abre um caso para o
síndico. Bloqueio automático permitiria usar a ferramenta para calar um
vizinho.

## O que não está aqui

O aplicativo (Flutter) e o painel web (React) ainda estão na etapa de
protótipo de interface: as telas definidas estão em
[`../docs/diagramas/`](../docs/diagramas/) e a navegação entre elas, no
documento da Entrega 2. O código desta pasta é a implementação do núcleo do
produto, que é onde mora a regra dos Elos.
