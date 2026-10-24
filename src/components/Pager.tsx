export function Pager({
  index,
  total,
  onChange,
  label = "ページ",
}: {
  index: number;
  total: number;
  onChange: (index: number) => void;
  label?: string;
}) {
  return (
    <div className="pager" aria-label={label}>
      <button
        disabled={index <= 0}
        onClick={() => onChange(index - 1)}
        aria-label={`${label}を前へ`}
      >
        ←
      </button>
      <span>
        {index + 1} <small>/ {Math.max(1, total)}</small>
      </span>
      <button
        disabled={index >= total - 1}
        onClick={() => onChange(index + 1)}
        aria-label={`${label}を次へ`}
      >
        →
      </button>
    </div>
  );
}
export function splitText(text: string, limit = 48): string[] {
  const sentences = text.match(/[^。！？\n]+[。！？]?/gu) ?? [text];
  const out: string[] = [];
  for (const sentence of sentences) {
    const chars = Array.from(sentence.trim());
    while (chars.length) out.push(chars.splice(0, limit).join(""));
  }
  return out.length ? out : [""];
}
