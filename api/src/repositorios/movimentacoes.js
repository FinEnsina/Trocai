/**
 * Livro-razão dos Elos. Este repositório expõe inserção e leitura e mais
 * nada: não existe método de alteração nem de exclusão, e a trigger
 * `trg_livro_razao_imutavel` barra as duas no banco caso alguém tente por
 * outro caminho.
 */
module.exports = (ex) => ({
  async registrar({ troca_id, morador_id, tipo, valor, saldo_apos }) {
    const { rows } = await ex.query(
      `INSERT INTO movimentacao_elos (troca_id, morador_id, tipo, valor, saldo_apos)
            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [troca_id || null, morador_id, tipo, valor, saldo_apos]
    );
    return rows[0];
  },

  /** Extrato exibido na carteira (UC10). */
  async extrato(moradorId, limite = 50) {
    const { rows } = await ex.query(
      `SELECT mv.id, mv.tipo, mv.valor, mv.saldo_apos, mv.criado_em,
              mv.troca_id, h.titulo AS habilidade_titulo,
              CASE WHEN t.solicitante_id = $1 THEN o.nome ELSE s.nome END AS contraparte
         FROM movimentacao_elos mv
         LEFT JOIN trocas t      ON t.id = mv.troca_id
         LEFT JOIN habilidades h ON h.id = t.habilidade_id
         LEFT JOIN moradores s   ON s.id = t.solicitante_id
         LEFT JOIN moradores o   ON o.id = t.ofertante_id
        WHERE mv.morador_id = $1
        ORDER BY mv.criado_em DESC, mv.id DESC
        LIMIT $2`, [moradorId, limite]
    );
    return rows;
  },

  /**
   * Auditoria (RN12): reconstrói saldo e custódia a partir do livro-razão e
   * compara com as colunas materializadas. Divergência aqui significa
   * escrita fora de transação.
   *
   * O lançamento `debito` fica de fora da soma do saldo de propósito: na
   * conclusão de uma troca os Elos saem da custódia, não do saldo — o saldo
   * do solicitante já havia sido reduzido no aceite, pelo lançamento
   * `custodia`. Somar os dois descontaria o mesmo valor duas vezes.
   */
  async conferirSaldo(moradorId) {
    const { rows } = await ex.query(
      `SELECT m.saldo_elos    AS saldo_materializado,
              m.elos_custodia AS custodia_materializada,
              coalesce(sum(mv.valor)
                FILTER (WHERE mv.tipo <> 'debito'), 0)::int AS saldo_no_livro,
              coalesce(
                  sum(-mv.valor) FILTER (WHERE mv.tipo = 'custodia')
                - sum(mv.valor)  FILTER (WHERE mv.tipo = 'devolucao')
                - sum(-mv.valor) FILTER (WHERE mv.tipo = 'debito'), 0)::int
                AS custodia_no_livro
         FROM moradores m
         LEFT JOIN movimentacao_elos mv ON mv.morador_id = m.id
        WHERE m.id = $1
        GROUP BY m.saldo_elos, m.elos_custodia`, [moradorId]
    );
    const r = rows[0];
    if (!r) return null;
    return {
      ...r,
      confere: r.saldo_materializado === r.saldo_no_livro
            && r.custodia_materializada === r.custodia_no_livro
    };
  }
});
