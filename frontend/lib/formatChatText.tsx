/**
 * LLM sohbet yanıtlarındaki basit markdown alt kümesini (paragraf, **kalın**,
 * numaralı/madde işaretli liste) JSX'e çevirir. Tam bir markdown ayrıştırıcı
 * değil — backend'in reply prompt'unun ürettiği biçimlendirmeyle sınırlı
 * (bkz. backend/agents/orchestrator.py::_REPLY_SYSTEM). Öncesinde `{m.text}`
 * ham metin olarak basılıyordu: "**" işaretleri literal görünüyor, satır
 * sonları CSS'te collapse olup tek bir paragrafa yapışıyordu.
 */
import type { ReactNode } from "react";

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
        <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={`${keyPrefix}-${i}`}>{part}</span>
      ),
    );
}

const LIST_ITEM_RE = /^(?:(\d+)[.)]|[-*])\s+(.*)$/;

export function formatChatText(raw: string): ReactNode {
  const lines = raw.trim().split("\n");
  const blocks: ReactNode[] = [];
  let paragraphLines: string[] = [];
  let listItems: { ordered: boolean; text: string }[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    const text = paragraphLines.join(" ").trim();
    if (text) {
      blocks.push(
        <p key={`p-${blocks.length}`} style={{ margin: blocks.length ? "10px 0 0" : 0 }}>
          {renderInline(text, `p-${blocks.length}`)}
        </p>,
      );
    }
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    const ordered = listItems[0].ordered;
    const Tag = ordered ? "ol" : "ul";
    blocks.push(
      <Tag
        key={`l-${blocks.length}`}
        style={{ margin: blocks.length ? "10px 0 0" : 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}
      >
        {listItems.map((item, i) => (
          <li key={i} style={{ lineHeight: 1.6 }}>
            {renderInline(item.text, `li-${blocks.length}-${i}`)}
          </li>
        ))}
      </Tag>,
    );
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    const m = line.match(LIST_ITEM_RE);
    if (m) {
      flushParagraph();
      listItems.push({ ordered: m[1] !== undefined, text: m[2] });
    } else {
      flushList();
      paragraphLines.push(line);
    }
  }
  flushParagraph();
  flushList();

  return <>{blocks}</>;
}
