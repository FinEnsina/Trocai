#!/usr/bin/env node
const { criarApp } = require('./app');
const { Banco } = require('./db/pool');
const config = require('./config');

const banco = new Banco();
const app = criarApp(banco);

const servidor = app.listen(config.porta, () => {
  console.log(`Trocaí API ouvindo em http://localhost:${config.porta}/api`);
  console.log(`Ambiente: ${config.ambiente}`);
});

// Encerramento ordenado: para de aceitar conexão nova, espera as em curso e
// só então fecha o pool. Derrubar o processo no meio de uma transferência de
// Elos deixaria a transação para o PostgreSQL reverter sozinho — funciona,
// mas o morador veria um erro sem saber se a troca valeu.
function encerrar(sinal) {
  console.log(`\n${sinal} recebido, encerrando.`);
  servidor.close(async () => {
    await banco.encerrar();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => encerrar('SIGTERM'));
process.on('SIGINT', () => encerrar('SIGINT'));
