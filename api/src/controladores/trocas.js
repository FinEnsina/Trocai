/**
 * Ciclo de vida da troca (UC05 a UC09) e denúncia (UC16).
 *
 * A confirmação devolve 200 nos dois desfechos possíveis — "aguardando a
 * outra parte" e "concluída" —, porque os dois são sucesso. O aplicativo
 * distingue um do outro pelo campo `status`, que é o mesmo nome usado na
 * máquina de estados do serviço.
 */
module.exports = ({ troca, interacao, db }) => ({
  async solicitar(req, res) {
    const nova = await troca.solicitar({
      solicitanteId: req.morador.id,
      habilidadeId: req.body.habilidade_id,
      descricao: req.body.descricao,
      duracaoMinutos: req.body.duracao_minutos
    });
    res.status(201).json(nova);
  },

  async listar(req, res) {
    res.json(await db.repositorios.trocas.listarDoMorador(req.morador.id, {
      papel: req.query.papel,
      status: req.query.status
    }));
  },

  async aceitar(req, res) {
    res.json(await troca.aceitar(req.params.id, req.morador.id));
  },

  async recusar(req, res) {
    res.json(await troca.recusar(req.params.id, req.morador.id));
  },

  async confirmar(req, res) {
    res.json(await troca.confirmarConclusao(req.params.id, req.morador.id));
  },

  async cancelar(req, res) {
    res.json(await troca.cancelar(
      req.params.id, req.morador.id, req.body.justificativa
    ));
  },

  async enviarMensagem(req, res) {
    const mensagem = await interacao.enviarMensagem({
      trocaId: req.params.id,
      autorId: req.morador.id,
      conteudo: req.body.conteudo
    });
    res.status(201).json(mensagem);
  },

  async listarMensagens(req, res) {
    res.json(await interacao.listarMensagens({
      trocaId: req.params.id,
      moradorId: req.morador.id,
      desdeId: req.query.desde
    }));
  },

  async avaliar(req, res) {
    const avaliacao = await interacao.avaliar({
      trocaId: req.params.id,
      autorId: req.morador.id,
      nota: req.body.nota,
      comentario: req.body.comentario
    });
    res.status(201).json(avaliacao);
  },

  async denunciar(req, res) {
    const denuncia = await interacao.denunciar({
      denuncianteId: req.morador.id,
      denunciadoId: req.body.denunciado_id,
      trocaId: req.body.troca_id,
      motivo: req.body.motivo
    });
    res.status(201).json(denuncia);
  }
});
