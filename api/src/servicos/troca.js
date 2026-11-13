const { RegraDeNegocio, NaoAutorizado, NaoEncontrado } = require('../erros');
const { CarteiraService, PARAMETROS: R } = require('./carteira');

const STATUS = {
  PENDENTE: 'pendente',
  ACEITA: 'aceita',
  CONCLUIDA: 'concluida',
  CANCELADA: 'cancelada',
  MEDIACAO: 'mediacao'
};

/** Transições permitidas da máquina de estados da troca. */
const TRANSICOES = {
  [STATUS.PENDENTE]: [STATUS.ACEITA, STATUS.CANCELADA],
  [STATUS.ACEITA]: [STATUS.CONCLUIDA, STATUS.CANCELADA, STATUS.MEDIACAO],
  [STATUS.CONCLUIDA]: [],
  [STATUS.CANCELADA]: [],
  [STATUS.MEDIACAO]: [STATUS.CONCLUIDA, STATUS.CANCELADA]
};

class TrocaService {
  constructor(db, carteira = new CarteiraService()) {
    this.db = db;
    this.carteira = carteira;
  }

  static podeTransitar(de, para) {
    return (TRANSICOES[de] || []).includes(para);
  }

  /** UC05 — solicitar troca. */
  async solicitar({ solicitanteId, habilidadeId, descricao, duracaoMinutos }) {
    return this.db.transacao(async (tx) => {
      const habilidade = await tx.habilidades.buscar(habilidadeId);
      if (!habilidade || !habilidade.ativa) {
        throw new NaoEncontrado('Esta habilidade não está disponível.');
      }
      if (habilidade.morador_id === solicitanteId) {
        throw new RegraDeNegocio('Você não pode solicitar a si mesmo.');
      }

      const solicitante = await tx.moradores.buscar(solicitanteId);
      const ofertante = await tx.moradores.buscar(habilidade.morador_id);
      if (solicitante.condominio_id !== ofertante.condominio_id) {
        throw new RegraDeNegocio('A troca só acontece dentro do mesmo condomínio.');
      }

      // RN10 — período bloqueado pelo síndico
      if (await tx.bloqueios.existeAtivo(solicitante.condominio_id)) {
        throw new RegraDeNegocio(
          'As trocas estão suspensas neste período.',
          'PERIODO_BLOQUEADO'
        );
      }

      // RN11 — teto mensal
      const noMes = await tx.trocas.contarConcluidasNoMes(solicitanteId);
      if (noMes >= R.TETO_TROCAS_MES) {
        throw new RegraDeNegocio(
          `Você atingiu o limite de ${R.TETO_TROCAS_MES} trocas no mês.`,
          'TETO_MENSAL'
        );
      }

      const custo = duracaoMinutos
        ? CarteiraService.custoPorDuracao(duracaoMinutos)
        : habilidade.custo_elos;

      // RN05 — verificação antecipada, para dar mensagem clara antes do aceite
      if (!CarteiraService.podeSolicitar(solicitante.saldo_elos, custo)) {
        throw new RegraDeNegocio(
          'Saldo insuficiente. Ofereça uma habilidade para voltar a pedir.',
          'LIMITE_DIVIDA'
        );
      }

      return tx.trocas.criar({
        solicitante_id: solicitanteId,
        ofertante_id: habilidade.morador_id,
        habilidade_id: habilidadeId,
        descricao,
        duracao_estimada: duracaoMinutos || null,
        custo_elos: custo,
        status: STATUS.PENDENTE
      });
    });
  }

  /** UC06 — aceitar: reserva os créditos em custódia. */
  async aceitar(trocaId, moradorId) {
    return this.db.transacao(async (tx) => {
      const troca = await tx.trocas.buscarParaAtualizar(trocaId);
      if (!troca) throw new NaoEncontrado('Troca não encontrada.');
      if (troca.ofertante_id !== moradorId) {
        throw new NaoAutorizado('Apenas quem oferece pode aceitar o pedido.');
      }
      if (!TrocaService.podeTransitar(troca.status, STATUS.ACEITA)) {
        throw new RegraDeNegocio(`Não é possível aceitar uma troca ${troca.status}.`);
      }

      await this.carteira.reservar(tx, {
        solicitanteId: troca.solicitante_id,
        valor: troca.custo_elos,
        trocaId
      });
      await tx.trocas.atualizarStatus(trocaId, STATUS.ACEITA);
      return { status: STATUS.ACEITA };
    });
  }

