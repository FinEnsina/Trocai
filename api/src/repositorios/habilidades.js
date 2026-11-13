module.exports = (ex) => ({
  async buscar(id) {
    const { rows } = await ex.query(
      `SELECT h.*, m.condominio_id, m.nome AS morador_nome, m.unidade
         FROM habilidades h
         JOIN moradores m ON m.id = h.morador_id
        WHERE h.id = $1`, [id]
    );
    return rows[0] || null;
  },

  async criar({ morador_id, categoria_id, titulo, descricao, custo_elos, duracao_minutos }) {
    const { rows } = await ex.query(
      `INSERT INTO habilidades
         (morador_id, categoria_id, titulo, descricao, custo_elos, duracao_minutos)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [morador_id, categoria_id || null, titulo, descricao, custo_elos, duracao_minutos || null]
    );
    return rows[0];
  },

  /**
   * Busca com filtros (UC04). A relevância vem do índice de texto em
   * português criado na migração 001; sem termo de busca, ordena pelas mais
   * recentes. O resultado nunca sai do condomínio de quem pesquisa.
   */
  async listar({ condominioId, termo, categoriaId, limite = 30, deslocamento = 0 }) {
    const parametros = [condominioId];
    const condicoes = [`m.condominio_id = $1`, `h.ativa = TRUE`, `m.situacao = 'aprovado'`];
    let ordem = 'h.criado_em DESC';
    let relevancia = '0 AS relevancia';

    if (termo && termo.trim()) {
      parametros.push(termo.trim());
      const p = `$${parametros.length}`;
      condicoes.push(
        `to_tsvector('portuguese', h.titulo || ' ' || h.descricao)
           @@ plainto_tsquery('portuguese', ${p})`
      );
      relevancia = `ts_rank(to_tsvector('portuguese', h.titulo || ' ' || h.descricao),
                            plainto_tsquery('portuguese', ${p})) AS relevancia`;
      ordem = 'relevancia DESC, h.criado_em DESC';
    }

    if (categoriaId) {
      parametros.push(categoriaId);
      condicoes.push(`h.categoria_id = $${parametros.length}`);
    }

    parametros.push(limite, deslocamento);

    const { rows } = await ex.query(
      `SELECT h.id, h.titulo, h.descricao, h.custo_elos, h.duracao_minutos,
              h.morador_id, m.nome AS morador_nome, m.unidade, m.nota_media,
              c.nome AS categoria, ${relevancia}
         FROM habilidades h
         JOIN moradores m  ON m.id = h.morador_id
         LEFT JOIN categorias c ON c.id = h.categoria_id
        WHERE ${condicoes.join(' AND ')}
        ORDER BY ${ordem}
        LIMIT $${parametros.length - 1} OFFSET $${parametros.length}`, parametros
    );
    return rows;
  },

  async listarDoMorador(moradorId) {
    const { rows } = await ex.query(
      `SELECT h.*, c.nome AS categoria
         FROM habilidades h
         LEFT JOIN categorias c ON c.id = h.categoria_id
        WHERE h.morador_id = $1 ORDER BY h.criado_em DESC`, [moradorId]
    );
    return rows;
  },

  async desativar(id, moradorId) {
    const { rows } = await ex.query(
      `UPDATE habilidades SET ativa = FALSE
        WHERE id = $1 AND morador_id = $2 RETURNING *`, [id, moradorId]
    );
    return rows[0] || null;
  },

  /**
   * Árvore de Talentos (UC14): o que a comunidade oferece contra o que a
   * comunidade procura. A diferença entre as duas colunas é a lacuna de
   * habilidades que o síndico vê no painel.
   */
  async mapaDeTalentos(condominioId) {
    const { rows } = await ex.query(
      `SELECT c.id, c.nome, c.icone,
              count(DISTINCT h.id)::int AS ofertas,
              count(DISTINCT n.id)::int AS procuras
         FROM categorias c
         LEFT JOIN habilidades h ON h.categoria_id = c.id AND h.ativa
              AND h.morador_id IN (SELECT id FROM moradores WHERE condominio_id = $1)
         LEFT JOIN necessidades n ON n.categoria_id = c.id AND NOT n.atendida
              AND n.morador_id IN (SELECT id FROM moradores WHERE condominio_id = $1)
        GROUP BY c.id
        ORDER BY (count(DISTINCT n.id) - count(DISTINCT h.id)) DESC`, [condominioId]
    );
    return rows;
  }
});
