const { ErroDeDominio, RegraDeNegocio, NaoAutorizado, NaoEncontrado } = require('../erros');

const STATUS = [
  [NaoAutorizado, 401],
  [NaoEncontrado, 404],
  [RegraDeNegocio, 422]
];

/**
 * Converte exceção em resposta.
 *
 * Erro de domínio vira mensagem para o morador ler — por isso os serviços
 * escrevem em português, na voz do produto. Qualquer outra exceção é falha
 * nossa: vai inteira para o log e sai como 500 genérico, sem vazar detalhe
 * de banco ou caminho de arquivo para quem chamou.
 */
function tratarErro(erro, req, res, _proximo) {
  if (erro instanceof ErroDeDominio) {
    const par = STATUS.find(([Classe]) => erro instanceof Classe);
    return res.status(par ? par[1] : 400).json({
      erro: erro.message,
      codigo: erro.codigo
    });
  }

  // Violação de restrição do PostgreSQL que escapou da validação do serviço.
  if (erro.code === '23505') {
    return res.status(409).json({ erro: 'Registro já existe.', codigo: 'DUPLICADO' });
  }
  if (erro.code === '23514') {
    return res.status(422).json({
      erro: 'A operação violaria uma regra da carteira de Elos.',
      codigo: 'RESTRICAO_DE_SALDO'
    });
  }

  console.error(`[erro] ${req.method} ${req.originalUrl}`, erro);
  return res.status(500).json({
    erro: 'Não foi possível concluir a operação. Tente novamente.',
    codigo: 'ERRO_INTERNO'
  });
}

function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: `Rota ${req.method} ${req.path} não existe.` });
}

module.exports = { tratarErro, rotaNaoEncontrada };
