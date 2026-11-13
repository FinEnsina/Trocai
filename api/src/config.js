// Configuração lida do ambiente. Nenhum segredo fica no repositório:
// o arquivo .env.example mostra os nomes das variáveis, nunca os valores.

function obrigatoria(nome, padraoEmDesenvolvimento) {
  const valor = process.env[nome];
  if (valor) return valor;
  if (process.env.NODE_ENV !== 'production' && padraoEmDesenvolvimento !== undefined) {
    return padraoEmDesenvolvimento;
  }
  throw new Error(`Variável de ambiente ${nome} não definida.`);
}

module.exports = {
  porta: Number(process.env.PORTA || 3000),
  ambiente: process.env.NODE_ENV || 'desenvolvimento',

  banco: {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || 'trocai',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    max: Number(process.env.PGPOOL_MAX || 10)
  },

  jwt: {
    segredo: obrigatoria('JWT_SEGREDO', 'segredo-de-desenvolvimento-nao-use-em-producao'),
    validade: process.env.JWT_VALIDADE || '7d'
  },

  senha: {
    // Custo do bcrypt. Dez rodadas é o equilíbrio usado em produção pequena.
    rodadas: Number(process.env.BCRYPT_RODADAS || 10)
  }
};
