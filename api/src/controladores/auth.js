/**
 * Cadastro e login (UC01).
 *
 * O controlador não decide nada: lê a requisição, chama um método de serviço
 * e escolhe o código HTTP. Toda regra está em AutenticacaoService, de onde o
 * painel web a alcança pelos mesmos endpoints.
 */
module.exports = ({ autenticacao, db }) => ({
  async cadastrar(req, res) {
    const resultado = await autenticacao.cadastrar({
      condominioId: req.body.condominio_id,
      nome: req.body.nome,
      email: req.body.email,
      senha: req.body.senha,
      unidade: req.body.unidade,
      telefone: req.body.telefone
    });
    res.status(201).json(resultado);
  },

  async entrar(req, res) {
    const resultado = await autenticacao.entrar({
      email: req.body.email,
      senha: req.body.senha
    });
    res.json(resultado);
  },

  /** Quem sou eu: usado pelo aplicativo na abertura, para validar a sessão. */
  async eu(req, res) {
    const morador = await db.repositorios.moradores.buscar(req.morador.id);
    res.json(morador);
  }
});
