# 🏥 SISPRONT — Sistema de Gestão Hospitalar, Triagem e Prontuário Eletrônico

O **SISPRONT** é uma plataforma web e mobile integrada voltada para hospitais, Unidades de Pronto Atendimento (UPAs) e equipes multidisciplinares de saúde. O sistema gerencia todo o fluxo emergencial e de internação: desde a recepção com cadastro único por CPF, passando pela triagem clínica automatizada pelo **Protocolo de Manchester**, organização reativa da fila médica em tempo real, registro imutável no **Prontuário Eletrônico do Paciente (PEP)**, prescrição eletrônica de medicamentos e governança visual da ocupação de leitos.

---

## 🎯 Diferenciais e Solução de Gargalos Regionais

Além do fluxo hospitalar clássico, o SISPRONT foi projetado para solucionar gargalos críticos da saúde pública e regional:

- **Governança Móvel de Leitos via QR Code (Fim dos "Leitos Fantasmas"):** Interface mobile dedicada para a equipe de higienização realizar o duplo escaneamento do QR Code do leito (1º scan inicia a limpeza; 2º scan libera o leito para `"Livre"` em tempo real no painel central).
- **Segurança no Tempo de Espera (Alertas de Retriagem):** Monitoramento automático contínuo dos tempos limites do Protocolo de Manchester, disparando alertas visuais e sonoros via WebSocket caso um paciente exceda o tempo máximo na fila.
- **Imutabilidade e Conformidade com a LGPD:** Prontuário eletrônico versionado e bloqueado contra alterações retroativas no banco de dados, combinado com criptografia **AES-256** para dados sensíveis e controle estrito de sessão e bloqueio de conta.
- **Interoperabilidade e Resiliência Operacional:** Arquitetura preparada para integração com a Rede Nacional de Dados em Saúde (**RNDS/SUS**) via padrão **HL7 FHIR** e operação resiliente _Offline-First_.

---

## Acompanhamento (Trello)

Quadro com as user stories organizadas em A fazer, Fazendo e Feito:

![Quadro do Trello](docs/img/trello-quadro.png)

## 📂 Estrutura do Repositório

O repositório está organizado no formato _monorepo_ contendo o backend, o frontend e os artefatos de documentação e diagramas UML:

```text
sispront/
├── docs/
│   └── img/                   # Diagramas UML (Casos de Uso, Contexto, Classes, Atividades, Sequência e Estados)
├── sispront-api/              # Backend REST + WebSockets em Java 17 e Spring Boot 3
│   ├── src/main/java/         # Código-fonte (Controllers, Entities, Repositories, Security JWT, Utils)
│   ├── src/main/resources/    # Configurações (application.yml) e Migrations SQL (Flyway V1 e V2)
│   └── pom.xml                # Manifesto de dependências Maven
├── sispront-frontend/         # Aplicação Web/Mobile em React, TypeScript, Vite e Tailwind CSS
│   ├── public/                # Manifesto PWA e alertas sonoros
│   ├── src/                   # Telas por perfil (Login, Recepção, Triagem, PEP Médico e Mapa de Leitos)
│   └── package.json           # Dependências do ecossistema Frontend
└── README.md                  # Documentação principal do projeto
```

---

## 🛠️ Tecnologias Utilizadas (Tech Stack)

### Backend (`sispront-api`)

- **Linguagem:** Java 17 (OpenJDK 17)
- **Framework:** Spring Boot 3.3.x
  - **Spring Web:** APIs RESTful padronizadas.
  - **Spring Data JPA / Hibernate 6:** Persistência relacional com suporte nativo a `ENUM`, `ARRAY` e `JSONB` do PostgreSQL.
  - **Spring Security 6 + JWT (`jjwt` 0.12.6):** Autenticação _stateless_, controle de acesso baseado em perfis (RBAC), bloqueio de conta por tentativas inválidas e expiração por inatividade.
  - **Spring WebSocket (STOMP + SockJS):** Atualização reativa em tempo real da fila de atendimento e do mapa de leitos.
  - **Spring Validation (Bean Validation):** Validação estrita de payloads e faixas fisiológicas.
- **Criptografia:** AES-256 via `AttributeConverter` do JPA e extensão `pgcrypto` (LGPD).
- **Banco de Dados e Versionamento:** PostgreSQL 16 + Flyway Migration.
- **Produtividade e Build:** Lombok + Apache Maven (`mvnw`).

### Frontend (`sispront-frontend`)

- **Core:** React 18 + TypeScript + Vite
- **Estilização:** Tailwind CSS + Lucide React (Ícones clínicos e operacionais)
- **Gerenciamento de Estado e Rotas:** Zustand (com persistência e monitor de inatividade) + React Router DOM
- **Comunicação API e Tempo Real:** Axios (com _interceptors_ JWT) + `@stomp/stompjs` & `sockjs-client`

