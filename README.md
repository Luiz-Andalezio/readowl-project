# 🦉 Readowl (Frontend)

-----

Projeto web de uma plataforma de publicação e leitura de livros, focado em fomentar a literatura amadora no Brasil e aproximar leitores de escritores iniciantes.  
Desenvolvido utilizando **React**, **Vite** e **Tailwind CSS**.

-----

## 📋 Sobre o Projeto

O **Readowl** nasce da necessidade de criar um espaço para acolher escritores iniciantes e fortalecer a cultura literária no Brasil.  
A plataforma busca solucionar problemas comuns em outros sistemas, como a divulgação ineficiente e interfaces confusas, oferecendo um ambiente confiável para autores publicarem suas obras gratuitamente e receberem feedback.

### 👥 Equipe do Projeto

| Nome | Função |
|---|---|
| Alexandre Monteiro Londe | Desenvolvedor |
| Gabriel Lucas Silva Seabra | Desenvolvedor |
| Jussie Lopes da Silva | Desenvolvedor |
| Luiz Alberto Cury Andalécio | Desenvolvedor |
| Vitor Gabriel Resende Lopes Oliveira | Desenvolvedor |

*Tabela adaptada do documento "PP - LabESOF"*

### 🎯 Funcionalidades Principais

- Cadastro e login de usuários com autenticação segura e recuperação de senha.
- Criação, visualização, edição e exclusão de livros, volumes e capítulos.
- Sistema de busca avançada e filtros por gênero, popularidade e data.
- Biblioteca pessoal para favoritar obras e receber notificações.
- Interação através de avaliações, curtidas e comentários em livros e capítulos.
- Painel de administração para gerenciamento de usuários e moderação de conteúdo.

### 🛠️ Tecnologias Utilizadas

- **Interface e Estrutura**:
    - Next.js (React + roteamento nativo)
    - TypeScript
- **Estilização**:
    - Tailwind CSS
- **Gerenciamento de Dados e Formulários**:
    - TanStack Query
    - React Hook Form
- **Editor de Texto**:
    - TipTap
- **Ambiente**:
    - Git
    - npm
    - VS Code

### 📁 Estrutura do Projeto (Sugestão)

- `public/` – Imagens, fontes e arquivos estáticos.
- `src/` – Código-fonte da aplicação.
    - `app/` – Rotas e páginas do Next.js.
    - `assets/` – Arquivos de mídia e estilos globais.
    - `components/` – Componentes React reutilizáveis.
    - `hooks/` – Hooks personalizados.
    - `services/` – Lógica de comunicação com a API.
    - `styles/` – CSS das páginas da aplicação.
    - `utils/` – Funções utilitárias.

-----

## 📓 Padrão de Commits

