#!/usr/bin/env node
/**
 * Aplica as migrações em ordem, uma vez cada.
 *
 *   npm run migrar
 *
 * O controle é feito pela tabela `migracoes`: um arquivo já registrado não
 * roda de novo. Cada arquivo é executado dentro de uma transação, então uma
 * migração que falhar no meio não deixa o esquema pela metade.
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const config = require('../config');

const PASTA = path.join(__dirname, 'migracoes');

async function principal() {
  const pool = new Pool(config.banco);
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS migracoes (
        arquivo    VARCHAR(160) PRIMARY KEY,
        aplicada_em TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const { rows } = await client.query('SELECT arquivo FROM migracoes');
    const aplicadas = new Set(rows.map((r) => r.arquivo));

    const arquivos = fs.readdirSync(PASTA).filter((f) => f.endsWith('.sql')).sort();
    let executadas = 0;

    for (const arquivo of arquivos) {
      if (aplicadas.has(arquivo)) {
        console.log(`  já aplicada   ${arquivo}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(PASTA, arquivo), 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO migracoes (arquivo) VALUES ($1)', [arquivo]);
        await client.query('COMMIT');
        console.log(`  aplicada      ${arquivo}`);
        executadas++;
      } catch (erro) {
        await client.query('ROLLBACK');
        console.error(`  FALHOU        ${arquivo}`);
        throw erro;
      }
    }

    console.log(executadas ? `\n${executadas} migração(ões) aplicada(s).` : '\nNada a fazer.');
  } finally {
    client.release();
    await pool.end();
  }
}

principal().catch((erro) => {
  console.error('\n' + erro.message);
  process.exit(1);
});
