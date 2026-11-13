/** Painel do síndico (UC11 a UC14). Todas as rotas passam por exigirSindico. */
module.exports = ({ administracao, db }) => ({
  async cadastrosPendentes(req, res) {
    res.json(await administracao.cadastrosPendentes(req.morador.condominio_id));
  },

  async decidirCadastro(req, res) {
    const atualizado = await administracao.decidirCadastro({
      sindico: req.morador,
      moradorId: req.params.id,
      aprovado: req.body.aprovado === true
    });
    res.json(atualizado);
  },

  async suspenderMorador(req, res) {
    res.json(await administracao.suspenderMorador({
      sindico: req.morador,
      moradorId: req.params.id,
      motivo: req.body.motivo
    }));
  },

  async painel(req, res) {
    res.json(await administracao.painel(req.morador.condominio_id));
  },

  async suspenderTrocas(req, res) {
    const bloqueio = await administracao.suspenderTrocas({
      sindico: req.morador,
      motivo: req.body.motivo,
      fimEm: req.body.fim_em
    });
    res.status(201).json(bloqueio);
  },

  async liberarTrocas(req, res) {
    res.json(await administracao.liberarTrocas({ bloqueioId: req.params.id }));
  },

  async denuncias(req, res) {
    res.json(await db.repositorios.denuncias.listarAbertas(req.morador.condominio_id));
  },

  async decidirDenuncia(req, res) {
    res.json(await administracao.decidirDenuncia({
      denunciaId: req.params.id,
      situacao: req.body.situacao,
      parecer: req.body.parecer
    }));
  }
});
