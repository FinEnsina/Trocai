const request = require('supertest');
const bcrypt = require('bcryptjs');

const { criarApp } = require('../../src/app');
const { BancoFake } = require('../bancoFake');

/**
 * Testes de integração: exercitam os endpoints de ponta a ponta — rota,
 * middleware de autenticação, validação, controlador, serviço e repositório —
 * contra o banco de teste em memória, que reverte transação igual ao
 * PostgreSQL. O que não é coberto aqui é o SQL em si, verificado à parte
 * contra o banco real no roteiro de testes da Entrega 5.
 */

// Custo 4 em vez de 10: o teste não ganha nada com bcrypt lento.
const SENHA = 'moradia2026';
const HASH = bcrypt.hashSync(SENHA, 4);

function bancoComMoradores() {
  return new BancoFake({
    moradores: {
      1: {
        id: 1, condominio_id: 1, nome: 'Helena Prado', email: 'sindico@trocai.app',
        senha_hash: HASH, unidade: '101', papel: 'sindico', situacao: 'aprovado',
        saldo_elos: 3, elos_custodia: 0, nota_media: null
      },
      2: {
        id: 2, condominio_id: 1, nome: 'Camila Ferreira', email: 'camila@trocai.app',
        senha_hash: HASH, unidade: '22A', papel: 'morador', situacao: 'aprovado',
        saldo_elos: 5, elos_custodia: 0, nota_media: null
      },
      3: {
        id: 3, condominio_id: 1, nome: 'Antônio Barros', email: 'antonio@trocai.app',
        senha_hash: HASH, unidade: '54B', papel: 'morador', situacao: 'aprovado',
        saldo_elos: 3, elos_custodia: 0, nota_media: null
      },
      4: {
        id: 4, condominio_id: 2, nome: 'Outro prédio', email: 'fora@trocai.app',
        senha_hash: HASH, unidade: '12', papel: 'morador', situacao: 'aprovado',
        saldo_elos: 3, elos_custodia: 0, nota_media: null
      }
    },
    // O saldo de abertura de cada morador existe no livro-razão: o bônus de
    // boas-vindas (RN02) e, no caso da Camila, dois Elos ganhos ensinando.
    // Sem isso a auditoria de integridade acusaria divergência logo de saída,
    // e com razão — saldo sem lançamento é exatamente o que ela procura.
    movimentacoes: [
      { id: 1, troca_id: null, morador_id: 1, tipo: 'bonus',   valor: 3, saldo_apos: 3 },
      { id: 2, troca_id: null, morador_id: 2, tipo: 'bonus',   valor: 3, saldo_apos: 3 },
      { id: 3, troca_id: null, morador_id: 2, tipo: 'credito', valor: 2, saldo_apos: 5 },
      { id: 4, troca_id: null, morador_id: 3, tipo: 'bonus',   valor: 3, saldo_apos: 3 },
      { id: 5, troca_id: null, morador_id: 4, tipo: 'bonus',   valor: 3, saldo_apos: 3 }
    ],
    habilidades: {
      10: {
        id: 10, morador_id: 3, categoria_id: 3, ativa: true,
        titulo: 'Conserto de eletrônicos pequenos',
        descricao: 'Ventilador, liquidificador e rádio. Técnico aposentado.',
        custo_elos: 2, duracao_minutos: 60
      }
    },
    proximoId: 100
  });
}

async function entrar(app, email) {
  const r = await request(app).post('/api/auth/login').send({ email, senha: SENHA });
  expect(r.status).toBe(200);
  return r.body.token;
}

let app;
let banco;

beforeEach(() => {
  banco = bancoComMoradores();
  app = criarApp(banco);
});

describe('Saúde e autenticação', () => {
  test('GET /api/saude responde sem token', async () => {
    const r = await request(app).get('/api/saude');
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
  });

  test('rota protegida sem token devolve 401', async () => {
    const r = await request(app).get('/api/carteira');
    expect(r.status).toBe(401);
    expect(r.body.codigo).toBe('TOKEN_AUSENTE');
  });

  test('token inválido devolve 401', async () => {
    const r = await request(app).get('/api/carteira').set('Authorization', 'Bearer abc.def.ghi');
    expect(r.status).toBe(401);
    expect(r.body.codigo).toBe('TOKEN_INVALIDO');
  });

  test('login com senha errada não revela se o e-mail existe', async () => {
    const existe = await request(app).post('/api/auth/login')
      .send({ email: 'camila@trocai.app', senha: 'errada123' });
    const naoExiste = await request(app).post('/api/auth/login')
      .send({ email: 'ninguem@trocai.app', senha: 'errada123' });

    expect(existe.status).toBe(401);
    expect(naoExiste.status).toBe(401);
    expect(existe.body.erro).toBe(naoExiste.body.erro);
  });

  test('campos obrigatórios faltando devolvem 422 com a lista', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: 'camila@trocai.app' });
    expect(r.status).toBe(422);
    expect(r.body.codigo).toBe('CAMPOS_FALTANDO');
    expect(r.body.erro).toContain('senha');
  });
});

