const CAMPOS_PUBLICOS = `
  id, condominio_id, nome, unidade, papel, situacao,
  saldo_elos, elos_custodia, nota_media, criado_em
`;

/**
 * Nenhum método devolve senha_hash, exceto `buscarPorEmailComSenha`, usado
 * apenas no login. O e-mail e o telefone só saem em `buscar`, que serve ao
 * próprio morador e ao síndico — o perfil que o vizinho vê é o de
 * `perfilPublico`, sem dado de contato (LGPD, minimização).
 */
module.exports = (ex) => ({
  async buscar(id) {
    const { rows } = await ex.query(
      `SELECT ${CAMPOS_PUBLICOS}, email, telefone FROM moradores WHERE id = $1`, [id]
    );
    return rows[0] || null;
  },

  /**
   * SELECT ... FOR UPDATE: trava a linha até o fim da transação.
   * Duas trocas simultâneas envolvendo o mesmo morador ficam em fila em vez
   * de ler o mesmo saldo e gravar dois resultados conflitantes.
   */
  async buscarParaAtualizar(id) {
    const { rows } = await ex.query(
      `SELECT ${CAMPOS_PUBLICOS} FROM moradores WHERE id = $1 FOR UPDATE`, [id]
    );
    return rows[0] || null;
  },

  async buscarPorEmailComSenha(email) {
    const { rows } = await ex.query(
      `SELECT ${CAMPOS_PUBLICOS}, email, senha_hash FROM moradores WHERE email = $1`,
      [String(email).toLowerCase().trim()]
    );
    return rows[0] || null;
  },

  async perfilPublico(id) {
    const { rows } = await ex.query(
      `SELECT m.id, m.nome, m.unidade, m.nota_media,
              (SELECT count(*) FROM trocas t
                WHERE t.ofertante_id = m.id AND t.status = 'concluida') AS trocas_concluidas
         FROM moradores m
        WHERE m.id = $1 AND m.situacao = 'aprovado'`, [id]
    );
    return rows[0] || null;
  },

  async criar({ condominio_id, nome, email, senha_hash, unidade, telefone }) {
    const { rows } = await ex.query(
      `INSERT INTO moradores (condominio_id, nome, email, senha_hash, unidade, telefone)
            VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING ${CAMPOS_PUBLICOS}`,
      [condominio_id, nome, String(email).toLowerCase().trim(), senha_hash, unidade, telefone || null]
    );
    return rows[0];
  },

  async atualizarSaldos(id, { saldo_elos, elos_custodia }) {
    await ex.query(
      `UPDATE moradores SET saldo_elos = $2, elos_custodia = $3 WHERE id = $1`,
      [id, saldo_elos, elos_custodia]
    );
  },

  async definirSituacao(id, situacao) {
    const { rows } = await ex.query(
      `UPDATE moradores SET situacao = $2 WHERE id = $1 RETURNING ${CAMPOS_PUBLICOS}`,
      [id, situacao]
    );
    return rows[0] || null;
  },

  async listarPendentes(condominioId) {
    const { rows } = await ex.query(
      `SELECT id, nome, unidade, criado_em FROM moradores
        WHERE condominio_id = $1 AND situacao = 'pendente'
        ORDER BY criado_em`, [condominioId]
    );
    return rows;
  },

  /** Ranking de moradores ativos exibido no painel do síndico (UC13). */
  async ranking(condominioId, limite = 10) {
    const { rows } = await ex.query(
      `SELECT m.id, m.nome, m.unidade, m.nota_media,
              count(t.id) FILTER (WHERE t.status = 'concluida') AS trocas
         FROM moradores m
         LEFT JOIN trocas t ON t.ofertante_id = m.id
        WHERE m.condominio_id = $1 AND m.situacao = 'aprovado'
        GROUP BY m.id
        ORDER BY trocas DESC, m.nota_media DESC NULLS LAST
        LIMIT $2`, [condominioId, limite]
    );
    return rows;
  },

  async recalcularNotaMedia(id) {
    await ex.query(
      `UPDATE moradores
          SET nota_media = (SELECT round(avg(nota), 2) FROM avaliacoes WHERE avaliado_id = $1)
        WHERE id = $1`, [id]
    );
  }
});
