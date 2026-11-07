# Antes do Dia

ARG local de Catastrophe. Next.js, TypeScript, React, Tailwind CSS e SQLite persistente pelo módulo nativo `node:sqlite`. Oito capítulos, 24 desafios, 48 documentos, oito relações opcionais e um painel administrativo com autenticação no servidor.

## Executar

Requer Node.js **22.19 ou superior** e npm. Se você clonou do GitHub, extraia `ANTES-DO-DIA-CONTEUDO-DO-MESTRE.zip` na raiz do clone para instalar os arquivos de campanha. O pacote local fornece `lib/content.js`, `lib/print-materials.js`, o guia e as ferramentas de verificação da campanha. O Git ignora esses arquivos. O ZIP completo de entrega já inclui o conteúdo.

Execute estes comandos em PowerShell na raiz do projeto.

```powershell
npm ci
npm run setup
npm run build
npm start
```

Abra [o caderno](http://127.0.0.1:3000) e [o painel do mestre](http://127.0.0.1:3000/mestre). `setup` pede uma senha oculta com confirmação, mínimo de 14 caracteres. Não há senha padrão e nenhuma senha real foi gravada neste projeto. Use `npm run dev` durante alterações. Os scripts usam Webpack, pois o Turbopack encontrou uma falha de subprocesso no ambiente Windows usado na verificação.

O servidor deve continuar executando enquanto as páginas são utilizadas. Os scripts vinculam a interface a 127.0.0.1 por padrão. Para acesso pela rede da mesa, execute `npx next start --hostname 0.0.0.0` e use o endereço do computador anfitrião. Para hospedagem externa, use processo Node persistente e disco persistente; este projeto **não é exportável como site estático**. Não foi publicado em domínio externo.

## Onde começar na mesa

Leia primeiro **materials/master-guide/GUIA-DO-MESTRE.md**. A pasta contém também MATRIZ-DE-PISTAS.md e CONTINUIDADE.md. O prompt atual prevalece sobre os ARGs antigos preservados no dossiê. O guia distingue cânone, hipóteses, mentiras/omissões e documentos novos do ARG.

- Antes da dungeon: capítulos 1 e 2 estão liberados.
- Na primeira sessão, entregue o primeiro conjunto de impressos e libere os capítulos 3 e 4.
- Na segunda sessão, entregue o segundo conjunto e libere os capítulos 5 a 7.
- Após a one-shot, entregue o conjunto final e libere o capítulo 8. O painel exige uma confirmação específica.

Cada pasta exige a conclusão da anterior. Cada reconstrução exige os dois indícios da pasta. Os principais desafios 3, 4, 6, 7 e 8 também exigem selo aleatório do material presencial. A liberação do mestre e o selo são controles diferentes.

## Impressos

Os três conjuntos têm versões legível e estilizada. No clone do GitHub, execute `npm run materials` ou abra os links de impressão no painel. Os impressos gerados ficam fora do Git porque contêm os selos de campo da instalação. **O repositório e os impressos completos são reservados ao mestre.** Não envie materiais pós-one-shot antecipadamente.

O ZIP de entrega inclui seis PDFs e seis HTMLs em `materials/session-1`, `materials/session-2` e `materials/post-oneshot`. Mantenha o banco incluído no ZIP se usar os PDFs prontos. Se iniciar um banco novo, mudar ARG_DATA_DIR ou restaurar outra instalação, use os links de impressão autenticados do painel; eles sempre usam os selos atuais. No navegador, imprimir → salvar como PDF produz novas cópias sem dependências extras.

O script opcional `scripts/print-pdfs.py` gera os seis PDFs offline com ReportLab e fontes Arial/Georgia do Windows. Rode `npm run materials` antes. Em outros sistemas, ajuste os caminhos de fontes; o HTML e a impressão pelo painel são portáveis.

## Recursos

- Rotas /diario, /imperial, /serafim, /correspondencia, /final, /terminal e /investigacao. Para uma pasta específica, use `?cap=NUMERO`. Rotas diretas não contornam a API protegida.
- Leitor com documentos completos, downloads reais TXT/MD/PDF/SVG e transcrições de e-mails/logs. Imagens autorais têm tabela equivalente acessível. Não há áudio obrigatório.
- Quadro de evidências por caixas de seleção, notas pessoais e conexões com recompensa opcional.
- Terminal fictício: help, dir, read ID, search TERMO, decrypt 3 TEXTO, status, archive. Não acessa o sistema operacional.
- Dicas graduais sem temporizador; comparação, coordenadas, César, substituição, metadados, cronologia e reconstrução causal.
- Progresso por cookie HttpOnly e banco SQLite, exportação JSON assinada, importação na mesma instalação e reinício com confirmação.
- Painel: liberações, bloqueios, soluções, rascunhos e publicação de textos, pistas adicionais, impressos, sessões pseudônimas, importação/exportação de conteúdo e teste completo em sessão isolada.
- Pré-visualização autenticada: rascunhos, capítulos liberados e selos dispensados só na sessão de teste. Não interfere no progresso real.

## Dados, segurança e manutenção

`data/arg.sqlite` contém senha scrypt com salt, hashes de tokens, sessões, selos e chave de assinatura de exportações. Não é servido por HTTP. `ARG_DATA_DIR` pode definir outra pasta privada. `npm run setup` é também o procedimento de troca local de senha e encerra sessões administrativas anteriores. Faça backup com o servidor parado, copiando `data` e os impressos relacionados. Nunca publique essa pasta.

Em HTTPS, defina `ARG_SECURE_COOKIE=1` e `ARG_ORIGIN=https://seu-endereco-real` no ambiente do servidor, especialmente atrás de proxy reverso. Cookies são HttpOnly, SameSite=Strict; requisições de alteração exigem cabeçalho de aplicação e verificação de Origin. Sessões administrativas duram oito horas, sessões de jogadores 30 dias. Exporte progresso após cada encontro. Tentativas de autenticação e respostas têm limitação no servidor. O SQLite do Node 22 ainda emite aviso experimental; não há dependência SQLite nativa separada.

A aplicação não envia respostas nem documentos futuros nos desafios. Publicação de rascunhos não é implícita. Conteúdo editável é exibido como texto escapado pelo React; SVGs usam escape XML. A autenticação é obrigatória também para APIs administrativas e impressos. Importações de progresso são assinadas e nunca liberam capítulos narrativos. Não execute o diretório do projeto como servidor estático nem distribua seu código aos jogadores: ele contém os segredos locais do mestre.

O painel edita textos e adiciona pistas; mudanças em respostas, regras ou estrutura exigem editar `lib/content.js`, executar testes e gerar novamente o guia. O exportador de conteúdo transporta os textos editados e pistas extras, sem senhas, sessões ou selos; não substitui um backup integral do banco. Importações têm limite de 256 KB.

## Verificação e expansão

```powershell
npm test
npm run build
npm run guide
npm run materials
```

O botão “Executar teste completo” no painel valida as 24 respostas corretas e incorretas em pré-visualização isolada. Os testes de integração também cobrem persistência, exportação/importação, liberação presencial, bloqueios em documentos/downloads/terminal, rascunhos, publicação, autenticação e impressos. Veja **VERIFICACAO.md** para evidências e limites da verificação.

Arquitetura: `components` só consome DTOs públicos; `lib/content.js` e `lib/server.js` ficam no servidor; `lib/database.js` concentra persistência; `app/api/[...path]` fornece os endpoints. Textos de capítulos não entram em componentes clientes. Os materiais e guias ficam fora de `public`. A base tem oito capítulos por contrato; ao expandi-la, ajuste também os limites e as validações de acesso.

Referências técnicas: [Route Handlers do Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/route), [SQLite do Node.js](https://nodejs.org/api/sqlite.html), [scrypt do Node.js](https://nodejs.org/api/crypto.html#cryptoscryptsyncpassword-salt-keylen-options). As fontes narrativas são locais e estão discriminadas no guia, sem reutilizar instruções ou versões antigas como novas decisões canônicas.
