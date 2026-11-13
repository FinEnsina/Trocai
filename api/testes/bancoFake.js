/**
 * Banco em memória que reproduz o comportamento transacional do PostgreSQL:
 * em caso de exceção, o estado volta exatamente ao que era antes do BEGIN.
 * Isso permite testar a reversão (CT04) sem subir um banco real.
 *
 * Expõe a mesma interface do objeto `Banco` de src/db/pool.js — `transacao()`
 * e `repositorios` —, então tanto os serviços de domínio quanto a aplicação
 * Express inteira funcionam sobre ele sem saber da diferença. É o que permite
 * aos testes de integração exercitar os endpoints de ponta a ponta.
 */
function clonar(o) { return JSON.parse(JSON.stringify(o)); }

class BancoFake {
  constructor(estadoInicial = {}) {
    this.estado = {
      moradores: estadoInicial.moradores || {},
      habilidades: estadoInicial.habilidades || {},
      necessidades: estadoInicial.necessidades || {},
      trocas: estadoInicial.trocas || {},
      movimentacoes: estadoInicial.movimentacoes || [],
      mensagens: estadoInicial.mensagens || [],
      avaliacoes: estadoInicial.avaliacoes || [],
      denuncias: estadoInicial.denuncias || [],
      categorias: estadoInicial.categorias || [
        { id: 1, nome: 'Reparos e manutenção', icone: 'construcao' },
        { id: 2, nome: 'Aulas e reforço escolar', icone: 'livro' },
        { id: 3, nome: 'Tecnologia', icone: 'computador' }
      ],
      bloqueios: estadoInicial.bloqueios || [],
      proximoId: estadoInicial.proximoId || 100
    };
    this.travasPedidas = [];
  }

  async transacao(fn) {
    const antes = clonar(this.estado);
    try {
      const r = await fn(this._tx());
      return r;
    } catch (e) {
      this.estado = antes;   // ROLLBACK
      throw e;
    }
  }

  /** Leitura fora de transação, como o pool real. */
  get repositorios() {
    return this._tx();
  }

