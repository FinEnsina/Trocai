const { Pool } = require('pg');
const config = require('../config');
const montarRepositorios = require('../repositorios');

/**
 * Acesso ao PostgreSQL.
 *
 * Toda operação que toca mais de uma linha passa por `transacao()`. Os
 * serviços de domínio nunca recebem o pool: recebem o objeto `tx` montado
 * aqui, com os repositórios já presos ao mesmo client. É isso que garante
 * que débito e crédito de uma troca caibam na mesma transação.
 */
class Banco {
  constructor(opcoes = config.banco) {
    this.pool = new Pool(opcoes);
  }

  /** Consulta avulsa, fora de transação. Usada apenas em leitura. */
  async consultar(sql, parametros = []) {
    const { rows } = await this.pool.query(sql, parametros);
    return rows;
  }

  /** Leitura que espera uma linha só. */
  async consultarUm(sql, parametros = []) {
    const linhas = await this.consultar(sql, parametros);
    return linhas[0] || null;
  }

  /**
   * Executa `fn` dentro de BEGIN/COMMIT. Qualquer exceção lançada lá dentro
   * reverte tudo — inclusive escritas já realizadas — e sobe para quem chamou.
   */
  async transacao(fn) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const resultado = await fn(montarRepositorios(client));
      await client.query('COMMIT');
      return resultado;
    } catch (erro) {
      await client.query('ROLLBACK');
      throw erro;
    } finally {
      client.release();
    }
  }

  /** Repositórios fora de transação, para leitura simples. */
  get repositorios() {
    return montarRepositorios(this.pool);
  }

  async encerrar() {
    await this.pool.end();
  }
}

module.exports = { Banco };
