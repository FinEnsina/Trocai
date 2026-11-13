const { CarteiraService, PARAMETROS } = require('../src/servicos/carteira');
const { RegraDeNegocio } = require('../src/erros');
const { cenario } = require('./bancoFake');

describe('CarteiraService — conversão de duração em Elos (RN01)', () => {
  test('30 minutos valem 1 Elo', () => {
    expect(CarteiraService.custoPorDuracao(30)).toBe(1);
  });
  test('1 hora vale 2 Elos', () => {
    expect(CarteiraService.custoPorDuracao(60)).toBe(2);
  });
  test('arredonda para cima: 45 minutos valem 2 Elos', () => {
    expect(CarteiraService.custoPorDuracao(45)).toBe(2);
  });
  test('duração mínima cobra ao menos 1 Elo', () => {
    expect(CarteiraService.custoPorDuracao(5)).toBe(1);
  });
  test('duração inválida é recusada', () => {
    expect(() => CarteiraService.custoPorDuracao(0)).toThrow(RegraDeNegocio);
    expect(() => CarteiraService.custoPorDuracao(-10)).toThrow(RegraDeNegocio);
  });
});

describe('CarteiraService — limite de dívida (RN05)', () => {
  test('permite ficar exatamente no limite de -3', () => {
    expect(CarteiraService.podeSolicitar(-1, 2)).toBe(true);
  });
  test('recusa ultrapassar o limite de -3', () => {
    expect(CarteiraService.podeSolicitar(-2, 2)).toBe(false);
  });
  test('permite quando há saldo folgado', () => {
    expect(CarteiraService.podeSolicitar(10, 2)).toBe(true);
  });
});

describe('CarteiraService — reserva em custódia (RN06)', () => {
  test('tira do saldo disponível e põe em custódia, sem sumir com o valor', async () => {
    const db = cenario();
    const c = new CarteiraService();
    await db.transacao(tx => c.reservar(tx, { solicitanteId: 1, valor: 2, trocaId: 50 }));

    const m = db.estado.moradores[1];
    expect(m.saldo_elos).toBe(3);
    expect(m.elos_custodia).toBe(2);
    expect(m.saldo_elos + m.elos_custodia).toBe(5); // total preservado
  });

  test('registra um lançamento de custódia no livro-razão', async () => {
    const db = cenario();
    const c = new CarteiraService();
    await db.transacao(tx => c.reservar(tx, { solicitanteId: 1, valor: 2, trocaId: 50 }));

    expect(db.estado.movimentacoes).toHaveLength(1);
    expect(db.estado.movimentacoes[0]).toMatchObject({
      morador_id: 1, tipo: 'custodia', valor: -2, saldo_apos: 3
    });
  });

  test('recusa reserva que violaria o limite de dívida', async () => {
    const db = cenario({ moradores: { 1: { id: 1, condominio_id: 1, nome: 'Camila', saldo_elos: -2, elos_custodia: 0 } } });
    const c = new CarteiraService();
    await expect(
      db.transacao(tx => c.reservar(tx, { solicitanteId: 1, valor: 2, trocaId: 50 }))
    ).rejects.toThrow(/Saldo insuficiente/);
    expect(db.estado.moradores[1].saldo_elos).toBe(-2); // nada mudou
  });
});

describe('CarteiraService — devolução no cancelamento (RN07)', () => {
  test('devolve integralmente o que estava retido', async () => {
    const db = cenario({ moradores: { 1: { id: 1, condominio_id: 1, nome: 'Camila', saldo_elos: 3, elos_custodia: 2 } } });
    const c = new CarteiraService();
    await db.transacao(tx => c.devolver(tx, { solicitanteId: 1, valor: 2, trocaId: 50 }));

    expect(db.estado.moradores[1]).toMatchObject({ saldo_elos: 5, elos_custodia: 0 });
  });
});

describe('CarteiraService — transferência na conclusão', () => {
  test('debita a custódia da origem e credita o destino', async () => {
    const db = cenario({ moradores: {
      1: { id: 1, condominio_id: 1, nome: 'Camila', saldo_elos: 3, elos_custodia: 2 },
      2: { id: 2, condominio_id: 1, nome: 'Antônio', saldo_elos: 2, elos_custodia: 0 }
    }});
    const c = new CarteiraService();
    await db.transacao(tx => c.transferir(tx, { deId: 1, paraId: 2, valor: 2, trocaId: 50 }));

    expect(db.estado.moradores[1]).toMatchObject({ saldo_elos: 3, elos_custodia: 0 });
    expect(db.estado.moradores[2]).toMatchObject({ saldo_elos: 4, elos_custodia: 0 });
  });

  test('grava sempre duas linhas no livro-razão, nunca uma só', async () => {
    const db = cenario({ moradores: {
      1: { id: 1, condominio_id: 1, nome: 'Camila', saldo_elos: 3, elos_custodia: 2 },
      2: { id: 2, condominio_id: 1, nome: 'Antônio', saldo_elos: 2, elos_custodia: 0 }
    }});
    const c = new CarteiraService();
    await db.transacao(tx => c.transferir(tx, { deId: 1, paraId: 2, valor: 2, trocaId: 50 }));

    const m = db.estado.movimentacoes;
    expect(m).toHaveLength(2);
    expect(m.map(x => x.tipo).sort()).toEqual(['credito', 'debito']);
    expect(m.reduce((s, x) => s + x.valor, 0)).toBe(0); // soma zero: nada criado nem destruído
  });

  test('trava as linhas sempre na ordem crescente de id, para evitar impasse', async () => {
    const db = cenario({ moradores: {
      1: { id: 1, condominio_id: 1, nome: 'Camila', saldo_elos: 3, elos_custodia: 2 },
      2: { id: 2, condominio_id: 1, nome: 'Antônio', saldo_elos: 2, elos_custodia: 0 }
    }});
    const c = new CarteiraService();
    // transferência no sentido 2 -> 1 deve travar 1 antes de 2 mesmo assim
    db.estado.moradores[2].elos_custodia = 2;
    await db.transacao(tx => c.transferir(tx, { deId: 2, paraId: 1, valor: 2, trocaId: 50 }));
    expect(db.travasPedidas).toEqual([1, 2]);
  });

  test('recusa transferência sem créditos reservados', async () => {
    const db = cenario();
    const c = new CarteiraService();
    await expect(
      db.transacao(tx => c.transferir(tx, { deId: 1, paraId: 2, valor: 2, trocaId: 50 }))
    ).rejects.toThrow(/não estão reservados/);
  });

  test('recusa transferência para si mesmo', async () => {
    const db = cenario();
    const c = new CarteiraService();
    await expect(
      db.transacao(tx => c.transferir(tx, { deId: 1, paraId: 1, valor: 2, trocaId: 50 }))
    ).rejects.toThrow(/para si mesmo/);
  });
});

describe('CarteiraService — bônus de boas-vindas (RN02)', () => {
  test('credita 3 Elos na aprovação do cadastro', async () => {
    const db = cenario({ moradores: { 9: { id: 9, condominio_id: 1, nome: 'Novo', saldo_elos: 0, elos_custodia: 0 } } });
    const c = new CarteiraService();
    await db.transacao(tx => c.creditarBoasVindas(tx, 9));
    expect(db.estado.moradores[9].saldo_elos).toBe(PARAMETROS.BONUS_BOAS_VINDAS);
    expect(db.estado.movimentacoes[0].tipo).toBe('bonus');
  });
});
