// Utilidades de formatação do texto do chat:
//  - cleanForSpeech: remove conteúdo técnico (caminhos, URLs, código) para a voz
//    ler só a parte em linguagem natural.
//  - splitSegments: separa o texto em blocos "natural" e "técnico" para o app
//    mostrar o técnico recolhido atrás de um botão "+".

const URL_RE = /\b(?:https?|wss?):\/\/[^\s]+/gi;
const WIN_PATH_RE = /\b[A-Za-z]:\\[^\s]+/g;
const INLINE_CODE_RE = /`[^`]+`/g;

// Uma linha é "técnica" quando parece caminho, URL, comando ou código.
function isTechnicalLine(line: string): boolean {
  const s = line.trim();
  if (!s) return false;
  if (/^(?:https?|wss?):\/\//i.test(s)) return true; // URL
  if (/[A-Za-z]:\\/.test(s)) return true; // caminho Windows (C:\...)
  if (/(^|\s)\/[\w.\-]+\/[\w.\-/]+/.test(s)) return true; // caminho unix (/a/b/c)
  if (/^\s*(?:cd|git|npm|npx|pip|uvicorn|ngrok|cloudflared|hermes|python|powershell|Set-\w+|Invoke-\w+|\$)\b/.test(s))
    return true; // comando
  if (/[{};]\s*$/.test(s) && /[=()<>]/.test(s)) return true; // linha de código
  return false;
}

/** Texto enxuto para a voz: sem caminhos, URLs nem código. */
export function cleanForSpeech(text: string): string {
  let t = text ?? '';
  // remove blocos de código cercados por ```
  t = t.replace(/```[\s\S]*?```/g, ' ');
  // remove código inline, URLs e caminhos Windows
  t = t.replace(INLINE_CODE_RE, ' ').replace(URL_RE, ' ').replace(WIN_PATH_RE, ' ');
  // remove linhas inteiras que são técnicas
  t = t
    .split('\n')
    .filter((line) => !isTechnicalLine(line))
    .join(' ');
  // normaliza espaços e pontuação solta
  t = t.replace(/\s{2,}/g, ' ').replace(/\s+([.,!?])/g, '$1').trim();
  return t;
}

export interface Segment {
  type: 'text' | 'tech';
  content: string;
}

/**
 * Separa o texto em segmentos naturais e técnicos.
 * Blocos ``` ``` e linhas técnicas consecutivas viram um segmento "tech".
 */
export function splitSegments(text: string): Segment[] {
  const raw = text ?? '';
  const segments: Segment[] = [];
  const fence = /```[\s\S]*?```/g;

  let lastIndex = 0;
  let m: RegExpExecArray | null;
  const pushText = (chunk: string) => {
    // dentro do trecho não-cercado, agrupa linhas por natureza
    const lines = chunk.split('\n');
    let buf: string[] = [];
    let bufTech = false;
    const flush = () => {
      const content = buf.join('\n').trim();
      if (content) segments.push({ type: bufTech ? 'tech' : 'text', content });
      buf = [];
    };
    for (const line of lines) {
      const tech = isTechnicalLine(line);
      if (buf.length && tech !== bufTech) flush();
      bufTech = tech;
      buf.push(line);
    }
    flush();
  };

  while ((m = fence.exec(raw)) !== null) {
    if (m.index > lastIndex) pushText(raw.slice(lastIndex, m.index));
    segments.push({ type: 'tech', content: m[0].replace(/```/g, '').trim() });
    lastIndex = fence.lastIndex;
  }
  if (lastIndex < raw.length) pushText(raw.slice(lastIndex));

  return segments.length ? segments : [{ type: 'text', content: raw.trim() }];
}

/** true se o texto tem algum conteúdo técnico (para decidir mostrar o "+"). */
export function hasTechnical(text: string): boolean {
  return splitSegments(text).some((s) => s.type === 'tech');
}
