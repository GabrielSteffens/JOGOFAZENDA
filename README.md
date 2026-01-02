# JOGOADFAZENDA

Um jogo de fazenda simples desenvolvido com Vite (Web) e Flutter (Mobile), incluindo scripts utilitários em Python.

## Estrutura do Projeto

- **/** (Raiz): Código fonte da aplicação Web (Vite + Three.js/Vanilla JS).
- **/mobile_app**: Código fonte da aplicação Mobile (Flutter).
- **/scripts**: Scripts utilitários (ex: processamento de imagens).

## Pré-requisitos

Para rodar este projeto, você precisará instalar:

- [Node.js](https://nodejs.org/) (para a parte Web)
- [Python](https://www.python.org/) (para scripts utilitários)
- [Flutter SDK](https://flutter.dev/) (para a parte Mobile)

## Como Rodar

### Aplicação Web

1.  Abra o terminal na pasta raiz do projeto.
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Rode o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
4.  Acesse o link mostrado no terminal (geralmente `http://localhost:5173`).

### Aplicação Mobile

1.  Abra o terminal na pasta `mobile_app`.
2.  Baixe as dependências do Flutter:
    ```bash
    flutter pub get
    ```
3.  Rode o aplicativo (necessário um emulador ou dispositivo conectado):
    ```bash
    flutter run
    ```

### Scripts Utilitários

Para rodar o script `fix_transparency.py` (ou outros scripts Python):

1.  (Opcional mas recomendado) Crie um ambiente virtual:
    ```bash
    python -m venv venv
    # Windows
    .\venv\Scripts\activate
    # Linux/Mac
    source venv/bin/activate
    ```
2.  Instale as dependências:
    ```bash
    pip install -r requirements.txt
    ```
3.  Rode o script:
    ```bash
    python fix_transparency.py
    ```

## Desenvolvimento no Windows

Se você estiver desenvolvendo no Windows:

- Certifique-se de usar o PowerShell ou Git Bash para rodar os comandos.
- Para o Flutter, verifique se as variáveis de ambiente estão configuradas corretamente.
- Se houver problemas com caminhos de arquivos, verifique as barras (Windows usa `\` mas muitas tools aceitam `/`).

## Contribuição

1.  Clone o repositório.
2.  Crie sua feature branch (`git checkout -b feature/minha-feature`).
3.  Commit suas mudanças (`git commit -m 'Adiciona minha feature'`).
4.  Push para a branch (`git push origin feature/minha-feature`).
5.  Abra um Pull Request.