describe('Cadastro e aprovação pelo síndico (UC01, UC11)', () => {
  test('cadastro nasce pendente e não consegue entrar', async () => {
    const criado = await request(app).post('/api/auth/cadastro').send({
      condominio_id: 1, nome: 'Rita Nogueira', email: 'rita@trocai.app',
      senha: 'bolodecenoura1', unidade: '73C'
    });
    expect(criado.status).toBe(201);
    expect(criado.body.morador.situacao).toBe('pendente');

    const login = await request(app).post('/api/auth/login')
      .send({ email: 'rita@trocai.app', senha: 'bolodecenoura1' });
    expect(login.status).toBe(401);
    expect(login.body.codigo).toBe('CADASTRO_PENDENTE');
  });

  test('senha fraca é recusada antes de criar a conta', async () => {
    const r = await request(app).post('/api/auth/cadastro').send({
      condominio_id: 1, nome: 'Rita Nogueira', email: 'rita2@trocai.app',
      senha: 'somenteletras', unidade: '73C'
    });
    expect(r.status).toBe(422);
    expect(r.body.erro).toContain('letras e números');
  });

  test('aprovação do síndico credita o bônus de boas-vindas (RN02)', async () => {
    await request(app).post('/api/auth/cadastro').send({
      condominio_id: 1, nome: 'Rita Nogueira', email: 'rita@trocai.app',
      senha: 'bolodecenoura1', unidade: '73C'
    });

    const tokenSindico = await entrar(app, 'sindico@trocai.app');

    const pendentes = await request(app).get('/api/admin/cadastros')
      .set('Authorization', `Bearer ${tokenSindico}`);
    expect(pendentes.status).toBe(200);
    expect(pendentes.body).toHaveLength(1);

    const novoId = pendentes.body[0].id;
    const decisao = await request(app).patch(`/api/admin/cadastros/${novoId}`)
      .set('Authorization', `Bearer ${tokenSindico}`)
      .send({ aprovado: true });

    expect(decisao.status).toBe(200);
    expect(decisao.body.situacao).toBe('aprovado');
    expect(decisao.body.saldo_elos).toBe(3);

    const login = await request(app).post('/api/auth/login')
      .send({ email: 'rita@trocai.app', senha: 'bolodecenoura1' });
    expect(login.status).toBe(200);
  });

  test('morador comum não acessa a área do síndico', async () => {
    const token = await entrar(app, 'camila@trocai.app');
    const r = await request(app).get('/api/admin/cadastros')
      .set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(401);
    expect(r.body.codigo).toBe('PERMISSAO_INSUFICIENTE');
  });
});

describe('Habilidades e busca (UC02, UC04)', () => {
  test('publica habilidade com custo derivado da duração (RN01)', async () => {
    const token = await entrar(app, 'camila@trocai.app');
    const r = await request(app).post('/api/habilidades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo: 'Reforço de matemática',
        descricao: 'Atendimento individual no salão de festas, com material impresso.',
        duracao_minutos: 90, categoria_id: 2
      });

    expect(r.status).toBe(201);
    expect(r.body.custo_elos).toBe(3);   // 90 min ÷ 30 = 3 Elos
  });

  test('descrição curta demais é recusada com mensagem útil', async () => {
    const token = await entrar(app, 'camila@trocai.app');
    const r = await request(app).post('/api/habilidades')
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Aulas de violão', descricao: 'Ensino violão.', duracao_minutos: 60 });

    expect(r.status).toBe(422);
    expect(r.body.erro).toContain('vizinho decide');
  });

  test('a busca só devolve habilidades do próprio condomínio', async () => {
    const deFora = await entrar(app, 'fora@trocai.app');
    const r = await request(app).get('/api/habilidades?q=eletr')
      .set('Authorization', `Bearer ${deFora}`);

    expect(r.status).toBe(200);
    expect(r.body.resultados).toHaveLength(0);

    const dentro = await entrar(app, 'camila@trocai.app');
    const r2 = await request(app).get('/api/habilidades?q=eletr')
      .set('Authorization', `Bearer ${dentro}`);
    expect(r2.body.resultados).toHaveLength(1);
    expect(r2.body.resultados[0].morador_nome).toBe('Antônio Barros');
  });
});