Este repositório adota uma variação do padrão [Conventional Commits](https://www.conventionalcommits.org/), adaptada para integração com o Jira. Essa abordagem facilita a rastreabilidade das tarefas, mantém o histórico de commits claro e organizado, e contribui para a automação de versões e geração de changelogs.

### ✔️ Formato

```bash
<ID da task no Jira> <tipo>(escopo):<ENTER>
<mensagem breve sobre o que o commit faz>
```

### 📍 O que é o "tipo"?

    * `feat`: Nova funcionalidade
    * `fix`: Correção de bugs
    * `docs`: Alterações na documentação
    * `style`: Ajustes de estilização (css, cores, imagens, etc.)
    * `refactor`: Refatoração de código sem mudança de comportamento
    * `perf`: Melhorias de performance
    * `test`: Criação ou modificação de testes
    * `build`: Mudanças que afetam o build (dependências, scripts)
    * `ci`: Configurações de integração contínua

### 📍 O que é o "escopo"?

Define o título do commit referente à parte do projeto afetada, como um módulo (`criptografia`), uma página (`login-page`), ou uma feature (`carrossel`).

### 📝 Exemplo

```bash
git commit -am "RO-25 refactor(criptografia):
> Aprimora a indentação."

git commit -am "RO-12 fix(login-page):
> Corrige bug de login nulo."

git commit -am "RO-47 feat(carrossel):
> Implementa o carrossel na página inicial."
```

-----

## 🪢 Padrão de Branches

Este documento descreve o padrão de versionamento e a organização das branches do projeto Readowl, utilizando Git em conjunto com o Jira para um fluxo de trabalho mais organizado e rastreável.

## Índice

1.  [Integração com o Jira](https://www.google.com/search?q=%231-integra%C3%A7%C3%A3o-com-o-jira)
2.  [Padrão para Nomenclatura de Branches](https://www.google.com/search?q=%232-padr%C3%A3o-para-nomenclatura-de-branches)
3.  [Branches Locais vs. Remotas (Origin)](https://www.google.com/search?q=%233-branches-locais-vs-remotas-origin)
4.  [Fluxo de Desenvolvimento](https://www.google.com/search?q=%234-fluxo-de-desenvolvimento)
5.  [Padrão de Commits](https://www.google.com/search?q=%235-padr%C3%A3o-de-commits)
6.  [Processo de Pull Request (PR)](https://www.google.com/search?q=%236-processo-de-pull-request-pr)

-----

### 1. Integração com o Jira

Para garantir que nosso trabalho no código-fonte esteja sempre conectado às tarefas planejadas no Jira, utilizamos um sistema de rastreamento simples. Cada tarefa no Jira possui um identificador único (ID), como `RO-17`, `RO-25`, etc.

É **obrigatório** que cada branch e commit relacionado a uma tarefa comece com o ID correspondente, pois isso permite que o Jira identifique e vincule automaticamente as branches e os commits à tarefa, facilitando o acompanhamento do progresso e a revisão do trabalho realizado.

### 2. Padrão para Nomenclatura de Branches

Toda nova branch criada para o desenvolvimento de uma tarefa deve seguir estritamente o padrão abaixo para garantir consistência e clareza sobre o propósito de cada branch.

**Padrão:** `<ID da task>-<nome descritivo em minusculo>`

O nome descritivo deve ser curto e usar hífens para separar as palavras.

**Exemplos de nomes de branch:**

- `RO-17-landing-page`
- `RO-12-configuracao-de-backend`
- `RO-25-formulario-de-login`

**Comando para criar a branch:**

Para criar uma nova branch a partir da `dev` e já mudar para ela, utilize o comando:

```bash
git checkout -b RO-17-landing-page
```

### 3. Branches Locais vs. Remotas (Origin)

É fundamental entender a diferença entre uma branch em sua máquina (local) e a branch no repositório remoto (origin).

- **Branch Local:** É uma versão do repositório que reside exclusivamente no seu computador. É nela que você trabalha, desenvolve o código, testa e faz commits.
- **Branch Remota (origin):** É a versão da branch que está armazenada no servidor central (como GitHub, GitLab, etc.). Ela serve como um ponto de sincronização para todos os membros da equipe.

Embora a sua branch local e a branch remota correspondente tenham o **mesmo nome** (ex: `RO-17-landing-page`), elas são entidades diferentes. Você desenvolve na sua branch local, e quando deseja compartilhar seu progresso ou fazer um backup, você envia seus commits para a branch remota com o comando `git push`.

**Fluxo básico:**

1. Você cria a branch `RO-17-landing-page` **localmente**.
2. Você desenvolve e faz seus commits nessa branch local.
3. Você envia suas alterações para o servidor remoto com `git push -u origin RO-17-landing-page`.

> OBS: O parâmetro `-u` (ou `--set-upstream`) faz com que sua branch local seja vinculada à branch remota recém-criada, facilitando futuros comandos `git push` e `git pull` sem precisar especificar o nome da branch.

### 4. Fluxo de Desenvolvimento

1. **Sincronize sua branch `dev` local:**
        ```bash
        git checkout dev
        git pull origin dev
        ```
2. **Crie a branch da sua tarefa:**
        Crie sua branch local a partir da `dev` atualizada, seguindo o padrão de nomenclatura.
        ```bash
        git checkout -b RO-25-formulario-de-login
        ```
3. **Desenvolva e faça commits:**
        Trabalhe no código e faça commits claros e concisos. Lembre-se de seguir o padrão de commits.
        ```bash
        git add .
        git commit -m "RO-25 feat(login-form):
        > Adiciona validação de campos"
        ```
4. **Envie seu trabalho para o repositório remoto:**
        Faça o push dos seus commits para a branch remota de mesmo nome.
        ```bash
        git push origin -u RO-25-formulario-de-login
        ```

### 5. Mantenha o Padrão de Commits

[Consulte o padrão de commits detalhado acima](#padrão-de-commits) para garantir que suas mensagens estejam claras, rastreáveis e referenciem sempre o ID da task correspondente.

### 6. Processo de Pull Request (PR)

O Pull Request (PR) é o mecanismo para revisar e integrar o código de uma branch em outra.

- **Ao finalizar uma tarefa:**
        Quando o desenvolvimento na branch da sua tarefa (ex: `RO-25-formulario-de-login`) estiver concluído e testado, você deve abrir um **Pull Request** da sua branch para a branch `dev`.
        Isso serve para:
        1. Permitir a revisão do código (Code Review) por outros membros da equipe.
        2. Manter um registro histórico de todas as alterações integradas.
        3. Disponibilizar o código da tarefa na `dev` para que outros desenvolvedores possam acessá-lo, caso necessário.

- **Ao final de uma Sprint:**
        A branch `main` é a nossa branch de produção e deve conter apenas código estável e testado. Portanto, as atualizações na `main` ocorrem apenas no final de cada ciclo de desenvolvimento (Sprint).
        Ao final da sprint, um **Pull Request** será aberto da branch `dev` para a branch `main`, contendo todas as funcionalidades e correções desenvolvidas durante o ciclo.

-----
