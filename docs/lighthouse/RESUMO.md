# Auditoria Lighthouse — Studio Liso Espelhado

Gerado em: 01/10/2026, 00:07:50
Build: cErT-WRXx9EMuxJ5uTrtm
Execucao: Lighthouse via navegador do harness (acessibilidade + boas praticas + SEO,
sem emulacao de dispositivo nem throttling).

Como reproduzir pelo navegador: abrir a pagina e chamar a auditoria de Lighthouse.
Pela linha de comando (com servidor em :3000):

```powershell
powershell -ExecutionPolicy Bypass -Command "& 'C:\Users\Empreendedores\Desktop\studio-liso\scripts\lighthouse-audit.ps1'"
```

Os JSON completos de cada pagina estao nesta pasta.

## Resultado por pagina

| # | Pagina | Acessibilidade | Boas praticas | SEO | Falhas |
|---|---|---|---|---|---|
| 1 | `home` | 100 | 100 | 100 | - |
| 2 | `servicos` | 100 | 100 | 100 | - |
| 3 | `promocoes` | 100 | 100 | 100 | - |
| 4 | `resultados` | 100 | 100 | 100 | - |
| 5 | `mostruario` | 100 | 100 | 100 | - |
| 6 | `sobre` | 100 | 100 | 100 | - |
| 7 | `contato` | 100 | 100 | 100 | - |
| 8 | `agendar` | 100 | 100 | 100 | - |
| 9 | `politica-de-privacidade` | 100 | 100 | 100 | - |
| 10 | `termos-de-uso` | 100 | 100 | 100 | - |
| 11 | `politica-de-agendamento` | 100 | 100 | 100 | - |
| 12 | `admin/` | 100 | 100 | 100 | - |
| 13 | `admin/avisos` | 100 | 100 | 100 | - |
| 14 | `admin/agenda` | 100 | 100 | 100 | - |
| 15 | `admin/conteudo` | 100 | 100 | 100 | - |
| 16 | `admin/servicos` | 100 | 100 | 100 | - |
| 17 | `admin/galeria` | 100 | 100 | 100 | - |
| 18 | `admin/promocoes` | 100 | 100 | 100 | - |
| 19 | `admin/depoimentos` | 100 | 100 | 100 | - |
| 20 | `admin/login` | 100 | 100 | 100 | - |
| 21 | `admin/usuarios` | 100 | 100 | 100 | - |

**Total: 21 telas auditadas — 0 abaixo de 100 em alguma categoria — 0 auditorias reprovadas.**

## Nota
- Todas as telas publicas e do painel fecharam em **100/100/100** sem falhas.
- Auditorias com `score` zero em execucoes antigas eram cortes de maquina
  (PAGE_HUNG / PROTOCOL_TIMEOUT), nao falha do site — causa tratada matando o
  Chrome orfao entre as paginas.