describe('Ciclo completo de uma troca (UC05 a UC10)', () => {
  test('do pedido à conclusão, com os saldos conferindo no fim', async () => {
    const camila = await entrar(app, 'camila@trocai.app');
    const antonio = await entrar(app, 'antonio@trocai.app');
    const comoCamila = (r) => r.set('Authorization', `Bearer ${camila}`);
    const comoAntonio = (r) => r.set('Authorization', `Bearer ${antonio}`);

    // 1. Camila pede o conserto
    const pedido = await comoCamila(request(app).post('/api/trocas'))
      .send({ habilidade_id: 10, descricao: 'Ventilador de teto parou de girar.' });
    expect(pedido.status).toBe(201);
    expect(pedido.body.status).toBe('pendente');
    expect(pedido.body.custo_elos).toBe(2);
    const trocaId = pedido.body.id;

    // 2. Antônio aceita: os 2 Elos saem do saldo dela e vão para custódia
    const aceite = await comoAntonio(request(app).patch(`/api/trocas/${trocaId}/aceitar`));
    expect(aceite.status).toBe(200);

    const carteiraAposAceite = await comoCamila(request(app).get('/api/carteira'));
    expect(carteiraAposAceite.body.saldo).toBe(3);
    expect(carteiraAposAceite.body.em_custodia).toBe(2);

    // 3. Combinam o horário pelo chat da troca
    const msg = await comoCamila(request(app).post(`/api/trocas/${trocaId}/mensagens`))
      .send({ conteudo: 'Posso quinta às 19h, pode ser?' });
    expect(msg.status).toBe(201);

    const conversa = await comoAntonio(request(app).get(`/api/trocas/${trocaId}/mensagens`));
    expect(conversa.body).toHaveLength(1);
    expect(conversa.body[0].autor_nome).toBe('Camila Ferreira');

    // 4. Uma confirmação só não transfere nada
    const primeira = await comoCamila(request(app).patch(`/api/trocas/${trocaId}/confirmar`));
    expect(primeira.body.status).toBe('aguardando_outra_parte');

    const meio = await comoAntonio(request(app).get('/api/carteira'));
    expect(meio.body.saldo).toBe(3);   // Antônio ainda não recebeu

    // 5. A segunda confirmação conclui e transfere (RN04)
    const segunda = await comoAntonio(request(app).patch(`/api/trocas/${trocaId}/confirmar`));
    expect(segunda.body.status).toBe('concluida');

    const dela = await comoCamila(request(app).get('/api/carteira'));
    const dele = await comoAntonio(request(app).get('/api/carteira'));
    expect(dela.body.saldo).toBe(3);
    expect(dela.body.em_custodia).toBe(0);
    expect(dele.body.saldo).toBe(5);

    // 6. O extrato mostra as duas pontas da transferência
    expect(dela.body.extrato.slice(0, 2).map((m) => m.tipo)).toEqual(['debito', 'custodia']);
    expect(dele.body.extrato[0].tipo).toBe('credito');

    // 7. Auditoria: livro-razão bate com o saldo materializado (RN12)
    const auditoriaDela = await comoCamila(request(app).get('/api/carteira/auditoria'));
    const auditoriaDele = await comoAntonio(request(app).get('/api/carteira/auditoria'));
    expect(auditoriaDela.body.confere).toBe(true);
    expect(auditoriaDele.body.confere).toBe(true);

    // 8. Só agora a avaliação abre
    const avaliacao = await comoCamila(request(app).post(`/api/trocas/${trocaId}/avaliacao`))
      .send({ nota: 5, comentario: 'Resolveu em vinte minutos.' });
    expect(avaliacao.status).toBe(201);

    const perfil = await comoCamila(request(app).get('/api/moradores/3'));
    expect(perfil.body.nota_media).toBe(5);
    expect(perfil.body.email).toBeUndefined();   // contato não sai no perfil público
  });

  test('quem não participa da troca não lê o chat nem confirma', async () => {
    const camila = await entrar(app, 'camila@trocai.app');
    const sindico = await entrar(app, 'sindico@trocai.app');

    const pedido = await request(app).post('/api/trocas')
      .set('Authorization', `Bearer ${camila}`)
      .send({ habilidade_id: 10, descricao: 'Ventilador de teto parou de girar.' });
    const trocaId = pedido.body.id;

    const leitura = await request(app).get(`/api/trocas/${trocaId}/mensagens`)
      .set('Authorization', `Bearer ${sindico}`);
    expect(leitura.status).toBe(401);

    const confirmacao = await request(app).patch(`/api/trocas/${trocaId}/confirmar`)
      .set('Authorization', `Bearer ${sindico}`);
    expect([401, 422]).toContain(confirmacao.status);
  });

  test('avaliação antes da conclusão é recusada (RN09)', async () => {
    const camila = await entrar(app, 'camila@trocai.app');
    const pedido = await request(app).post('/api/trocas')
      .set('Authorization', `Bearer ${camila}`)
      .send({ habilidade_id: 10, descricao: 'Ventilador de teto parou de girar.' });

    const r = await request(app).post(`/api/trocas/${pedido.body.id}/avaliacao`)
      .set('Authorization', `Bearer ${camila}`).send({ nota: 5 });

    expect(r.status).toBe(422);
    expect(r.body.erro).toContain('concluída');
  });

  test('cancelar depois do aceite devolve os Elos retidos (RN07)', async () => {
    const camila = await entrar(app, 'camila@trocai.app');
    const antonio = await entrar(app, 'antonio@trocai.app');

    const pedido = await request(app).post('/api/trocas')
      .set('Authorization', `Bearer ${camila}`)
      .send({ habilidade_id: 10, descricao: 'Ventilador de teto parou de girar.' });
    const trocaId = pedido.body.id;

    await request(app).patch(`/api/trocas/${trocaId}/aceitar`)
      .set('Authorization', `Bearer ${antonio}`);

    const cancelamento = await request(app).patch(`/api/trocas/${trocaId}/cancelar`)
      .set('Authorization', `Bearer ${camila}`)
      .send({ justificativa: 'Chamei o técnico da garantia antes de combinar o horário.' });
    expect(cancelamento.status).toBe(200);

    const carteira = await request(app).get('/api/carteira')
      .set('Authorization', `Bearer ${camila}`);
    expect(carteira.body.saldo).toBe(5);
    expect(carteira.body.em_custodia).toBe(0);

    const auditoria = await request(app).get('/api/carteira/auditoria')
      .set('Authorization', `Bearer ${camila}`);
    expect(auditoria.body.confere).toBe(true);
  });

  test('pedir habilidade de outro condomínio é recusado', async () => {
    const deFora = await entrar(app, 'fora@trocai.app');
    const r = await request(app).post('/api/trocas')
      .set('Authorization', `Bearer ${deFora}`)
      .send({ habilidade_id: 10, descricao: 'Ventilador parou de girar.' });

    expect(r.status).toBe(422);
    expect(r.body.erro).toContain('mesmo condomínio');
  });
});

