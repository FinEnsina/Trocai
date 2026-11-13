class ErroDeDominio extends Error {
  constructor(mensagem, codigo) {
    super(mensagem);
    this.name = this.constructor.name;
    this.codigo = codigo;
  }
}

class RegraDeNegocio extends ErroDeDominio {
  constructor(mensagem, codigo = 'REGRA_DE_NEGOCIO') { super(mensagem, codigo); }
}

class NaoAutorizado extends ErroDeDominio {
  constructor(mensagem, codigo = 'NAO_AUTORIZADO') { super(mensagem, codigo); }
}

class NaoEncontrado extends ErroDeDominio {
  constructor(mensagem, codigo = 'NAO_ENCONTRADO') { super(mensagem, codigo); }
}

module.exports = { ErroDeDominio, RegraDeNegocio, NaoAutorizado, NaoEncontrado };
