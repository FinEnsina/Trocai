-- Esquema do Trocaí — corresponde ao modelo entidade-relacionamento da
-- Entrega 3 (docs/diagramas/mer.png).
--
-- Decisão registrada: o saldo de Elos é materializado em coluna na tabela
-- moradores, e não recalculado a cada leitura, porque o saldo é lido em toda
-- abertura do aplicativo. A consistência é garantida por transação, pelas
-- restrições abaixo e pela auditoria contra movimentacao_elos.

BEGIN;

CREATE TABLE IF NOT EXISTS condominios (
  id              SERIAL PRIMARY KEY,
  nome            VARCHAR(120)  NOT NULL,
  cep             CHAR(8)       NOT NULL,
  logradouro      VARCHAR(160)  NOT NULL,
  numero          VARCHAR(10)   NOT NULL,
  total_unidades  INTEGER       NOT NULL CHECK (total_unidades > 0),
  criado_em       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Papéis: morador comum ou síndico. O síndico é um morador com permissão
-- adicional, não um usuário de outra natureza (decisão da Entrega 1).
DO $$ BEGIN
  CREATE TYPE papel_morador AS ENUM ('morador', 'sindico');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE situacao_cadastro AS ENUM ('pendente', 'aprovado', 'recusado', 'bloqueado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS moradores (
  id               SERIAL PRIMARY KEY,
  condominio_id    INTEGER       NOT NULL REFERENCES condominios (id),
  nome             VARCHAR(120)  NOT NULL,
  email            VARCHAR(160)  NOT NULL UNIQUE,
  senha_hash       VARCHAR(100)  NOT NULL,
  unidade          VARCHAR(10)   NOT NULL,
  telefone         VARCHAR(20),
  papel            papel_morador     NOT NULL DEFAULT 'morador',
  situacao         situacao_cadastro NOT NULL DEFAULT 'pendente',
  saldo_elos       INTEGER       NOT NULL DEFAULT 0,
  elos_custodia    INTEGER       NOT NULL DEFAULT 0,
  nota_media       NUMERIC(3,2),
  criado_em        TIMESTAMPTZ   NOT NULL DEFAULT now(),

  -- RN05: o morador pode ficar devendo até três Elos, nunca mais que isso.
  CONSTRAINT saldo_minimo   CHECK (saldo_elos >= -3),
  -- Nenhuma operação pode deixar a custódia negativa.
  CONSTRAINT custodia_valida CHECK (elos_custodia >= 0),
  CONSTRAINT unidade_unica   UNIQUE (condominio_id, unidade, email)
);

CREATE INDEX IF NOT EXISTS idx_moradores_condominio ON moradores (condominio_id, situacao);

CREATE TABLE IF NOT EXISTS categorias (
  id     SERIAL PRIMARY KEY,
  nome   VARCHAR(60) NOT NULL UNIQUE,
  icone  VARCHAR(40)
);

CREATE TABLE IF NOT EXISTS habilidades (
  id             SERIAL PRIMARY KEY,
  morador_id     INTEGER      NOT NULL REFERENCES moradores (id) ON DELETE CASCADE,
  categoria_id   INTEGER      REFERENCES categorias (id),
  titulo         VARCHAR(80)  NOT NULL,
  descricao      TEXT         NOT NULL,
  custo_elos     INTEGER      NOT NULL CHECK (custo_elos > 0),
  duracao_minutos INTEGER     CHECK (duracao_minutos > 0),
  ativa          BOOLEAN      NOT NULL DEFAULT TRUE,
  criado_em      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Busca por texto dentro do condomínio. O volume de um condomínio não
-- justifica um serviço de busca dedicado (decisão da Entrega 4).
CREATE INDEX IF NOT EXISTS idx_habilidades_busca
  ON habilidades USING GIN (to_tsvector('portuguese', titulo || ' ' || descricao));
CREATE INDEX IF NOT EXISTS idx_habilidades_morador ON habilidades (morador_id, ativa);

CREATE TABLE IF NOT EXISTS necessidades (
  id           SERIAL PRIMARY KEY,
  morador_id   INTEGER      NOT NULL REFERENCES moradores (id) ON DELETE CASCADE,
  categoria_id INTEGER      REFERENCES categorias (id),
  titulo       VARCHAR(80)  NOT NULL,
  descricao    TEXT,
  atendida     BOOLEAN      NOT NULL DEFAULT FALSE,
  criado_em    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TYPE status_troca AS ENUM
  ('pendente', 'aceita', 'concluida', 'cancelada', 'mediacao');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS trocas (
  id                   SERIAL PRIMARY KEY,
  solicitante_id       INTEGER      NOT NULL REFERENCES moradores (id),
  ofertante_id         INTEGER      NOT NULL REFERENCES moradores (id),
  habilidade_id        INTEGER      NOT NULL REFERENCES habilidades (id),
  descricao            TEXT,
  duracao_estimada     INTEGER,
  -- RN03: o custo é congelado no aceite para que o ofertante não possa
  -- alterar o preço depois do combinado.
  custo_elos           INTEGER      NOT NULL CHECK (custo_elos > 0),
  status               status_troca NOT NULL DEFAULT 'pendente',
  conf_solicitante     TIMESTAMPTZ,
  conf_ofertante       TIMESTAMPTZ,
  motivo_cancelamento  TEXT,
  criado_em            TIMESTAMPTZ  NOT NULL DEFAULT now(),
  concluido_em         TIMESTAMPTZ,

  CONSTRAINT partes_distintas CHECK (solicitante_id <> ofertante_id)
);

CREATE INDEX IF NOT EXISTS idx_trocas_solicitante ON trocas (solicitante_id, status);
CREATE INDEX IF NOT EXISTS idx_trocas_ofertante   ON trocas (ofertante_id, status);

DO $$ BEGIN
  CREATE TYPE tipo_movimentacao AS ENUM
  ('bonus', 'custodia', 'devolucao', 'debito', 'credito', 'ajuste');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Livro-razão. Só aceita inserção: não há UPDATE nem DELETE em nenhum ponto
-- do código, e a trigger abaixo impede que isso mude por engano.
CREATE TABLE IF NOT EXISTS movimentacao_elos (
  id           BIGSERIAL PRIMARY KEY,
  troca_id     INTEGER     REFERENCES trocas (id),
  morador_id   INTEGER     NOT NULL REFERENCES moradores (id),
  tipo         tipo_movimentacao NOT NULL,
  valor        INTEGER     NOT NULL CHECK (valor <> 0),
  saldo_apos   INTEGER     NOT NULL,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movimentacao_morador
  ON movimentacao_elos (morador_id, criado_em DESC);

CREATE OR REPLACE FUNCTION impedir_alteracao_livro_razao() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'O livro-razão de Elos é imutável: % não é permitido.', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_livro_razao_imutavel ON movimentacao_elos;
CREATE TRIGGER trg_livro_razao_imutavel
  BEFORE UPDATE OR DELETE ON movimentacao_elos
  FOR EACH ROW EXECUTE FUNCTION impedir_alteracao_livro_razao();

CREATE TABLE IF NOT EXISTS mensagens (
  id          BIGSERIAL PRIMARY KEY,
  troca_id    INTEGER     NOT NULL REFERENCES trocas (id) ON DELETE CASCADE,
  autor_id    INTEGER     NOT NULL REFERENCES moradores (id),
  conteudo    TEXT        NOT NULL,
  lida_em     TIMESTAMPTZ,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_troca ON mensagens (troca_id, criado_em);

CREATE TABLE IF NOT EXISTS avaliacoes (
  id           SERIAL PRIMARY KEY,
  troca_id     INTEGER     NOT NULL REFERENCES trocas (id) ON DELETE CASCADE,
  autor_id     INTEGER     NOT NULL REFERENCES moradores (id),
  avaliado_id  INTEGER     NOT NULL REFERENCES moradores (id),
  nota         SMALLINT    NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario   TEXT,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- RN09: uma avaliação por parte, por troca.
  CONSTRAINT avaliacao_unica UNIQUE (troca_id, autor_id)
);

DO $$ BEGIN
  CREATE TYPE situacao_denuncia AS ENUM ('aberta', 'em_analise', 'resolvida', 'arquivada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS denuncias (
  id            SERIAL PRIMARY KEY,
  denunciante_id INTEGER    NOT NULL REFERENCES moradores (id),
  denunciado_id  INTEGER    NOT NULL REFERENCES moradores (id),
  troca_id       INTEGER    REFERENCES trocas (id),
  motivo         TEXT       NOT NULL,
  situacao       situacao_denuncia NOT NULL DEFAULT 'aberta',
  parecer        TEXT,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RN10: o síndico pode suspender as trocas durante obras ou assembleias.
CREATE TABLE IF NOT EXISTS bloqueios (
  id            SERIAL PRIMARY KEY,
  condominio_id INTEGER     NOT NULL REFERENCES condominios (id),
  sindico_id    INTEGER     NOT NULL REFERENCES moradores (id),
  motivo        TEXT        NOT NULL,
  inicio_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  fim_em        TIMESTAMPTZ,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bloqueios_ativos
  ON bloqueios (condominio_id, inicio_em, fim_em);

COMMIT;
