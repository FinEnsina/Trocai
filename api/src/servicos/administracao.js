const { RegraDeNegocio, NaoEncontrado } = require('../erros');
const { CarteiraService } = require('./carteira');

/**
 * Painel do síndico (UC11, UC12, UC13, UC14).
 *
 * Toda operação aqui pressupõe que o middleware de permissão já confirmou o
 * papel. Mesmo assim os métodos reconferem o condomínio: o papel de síndico
 * vale no prédio de quem o exerce, não em todos.
 */
class AdministracaoService {
  constructor(db, carteira = new CarteiraService()) {
    this.db = db;
    this.carteira = carteira;
  }

  async cadastrosPendentes(condominioId) {
    return this.db.repositorios.moradores.listarPendentes(condominioId);
  }

  /**
   * UC11 — aprovar ou recusar cadastro. A aprovação credita o bônus de
   * boas-vindas (RN02) na mesma transação: é o que permite ao morador novo
   * pedir uma primeira ajuda antes de ter oferecido qualquer coisa.
   */
  async decidirCadastro({ sindico, moradorId, aprovado }) {
    return this.db.transacao(async (tx) => {
      const morador = await tx.moradores.buscar(moradorId);
      if (!morador) throw new NaoEncontrado('Cadastro não encontrado.');
      if (morador.condominio_id !== sindico.condominio_id) {
        throw new RegraDeNegocio('Este cadastro é de outro condomínio.');
      }
      if (morador.situacao !== 'pendente') {
        throw new RegraDeNegocio(`Este cadastro já foi ${morador.situacao}.`);
      }

      const atualizado = await tx.moradores.definirSituacao(
        moradorId, aprovado ? 'aprovado' : 'recusado'
      );
      if (aprovado) {
        atualizado.saldo_elos = await this.carteira.creditarBoasVindas(tx, moradorId);
      }
      return atualizado;
    });
  }

  /** UC12 — suspender o acesso de um morador após apuração de denúncia. */
  async suspenderMorador({ sindico, moradorId, motivo }) {
    if (!motivo || motivo.trim().length < 10) {
      throw new RegraDeNegocio('Registre o motivo da suspensão.');
    }
    return this.db.transacao(async (tx) => {
      const morador = await tx.moradores.buscar(moradorId);
      if (!morador) throw new NaoEncontrado('Morador não encontrado.');
      if (morador.condominio_id !== sindico.condominio_id) {
        throw new RegraDeNegocio('Este morador é de outro condomínio.');
      }
      if (morador.papel === 'sindico') {
        throw new RegraDeNegocio('O síndico não pode suspender a si mesmo.');
      }
      return tx.moradores.definirSituacao(moradorId, 'bloqueado');
    });
  }

  /** RN10 — suspender as trocas do condomínio (obra, assembleia, reforma). */
  async suspenderTrocas({ sindico, motivo, fimEm }) {
    if (!motivo || motivo.trim().length < 10) {
      throw new RegraDeNegocio('Explique por que as trocas estão suspensas.');
    }
    return this.db.transacao(async (tx) =>
      tx.bloqueios.criar({
        condominio_id: sindico.condominio_id,
        sindico_id: sindico.id,
        motivo: motivo.trim(),
        fim_em: fimEm || null
      })
    );
  }

  async liberarTrocas({ bloqueioId }) {
    return this.db.transacao(async (tx) => {
      await tx.bloqueios.encerrar(bloqueioId);
      return { liberado: true };
    });
  }

  /** UC13 — indicadores e ranking exibidos no painel web. */
  async painel(condominioId) {
    const r = this.db.repositorios;
    const [resumo, ranking, talentos, denuncias] = await Promise.all([
      r.trocas.resumoDoCondominio(condominioId),
      r.moradores.ranking(condominioId),
      r.habilidades.mapaDeTalentos(condominioId),
      r.denuncias.listarAbertas(condominioId)
    ]);

    // UC14 — a Árvore de Talentos é a leitura do mapa pelo lado da falta:
    // categorias procuradas que ninguém no prédio oferece.
    const lacunas = talentos.filter((t) => t.procuras > t.ofertas);

    return { resumo, ranking, talentos, lacunas, denuncias_abertas: denuncias };
  }

  async decidirDenuncia({ denunciaId, situacao, parecer }) {
    if (!['em_analise', 'resolvida', 'arquivada'].includes(situacao)) {
      throw new RegraDeNegocio('Situação inválida para a denúncia.');
    }
    return this.db.transacao(async (tx) => {
      const decidida = await tx.denuncias.decidir(denunciaId, { situacao, parecer });
      if (!decidida) throw new NaoEncontrado('Denúncia não encontrada.');
      return decidida;
    });
  }
}

module.exports = { AdministracaoService };
