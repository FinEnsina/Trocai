/** Publicação, busca e necessidades (UC02, UC03, UC04). */
module.exports = ({ habilidade, db }) => ({
  async publicar(req, res) {
    const nova = await habilidade.publicar({
      moradorId: req.morador.id,
      categoriaId: req.body.categoria_id,
      titulo: req.body.titulo,
      descricao: req.body.descricao,
      duracaoMinutos: req.body.duracao_minutos
    });
    res.status(201).json(nova);
  },

  /** O condomínio vem do token: a busca não aceita esse filtro pela URL. */
  async buscar(req, res) {
    const resultados = await habilidade.buscar({
      condominioId: req.morador.condominio_id,
      termo: req.query.q,
      categoriaId: req.query.categoria,
      pagina: req.query.pagina,
      porPagina: req.query.por_pagina
    });
    res.json({ total: resultados.length, resultados });
  },

  async minhas(req, res) {
    res.json(await db.repositorios.habilidades.listarDoMorador(req.morador.id));
  },

  async despublicar(req, res) {
    await habilidade.despublicar({
      moradorId: req.morador.id,
      habilidadeId: req.params.id
    });
    res.status(204).end();
  },

  async registrarNecessidade(req, res) {
    const nova = await habilidade.registrarNecessidade({
      moradorId: req.morador.id,
      categoriaId: req.body.categoria_id,
      titulo: req.body.titulo,
      descricao: req.body.descricao
    });
    res.status(201).json(nova);
  },

  async listarNecessidades(req, res) {
    res.json(await db.repositorios.necessidades.listar(req.morador.condominio_id));
  },

  async categorias(_req, res) {
    res.json(await db.repositorios.categorias.listar());
  }
});
