const request = require('supertest');
const bcrypt = require('bcryptjs');

const { criarApp } = require('../../src/app');
const { BancoFake } = require('../bancoFake');

/**
 * Moderação, catálogo e perfil: os fluxos que sustentam a confiança do
 * condomínio depois que a troca básica já funciona.
 */
const SENHA = 'moradia2026';
const HASH = bcrypt.hashSync(SENHA, 4);

const morador = (id, nome, email, extra = {}) => ({
  id, condominio_id: 1, nome, email, senha_hash: HASH,
  unidade: String(100 + id), papel: 'morador', situacao: 'aprovado',
  saldo_elos: 3, elos_custodia: 0, nota_media: null, ...extra
});

function banco() {
  return new BancoFake({
    moradores: {
      1: morador(1, 'Helena Prado', 'sindico@trocai.app', { papel: 'sindico' }),
      2: morador(2, 'Camila Ferreira', 'camila@trocai.app'),
      3: morador(3, 'Antônio Barros', 'antonio@trocai.app')
    },
    movimentacoes: [
      { id: 1, troca_id: null, morador_id: 1, tipo: 'bonus', valor: 3, saldo_apos: 3 },
      { id: 2, troca_id: null, morador_id: 2, tipo: 'bonus', valor: 3, saldo_apos: 3 },
      { id: 3, troca_id: null, morador_id: 3, tipo: 'bonus', valor: 3, saldo_apos: 3 }
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

let app;
const token = {};

beforeEach(async () => {
  app = criarApp(banco());
  for (const [papel, email] of Object.entries({
    sindico: 'sindico@trocai.app',
    camila: 'camila@trocai.app',
    antonio: 'antonio@trocai.app'
  })) {
    const r = await request(app).post('/api/auth/login').send({ email, senha: SENHA });
    token[papel] = r.body.token;
  }
});

const como = (papel, requisicao) =>
  requisicao.set('Authorization', `Bearer ${token[papel]}`);

describe('Sessão', () => {
  test('GET /api/auth/eu devolve o morador do token, sem a senha', async () => {
    const r = await como('camila', request(app).get('/api/auth/eu'));
    expect(r.status).toBe(200);
    expect(r.body.nome).toBe('Camila Ferreira');
    expect(r.body.senha_hash).toBeUndefined();
  });
});

describe('Catálogo do morador', () => {
  test('lista as próprias habilidades e consegue despublicar', async () => {
    const criada = await como('camila', request(app).post('/api/habilidades')).send({
      titulo: 'Aulas de violão para iniciantes',
      descricao: 'Primeiros acordes e leitura de cifra, no salão de festas.',
      duracao_minutos: 60, categoria_id: 2
    });
    expect(criada.status).toBe(201);

    const minhas = await como('camila', request(app).get('/api/habilidades/minhas'));
    expect(minhas.body).toHaveLength(1);

    const remocao = await como('camila',
      request(app).delete(`/api/habilidades/${criada.body.id}`));
    expect(remocao.status).toBe(204);

    const busca = await como('antonio', request(app).get('/api/habilidades?q=violão'));
    expect(busca.body.resultados).toHaveLength(0);
  });

  test('ninguém despublica habilidade de outro morador', async () => {
    const r = await como('camila', request(app).delete('/api/habilidades/10'));
    expect(r.status).toBe(404);
  });

  test('as categorias saem prontas para o filtro da busca', async () => {
    const r = await como('camila', request(app).get('/api/categorias'));
    expect(r.status).toBe(200);
    expect(r.body.length).toBeGreaterThan(0);
    expect(r.body[0]).toHaveProperty('nome');
  });

  test('necessidade registrada aparece na lista do condomínio (UC03)', async () => {
    await como('camila', request(app).post('/api/necessidades'))
      .send({ titulo: 'Ajuda para montar um armário', categoria_id: 1 });

    const r = await como('antonio', request(app).get('/api/necessidades'));
    expect(r.body).toHaveLength(1);
    expect(r.body[0].titulo).toContain('armário');
  });
});

describe('Denúncia e apuração (UC16, UC12)', () => {
  async function trocaConcluida() {
    const pedido = await como('camila', request(app).post('/api/trocas'))
      .send({ habilidade_id: 10, descricao: 'Ventilador de teto parou de girar.' });
    const id = pedido.body.id;
    await como('antonio', request(app).patch(`/api/trocas/${id}/aceitar`));
    await como('camila', request(app).patch(`/api/trocas/${id}/confirmar`));
    await como('antonio', request(app).patch(`/api/trocas/${id}/confirmar`));
    return id;
  }

  test('relato curto demais é recusado', async () => {
    const r = await como('camila', request(app).post('/api/denuncias'))
      .send({ denunciado_id: 3, motivo: 'não gostei' });
    expect(r.status).toBe(422);
    expect(r.body.erro).toContain('vinte caracteres');
  });

  test('não é possível denunciar a si mesmo', async () => {
    const r = await como('camila', request(app).post('/api/denuncias'))
      .send({ denunciado_id: 2, motivo: 'Testando se o sistema deixa fazer isso aqui.' });
    expect(r.status).toBe(422);
  });

  test('denúncia aberta chega ao síndico e não suspende ninguém sozinha', async () => {
    const trocaId = await trocaConcluida();

    const denuncia = await como('camila', request(app).post('/api/denuncias')).send({
      denunciado_id: 3, troca_id: trocaId,
      motivo: 'Combinamos 19h e a pessoa não apareceu nem avisou nada.'
    });
    expect(denuncia.status).toBe(201);
    expect(denuncia.body.situacao).toBe('aberta');

    // O denunciado continua com acesso normal enquanto o caso não é apurado.
    const aindaEntra = await request(app).post('/api/auth/login')
      .send({ email: 'antonio@trocai.app', senha: SENHA });
    expect(aindaEntra.status).toBe(200);

    const naMesa = await como('sindico', request(app).get('/api/admin/denuncias'));
    expect(naMesa.body).toHaveLength(1);

    const decisao = await como('sindico',
      request(app).patch(`/api/admin/denuncias/${denuncia.body.id}`))
      .send({ situacao: 'resolvida', parecer: 'Conversei com as duas partes; houve engano de data.' });
    expect(decisao.status).toBe(200);
    expect(decisao.body.situacao).toBe('resolvida');

    const depois = await como('sindico', request(app).get('/api/admin/denuncias'));
    expect(depois.body).toHaveLength(0);
  });

  test('situação inválida na decisão é recusada', async () => {
    const r = await como('sindico', request(app).patch('/api/admin/denuncias/1'))
      .send({ situacao: 'engavetada' });
    expect(r.status).toBe(422);
  });

  test('suspensão impede o morador de entrar e não vale para o próprio síndico',
    async () => {
      const suspensao = await como('sindico',
        request(app).patch('/api/admin/moradores/3/suspender'))
        .send({ motivo: 'Reincidência em faltas combinadas, apurada em duas denúncias.' });
      expect(suspensao.status).toBe(200);
      expect(suspensao.body.situacao).toBe('bloqueado');

      const tentativa = await request(app).post('/api/auth/login')
        .send({ email: 'antonio@trocai.app', senha: SENHA });
      expect(tentativa.status).toBe(401);
      expect(tentativa.body.codigo).toBe('ACESSO_SUSPENSO');

      const emSiMesmo = await como('sindico',
        request(app).patch('/api/admin/moradores/1/suspender'))
        .send({ motivo: 'Tentativa de suspender o próprio acesso de síndico.' });
      expect(emSiMesmo.status).toBe(422);
    });

  test('recusa de cadastro não credita bônus', async () => {
    await request(app).post('/api/auth/cadastro').send({
      condominio_id: 1, nome: 'Pessoa de fora', email: 'fora@exemplo.com',
      senha: 'tentativa123', unidade: '999'
    });

    const pendentes = await como('sindico', request(app).get('/api/admin/cadastros'));
    const id = pendentes.body[0].id;

    const recusa = await como('sindico', request(app).patch(`/api/admin/cadastros/${id}`))
      .send({ aprovado: false });
    expect(recusa.status).toBe(200);
    expect(recusa.body.situacao).toBe('recusado');
    expect(recusa.body.saldo_elos).toBe(0);
  });

  test('cadastro já decidido não é decidido de novo', async () => {
    const r = await como('sindico', request(app).patch('/api/admin/cadastros/3'))
      .send({ aprovado: true });
    expect(r.status).toBe(422);
    expect(r.body.erro).toContain('já foi');
  });
});
