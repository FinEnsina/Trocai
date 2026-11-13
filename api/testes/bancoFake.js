/**
 * Banco em memória que reproduz o comportamento transacional do PostgreSQL:
 * em caso de exceção, o estado volta exatamente ao que era antes do BEGIN.
 * Isso permite testar a reversão (CT04) sem subir um banco real.
 */
function clonar(o) { return JSON.parse(JSON.stringify(o)); }

class BancoFake {
  constructor(estadoInicial = {}) {
    this.estado = {
      moradores: estadoInicial.moradores || {},
      habilidades: estadoInicial.habilidades || {},
      trocas: estadoInicial.trocas || {},
      movimentacoes: estadoInicial.movimentacoes || [],
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

  _tx() {
    const st = this.estado;
    const registrarTrava = (id) => this.travasPedidas.push(id);
    return {
      moradores: {
        async buscar(id) { return st.moradores[id] ? clonar(st.moradores[id]) : null; },
        async buscarParaAtualizar(id) {
          registrarTrava(id);
          return st.moradores[id] ? clonar(st.moradores[id]) : null;
        },
        async atualizarSaldos(id, { saldo_elos, elos_custodia }) {
          if (saldo_elos < -3) throw new Error('saldo_minimo violado');
          if (elos_custodia < 0) throw new Error('custodia_valida violada');
          st.moradores[id].saldo_elos = saldo_elos;
          st.moradores[id].elos_custodia = elos_custodia;
        }
      },
      habilidades: {
        async buscar(id) { return st.habilidades[id] ? clonar(st.habilidades[id]) : null; }
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
        async registrarConfirmacao(id, campo) { st.trocas[id][campo] = '2026-11-08T18:00:00Z'; },
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
        }
      },
      movimentacoes: {
        async registrar(m) { st.movimentacoes.push({ id: st.proximoId++, ...m }); }
      },
      bloqueios: {
        async existeAtivo(condominioId) {
          return st.bloqueios.some(b => b.condominio_id === condominioId && b.ativo);
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
