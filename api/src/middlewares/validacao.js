const { RegraDeNegocio } = require('../erros');

/**
 * Validação de formato na borda da API.
 *
 * Aqui só se verifica se o campo existe e se é do tipo certo. Regra de
 * negócio — custo em Elos, limite de dívida, transição de estado — fica nos
 * serviços, nunca aqui: a rota é uma porta de entrada, e o aplicativo e o
 * painel web precisam encontrar a mesma regra do outro lado dela.
 */
const tipos = {
  texto: (v) => typeof v === 'string' && v.trim().length > 0,
  inteiro: (v) => Number.isInteger(Number(v)) && String(v).trim() !== '',
  booleano: (v) => typeof v === 'boolean',
  opcional: () => true
};

function validarCorpo(esquema) {
  return function (req, _res, proximo) {
    const faltando = [];
    const invalidos = [];

    for (const [campo, regra] of Object.entries(esquema)) {
      const valor = req.body ? req.body[campo] : undefined;
      const opcional = regra.endsWith('?');
      const tipo = opcional ? regra.slice(0, -1) : regra;

      if (valor === undefined || valor === null || valor === '') {
        if (!opcional) faltando.push(campo);
        continue;
      }
      if (!(tipos[tipo] || tipos.opcional)(valor)) invalidos.push(campo);
    }

    if (faltando.length) {
      return proximo(new RegraDeNegocio(
        `Campos obrigatórios: ${faltando.join(', ')}.`, 'CAMPOS_FALTANDO'
      ));
    }
    if (invalidos.length) {
      return proximo(new RegraDeNegocio(
        `Campos com formato inválido: ${invalidos.join(', ')}.`, 'CAMPOS_INVALIDOS'
      ));
    }
    return proximo();
  };
}

/** Converte :id de rota em inteiro, recusando o que não for número. */
function validarIdNaRota(nome = 'id') {
  return function (req, _res, proximo) {
    const valor = Number(req.params[nome]);
    if (!Number.isInteger(valor) || valor <= 0) {
      return proximo(new RegraDeNegocio('Identificador inválido.', 'ID_INVALIDO'));
    }
    req.params[nome] = valor;
    return proximo();
  };
}

module.exports = { validarCorpo, validarIdNaRota };