  _tx() {
    const st = this.estado;
    const registrarTrava = (id) => this.travasPedidas.push(id);

    const moradoresDoCondominio = (condominioId) =>
      Object.values(st.moradores).filter((m) => m.condominio_id === condominioId);

    const semSenha = (m) => {
      if (!m) return null;
      const copia = clonar(m);
      delete copia.senha_hash;
      return copia;
    };

    return {
      moradores: {
        async buscar(id) { return semSenha(st.moradores[id]); },

        async buscarParaAtualizar(id) {
          registrarTrava(id);
          return semSenha(st.moradores[id]);
        },

        async atualizarSaldos(id, { saldo_elos, elos_custodia }) {
          if (saldo_elos < -3) throw new Error('saldo_minimo violado');
          if (elos_custodia < 0) throw new Error('custodia_valida violada');
          st.moradores[id].saldo_elos = saldo_elos;
          st.moradores[id].elos_custodia = elos_custodia;
        },

        async buscarPorEmailComSenha(email) {
          const alvo = String(email || '').toLowerCase().trim();
          const m = Object.values(st.moradores).find(
            (x) => (x.email || '').toLowerCase() === alvo
          );
          return m ? clonar(m) : null;
        },

        async criar(dados) {
          const id = st.proximoId++;
          st.moradores[id] = {
            id,
            papel: 'morador',
            situacao: 'pendente',
            saldo_elos: 0,
            elos_custodia: 0,
            nota_media: null,
            ...dados,
            email: String(dados.email).toLowerCase().trim()
          };
          return semSenha(st.moradores[id]);
        },

        async definirSituacao(id, situacao) {
          st.moradores[id].situacao = situacao;
          return semSenha(st.moradores[id]);
        },

        async listarPendentes(condominioId) {
          return moradoresDoCondominio(condominioId)
            .filter((m) => m.situacao === 'pendente')
            .map((m) => ({ id: m.id, nome: m.nome, unidade: m.unidade }));
        },

        async perfilPublico(id) {
          const m = st.moradores[id];
          if (!m || m.situacao !== 'aprovado') return null;
          return {
            id: m.id, nome: m.nome, unidade: m.unidade, nota_media: m.nota_media,
            trocas_concluidas: Object.values(st.trocas).filter(
              (t) => t.ofertante_id === id && t.status === 'concluida'
            ).length
          };
        },

        async ranking(condominioId, limite = 10) {
          return moradoresDoCondominio(condominioId)
            .filter((m) => m.situacao === 'aprovado')
            .map((m) => ({
              id: m.id, nome: m.nome, unidade: m.unidade, nota_media: m.nota_media,
              trocas: Object.values(st.trocas).filter(
                (t) => t.ofertante_id === m.id && t.status === 'concluida'
              ).length
            }))
            .sort((a, b) => b.trocas - a.trocas)
            .slice(0, limite);
        },

        async recalcularNotaMedia(id) {
          const notas = st.avaliacoes.filter((a) => a.avaliado_id === id).map((a) => a.nota);
          st.moradores[id].nota_media = notas.length
            ? Number((notas.reduce((s, n) => s + n, 0) / notas.length).toFixed(2))
            : null;
        }
      },

      habilidades: {
        async buscar(id) {
          const h = st.habilidades[id];
          if (!h) return null;
          const dono = st.moradores[h.morador_id] || {};
          return { ...clonar(h), condominio_id: dono.condominio_id, morador_nome: dono.nome };
        },

        async criar(dados) {
          const id = st.proximoId++;
          st.habilidades[id] = { id, ativa: true, ...dados };
          return clonar(st.habilidades[id]);
        },

        async listar({ condominioId, termo, categoriaId, limite = 30, deslocamento = 0 }) {
          const alvo = (termo || '').toLowerCase().trim();
          return Object.values(st.habilidades)
            .filter((h) => {
              const dono = st.moradores[h.morador_id];
              if (!dono || dono.condominio_id !== condominioId) return false;
              if (dono.situacao && dono.situacao !== 'aprovado') return false;
              if (!h.ativa) return false;
              if (categoriaId && h.categoria_id !== Number(categoriaId)) return false;
              if (!alvo) return true;
              return `${h.titulo} ${h.descricao || ''}`.toLowerCase().includes(alvo);
            })
            .map((h) => ({
              ...clonar(h),
              morador_nome: (st.moradores[h.morador_id] || {}).nome,
              unidade: (st.moradores[h.morador_id] || {}).unidade
            }))
            .slice(deslocamento, deslocamento + limite);
        },

        async listarDoMorador(moradorId) {
          return Object.values(st.habilidades)
            .filter((h) => h.morador_id === Number(moradorId))
            .map(clonar);
        },

        async desativar(id, moradorId) {
          const h = st.habilidades[id];
          if (!h || h.morador_id !== Number(moradorId)) return null;
          h.ativa = false;
          return clonar(h);
        },

        async mapaDeTalentos(condominioId) {
          const doCondominio = (lista) => lista.filter((x) => {
            const dono = st.moradores[x.morador_id];
            return dono && dono.condominio_id === condominioId;
          });
          return st.categorias.map((c) => ({
            ...c,
            ofertas: doCondominio(Object.values(st.habilidades))
              .filter((h) => h.categoria_id === c.id && h.ativa).length,
            procuras: doCondominio(Object.values(st.necessidades))
              .filter((n) => n.categoria_id === c.id && !n.atendida).length
          }));
        }
      },

      necessidades: {
        async criar(dados) {
          const id = st.proximoId++;
          st.necessidades[id] = { id, atendida: false, ...dados };
          return clonar(st.necessidades[id]);
        },
        async listar(condominioId) {
          return Object.values(st.necessidades).filter((n) => {
            const dono = st.moradores[n.morador_id];
            return dono && dono.condominio_id === condominioId && !n.atendida;
          }).map(clonar);
        },
        async marcarAtendida(id, moradorId) {
          const n = st.necessidades[id];
          if (!n || n.morador_id !== Number(moradorId)) return null;
          n.atendida = true;
          return clonar(n);
        }
      },

      trocas: {
        async buscar(id) { return st.trocas[id] ? clonar(st.trocas[id]) : null; },

        async buscarParaAtualizar(id) {
          registrarTrava('troca:' + id);
          return st.trocas[id] ? clonar(st.trocas[id]) : null;
        },

        async criar(dados) {
          const id = st.proximoId++;
          st.trocas[id] = { id, conf_solicitante: null, conf_ofertante: null, ...dados };
          return clonar(st.trocas[id]);
        },

        async atualizarStatus(id, status) { st.trocas[id].status = status; },

        async registrarConfirmacao(id, campo) {
          if (!['conf_solicitante', 'conf_ofertante'].includes(campo)) {
            throw new Error(`Campo de confirmação inválido: ${campo}`);
          }
          st.trocas[id][campo] = '2026-11-08T18:00:00Z';
        },

        async concluir(id) {
          st.trocas[id].status = 'concluida';
          st.trocas[id].concluido_em = '2026-11-08T18:00:00Z';
        },

        async cancelar(id, motivo) {
          st.trocas[id].status = 'cancelada';
          st.trocas[id].motivo_cancelamento = motivo;
        },

        async contarConcluidasNoMes(moradorId) {
          return Object.values(st.trocas).filter(
            t => t.solicitante_id === moradorId && t.status === 'concluida'
          ).length;
        },

        async listarDoMorador(moradorId, { papel = 'ambos', status } = {}) {
          const id = Number(moradorId);
          return Object.values(st.trocas).filter((t) => {
            if (status && t.status !== status) return false;
            if (papel === 'solicitante') return t.solicitante_id === id;
            if (papel === 'ofertante') return t.ofertante_id === id;
            return t.solicitante_id === id || t.ofertante_id === id;
          }).map((t) => ({
            ...clonar(t),
            habilidade_titulo: (st.habilidades[t.habilidade_id] || {}).titulo,
            ofertante_nome: (st.moradores[t.ofertante_id] || {}).nome
          }));
        },

        async resumoDoCondominio(condominioId) {
          const doCondominio = Object.values(st.trocas).filter((t) => {
            const s = st.moradores[t.solicitante_id];
            return s && s.condominio_id === condominioId;
          });
          const por = (s) => doCondominio.filter((t) => t.status === s).length;
          return {
            concluidas: por('concluida'),
            pendentes: por('pendente'),
            em_andamento: por('aceita'),
            elos_movimentados: doCondominio
              .filter((t) => t.status === 'concluida')
              .reduce((soma, t) => soma + t.custo_elos, 0)
          };
        }
      },

      movimentacoes: {
        async registrar(m) {
          const linha = { id: st.proximoId++, criado_em: new Date().toISOString(), ...m };
          st.movimentacoes.push(linha);
          return clonar(linha);
        },

        async extrato(moradorId, limite = 50) {
          return st.movimentacoes
            .filter((m) => m.morador_id === Number(moradorId))
            .slice(-limite)
            .reverse()
            .map(clonar);
        },

        /** Mesma conferência do repositório real (RN12). */
        async conferirSaldo(moradorId) {
          const id = Number(moradorId);
          const m = st.moradores[id];
          if (!m) return null;
          const minhas = st.movimentacoes.filter((x) => x.morador_id === id);
          const soma = (filtro, sinal = 1) =>
            minhas.filter(filtro).reduce((s, x) => s + sinal * x.valor, 0);

          const saldo_no_livro = soma((x) => x.tipo !== 'debito');
          const custodia_no_livro =
              soma((x) => x.tipo === 'custodia', -1)
            - soma((x) => x.tipo === 'devolucao')
            - soma((x) => x.tipo === 'debito', -1);

          return {
            saldo_materializado: m.saldo_elos,
            custodia_materializada: m.elos_custodia,
            saldo_no_livro,
            custodia_no_livro,
            confere: m.saldo_elos === saldo_no_livro
                  && m.elos_custodia === custodia_no_livro
          };
        }
      },

      mensagens: {
        async criar({ troca_id, autor_id, conteudo }) {
          const linha = {
            id: st.proximoId++, troca_id, autor_id, conteudo,
            lida_em: null, criado_em: new Date().toISOString()
          };
          st.mensagens.push(linha);
          return clonar(linha);
        },
        async listarDaTroca(trocaId, desdeId = 0) {
          return st.mensagens
            .filter((m) => m.troca_id === Number(trocaId) && m.id > desdeId)
            .map((m) => ({ ...clonar(m), autor_nome: (st.moradores[m.autor_id] || {}).nome }));
        },
        async marcarLidas(trocaId, leitorId) {
          st.mensagens.forEach((m) => {
            if (m.troca_id === Number(trocaId) && m.autor_id !== Number(leitorId)) {
              m.lida_em = new Date().toISOString();
            }
          });
        }
      },

      avaliacoes: {
        async criar(dados) {
          const linha = { id: st.proximoId++, ...dados };
          st.avaliacoes.push(linha);
          return clonar(linha);
        },
        async existe(trocaId, autorId) {
          return st.avaliacoes.some(
            (a) => a.troca_id === Number(trocaId) && a.autor_id === Number(autorId)
          );
        },
        async listarDoMorador(avaliadoId) {
          return st.avaliacoes
            .filter((a) => a.avaliado_id === Number(avaliadoId))
            .map(clonar);
        }
      },

      denuncias: {
        async criar(dados) {
          const linha = { id: st.proximoId++, situacao: 'aberta', ...dados };
          st.denuncias.push(linha);
          return clonar(linha);
        },
        async listarAbertas(condominioId) {
          return st.denuncias.filter((d) => {
            const alvo = st.moradores[d.denunciado_id];
            return alvo && alvo.condominio_id === condominioId
              && ['aberta', 'em_analise'].includes(d.situacao);
          }).map(clonar);
        },
        async decidir(id, { situacao, parecer }) {
          const d = st.denuncias.find((x) => x.id === Number(id));
          if (!d) return null;
          d.situacao = situacao;
          d.parecer = parecer || null;
          return clonar(d);
        }
      },

      categorias: {
        async listar() { return clonar(st.categorias); }
      },

      bloqueios: {
        async existeAtivo(condominioId) {
          return st.bloqueios.some(b => b.condominio_id === condominioId && b.ativo);
        },
        async criar(dados) {
          const linha = { id: st.proximoId++, ativo: true, ...dados };
          st.bloqueios.push(linha);
          return clonar(linha);
        },
        async encerrar(id) {
          const b = st.bloqueios.find((x) => x.id === Number(id));
          if (b) b.ativo = false;
        }
      }
    };
  }
}

/** Cenário-base usado pela maioria dos testes. */
function cenario(ajustes = {}) {
  return new BancoFake({
    moradores: {
      1: { id: 1, condominio_id: 1, nome: 'Camila', saldo_elos: 5, elos_custodia: 0 },
      2: { id: 2, condominio_id: 1, nome: 'Antônio', saldo_elos: 2, elos_custodia: 0 },
      3: { id: 3, condominio_id: 2, nome: 'Vizinho de outro prédio', saldo_elos: 5, elos_custodia: 0 },
      ...(ajustes.moradores || {})
    },
    habilidades: {
      10: { id: 10, morador_id: 2, custo_elos: 2, ativa: true, titulo: 'Conserto de eletrônicos' },
      11: { id: 11, morador_id: 2, custo_elos: 2, ativa: false, titulo: 'Habilidade desativada' },
      12: { id: 12, morador_id: 3, custo_elos: 2, ativa: true, titulo: 'Habilidade de outro condomínio' },
      ...(ajustes.habilidades || {})
    },
    trocas: ajustes.trocas || {},
    bloqueios: ajustes.bloqueios || [],
    proximoId: 100
  });
}

module.exports = { BancoFake, cenario };