  /** UC06 — recusar: nenhum crédito é movimentado. */
  async recusar(trocaId, moradorId) {
    return this.db.transacao(async (tx) => {
      const troca = await tx.trocas.buscarParaAtualizar(trocaId);
      if (!troca) throw new NaoEncontrado('Troca não encontrada.');
      if (troca.ofertante_id !== moradorId) {
        throw new NaoAutorizado('Apenas quem oferece pode recusar o pedido.');
      }
      if (troca.status !== STATUS.PENDENTE) {
        throw new RegraDeNegocio('Só é possível recusar um pedido pendente.');
      }
      await tx.trocas.atualizarStatus(trocaId, STATUS.CANCELADA);
      return { status: STATUS.CANCELADA };
    });
  }

  /** UC07 — confirmar conclusão. Transfere só quando as duas partes confirmam. */
  async confirmarConclusao(trocaId, moradorId) {
    return this.db.transacao(async (tx) => {
      const troca = await tx.trocas.buscarParaAtualizar(trocaId);
      if (!troca) throw new NaoEncontrado('Troca não encontrada.');
      if (troca.status !== STATUS.ACEITA) {
        throw new RegraDeNegocio(`A troca não está em andamento (${troca.status}).`);
      }

      const ehSolicitante = troca.solicitante_id === moradorId;
      const ehOfertante = troca.ofertante_id === moradorId;
      if (!ehSolicitante && !ehOfertante) {
        throw new NaoAutorizado('Você não participa desta troca.');
      }

      const campo = ehSolicitante ? 'conf_solicitante' : 'conf_ofertante';
      if (troca[campo]) {
        throw new RegraDeNegocio('Você já confirmou esta troca.');
      }
      await tx.trocas.registrarConfirmacao(trocaId, campo);

      const atual = await tx.trocas.buscar(trocaId);
      if (!(atual.conf_solicitante && atual.conf_ofertante)) {
        return { status: 'aguardando_outra_parte' };
      }

      // RN04 — dupla confirmação: agora sim transfere
      await this.carteira.transferir(tx, {
        deId: atual.solicitante_id,
        paraId: atual.ofertante_id,
        valor: atual.custo_elos,
        trocaId
      });
      await tx.trocas.concluir(trocaId);
      return { status: STATUS.CONCLUIDA };
    });
  }

  /** UC05/UC06 — cancelar antes do encontro devolve o que estava retido. */
  async cancelar(trocaId, moradorId, justificativa) {
    return this.db.transacao(async (tx) => {
      const troca = await tx.trocas.buscarParaAtualizar(trocaId);
      if (!troca) throw new NaoEncontrado('Troca não encontrada.');
      if (troca.solicitante_id !== moradorId && troca.ofertante_id !== moradorId) {
        throw new NaoAutorizado('Você não participa desta troca.');
      }
      if (!TrocaService.podeTransitar(troca.status, STATUS.CANCELADA)) {
        throw new RegraDeNegocio(`Não é possível cancelar uma troca ${troca.status}.`);
      }
      if (!justificativa || !justificativa.trim()) {
        throw new RegraDeNegocio('Informe o motivo do cancelamento.');
      }

      if (troca.status === STATUS.ACEITA) {
        await this.carteira.devolver(tx, {
          solicitanteId: troca.solicitante_id,
          valor: troca.custo_elos,
          trocaId
        });
      }
      await tx.trocas.cancelar(trocaId, justificativa);
      return { status: STATUS.CANCELADA };
    });
  }
}

module.exports = { TrocaService, STATUS, TRANSICOES };
