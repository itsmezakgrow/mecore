import React from 'react';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, className = '' }) => {
  // Parses markdown text and renders structured elements (tables, lists, headers, bold, code)
  const renderFormatted = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 1. Table Detection (lines starting and containing |)
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }

        // Parse Table Lines
        if (tableLines.length >= 2) {
          const headerLine = tableLines[0];
          // check if second line is divider (e.g. |---|---|)
          const isDivider = tableLines[1].replace(/[\s|:-]/g, '').length === 0;
          const bodyLines = isDivider ? tableLines.slice(2) : tableLines.slice(1);

          const parseCells = (row: string) => {
            const rawCells = row.split('|');
            // Remove leading and trailing empty cells from split
            return rawCells.slice(1, -1).map(c => c.trim());
          };

          const headers = parseCells(headerLine);

          elements.push(
            <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-3xs bg-white dark:bg-[#181A1F]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-100/80 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700">
                    {headers.map((h, idx) => (
                      <th key={idx} className="p-2.5 font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider text-[11px] whitespace-nowrap">
                        {renderInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800">
                  {bodyLines.map((row, rIdx) => {
                    const cells = parseCells(row);
                    return (
                      <tr 
                        key={rIdx} 
                        className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                      >
                        {cells.map((c, cIdx) => (
                          <td key={cIdx} className="p-2.5 text-neutral-700 dark:text-neutral-300 align-top leading-relaxed">
                            {renderCellContent(c)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // 2. Code Block Detection (```)
      if (line.trim().startsWith('```')) {
        const lang = line.trim().slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        elements.push(
          <div key={`code-${i}`} className="my-2.5 rounded-xl bg-neutral-900 text-neutral-100 p-3 text-xs font-mono overflow-x-auto border border-neutral-800">
            {lang && <div className="text-[10px] text-neutral-400 font-bold uppercase mb-1">{lang}</div>}
            <pre className="whitespace-pre">{codeLines.join('\n')}</pre>
          </div>
        );
        continue;
      }

      // 3. Headers (###, ##, #)
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-sm font-bold text-neutral-900 dark:text-white mt-3 mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-3.5 bg-emerald-500 rounded-full inline-block"></span>
            {renderInline(line.slice(4))}
          </h3>
        );
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-base font-bold text-neutral-900 dark:text-white mt-3.5 mb-2 pb-1 border-b border-neutral-200 dark:border-neutral-800">
            {renderInline(line.slice(3))}
          </h2>
        );
        i++;
        continue;
      }
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${i}`} className="text-lg font-extrabold text-neutral-900 dark:text-white mt-4 mb-2 pb-1.5 border-b border-neutral-200 dark:border-neutral-800">
            {renderInline(line.slice(2))}
          </h1>
        );
        i++;
        continue;
      }

      // 4. Bullet lists (*, -)
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const bulletText = line.trim().slice(2);
        elements.push(
          <li key={`li-${i}`} className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 ml-4 list-disc leading-relaxed my-0.5">
            {renderInline(bulletText)}
          </li>
        );
        i++;
        continue;
      }

      // 5. Numbered lists (1. , 2. )
      const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        elements.push(
          <div key={`num-${i}`} className="flex items-start gap-2 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 my-1">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-[11px] bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
              {numMatch[1]}
            </span>
            <div className="flex-1 leading-relaxed">{renderInline(numMatch[2])}</div>
          </div>
        );
        i++;
        continue;
      }

      // 6. Blockquote (> )
      if (line.trim().startsWith('> ')) {
        elements.push(
          <blockquote key={`quote-${i}`} className="my-2 p-2.5 pl-3.5 border-l-3 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs italic text-neutral-700 dark:text-neutral-300 rounded-r-xl">
            {renderInline(line.trim().slice(2))}
          </blockquote>
        );
        i++;
        continue;
      }

      // 7. Regular paragraph / empty line
      if (!line.trim()) {
        elements.push(<div key={`sp-${i}`} className="h-1.5" />);
      } else {
        elements.push(
          <p key={`p-${i}`} className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed my-1">
            {renderInline(line)}
          </p>
        );
      }
      i++;
    }

    return elements;
  };

  // Specialized cell formatter (detects High/Med/Low badges, bold, dates)
  const renderCellContent = (cell: string) => {
    // Check if cell is a priority badge like **High**, High, **Med**, **Low**
    const trimmed = cell.trim();
    const cleanLower = trimmed.replace(/\*\*/g, '').toLowerCase();

    if (cleanLower === 'high' || cleanLower === 'urgent') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900 shadow-3xs">
          High
        </span>
      );
    }
    if (cleanLower === 'med' || cleanLower === 'medium') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900 shadow-3xs">
          Med
        </span>
      );
    }
    if (cleanLower === 'low') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900 shadow-3xs">
          Low
        </span>
      );
    }

    return renderInline(cell);
  };

  // Inline formatter for bold (**), italics (*), code (`), and badges
  const renderInline = (str: string): React.ReactNode => {
    // Split by bold (**...**) and inline code (`...`)
    const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        const inner = part.slice(2, -2);
        // Special highlighting for common tags
        if (inner.toLowerCase() === 'high') {
          return (
            <span key={index} className="inline-block px-1.5 py-0.2 mx-0.5 rounded font-mono text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200">
              High
            </span>
          );
        }
        return (
          <strong key={index} className="font-bold text-neutral-900 dark:text-white">
            {inner}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code key={index} className="px-1.5 py-0.5 mx-0.5 text-[11px] font-mono rounded bg-neutral-100 dark:bg-neutral-800 text-emerald-700 dark:text-emerald-400 border border-neutral-200 dark:border-neutral-700">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return <div className={`markdown-content space-y-1 ${className}`}>{renderFormatted(content)}</div>;
};

export default MarkdownView;
