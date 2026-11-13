const moradores = require('./moradores');
const habilidades = require('./habilidades');
const trocas = require('./trocas');
const movimentacoes = require('./movimentacoes');
const d = require('./diversos');

/**
 * Monta o conjunto de repositórios sobre um executor — o client de uma
 * transação ou o próprio pool, para leitura avulsa. Os serviços de domínio
 * recebem exatamente este objeto e não sabem qual dos dois é.
 */
module.exports = function montarRepositorios(ex) {
  return {
    moradores: moradores(ex),
    habilidades: habilidades(ex),
    trocas: trocas(ex),
    movimentacoes: movimentacoes(ex),
    necessidades: d.necessidades(ex),
    mensagens: d.mensagens(ex),
    avaliacoes: d.avaliacoes(ex),
    denuncias: d.denuncias(ex),
    bloqueios: d.bloqueios(ex),
    categorias: d.categorias(ex)
  };
};