---

## 📋 Requisitos Atendidos pela Arquitetura

### Requisitos Funcionais (RF)

- **RF01 — Cadastrar Paciente:** Validação matemática de CPF e carregamento/atualização automática de cadastro pré-existente sem duplicação.
- **RF02 — Registrar Triagem e Sinais Vitais:** Validação de limites fisiológicos estritos ($\text{Saturação de O}_2$: $0-100\%$, $\text{Frequência Cardíaca}$: $20-250\text{ bpm}$, $\text{Temperatura}$: $30-45^\circ\text{C}$).
- **RF03 — Classificar Risco (Protocolo de Manchester):** Sugestão automática de cor (**Vermelho**, **Laranja**, **Amarelo**, **Verde** e **Azul**), exigindo justificativa obrigatória em caso de sobreposição manual pelo enfermeiro.
- **RF04 — Organizar Fila de Atendimento Médico:** Ordenação reativa via WebSockets por prioridade de risco e tempo de espera.
- **RF05 — Registrar Atendimento no PEP:** Registro de anamnese, exame físico, CID-10 e evolução clínica em histórico imutável e versionado.
- **RF06 — Prescrever Medicamentos:** Emissão de prescrições com busca _autocomplete_ no catálogo oficial do hospital (exigindo dosagem, via e intervalo).
- **RF07 — Consultar Histórico Clínico:** Busca de atendimentos anteriores por CPF ou número de prontuário.
- **RF08 — Mapear e Gerenciar Status de Leitos:** Painel em tempo real com cores dinâmicas: **Livre (Verde)**, **Ocupado (Vermelho)**, **Higienização (Amarelo)** e **Manutenção (Cinza)**.
- **RF09 — Solicitar Reserva e Alocação de Leito:** Listagem exclusiva de leitos disponíveis compatíveis com a especialidade e o sexo do paciente.
- **RF10 — Registrar Alta Hospitalar e Liberação de Leito:** Alta condicionada ao preenchimento obrigatório do sumário de alta, alterando o leito automaticamente para `"Higienização"`.
- **RF11 — Automação da Higienização via QR Code Mobile:** Duplo escaneamento via app mobile pela equipe de limpeza (`1º scan` $\rightarrow$ `"Em Higienização"`; `2º scan` $\rightarrow$ `"Livre"`).
- **RF12 — Alerta de Retriagem por Tempo Limite:** Monitoramento contínuo em _background_ (`@Scheduled`) com disparo de alertas visuais e sonoros ao exceder o tempo estipulado pelo Protocolo de Manchester.
- **RF13 — Interoperabilidade RNDS (HL7 FHIR):** Estrutura de integração para consulta de histórico unificado via CPF.

### Requisitos Não Funcionais (RNF)

- **RNF01 (Desempenho no PEP):** Índices compostos e GIN no PostgreSQL para renderização do histórico em $< 1,5\text{s}$.
- **RNF02 (Concorrência):** Pool HikariCP dimensionado para suportar $250+$ conexões simultâneas com tempo de resposta $< 2,0\text{s}$.
- **RNF03 (Autenticação e Segurança):** Senhas fortes (mín. 8 caracteres, maiúscula, número e símbolo), bloqueio de 15 minutos após 3 falhas consecutivas e encerramento de sessão após 10 minutos de inatividade.
- **RNF04 (LGPD e Criptografia):** Dados sensíveis criptografados em repouso com AES-256 e tráfego via HTTPS/TLS 1.3.

---

## 🚀 Passo a Passo: Como Clonar e Executar o Projeto

### Pré-requisitos

Certifique-se de ter instalado em sua máquina:

1. **Git**
2. **Docker** (para subir o banco de dados PostgreSQL 16 rapidamente)
3. **Java JDK 17** (importante: o projeto utiliza Java 17 como _target_)
4. **Node.js 18+** e **pnpm** (ou `npm`)

---

### 1. Clonar o Repositório

```bash
git clone https://github.com/SEU-USUARIO/sispront.git
cd sispront
```

---

### 2. Subir o Banco de Dados PostgreSQL (Docker)

Execute o comando abaixo para criar e iniciar o container do PostgreSQL 16 na porta `5432`:

```bash
docker run --name sispront-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=sispront_db \
  -p 5432:5432 \
  -d postgres:16-alpine
```

> **Nota:** Não é necessário rodar scripts SQL manualmente. Ao iniciar a API no próximo passo, o **Flyway** executará automaticamente as migrações `V1__create_sispront_schema.sql` (criação de tabelas, enums, índices e triggers) e `V2__seed_initial_data.sql` (usuários iniciais, catálogo de medicamentos e mapa de leitos).

