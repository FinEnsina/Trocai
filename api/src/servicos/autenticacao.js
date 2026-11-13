const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { RegraDeNegocio, NaoAutorizado } = require('../erros');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Cadastro e login (UC01).
 *
 * O cadastro nasce pendente: quem libera o acesso é o síndico, depois de
 * conferir que a pessoa mora mesmo na unidade informada. É essa conferência
 * humana que sustenta a confiança do resto do aplicativo — sem ela, qualquer
 * pessoa de fora entraria na rede do condomínio.
 */
class AutenticacaoService {
  constructor(db) {
    this.db = db;
  }

  static validarSenha(senha) {
    if (typeof senha !== 'string' || senha.length < 8) {
      throw new RegraDeNegocio('A senha precisa ter ao menos 8 caracteres.');
    }
    if (!/[a-zA-Z]/.test(senha) || !/[0-9]/.test(senha)) {
      throw new RegraDeNegocio('A senha precisa misturar letras e números.');
    }
  }

  async cadastrar({ condominioId, nome, email, senha, unidade, telefone }) {
    if (!nome || nome.trim().length < 3) {
      throw new RegraDeNegocio('Informe o nome completo.');
    }
    if (!EMAIL.test(String(email || ''))) {
      throw new RegraDeNegocio('E-mail inválido.');
    }
    if (!unidade || !String(unidade).trim()) {
      throw new RegraDeNegocio('Informe o número da sua unidade.');
    }
    AutenticacaoService.validarSenha(senha);

    const senha_hash = await bcrypt.hash(senha, config.senha.rodadas);

    return this.db.transacao(async (tx) => {
      const existente = await tx.moradores.buscarPorEmailComSenha(email);
      if (existente) {
        throw new RegraDeNegocio('Já existe uma conta com este e-mail.', 'EMAIL_EM_USO');
      }
      const morador = await tx.moradores.criar({
        condominio_id: condominioId,
        nome: nome.trim(),
        email,
        senha_hash,
        unidade: String(unidade).trim(),
        telefone
      });
      return {
        morador,
        aviso: 'Cadastro enviado. O síndico precisa aprovar antes do primeiro acesso.'
      };
    });
  }

  async entrar({ email, senha }) {
    const morador = await this.db.repositorios.moradores.buscarPorEmailComSenha(email);

    // A mesma mensagem para e-mail inexistente e senha errada: diferenciar as
    // duas permitiria descobrir quem mora no prédio testando endereços.
    const generico = 'E-mail ou senha incorretos.';
    if (!morador) throw new NaoAutorizado(generico);

    const confere = await bcrypt.compare(String(senha || ''), morador.senha_hash);
    if (!confere) throw new NaoAutorizado(generico);

    if (morador.situacao === 'pendente') {
      throw new NaoAutorizado(
        'Seu cadastro ainda está aguardando aprovação do síndico.', 'CADASTRO_PENDENTE'
      );
    }
    if (morador.situacao !== 'aprovado') {
      throw new NaoAutorizado('Este acesso está suspenso.', 'ACESSO_SUSPENSO');
    }

    delete morador.senha_hash;
    return { token: AutenticacaoService.gerarToken(morador), morador };
  }

  static gerarToken(morador) {
    return jwt.sign(
      {
        sub: morador.id,
        papel: morador.papel,
        condominio: morador.condominio_id
      },
      config.jwt.segredo,
      { expiresIn: config.jwt.validade }
    );
  }

  static lerToken(token) {
    try {
      return jwt.verify(token, config.jwt.segredo);
    } catch (erro) {
      throw new NaoAutorizado('Sessão expirada. Entre novamente.', 'TOKEN_INVALIDO');
    }
  }
}

module.exports = { AutenticacaoService };
