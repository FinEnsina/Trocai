const { TrocaService, STATUS } = require('../src/servicos/troca');
const { CarteiraService } = require('../src/servicos/carteira');
const { cenario } = require('./bancoFake');

const servico = (db) => new TrocaService(db, new CarteiraService());

const trocaAceita = (extra = {}) => cenario({
  moradores: {
    1: { id: 1, condominio_id: 1, nome: 'Camila', saldo_elos: 3, elos_custodia: 2 },
    2: { id: 2, condominio_id: 1, nome: 'Antônio', saldo_elos: 2, elos_custodia: 0 }
  },
  trocas: {
    50: {
      id: 50, solicitante_id: 1, ofertante_id: 2, habilidade_id: 10,
      custo_elos: 2, status: STATUS.ACEITA,
      conf_solicitante: null, conf_ofertante: null, ...extra
    }
  }
});

describe('Máquina de estados da troca', () => {
  test('pendente pode ir para aceita ou cancelada', () => {
    expect(TrocaService.podeTransitar('pendente', 'aceita')).toBe(true);
    expect(TrocaService.podeTransitar('pendente', 'cancelada')).toBe(true);
  });
  test('pendente não pode ir direto para concluída', () => {
    expect(TrocaService.podeTransitar('pendente', 'concluida')).toBe(false);
  });
  test('concluída é estado final', () => {
    expect(TrocaService.podeTransitar('concluida', 'cancelada')).toBe(false);
  });
});

describe('UC05 — solicitar troca', () => {
  test('cria a solicitação com status pendente e custo calculado pela duração', async () => {
    const db = cenario();
    const t = await servico(db).solicitar({
      solicitanteId: 1, habilidadeId: 10,
      descricao: 'Meu notebook trava', duracaoMinutos: 60
    });
    expect(t).toMatchObject({ status: 'pendente', custo_elos: 2, ofertante_id: 2 });
  });

  test('nenhum crédito é movimentado na solicitação', async () => {
    const db = cenario();
    await servico(db).solicitar({ solicitanteId: 1, habilidadeId: 10, descricao: 'x', duracaoMinutos: 60 });
    expect(db.estado.moradores[1].saldo_elos).toBe(5);
    expect(db.estado.movimentacoes).toHaveLength(0);
  });

  test('CT02 — recusa quando o saldo está no limite de dívida', async () => {
    const db = cenario({ moradores: { 1: { id: 1, condominio_id: 1, nome: 'Camila', saldo_elos: -3, elos_custodia: 0 } } });
    await expect(
      servico(db).solicitar({ solicitanteId: 1, habilidadeId: 10, descricao: 'x', duracaoMinutos: 60 })
    ).rejects.toThrow(/Saldo insuficiente/);
    expect(Object.keys(db.estado.trocas)).toHaveLength(0);
  });

  test('CT05 — recusa durante período bloqueado pelo síndico', async () => {
    const db = cenario({ bloqueios: [{ condominio_id: 1, ativo: true }] });
    await expect(
      servico(db).solicitar({ solicitanteId: 1, habilidadeId: 10, descricao: 'x', duracaoMinutos: 60 })
    ).rejects.toThrow(/suspensas neste período/);
  });

  test('recusa habilidade desativada', async () => {
    const db = cenario();
    await expect(
      servico(db).solicitar({ solicitanteId: 1, habilidadeId: 11, descricao: 'x', duracaoMinutos: 60 })
    ).rejects.toThrow(/não está disponível/);
  });

  test('recusa troca entre condomínios diferentes', async () => {
    const db = cenario();
    await expect(
      servico(db).solicitar({ solicitanteId: 1, habilidadeId: 12, descricao: 'x', duracaoMinutos: 60 })
    ).rejects.toThrow(/mesmo condomínio/);
  });

  test('recusa solicitar a própria habilidade', async () => {
    const db = cenario();
    await expect(
      servico(db).solicitar({ solicitanteId: 2, habilidadeId: 10, descricao: 'x', duracaoMinutos: 60 })
    ).rejects.toThrow(/a si mesmo/);
  });
});

describe('UC06 — aceitar e recusar', () => {
  test('aceitar reserva os créditos em custódia', async () => {
    const db = cenario({ trocas: { 50: {
      id: 50, solicitante_id: 1, ofertante_id: 2, habilidade_id: 10,
      custo_elos: 2, status: 'pendente', conf_solicitante: null, conf_ofertante: null
    }}});
    await servico(db).aceitar(50, 2);
    expect(db.estado.moradores[1]).toMatchObject({ saldo_elos: 3, elos_custodia: 2 });
    expect(db.estado.trocas[50].status).toBe('aceita');
  });

  test('só o ofertante pode aceitar', async () => {
    const db = cenario({ trocas: { 50: {
      id: 50, solicitante_id: 1, ofertante_id: 2, habilidade_id: 10,
      custo_elos: 2, status: 'pendente', conf_solicitante: null, conf_ofertante: null
    }}});
    await expect(servico(db).aceitar(50, 1)).rejects.toThrow(/Apenas quem oferece/);
  });

  test('recusar não movimenta crédito nenhum', async () => {
    const db = cenario({ trocas: { 50: {
      id: 50, solicitante_id: 1, ofertante_id: 2, habilidade_id: 10,
      custo_elos: 2, status: 'pendente', conf_solicitante: null, conf_ofertante: null
    }}});
    await servico(db).recusar(50, 2);
    expect(db.estado.trocas[50].status).toBe('cancelada');
    expect(db.estado.movimentacoes).toHaveLength(0);
  });
});