describe('Painel do síndico (UC13, UC14)', () => {
  test('mostra indicadores e as lacunas de habilidade do prédio', async () => {
    const camila = await entrar(app, 'camila@trocai.app');
    await request(app).post('/api/necessidades')
      .set('Authorization', `Bearer ${camila}`)
      .send({ titulo: 'Alguém para olhar um vazamento', categoria_id: 1 });

    const sindico = await entrar(app, 'sindico@trocai.app');
    const r = await request(app).get('/api/admin/painel')
      .set('Authorization', `Bearer ${sindico}`);

    expect(r.status).toBe(200);
    expect(r.body.resumo).toHaveProperty('concluidas');
    // Categoria 1 tem uma procura e nenhuma oferta: é lacuna.
    expect(r.body.lacunas.map((l) => l.id)).toContain(1);
  });

  test('suspensão das trocas bloqueia novos pedidos (RN10)', async () => {
    const sindico = await entrar(app, 'sindico@trocai.app');
    const bloqueio = await request(app).post('/api/admin/bloqueios')
      .set('Authorization', `Bearer ${sindico}`)
      .send({ motivo: 'Assembleia geral e troca do portão social.' });
    expect(bloqueio.status).toBe(201);

    const camila = await entrar(app, 'camila@trocai.app');
    const pedido = await request(app).post('/api/trocas')
      .set('Authorization', `Bearer ${camila}`)
      .send({ habilidade_id: 10, descricao: 'Ventilador de teto parou de girar.' });

    expect(pedido.status).toBe(422);
    expect(pedido.body.codigo).toBe('PERIODO_BLOQUEADO');

    await request(app).patch(`/api/admin/bloqueios/${bloqueio.body.id}/liberar`)
      .set('Authorization', `Bearer ${sindico}`);

    const depois = await request(app).post('/api/trocas')
      .set('Authorization', `Bearer ${camila}`)
      .send({ habilidade_id: 10, descricao: 'Ventilador de teto parou de girar.' });
    expect(depois.status).toBe(201);
  });
});

describe('Rota inexistente', () => {
  test('fora de /api devolve 404 em JSON, não página de erro', async () => {
    const r = await request(app).get('/inventado');
    expect(r.status).toBe(404);
    expect(r.body.erro).toContain('não existe');
  });

  test('dentro de /api, sem token, responde 401 antes de dizer se a rota existe', async () => {
    // Propositado: responder 404 a quem não se identificou permitiria mapear
    // a API de fora, descobrindo quais endpoints existem.
    const r = await request(app).get('/api/inventado');
    expect(r.status).toBe(401);
  });

  test('dentro de /api, autenticado, devolve 404', async () => {
    const token = await entrar(app, 'camila@trocai.app');
    const r = await request(app).get('/api/inventado')
      .set('Authorization', `Bearer ${token}`);
    expect(r.status).toBe(404);
  });
});
