INSERT INTO usuarios (nome, cpf, login, senha_hash, perfil, crm, coren) VALUES
('Carla Recepção', '11122233344', 'recepcao', crypt('Sispront@2026', gen_salt('bf', 10)), 'RECEPCIONISTA', NULL, NULL),
('Bruno Enfermeiro', '22233344455', 'enfermeiro', crypt('Sispront@2026', gen_salt('bf', 10)), 'ENFERMEIRO_TRIAGEM', NULL, 'COREN-BA-12345'),
('Dr. Carlos Plantonista', '33344455566', 'medico', crypt('Sispront@2026', gen_salt('bf', 10)), 'MEDICO_PLANTONISTA', 'CRM-BA-99887', NULL),
('Helena Gestora', '44455566677', 'gestor', crypt('Sispront@2026', gen_salt('bf', 10)), 'GESTOR_LEITOS', NULL, 'COREN-BA-54321'),
('Marcos Governança', '55566677788', 'limpeza', crypt('Sispront@2026', gen_salt('bf', 10)), 'EQUIPE_HIGIENIZACAO', NULL, NULL);

INSERT INTO catalogo_medicamentos (principio_ativo, nome_comercial, concentracao, forma_farmaceutica) VALUES
('Dipirona Sódica', 'Novalgina', '500mg/mL', 'Solução Injetável'),
('Amoxicilina + Clavulanato', 'Clavulin', '875mg + 125mg', 'Comprimido Revestido'),
('Ondansetrona', 'Vonau', '4mg', 'Comprimido Orodispersível'),
('Enoxaparina Sódica', 'Clexane', '40mg/0,4mL', 'Solução Injetável');

INSERT INTO leitos (numero, ala_setor, especialidade, sexo_compativel, status, qr_code_hash) VALUES
('101-A', 'Ala Sul', 'Clínica Médica', 'M', 'LIVRE', 'LEITO-QR-101A'),
('102-B', 'Ala Sul', 'Clínica Médica', 'F', 'LIVRE', 'LEITO-QR-102B'),
('201-UTI', 'Bloco Crítico', 'UTI Geral', 'A', 'AGUARDANDO_LIMPEZA', 'LEITO-QR-201UTI'),
('202-UTI', 'Bloco Crítico', 'UTI Geral', 'A', 'MANUTENCAO', 'LEITO-QR-202UTI');

UPDATE leitos SET motivo_manutencao = 'Troca de régua de gases medicinais' WHERE numero = '202-UTI';
