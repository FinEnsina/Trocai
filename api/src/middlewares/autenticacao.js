const { AutenticacaoService } = require('../servicos/autenticacao');
const { NaoAutorizado } = require('../erros');

/**
 * Lê o token do cabeçalho Authorization e põe o morador em `req.morador`.
 *
 * O condomínio sai do token, nunca da URL ou do corpo da requisição: é o que
 * garante que ninguém consiga listar habilidades de outro prédio trocando um
 * número no endereço.
 */
function exigirAutenticacao(req, _res, proximo) {
  const cabecalho = req.get('authorization') || '';
  const [esquema, token] = cabecalho.split(' ');

  if (esquema !== 'Bearer' || !token) {
    return proximo(new NaoAutorizado('Informe o token de acesso.', 'TOKEN_AUSENTE'));
  }

  const conteudo = AutenticacaoService.lerToken(token);
  req.morador = {
    id: conteudo.sub,
    papel: conteudo.papel,
    condominio_id: conteudo.condominio
  };
  return proximo();
}

module.exports = { exigirAutenticacao };
