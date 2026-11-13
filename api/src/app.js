const express = require('express');

const montarRotas = require('./rotas');
const { tratarErro, rotaNaoEncontrada } = require('./middlewares/erro');

const { CarteiraService } = require('./servicos/carteira');
const { TrocaService } = require('./servicos/troca');
const { AutenticacaoService } = require('./servicos/autenticacao');
const { HabilidadeService } = require('./servicos/habilidade');
const { InteracaoService } = require('./servicos/interacao');
const { AdministracaoService } = require('./servicos/administracao');

const { version: versao } = require('../package.json');

/**
 * Monta a aplicação a partir de um banco.
 *
 * O banco entra por parâmetro, e não por `require`, para que os testes de
 * integração possam passar a implementação em memória e exercitar os
 * endpoints de ponta a ponta sem subir PostgreSQL. Em produção quem chama é
 * servidor.js, com o pool real.
 */
function criarApp(db) {
  const carteira = new CarteiraService();

  const servicos = {
    db,
    versao,
    carteira,
    troca: new TrocaService(db, carteira),
    autenticacao: new AutenticacaoService(db),
    habilidade: new HabilidadeService(db),
    interacao: new InteracaoService(db),
    administracao: new AdministracaoService(db, carteira)
  };

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', montarRotas(servicos));

  app.use(rotaNaoEncontrada);
  app.use(tratarErro);

  app.locals.servicos = servicos;
  return app;
}

module.exports = { criarApp };
