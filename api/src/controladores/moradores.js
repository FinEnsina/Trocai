const { NaoEncontrado, NaoAutorizado } = require('../erros');

/**
 * Perfil público do vizinho (UC04).
 *
 * O que o morador vê de outro morador é só o necessário para decidir se pede
 * ajuda: nome, unidade, nota média, trocas concluídas e habilidades ativas.
 * E-mail e telefone não saem daqui — o contato acontece pelo chat da troca,
 * depois do aceite (minimização de dados, LGPD).
 */
module.exports = ({ db }) => ({
  async perfil(req, res) {
    const r = db.repositorios;
    const perfil = await r.moradores.perfilPublico(req.params.id);
    if (!perfil) throw new NaoEncontrado('Morador não encontrado.');

    // Confere o condomínio antes de responder: perfil de vizinho só vale
    // dentro do mesmo prédio.
    const completo = await r.moradores.buscar(req.params.id);
    if (completo.condominio_id !== req.morador.condominio_id) {
      throw new NaoAutorizado('Este morador é de outro condomínio.');
    }

    const [habilidades, avaliacoes] = await Promise.all([
      r.habilidades.listarDoMorador(req.params.id),
      r.avaliacoes.listarDoMorador(req.params.id)
    ]);

    res.json({
      ...perfil,
      habilidades: habilidades.filter((h) => h.ativa),
      avaliacoes
    });
  }
});
