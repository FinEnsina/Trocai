const { NaoAutorizado } = require('../erros');

/** Restringe a rota a um papel. Usado nas rotas de /admin. */
function exigirPapel(...papeis) {
  return function (req, _res, proximo) {
    if (!req.morador) {
      return proximo(new NaoAutorizado('Autentique-se para continuar.'));
    }
    if (!papeis.includes(req.morador.papel)) {
      return proximo(new NaoAutorizado(
        'Esta área é exclusiva do síndico.', 'PERMISSAO_INSUFICIENTE'
      ));
    }
    return proximo();
  };
}

module.exports = { exigirPapel, exigirSindico: exigirPapel('sindico') };
