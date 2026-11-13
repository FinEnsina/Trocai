-- Dados mínimos para subir o ambiente de desenvolvimento.
-- As senhas dos moradores de exemplo são todas "trocai123" (hash bcrypt).

BEGIN;

INSERT INTO categorias (nome, icone) VALUES
  ('Reparos e manutenção', 'construcao'),
  ('Aulas e reforço escolar', 'livro'),
  ('Tecnologia', 'computador'),
  ('Cuidados com animais', 'pata'),
  ('Culinária', 'panela'),
  ('Beleza e bem-estar', 'tesoura'),
  ('Transporte e compras', 'sacola'),
  ('Idiomas', 'globo')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO condominios (id, nome, cep, logradouro, numero, total_unidades)
VALUES (1, 'Residencial Jardim Osasco', '06010000', 'Rua Antônio Agu', '1200', 96)
ON CONFLICT (id) DO NOTHING;

-- hash de "trocai123"
INSERT INTO moradores
  (id, condominio_id, nome, email, senha_hash, unidade, papel, situacao, saldo_elos)
VALUES
  (1, 1, 'Síndica Helena Prado', 'sindico@trocai.app',
   '$2b$10$DkiMWaw/0w8jmVZ.ATDmgui3X2X6aiWXbJ8vQnmlEU12bRYK1WjSO',
   '101', 'sindico', 'aprovado', 3),
  (2, 1, 'Camila Ferreira', 'camila@trocai.app',
   '$2b$10$DkiMWaw/0w8jmVZ.ATDmgui3X2X6aiWXbJ8vQnmlEU12bRYK1WjSO',
   '22A', 'morador', 'aprovado', 14),
  (3, 1, 'Antônio Barros', 'antonio@trocai.app',
   '$2b$10$DkiMWaw/0w8jmVZ.ATDmgui3X2X6aiWXbJ8vQnmlEU12bRYK1WjSO',
   '54B', 'morador', 'aprovado', 9),
  (4, 1, 'Rita Nogueira', 'rita@trocai.app',
   '$2b$10$DkiMWaw/0w8jmVZ.ATDmgui3X2X6aiWXbJ8vQnmlEU12bRYK1WjSO',
   '73C', 'morador', 'aprovado', 6)
ON CONFLICT (id) DO NOTHING;

SELECT setval('moradores_id_seq', (SELECT MAX(id) FROM moradores));

INSERT INTO habilidades (morador_id, categoria_id, titulo, descricao, custo_elos, duracao_minutos)
VALUES
  (3, 3, 'Conserto de eletrônicos pequenos',
   'Ventilador, liquidificador, rádio e afins. Técnico em eletrônica aposentado.', 2, 60),
  (3, 1, 'Troca de tomada e instalação de luminária',
   'Serviço elétrico simples dentro do apartamento.', 1, 30),
  (2, 2, 'Reforço de matemática do ensino fundamental',
   'Atendimento individual no salão de festas, com material impresso.', 2, 60),
  (4, 5, 'Bolo caseiro para aniversário',
   'Massa simples com cobertura. Encomenda com três dias de antecedência.', 3, 90),
  (4, 4, 'Passeio com cachorro de porte pequeno',
   'Volta no quarteirão, de manhã ou no fim da tarde.', 1, 30)
ON CONFLICT DO NOTHING;

INSERT INTO necessidades (morador_id, categoria_id, titulo, descricao)
VALUES
  (2, 1, 'Alguém para olhar um vazamento na pia', 'Pinga embaixo do armário há dois dias.'),
  (3, 3, 'Ajuda para configurar celular novo', 'Passar fotos e contatos do aparelho antigo.')
ON CONFLICT DO NOTHING;

COMMIT;
