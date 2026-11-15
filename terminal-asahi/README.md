# Antes do Amanhã — Terminal de Asahi

ARG independente de Catastrophe, em português brasileiro. Dez capítulos, 60 documentos, 13 relatórios do laboratório e 13 folhas do Diário de Asahi.

## Jogar

Baixe e abra dist/antes_do_amanha.html no navegador. O arquivo é autônomo e funciona offline. Comece com help ou cat README.txt.

Digite diretamente uma palavra descoberta para ver a folha do diário, sem unlock ou cat. A saída aparece gradualmente; Enter revela o restante e Ctrl+C interrompe.

Comandos: help, ls, cd, cat, search, unlock, decrypt, clear e exit. Explore /seraphim/laboratory. O progresso é salvo no navegador, sem conta.

## Código e testes

Requer Node 22 ou superior para desenvolver; não há dependências de terceiros.

- npm run build: gera os HTMLs em dist.
- npm test: executa os 17 testes de progressão, cifras, palavras diretas, persistência e renderização.

Os módulos ficam em src: conteúdo, sistema de arquivos virtual, enigmas, interpretador, persistência e interface.

Para hospedagem estática, sirva somente dist. O guia reservado do mestre é mantido fora deste envio. Como o jogo é inteiramente local, textos e credenciais podem ser inspecionados no código. Os segredos reservados da campanha não foram incluídos no conteúdo jogável.
