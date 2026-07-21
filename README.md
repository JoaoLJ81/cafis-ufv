# VIII SEAFís — Site Oficial

Site institucional da **VIII Semana Acadêmica de Física (SEAFís)**, evento promovido pelo **Centro Acadêmico de Física (CAFís)** da Universidade Federal de Viçosa (UFV).

🔗 **Site no ar:** https://seafisufv.netlify.app/

## Sobre o projeto

Site estático (sem framework, sem processo de build) com 5 páginas:

| Arquivo             | Conteúdo                                              |
|----------------------|--------------------------------------------------------|
| `index.html`         | Página inicial — apresentação do evento e histórico do CAFís |
| `programacao.html`   | Planilha de horários, palestrantes, mesas redondas e minicursos |
| `comissao.html`      | Comissão Organizadora do evento |
| `inscricao.html`     | Valores e link para o formulário de inscrição |
| `404.html`           | Página de erro (exibida pelo Netlify em URLs inexistentes) |

## Tecnologias

- **HTML5 / CSS3 / JavaScript puro** — sem frameworks, sem bibliotecas externas, sem etapa de build. Basta abrir os arquivos `.html` num navegador (ou servir a pasta com qualquer servidor estático) para rodar o site localmente.
- **Deploy:** [Netlify](https://www.netlify.com/), publicado automaticamente a partir deste repositório.

## Estrutura de arquivos

```
├── index.html, programacao.html, inscricao.html, comissao.html, 404.html
├── main.css              # todo o CSS do site
├── main.js                # todo o JavaScript do site
├── imagens/
│   ├── palestrantes/      # fotos dos palestrantes/minicursos
│   ├── comissao/          # fotos da comissão organizadora
│   └── patrocinio/        # logos de apoiadores/realizadores
├── robots.txt, sitemap.xml   # SEO técnico
└── .gitignore
```

O código é **fortemente comentado em português** — o site foi construído também como material de estudo de desenvolvimento web, então os comentários explicam o "porquê" das decisões técnicas, não só o "o quê".

## Como atualizar o conteúdo

As seções mais comuns de editar já têm um modelo comentado no próprio HTML, pronto pra copiar:

- **Novo palestrante/mesa redonda/minicurso** → ver o comentário "MODELO" em `programacao.html`, dentro da seção de palestrantes.
- **Novo membro da comissão** → duplicar um `.committee-card` em `comissao.html` (ver comentário no topo da seção).
- **Planilha de horários** → tabelas em `programacao.html`, dentro de `#planilha`.

## Licença

Projeto institucional do CAFís/UFV — sem licença de código aberto formal definida.
