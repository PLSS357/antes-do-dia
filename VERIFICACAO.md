# Verificação — 07/11/2026

## Testes executados

- `npm test`: oito suítes aprovadas. Incluem extrações reais do acróstico, César, fragmentos, palavras e ata, além do fluxo de todos os 24 desafios com respostas corretas e incorretas.
- Integração com SQLite temporário: 48 documentos não vazios, ligações existentes, três dicas por desafio, oito margens opcionais, selos, autorizações, importação/exportação assinada, persistência, notas, rascunhos, publicação, pistas extras, reinício e autenticação.
- `npm run build`: compilação de produção e TypeScript aprovados com Webpack.
- `node scripts/audit-client.mjs`: 21 bundles públicos inspecionados; nenhuma das respostas ou revelações sensíveis verificadas foi encontrada. Os dados do mestre são obtidos somente por API autenticada.
- `node scripts/http-smoke.mjs`: nove páginas retornaram HTTP 200; o HTML não continha as revelações finais; capítulos/documentos finais bloquearam acesso; administração exigiu login; Herança → Raízes funcionou por HTTP com Origin real.
- Navegador: leitura, resposta errada rejeitada, três respostas de Herança confirmadas, nota salva, relação entre duas cartas com margem opcional, persistência após recarregar, login administrativo e botão de teste completo dos 24 desafios.
- Responsividade: inspeção visual em 1366×900 e 390×844; no celular, documento, grade e desafios permaneceram legíveis, sem transbordamento horizontal da página. A navegação por caixas e botões não exige arrastar. Verificados rótulos de formulário, headings, transcrição de imagem e ausência de erros de console na vista final.
- PDFs: seis arquivos, 20 páginas no total; extração textual e contagem conferidas; todas as páginas renderizadas com Poppler e inspecionadas em folha de contato, com uma página também revisada em resolução maior. Há versões legível e estilizada dos três conjuntos.

## Correções motivadas pela verificação

A checagem de Origin usa o Host recebido, pois o Next.js pode normalizar a URL interna para localhost ao receber acesso por 127.0.0.1. O painel obtém o conteúdo de continuidade por meio da API autenticada.

## Limites

Não houve teste cego com jogadores, sessão presencial real, auditoria externa de segurança, teste em aparelho móvel físico ou publicação externa. Os oito capítulos foram percorridos automaticamente e o fluxo inicial e painel foram verificados visualmente. A interface usa CSS responsivo e teclado, mas não foi certificada formalmente quanto a WCAG. Transcrições substituem áudio indisponível; nenhuma solução depende de som.

O servidor é local e requer processo Node ativo. O SQLite do Node 22 emite aviso experimental. A compilação no sandbox Windows bloqueou subprocessos; compilação fora do sandbox com Webpack foi bem-sucedida. Isso não exige mudanças no Windows do usuário.

Os arquivos pós-one-shot e o guia são exclusivos do mestre. O projeto completo deve ficar privado; jogadores recebem somente o endereço da aplicação. A senha descartável usada na verificação foi removida. Cadastre a sua com `npm run setup`.
