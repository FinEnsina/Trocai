const { RegraDeNegocio } = require('../erros');
const R = require('./regras');

/**
 * Regras da carteira de Elos.
 *
 * Nenhum método aqui conversa com o banco: todos recebem a transação (tx)
 * de quem os chama. Isso mantém as regras testáveis sem infraestrutura e
 * garante que a transferência inteira caiba em uma única transação.
 */
class CarteiraService {
  /** Converte duração em minutos para custo em Elos, arredondando para cima. */
  static custoPorDuracao(minutos) {
    if (!Number.isFinite(minutos) || minutos <= 0) {
      throw new RegraDeNegocio('A duração precisa ser maior que zero.');
    }
    return Math.max(1, Math.ceil(minutos / R.MINUTOS_POR_ELO));
  }

  /** RN05: abaixo do limite de dívida o morador só pode ofertar. */
  static podeSolicitar(saldoDisponivel, custo) {
    return saldoDisponivel - custo >= R.LIMITE_DIVIDA;
  }

  /**
   * RN06: no aceite, os Elos saem do saldo disponível e entram em custódia.
   * Não é transferência: o valor continua pertencendo ao solicitante até a conclusão.
   */
  async reservar(tx, { solicitanteId, valor, trocaId }) {
    const m = await tx.moradores.buscarParaAtualizar(solicitanteId);
    if (!CarteiraService.podeSolicitar(m.saldo_elos, valor)) {
      throw new RegraDeNegocio(
        'Saldo insuficiente. Ofereça uma habilidade para voltar a pedir.',
        'LIMITE_DIVIDA'
      );
    }
    const novoSaldo = m.saldo_elos - valor;
    await tx.moradores.atualizarSaldos(solicitanteId, {
      saldo_elos: novoSaldo,
      elos_custodia: m.elos_custodia + valor
    });
    await tx.movimentacoes.registrar({
      troca_id: trocaId, morador_id: solicitanteId,
      tipo: 'custodia', valor: -valor, saldo_apos: novoSaldo
    });
    return novoSaldo;
  }

  /** RN07: cancelamento devolve integralmente o que estava retido. */
  async devolver(tx, { solicitanteId, valor, trocaId }) {
    const m = await tx.moradores.buscarParaAtualizar(solicitanteId);
    if (m.elos_custodia < valor) {
      throw new RegraDeNegocio('Custódia insuficiente para devolução.', 'CUSTODIA_INVALIDA');
    }
    const novoSaldo = m.saldo_elos + valor;
    await tx.moradores.atualizarSaldos(solicitanteId, {
      saldo_elos: novoSaldo,
      elos_custodia: m.elos_custodia - valor
    });
    await tx.movimentacoes.registrar({
      troca_id: trocaId, morador_id: solicitanteId,
      tipo: 'devolucao', valor, saldo_apos: novoSaldo
    });
    return novoSaldo;
  }

  /**
   * Conclusão: libera a custódia do solicitante e credita o ofertante.
   * Grava sempre duas linhas no livro-razão — nunca uma só.
   */
  async transferir(tx, { deId, paraId, valor, trocaId }) {
    if (deId === paraId) {
      throw new RegraDeNegocio('Não é possível transferir Elos para si mesmo.');
    }
    if (!Number.isInteger(valor) || valor <= 0) {
      throw new RegraDeNegocio('O valor da transferência precisa ser inteiro e positivo.');
    }

    // Trava sempre na mesma ordem de id para não gerar impasse entre
    // duas trocas simultâneas entre as mesmas pessoas.
    const [primeiro, segundo] = [deId, paraId].sort((a, b) => a - b);
    const trava = {};
    trava[primeiro] = await tx.moradores.buscarParaAtualizar(primeiro);
    trava[segundo] = await tx.moradores.buscarParaAtualizar(segundo);

    const origem = trava[deId];
    const destino = trava[paraId];

    if (origem.elos_custodia < valor) {
      throw new RegraDeNegocio(
        'Os créditos desta troca não estão reservados.',
        'CUSTODIA_INVALIDA'
      );
    }

    await tx.moradores.atualizarSaldos(deId, {
      saldo_elos: origem.saldo_elos,
      elos_custodia: origem.elos_custodia - valor
    });
    const saldoDestino = destino.saldo_elos + valor;
    await tx.moradores.atualizarSaldos(paraId, {
      saldo_elos: saldoDestino,
      elos_custodia: destino.elos_custodia
    });

    await tx.movimentacoes.registrar({
      troca_id: trocaId, morador_id: deId,
      tipo: 'debito', valor: -valor, saldo_apos: origem.saldo_elos
    });
    await tx.movimentacoes.registrar({
      troca_id: trocaId, morador_id: paraId,
      tipo: 'credito', valor, saldo_apos: saldoDestino
    });

    return { saldoOrigem: origem.saldo_elos, saldoDestino };
  }

  /** RN02: bônus concedido quando o síndico aprova o cadastro. */
  async creditarBoasVindas(tx, moradorId) {
    const m = await tx.moradores.buscarParaAtualizar(moradorId);
    const novoSaldo = m.saldo_elos + R.BONUS_BOAS_VINDAS;
    await tx.moradores.atualizarSaldos(moradorId, {
      saldo_elos: novoSaldo, elos_custodia: m.elos_custodia
    });
    await tx.movimentacoes.registrar({
      troca_id: null, morador_id: moradorId,
      tipo: 'bonus', valor: R.BONUS_BOAS_VINDAS, saldo_apos: novoSaldo
    });
    return novoSaldo;
  }
}

module.exports = { CarteiraService, PARAMETROS: R };
