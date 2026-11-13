// Só estes dois campos podem ser escritos por `registrarConfirmacao`. O nome
// da coluna vem do serviço, então precisa ser validado contra uma lista
// fechada: interpolar o valor recebido direto no SQL abriria injeção.
const CAMPOS_CONFIRMACAO = ['conf_solicitante', 'conf_ofertante'];

module.exports = (ex) => ({
  async buscar(id) {
    const { rows } = await ex.query(`SELECT * FROM trocas WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  async buscarParaAtualizar(id) {
    const { rows } = await ex.query(
      `SELECT * FROM trocas WHERE id = $1 FOR UPDATE`, [id]
    );
    return rows[0] || null;
  },

  async criar(dados) {
    const { rows } = await ex.query(
      `INSERT INTO trocas
         (solicitante_id, ofertante_id, habilidade_id, descricao,
          duracao_estimada, custo_elos, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [dados.solicitante_id, dados.ofertante_id, dados.habilidade_id,
       dados.descricao || null, dados.duracao_estimada, dados.custo_elos, dados.status]
    );
    return rows[0];
  },

  async atualizarStatus(id, status) {
    await ex.query(`UPDATE trocas SET status = $2 WHERE id = $1`, [id, status]);
  },

  async registrarConfirmacao(id, campo) {
    if (!CAMPOS_CONFIRMACAO.includes(campo)) {
      throw new Error(`Campo de confirmação inválido: ${campo}`);
    }
    await ex.query(`UPDATE trocas SET ${campo} = now() WHERE id = $1`, [id]);
  },

  async concluir(id) {
    await ex.query(
      `UPDATE trocas SET status = 'concluida', concluido_em = now() WHERE id = $1`, [id]
    );
  },

  async cancelar(id, motivo) {
    await ex.query(
      `UPDATE trocas SET status = 'cancelada', motivo_cancelamento = $2 WHERE id = $1`,
      [id, motivo]
    );
  },

  /** RN11 — teto de trocas concluídas no mês corrente. */
  async contarConcluidasNoMes(moradorId) {
    const { rows } = await ex.query(
      `SELECT count(*)::int AS total FROM trocas
        WHERE solicitante_id = $1
          AND status = 'concluida'
          AND concluido_em >= date_trunc('month', now())`, [moradorId]
    );
    return rows[0].total;
  },

  /** `papel` separa o que o morador pediu do que lhe pediram. */
  async listarDoMorador(moradorId, { papel = 'ambos', status } = {}) {
    const condicoes = [];
    const parametros = [moradorId];

    if (papel === 'solicitante') condicoes.push('t.solicitante_id = $1');
    else if (papel === 'ofertante') condicoes.push('t.ofertante_id = $1');
    else condicoes.push('(t.solicitante_id = $1 OR t.ofertante_id = $1)');

    if (status) {
      parametros.push(status);
      condicoes.push(`t.status = $${parametros.length}`);
    }

    const { rows } = await ex.query(
      `SELECT t.*, h.titulo AS habilidade_titulo,
              s.nome AS solicitante_nome, o.nome AS ofertante_nome, o.unidade AS ofertante_unidade
         FROM trocas t
         JOIN habilidades h ON h.id = t.habilidade_id
         JOIN moradores s   ON s.id = t.solicitante_id
         JOIN moradores o   ON o.id = t.ofertante_id
        WHERE ${condicoes.join(' AND ')}
        ORDER BY t.criado_em DESC`, parametros
    );
    return rows;
  },

  /** Indicadores do painel do síndico (UC13). */
  async resumoDoCondominio(condominioId) {
    const { rows } = await ex.query(
      `SELECT count(*) FILTER (WHERE t.status = 'concluida')::int AS concluidas,
              count(*) FILTER (WHERE t.status = 'pendente')::int  AS pendentes,
              count(*) FILTER (WHERE t.status = 'aceita')::int    AS em_andamento,
              coalesce(sum(t.custo_elos) FILTER (WHERE t.status = 'concluida'), 0)::int AS elos_movimentados
         FROM trocas t
         JOIN moradores s ON s.id = t.solicitante_id
        WHERE s.condominio_id = $1`, [condominioId]
    );
    return rows[0];
  }
});
