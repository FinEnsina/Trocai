#!/usr/bin/env node
/**
 * Percorre uma troca inteira pela API, do cadastro à conclusão, imprimindo o
 * que acontece com os saldos a cada passo.
 *
 *   npm run demonstracao
 *
 * Roda sobre o banco em memória dos testes, então não precisa de PostgreSQL:
 * serve para conferir o comportamento do domínio em uma máquina qualquer,
 * inclusive na apresentação.
 */
const bcrypt = require('bcryptjs');
const { criarApp } = require('../src/app');
const { BancoFake } = require('../testes/bancoFake');

const SENHA = 'moradia2026';
const HASH = bcrypt.hashSync(SENHA, 4);

const banco = new BancoFake({
  moradores: {
    1: {
      id: 1, condominio_id: 1, nome: 'Helena Prado (síndica)', email: 'sindico@trocai.app',
      senha_hash: HASH, unidade: '101', papel: 'sindico', situacao: 'aprovado',
      saldo_elos: 3, elos_custodia: 0, nota_media: null
    },
    2: {
      id: 2, condominio_id: 1, nome: 'Antônio Barros', email: 'antonio@trocai.app',
      senha_hash: HASH, unidade: '54B', papel: 'morador', situacao: 'aprovado',
      saldo_elos: 3, elos_custodia: 0, nota_media: null
    }
  },
  movimentacoes: [
    { id: 1, troca_id: null, morador_id: 1, tipo: 'bonus', valor: 3, saldo_apos: 3 },
    { id: 2, troca_id: null, morador_id: 2, tipo: 'bonus', valor: 3, saldo_apos: 3 }
  ],
  habilidades: {
    10: {
      id: 10, morador_id: 2, categoria_id: 3, ativa: true,
      titulo: 'Conserto de eletrônicos pequenos',
      descricao: 'Ventilador, liquidificador e rádio. Técnico em eletrônica aposentado.',
      custo_elos: 2, duracao_minutos: 60
    }
  },
  proximoId: 100
});

const app = criarApp(banco);
const servidor = app.listen(0);
const base = () => `http://localhost:${servidor.address().port}/api`;

let passo = 0;
const titulo = (t) => console.log(`\n${String(++passo).padStart(2, '0')}. ${t}`);
const detalhe = (t) => console.log(`    ${t}`);

