const { Router } = require('express');

const { exigirAutenticacao } = require('../middlewares/autenticacao');
const { exigirSindico } = require('../middlewares/permissoes');
const { validarCorpo, validarIdNaRota } = require('../middlewares/validacao');

const controladorAuth = require('../controladores/auth');
const controladorMoradores = require('../controladores/moradores');
const controladorHabilidades = require('../controladores/habilidades');
const controladorTrocas = require('../controladores/trocas');
const controladorCarteira = require('../controladores/carteira');
const controladorAdmin = require('../controladores/admin');

/**
 * Encaminha a exceção de um handler assíncrono para o middleware de erro.
 * O Express 5 já faz isso sozinho; o invólucro fica porque deixa explícito,
 * em cada rota, que o erro tem um único lugar de tratamento.
 */
const rota = (handler) => (req, res, proximo) =>
  Promise.resolve(handler(req, res, proximo)).catch(proximo);

module.exports = function montarRotas(servicos) {
  const auth = controladorAuth(servicos);
  const moradores = controladorMoradores(servicos);
  const habilidades = controladorHabilidades(servicos);
  const trocas = controladorTrocas(servicos);
  const carteira = controladorCarteira(servicos);
  const admin = controladorAdmin(servicos);

  const r = Router();
  const id = validarIdNaRota('id');

  // ---------------------------------------------------------------- público
  r.get('/saude', (_req, res) => res.json({ ok: true, versao: servicos.versao }));

  r.post('/auth/cadastro',
    validarCorpo({
      condominio_id: 'inteiro', nome: 'texto', email: 'texto',
      senha: 'texto', unidade: 'texto', telefone: 'texto?'
    }),
    rota(auth.cadastrar));

  r.post('/auth/login',
    validarCorpo({ email: 'texto', senha: 'texto' }),
    rota(auth.entrar));

  // -------------------------------------------------- daqui para baixo, token
  r.use(exigirAutenticacao);

  r.get('/auth/eu', rota(auth.eu));
  r.get('/categorias', rota(habilidades.categorias));
  r.get('/moradores/:id', id, rota(moradores.perfil));

  // habilidades e necessidades
  r.get('/habilidades', rota(habilidades.buscar));
  r.get('/habilidades/minhas', rota(habilidades.minhas));
  r.post('/habilidades',
    validarCorpo({
      titulo: 'texto', descricao: 'texto',
      duracao_minutos: 'inteiro', categoria_id: 'inteiro?'
    }),
    rota(habilidades.publicar));
  r.delete('/habilidades/:id', id, rota(habilidades.despublicar));

  r.get('/necessidades', rota(habilidades.listarNecessidades));
  r.post('/necessidades',
    validarCorpo({ titulo: 'texto', descricao: 'texto?', categoria_id: 'inteiro?' }),
    rota(habilidades.registrarNecessidade));

  // trocas
  r.get('/trocas', rota(trocas.listar));
  r.post('/trocas',
    validarCorpo({
      habilidade_id: 'inteiro', descricao: 'texto?', duracao_minutos: 'inteiro?'
    }),
    rota(trocas.solicitar));

  r.patch('/trocas/:id/aceitar', id, rota(trocas.aceitar));
  r.patch('/trocas/:id/recusar', id, rota(trocas.recusar));
  r.patch('/trocas/:id/confirmar', id, rota(trocas.confirmar));
  r.patch('/trocas/:id/cancelar', id,
    validarCorpo({ justificativa: 'texto' }), rota(trocas.cancelar));

  r.get('/trocas/:id/mensagens', id, rota(trocas.listarMensagens));
  r.post('/trocas/:id/mensagens', id,
    validarCorpo({ conteudo: 'texto' }), rota(trocas.enviarMensagem));

  r.post('/trocas/:id/avaliacao', id,
    validarCorpo({ nota: 'inteiro', comentario: 'texto?' }), rota(trocas.avaliar));

  r.post('/denuncias',
    validarCorpo({ denunciado_id: 'inteiro', motivo: 'texto', troca_id: 'inteiro?' }),
    rota(trocas.denunciar));

  // carteira
  r.get('/carteira', rota(carteira.resumo));
  r.get('/carteira/auditoria', rota(carteira.auditoria));

  // ------------------------------------------------------- painel do síndico
  const painel = Router();
  painel.use(exigirSindico);

  painel.get('/cadastros', rota(admin.cadastrosPendentes));
  painel.patch('/cadastros/:id', id,
    validarCorpo({ aprovado: 'booleano' }), rota(admin.decidirCadastro));

  painel.patch('/moradores/:id/suspender', id,
    validarCorpo({ motivo: 'texto' }), rota(admin.suspenderMorador));

  painel.get('/painel', rota(admin.painel));

  painel.post('/bloqueios',
    validarCorpo({ motivo: 'texto', fim_em: 'texto?' }), rota(admin.suspenderTrocas));
  painel.patch('/bloqueios/:id/liberar', id, rota(admin.liberarTrocas));

  painel.get('/denuncias', rota(admin.denuncias));
  painel.patch('/denuncias/:id', id,
    validarCorpo({ situacao: 'texto', parecer: 'texto?' }), rota(admin.decidirDenuncia));

  r.use('/admin', painel);

  return r;
};
