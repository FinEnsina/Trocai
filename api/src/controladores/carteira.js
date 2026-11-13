const { PARAMETROS } = require('../servicos/carteira');

/**
 * Carteira de Elos (UC10).
 *
 * A resposta traz os parâmetros da economia junto do saldo. O aplicativo
 * precisa deles para explicar na tela por que um pedido foi recusado — "você
 * pode ficar devendo até 3 Elos" — sem repetir a regra em código próprio.
 */
module.exports = ({ db }) => ({
  async resumo(req, res) {
    const r = db.repositorios;
    const [morador, extrato] = await Promise.all([
      r.moradores.buscar(req.morador.id),
      r.movimentacoes.extrato(req.morador.id)
    ]);

    res.json({
      saldo: morador.saldo_elos,
      em_custodia: morador.elos_custodia,
      disponivel: morador.saldo_elos,
      limite_divida: PARAMETROS.LIMITE_DIVIDA,
      minutos_por_elo: PARAMETROS.MINUTOS_POR_ELO,
      extrato
    });
  },

  /**
   * Conferência de integridade exposta como endpoint para que o teste de
   * validação (CT08) possa checá-la de fora, sem abrir o banco.
   */
  async auditoria(req, res) {
    res.json(await db.repositorios.movimentacoes.conferirSaldo(req.morador.id));
  }
});