---

### 3. Executar o Backend (`sispront-api`)

Abra um terminal na pasta `sispront-api`, certifique-se de que o **JDK 17** está ativo e inicie o servidor Spring Boot:

```bash
cd sispront-api

# Permissão de execução para o Maven Wrapper
chmod +x mvnw

# (Opcional no Arch Linux / ambientes com múltiplos JDKs) Garantir o uso do Java 17:
# export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
# export PATH=$JAVA_HOME/bin:$PATH

# Compilar e iniciar a API na porta 8080
./mvnw clean spring-boot:run
```

A API estará disponível em `http://localhost:8080/api/v1` e o broker WebSocket em `http://localhost:8080/ws`.

---

### 4. Executar o Frontend (`sispront-frontend`)

Abra um **novo terminal**, acesse a pasta `sispront-frontend`, instale os pacotes e inicie o servidor Vite:

```bash
cd sispront-frontend

# Instalar dependências
pnpm install
# (ou: npm install)

# Iniciar servidor de desenvolvimento
pnpm dev
# (ou: npm run dev)
```

Acesse a aplicação no navegador em: **`http://localhost:5173`**

---

## 🔐 Credenciais de Acesso para Testes (Seed Inicial)

A migração `V2` já cadastra um usuário para cada perfil do sistema. A senha padrão de todos os usuários abaixo é **`Sispront@2026`**:

| Perfil (Stakeholder)         | Login        | Senha           | Módulo Principal                                                       |
| :--------------------------- | :----------- | :-------------- | :--------------------------------------------------------------------- |
| **Recepcionista**            | `recepcao`   | `Sispront@2026` | Recepção, Busca por CPF e Abertura de Boletim (`RF01`)                 |
| **Enfermeiro(a) de Triagem** | `enfermeiro` | `Sispront@2026` | Sinais Vitais e Classificação de Manchester (`RF02`, `RF03`)           |
| **Médico(a) Plantonista**    | `medico`     | `Sispront@2026` | Fila Priorizada, PEP, Prescrições, Internação e Alta (`RF04` a `RF10`) |
| **Gestor(a) de Leitos**      | `gestor`     | `Sispront@2026` | Mapa Geral de Leitos e Alocação (`RF08`, `RF09`)                       |
| **Equipe de Higienização**   | `limpeza`    | `Sispront@2026` | Leitura de QR Code Mobile para Limpeza de Leitos (`RF11`)              |

---

## 🧪 Roteiro Rápido de Validação Ponta a Ponta

1. **Bloqueio de Segurança (`RNF03`):** Na tela de login, erre a senha 3 vezes seguidas com qualquer usuário e observe o bloqueio automático de 15 minutos (`HTTP 423 Locked`).
2. **Recepção (`RF01`):** Entre com `recepcao` / `Sispront@2026`, consulte um CPF válido (ex: `52998224725`), salve o cadastro do paciente (Sexo: `M`) e clique em **Disponibilizar para Triagem**. Copie o `UUID` do Boletim gerado.
3. **Triagem de Manchester (`RF02`, `RF03`):** Acesse a tela de **Triagem**, cole o `UUID` do Boletim, informe sinais vitais dentro dos limites fisiológicos, clique em **Calcular Risco Manchester** e teste a sobreposição manual de cor informando uma justificativa obrigatória.
4. **Atendimento no PEP, Prescrição e Internação (`RF04` a `RF09`):** Acesse **Fila & PEP Médico**, chame o paciente do topo da fila, registre a evolução clínica com desfecho **Solicitar Internação em Leito**, prescreva um medicamento usando o _autocomplete_ (ex: `Dipirona`) e aloque o paciente no leito livre compatível (`101-A`).
5. **Alta e Liberação via QR Code (`RF10`, `RF11`):** Emita uma nova versão no PEP com desfecho **Alta Hospitalar** preenchendo o sumário de alta obrigatório (o leito `101-A` irá para `AGUARDANDO_LIMPEZA`). Em seguida, no **Mapa de Leitos**, realize o **1º Scan** e o **2º Scan** do QR Code (`LEITO-QR-101A`) para ver o leito retornar para **Livre (Verde)** em tempo real.

---

## 👨‍🎓 Contexto Acadêmico

- **Autor / Cliente:** Daniel Guilherme Nascimento Deveza (`daniel.deveza@ucsal.edu.br`)
- **Engenheiros de Software:** Leandro Garcia Magalhães Cerqueira & Caio Figueredo Amorim
- **Orientador:** Prof. Elton Figueiredo
- **Curso:** Análise e Desenvolvimento de Sistemas — Escola de Tecnologias
- **Instituição:** Universidade Católica do Salvador (UCSAL) — Salvador/BA, Brasil (2026)
