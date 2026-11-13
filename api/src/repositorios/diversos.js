/**
 * Repositórios das tabelas de apoio. Ficam juntos porque cada um tem duas ou
 * três consultas; separá-los em arquivos de dez linhas só espalharia o código.
 */

const necessidades = (ex) => ({
  async criar({ morador_id, categoria_id, titulo, descricao }) {
    const { rows } = await ex.query(
      `INSERT INTO necessidades (morador_id, categoria_id, titulo, descricao)
            VALUES ($1, $2, $3, $4) RETURNING *`,
      [morador_id, categoria_id || null, titulo, descricao || null]
    );
    return rows[0];
  },

  async listar(condominioId) {
    const { rows } = await ex.query(
      `SELECT n.*, m.nome AS morador_nome, m.unidade, c.nome AS categoria
         FROM necessidades n
         JOIN moradores m ON m.id = n.morador_id
         LEFT JOIN categorias c ON c.id = n.categoria_id
        WHERE m.condominio_id = $1 AND NOT n.atendida
        ORDER BY n.criado_em DESC`, [condominioId]
    );
    return rows;
  },

  async marcarAtendida(id, moradorId) {
    const { rows } = await ex.query(
      `UPDATE necessidades SET atendida = TRUE
        WHERE id = $1 AND morador_id = $2 RETURNING *`, [id, moradorId]
    );
    return rows[0] || null;
  }
});

const mensagens = (ex) => ({
  async criar({ troca_id, autor_id, conteudo }) {
    const { rows } = await ex.query(
      `INSERT INTO mensagens (troca_id, autor_id, conteudo)
            VALUES ($1, $2, $3) RETURNING *`, [troca_id, autor_id, conteudo]
    );
    return rows[0];
  },

  async listarDaTroca(trocaId, desdeId = 0) {
    const { rows } = await ex.query(
      `SELECT m.id, m.conteudo, m.autor_id, m.criado_em, a.nome AS autor_nome
         FROM mensagens m
         JOIN moradores a ON a.id = m.autor_id
        WHERE m.troca_id = $1 AND m.id > $2
        ORDER BY m.id`, [trocaId, desdeId]
    );
    return rows;
  },

  async marcarLidas(trocaId, leitorId) {
    await ex.query(
      `UPDATE mensagens SET lida_em = now()
        WHERE troca_id = $1 AND autor_id <> $2 AND lida_em IS NULL`, [trocaId, leitorId]
    );
  }
});

const avaliacoes = (ex) => ({
  async criar({ troca_id, autor_id, avaliado_id, nota, comentario }) {
    const { rows } = await ex.query(
      `INSERT INTO avaliacoes (troca_id, autor_id, avaliado_id, nota, comentario)
            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [troca_id, autor_id, avaliado_id, nota, comentario || null]
    );
    return rows[0];
  },

  async existe(trocaId, autorId) {
    const { rows } = await ex.query(
      `SELECT 1 FROM avaliacoes WHERE troca_id = $1 AND autor_id = $2`,
      [trocaId, autorId]
    );
    return rows.length > 0;
  },

  async listarDoMorador(avaliadoId, limite = 20) {
    const { rows } = await ex.query(
      `SELECT a.nota, a.comentario, a.criado_em, h.titulo AS habilidade_titulo
         FROM avaliacoes a
         JOIN trocas t      ON t.id = a.troca_id
         JOIN habilidades h ON h.id = t.habilidade_id
        WHERE a.avaliado_id = $1
        ORDER BY a.criado_em DESC LIMIT $2`, [avaliadoId, limite]
    );
    return rows;
  }
});

const denuncias = (ex) => ({
  async criar({ denunciante_id, denunciado_id, troca_id, motivo }) {
    const { rows } = await ex.query(
      `INSERT INTO denuncias (denunciante_id, denunciado_id, troca_id, motivo)
            VALUES ($1, $2, $3, $4) RETURNING id, situacao, criado_em`,
      [denunciante_id, denunciado_id, troca_id || null, motivo]
    );
    return rows[0];
  },

  async listarAbertas(condominioId) {
    const { rows } = await ex.query(
      `SELECT d.id, d.motivo, d.situacao, d.criado_em,
              dd.nome AS denunciado_nome, dd.unidade AS denunciado_unidade
         FROM denuncias d
         JOIN moradores dd ON dd.id = d.denunciado_id
        WHERE dd.condominio_id = $1 AND d.situacao IN ('aberta', 'em_analise')
        ORDER BY d.criado_em`, [condominioId]
    );
    return rows;
  },

  async decidir(id, { situacao, parecer }) {
    const { rows } = await ex.query(
      `UPDATE denuncias SET situacao = $2, parecer = $3 WHERE id = $1 RETURNING *`,
      [id, situacao, parecer || null]
    );
    return rows[0] || null;
  }
});

const bloqueios = (ex) => ({
  /** RN10 — há suspensão vigente no condomínio agora? */
  async existeAtivo(condominioId) {
    const { rows } = await ex.query(
      `SELECT 1 FROM bloqueios
        WHERE condominio_id = $1
          AND inicio_em <= now()
          AND (fim_em IS NULL OR fim_em > now())`, [condominioId]
    );
    return rows.length > 0;
  },

  async criar({ condominio_id, sindico_id, motivo, fim_em }) {
    const { rows } = await ex.query(
      `INSERT INTO bloqueios (condominio_id, sindico_id, motivo, fim_em)
            VALUES ($1, $2, $3, $4) RETURNING *`,
      [condominio_id, sindico_id, motivo, fim_em || null]
    );
    return rows[0];
  },

  async encerrar(id) {
    await ex.query(`UPDATE bloqueios SET fim_em = now() WHERE id = $1`, [id]);
  }
});

const categorias = (ex) => ({
  async listar() {
    const { rows } = await ex.query(`SELECT id, nome, icone FROM categorias ORDER BY nome`);
    return rows;
  }
});

module.exports = { necessidades, mensagens, avaliacoes, denuncias, bloqueios, categorias };
