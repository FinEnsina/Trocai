const { RegraDeNegocio, NaoEncontrado } = require('../erros');
const { CarteiraService } = require('./carteira');

/**
 * Publicação e busca de habilidades (UC02, UC03, UC04).
 *
 * O custo em Elos não é digitado livremente: deriva da duração informada,
 * pela regra de um Elo a cada trinta minutos (RN01). Deixar o morador
 * escolher o número abriria espaço para inflação dentro do condomínio — a
 * mesma hora de trabalho valendo valores diferentes conforme quem anuncia.
 */
class HabilidadeService {
  constructor(db) {
    this.db = db;
  }

  async publicar({ moradorId, categoriaId, titulo, descricao, duracaoMinutos }) {
    if (!titulo || titulo.trim().length < 5) {
      throw new RegraDeNegocio('Descreva a habilidade em pelo menos cinco caracteres.');
    }
    if (!descricao || descricao.trim().length < 20) {
      throw new RegraDeNegocio(
        'Explique em algumas linhas o que você faz: é por essa descrição que o vizinho decide.'
      );
    }

    const custo = CarteiraService.custoPorDuracao(Number(duracaoMinutos));

    return this.db.transacao(async (tx) => {
      const morador = await tx.moradores.buscar(moradorId);
      if (!morador || morador.situacao !== 'aprovado') {
        throw new RegraDeNegocio('Apenas moradores aprovados podem publicar habilidades.');
      }
      return tx.habilidades.criar({
        morador_id: moradorId,
        categoria_id: categoriaId,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        custo_elos: custo,
        duracao_minutos: Number(duracaoMinutos)
      });
    });
  }

  /** A busca nunca atravessa condomínios: o escopo vem do token, não da URL. */
  async buscar({ condominioId, termo, categoriaId, pagina = 1, porPagina = 20 }) {
    const limite = Math.min(Number(porPagina) || 20, 50);
    const deslocamento = (Math.max(Number(pagina) || 1, 1) - 1) * limite;
    return this.db.repositorios.habilidades.listar({
      condominioId, termo, categoriaId, limite, deslocamento
    });
  }

  async registrarNecessidade({ moradorId, categoriaId, titulo, descricao }) {
    if (!titulo || titulo.trim().length < 5) {
      throw new RegraDeNegocio('Diga em poucas palavras do que você precisa.');
    }
    return this.db.transacao(async (tx) =>
      tx.necessidades.criar({
        morador_id: moradorId,
        categoria_id: categoriaId,
        titulo: titulo.trim(),
        descricao
      })
    );
  }

  async despublicar({ moradorId, habilidadeId }) {
    return this.db.transacao(async (tx) => {
      const removida = await tx.habilidades.desativar(habilidadeId, moradorId);
      if (!removida) {
        throw new NaoEncontrado('Habilidade não encontrada no seu perfil.');
      }
      return removida;
    });
  }
}

module.exports = { HabilidadeService };