async function chamar(metodo, caminho, { token, corpo } = {}) {
  const resposta = await fetch(base() + caminho, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  const dados = await resposta.json().catch(() => ({}));
  return { status: resposta.status, dados };
}

const entrar = async (email) =>
  (await chamar('POST', '/auth/login', { corpo: { email, senha: SENHA } })).dados.token;

const carteira = async (token) => (await chamar('GET', '/carteira', { token })).dados;

const mostrarSaldos = async (tokenA, tokenB) => {
  const [a, b] = await Promise.all([carteira(tokenA), carteira(tokenB)]);
  detalhe(`Camila:  saldo ${a.saldo} · custódia ${a.em_custodia}`);
  detalhe(`Antônio: saldo ${b.saldo} · custódia ${b.em_custodia}`);
};

async function principal() {
  console.log('\n=== Trocaí — uma troca do começo ao fim ===');

  titulo('Camila se cadastra no condomínio');
  const cadastro = await chamar('POST', '/auth/cadastro', {
    corpo: {
      condominio_id: 1, nome: 'Camila Ferreira', email: 'camila@trocai.app',
      senha: SENHA, unidade: '22A'
    }
  });
  detalhe(`situação: ${cadastro.dados.morador.situacao}`);

  titulo('Sem aprovação, o acesso não abre');
  const tentativa = await chamar('POST', '/auth/login', {
    corpo: { email: 'camila@trocai.app', senha: SENHA }
  });
  detalhe(`HTTP ${tentativa.status} — ${tentativa.dados.erro}`);

  titulo('A síndica aprova o cadastro e o bônus de boas-vindas é creditado');
  const sindica = await entrar('sindico@trocai.app');
  const pendentes = await chamar('GET', '/admin/cadastros', { token: sindica });
  const idCamila = pendentes.dados[0].id;
  const aprovacao = await chamar('PATCH', `/admin/cadastros/${idCamila}`, {
    token: sindica, corpo: { aprovado: true }
  });
  detalhe(`saldo inicial: ${aprovacao.dados.saldo_elos} Elos (RN02)`);

  const camila = await entrar('camila@trocai.app');
  const antonio = await entrar('antonio@trocai.app');

  titulo('Camila procura quem conserta eletrônicos no prédio');
  const busca = await chamar('GET', '/habilidades?q=ventilador', { token: camila });
  const achada = busca.dados.resultados[0];
  detalhe(`${achada.titulo} — ${achada.morador_nome}, unidade ${achada.unidade}`);
  detalhe(`custo: ${achada.custo_elos} Elos (${achada.duracao_minutos} min ÷ 30)`);

  titulo('Ela solicita a troca');
  const pedido = await chamar('POST', '/trocas', {
    token: camila,
    corpo: { habilidade_id: achada.id, descricao: 'Ventilador de teto parou de girar.' }
  });
  const trocaId = pedido.dados.id;
  detalhe(`troca ${trocaId} criada com status "${pedido.dados.status}"`);
  await mostrarSaldos(camila, antonio);

  titulo('Antônio aceita: os Elos saem do saldo dela e ficam em custódia (RN06)');
  await chamar('PATCH', `/trocas/${trocaId}/aceitar`, { token: antonio });
  await mostrarSaldos(camila, antonio);

  titulo('Combinam o horário pelo chat da troca');
  await chamar('POST', `/trocas/${trocaId}/mensagens`, {
    token: camila, corpo: { conteudo: 'Posso quinta às 19h, pode ser?' }
  });
  await chamar('POST', `/trocas/${trocaId}/mensagens`, {
    token: antonio, corpo: { conteudo: 'Pode sim. Leva o ventilador no 54B.' }
  });
  const conversa = await chamar('GET', `/trocas/${trocaId}/mensagens`, { token: camila });
  conversa.dados.forEach((m) => detalhe(`${m.autor_nome}: ${m.conteudo}`));

  titulo('Camila confirma — e só isso não transfere nada (RN04)');
  const primeira = await chamar('PATCH', `/trocas/${trocaId}/confirmar`, { token: camila });
  detalhe(`status: ${primeira.dados.status}`);
  await mostrarSaldos(camila, antonio);

  titulo('Antônio confirma: agora a transferência acontece');
  const segunda = await chamar('PATCH', `/trocas/${trocaId}/confirmar`, { token: antonio });
  detalhe(`status: ${segunda.dados.status}`);
  await mostrarSaldos(camila, antonio);

  titulo('Extrato da Camila');
  const extrato = await carteira(camila);
  extrato.extrato.forEach((m) =>
    detalhe(`${m.tipo.padEnd(10)} ${String(m.valor).padStart(3)} Elos  → saldo ${m.saldo_apos}`)
  );

  titulo('Auditoria: o livro-razão bate com o saldo das duas carteiras (RN12)');
  for (const [nome, token] of [['Camila', camila], ['Antônio', antonio]]) {
    const a = await chamar('GET', '/carteira/auditoria', { token });
    detalhe(`${nome}: saldo ${a.dados.saldo_materializado} · livro ${a.dados.saldo_no_livro} · confere: ${a.dados.confere}`);
  }

  titulo('Camila avalia o serviço');
  await chamar('POST', `/trocas/${trocaId}/avaliacao`, {
    token: camila, corpo: { nota: 5, comentario: 'Resolveu em vinte minutos.' }
  });
  const perfil = await chamar('GET', '/moradores/2', { token: camila });
  detalhe(`${perfil.dados.nome} — nota ${perfil.dados.nota_media}, ${perfil.dados.trocas_concluidas} troca(s) concluída(s)`);

  titulo('Total de Elos em circulação no condomínio');
  const total = Object.values(banco.estado.moradores)
    .reduce((s, m) => s + m.saldo_elos + m.elos_custodia, 0);
  detalhe(`${total} Elos — o mesmo de antes da troca: a economia não cria nem destrói crédito`);

  console.log('');
}

principal()
  .catch((erro) => { console.error(erro); process.exitCode = 1; })
  .finally(() => servidor.close());