describe('UC07 — conclusão com dupla confirmação (RN04)', () => {
  test('CT03a — uma confirmação sozinha não transfere nada', async () => {
    const db = trocaAceita();
    const r = await servico(db).confirmarConclusao(50, 1);

    expect(r.status).toBe('aguardando_outra_parte');
    expect(db.estado.moradores[1]).toMatchObject({ saldo_elos: 3, elos_custodia: 2 });
    expect(db.estado.moradores[2].saldo_elos).toBe(2);
    expect(db.estado.movimentacoes).toHaveLength(0);
  });

  test('CT03b — a segunda confirmação transfere e conclui', async () => {
    const db = trocaAceita();
    const s = servico(db);
    await s.confirmarConclusao(50, 1);
    const r = await s.confirmarConclusao(50, 2);

    expect(r.status).toBe('concluida');
    expect(db.estado.moradores[1]).toMatchObject({ saldo_elos: 3, elos_custodia: 0 });
    expect(db.estado.moradores[2]).toMatchObject({ saldo_elos: 4, elos_custodia: 0 });
    expect(db.estado.trocas[50].status).toBe('concluida');
    expect(db.estado.movimentacoes).toHaveLength(2);
  });

  test('a ordem das confirmações não altera o resultado', async () => {
    const db = trocaAceita();
    const s = servico(db);
    await s.confirmarConclusao(50, 2);
    await s.confirmarConclusao(50, 1);
    expect(db.estado.moradores[2].saldo_elos).toBe(4);
  });

  test('confirmar duas vezes é recusado', async () => {
    const db = trocaAceita();
    const s = servico(db);
    await s.confirmarConclusao(50, 1);
    await expect(s.confirmarConclusao(50, 1)).rejects.toThrow(/já confirmou/);
  });

  test('quem não participa da troca não pode confirmar', async () => {
    const db = trocaAceita();
    await expect(servico(db).confirmarConclusao(50, 3)).rejects.toThrow(/não participa/);
  });

  test('não é possível confirmar troca já concluída', async () => {
    const db = trocaAceita({ status: 'concluida' });
    await expect(servico(db).confirmarConclusao(50, 1)).rejects.toThrow(/não está em andamento/);
  });

  test('CT04 — falha durante a transferência reverte tudo', async () => {
    const db = trocaAceita({ conf_solicitante: '2026-11-08T18:00:00Z' });
    const carteiraQueFalha = new CarteiraService();
    carteiraQueFalha.transferir = async () => { throw new Error('queda de conexão'); };
    const s = new TrocaService(db, carteiraQueFalha);

    await expect(s.confirmarConclusao(50, 2)).rejects.toThrow('queda de conexão');

    // nada mudou: nem saldo, nem confirmação, nem status
    expect(db.estado.moradores[1]).toMatchObject({ saldo_elos: 3, elos_custodia: 2 });
    expect(db.estado.moradores[2].saldo_elos).toBe(2);
    expect(db.estado.trocas[50].status).toBe('aceita');
    expect(db.estado.trocas[50].conf_ofertante).toBeNull();
    expect(db.estado.movimentacoes).toHaveLength(0);
  });
});

describe('Cancelamento', () => {
  test('cancelar troca aceita devolve os créditos retidos', async () => {
    const db = trocaAceita();
    await servico(db).cancelar(50, 1, 'Resolvi sozinha, obrigada');
    expect(db.estado.moradores[1]).toMatchObject({ saldo_elos: 5, elos_custodia: 0 });
    expect(db.estado.trocas[50].status).toBe('cancelada');
  });

  test('cancelamento exige justificativa', async () => {
    const db = trocaAceita();
    await expect(servico(db).cancelar(50, 1, '   ')).rejects.toThrow(/motivo/);
    expect(db.estado.trocas[50].status).toBe('aceita');
  });

  test('não é possível cancelar troca já concluída', async () => {
    const db = trocaAceita({ status: 'concluida' });
    await expect(servico(db).cancelar(50, 1, 'motivo')).rejects.toThrow(/Não é possível cancelar/);
  });
});

describe('Invariante global da economia', () => {
  test('o total de Elos do condomínio não muda com uma troca concluída', async () => {
    const db = trocaAceita();
    const total = (e) => Object.values(e.moradores)
      .reduce((s, m) => s + m.saldo_elos + m.elos_custodia, 0);
    const antes = total(db.estado);

    const s = servico(db);
    await s.confirmarConclusao(50, 1);
    await s.confirmarConclusao(50, 2);

    expect(total(db.estado)).toBe(antes);
  });
});
