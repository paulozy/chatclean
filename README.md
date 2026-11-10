# ChatClean v0.1.2

Extensão MV3 para ocultar visualmente mensagens automáticas no chat nativo da Kick.

## Instalação (Chrome / Edge)
1. Extraia o ZIP em uma pasta.
2. Abra `chrome://extensions` (Chrome) ou `edge://extensions` (Edge).
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação**.
5. Selecione a pasta `chatclean` extraída.
6. Abra ou atualize uma live em `kick.com`.

## Uso
Clique no ícone do ChatClean para ativar/desativar a extensão ou o filtro de resgates do PokeIdle.

## O que a versão 0.1 faz
- Observa mensagens novas no chat da Kick.
- Oculta mensagens que correspondam ao padrão de mensagens de resgate de bônus do PokeIdle.
- Guarda preferências via `chrome.storage.sync`.
- Não envia mensagens, não apaga mensagens na Kick e não usa servidor.

## Limitação conhecida
A Kick pode alterar o HTML do chat. O adapter inicial usa seletores e fallback heurístico; caso não reconheça o contêiner correto no chat real, será necessário ajustar o adapter com uma amostra do DOM da página.

## Privacidade
Todo o processamento ocorre no navegador. A extensão solicita apenas armazenamento local/sincronizado e acesso às páginas da Kick.
