const { RegraDeNegocio, NaoAutorizado, NaoEncontrado } = require('../erros');

/**
 * Chat da troca, avaliação e denúncia (UC08, UC09, UC16).
 *
 * As três operações compartilham a mesma verificação: só participa quem é
 * parte da troca. É a regra que impede um terceiro de ler a conversa de dois
 * vizinhos ou avaliar um serviço que não recebeu.
 */
class InteracaoService {
  constructor(db) {
    this.db = db;
  }

  static exigirParticipacao(troca, moradorId) {
    if (!troca) throw new NaoEncontrado('Troca não encontrada.');
    if (troca.solicitante_id !== moradorId && troca.ofertante_id !== moradorId) {
      throw new NaoAutorizado('Você não participa desta troca.');
    }
  }

  /**
   * UC08 — chat simples. Na Onda 1 a entrega é por requisição periódica do
   * aplicativo (parâmetro `desdeId`), não por WebSocket: a revisão técnica da
   * Atividade 7 classificou tempo real como conhecimento amarelo, e a versão
   * simples entrega quase toda a experiência.
   */
  async enviarMensagem({ trocaId, autorId, conteudo }) {
    if (!conteudo || !conteudo.trim()) {
      throw new RegraDeNegocio('A mensagem está vazia.');
    }
    if (conteudo.length > 1000) {
      throw new RegraDeNegocio('A mensagem é longa demais.');
    }
    return this.db.transacao(async (tx) => {
      const troca = await tx.trocas.buscar(trocaId);
      InteracaoService.exigirParticipacao(troca, autorId);
      if (['cancelada'].includes(troca.status)) {
        throw new RegraDeNegocio('Esta troca foi cancelada.');
      }
      return tx.mensagens.criar({
        troca_id: trocaId, autor_id: autorId, conteudo: conteudo.trim()
      });
    });
  }

  async listarMensagens({ trocaId, moradorId, desdeId = 0 }) {
    return this.db.transacao(async (tx) => {
      const troca = await tx.trocas.buscar(trocaId);
      InteracaoService.exigirParticipacao(troca, moradorId);
      const mensagens = await tx.mensagens.listarDaTroca(trocaId, Number(desdeId) || 0);
      await tx.mensagens.marcarLidas(trocaId, moradorId);
      return mensagens;
    });
  }

  /** UC09 — avaliar. Só depois de concluída, uma vez por parte (RN09). */
  async avaliar({ trocaId, autorId, nota, comentario }) {
    const valor = Number(nota);
    if (!Number.isInteger(valor) || valor < 1 || valor > 5) {
      throw new RegraDeNegocio('A nota vai de 1 a 5.');
    }
    return this.db.transacao(async (tx) => {
      const troca = await tx.trocas.buscar(trocaId);
      InteracaoService.exigirParticipacao(troca, autorId);
      if (troca.status !== 'concluida') {
        throw new RegraDeNegocio('A avaliação só abre depois que a troca é concluída.');
      }
      if (await tx.avaliacoes.existe(trocaId, autorId)) {
        throw new RegraDeNegocio('Você já avaliou esta troca.');
      }

      const avaliadoId = troca.solicitante_id === autorId
        ? troca.ofertante_id
        : troca.solicitante_id;

      const avaliacao = await tx.avaliacoes.criar({
        troca_id: trocaId, autor_id: autorId, avaliado_id: avaliadoId,
        nota: valor, comentario
      });
      await tx.moradores.recalcularNotaMedia(avaliadoId);
      return avaliacao;
    });
  }

  /**
   * UC16 — denúncia. Não suspende ninguém automaticamente: só abre o caso
   * para o síndico. Bloqueio automático por denúncia permitiria usar a
   * ferramenta para calar um vizinho.
   */
  async denunciar({ denuncianteId, denunciadoId, trocaId, motivo }) {
    if (!motivo || motivo.trim().length < 20) {
      throw new RegraDeNegocio('Descreva o ocorrido com pelo menos vinte caracteres.');
    }
    if (denuncianteId === denunciadoId) {
      throw new RegraDeNegocio('Não é possível denunciar a si mesmo.');
    }
    return this.db.transacao(async (tx) => {
      if (trocaId) {
        const troca = await tx.trocas.buscar(trocaId);
        InteracaoService.exigirParticipacao(troca, denuncianteId);
      }
      return tx.denuncias.criar({
        denunciante_id: denuncianteId,
        denunciado_id: denunciadoId,
        troca_id: trocaId,
        motivo: motivo.trim()
      });
    });
  }
}

module.exports = { InteracaoService };
