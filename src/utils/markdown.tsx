import React from 'react';

/**
 * Parses inline markdown-like syntax (bold, italic, code, links)
 */
export function parseLine(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[1]) parts.push(<strong key={match.index} className="font-semibold text-gray-900">{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={match.index} className="italic">{match[4]}</em>);
    else if (match[5]) parts.push(<code key={match.index} className="text-[12px] bg-gray-100 text-indigo-600 px-1 py-0.5 rounded font-mono">{match[6]}</code>);
    else if (match[7]) parts.push(<a key={match.index} href={match[9]} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2 decoration-indigo-300">{match[8]}</a>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
}

/**
 * Renders multiple lines of text with structural markdown-like syntax (headers, lists, blockquotes)
 */
export function renderMarkdownContent(text: string): React.ReactNode {
  if (!text) return null;
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (/^---+$/.test(line.trim())) { elements.push(<hr key={i} className="my-5 border-gray-100" />); i++; continue; }
    if (line.startsWith('### ')) { elements.push(<h3 key={i} className="text-[14px] font-bold text-gray-900 mt-5 mb-2">{parseLine(line.slice(4))}</h3>); i++; continue; }
    if (line.startsWith('## '))  { elements.push(<h2 key={i} className="text-[16px] font-bold text-gray-900 mt-6 mb-2.5">{parseLine(line.slice(3))}</h2>); i++; continue; }
    if (line.startsWith('# '))   { elements.push(<h1 key={i} className="text-[18px] font-bold text-gray-900 mt-7 mb-3">{parseLine(line.slice(2))}</h1>); i++; continue; }

    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) { quoteLines.push(lines[i].slice(2)); i++; }
      elements.push(
        <blockquote key={`bq-${i}`} className="border-l-3 border-indigo-300 pl-3.5 my-3 py-1 text-[13px] text-gray-600 italic bg-indigo-50/30 rounded-r-lg">
          {quoteLines.map((ql, qi) => <p key={qi} className="leading-relaxed">{parseLine(ql)}</p>)}
        </blockquote>
      ); continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      const match = line.match(/^(\d+)\.\s/);
      const startNum = match ? parseInt(match[1], 10) : 1;
      
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) { 
        items.push(lines[i].replace(/^\d+\.\s/, '')); 
        i++; 
      }
      elements.push(<ol key={`ol-${i}`} start={startNum} className="list-decimal list-outside ml-5 my-2 space-y-1.5">{items.map((t, li) => <li key={li} className="text-[13px] text-gray-700 leading-relaxed pl-1">{parseLine(t)}</li>)}</ol>); 
      continue;
    }

    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) { items.push(lines[i].slice(2)); i++; }
      elements.push(<ul key={`ul-${i}`} className="list-disc list-outside ml-5 my-2 space-y-1">{items.map((t, li) => <li key={li} className="text-[13px] text-gray-700 leading-relaxed pl-1">{parseLine(t)}</li>)}</ul>); continue;
    }

    if (line.trim() === '') { elements.push(<div key={i} className="h-2" />); i++; continue; }
    elements.push(<p key={i} className="text-[13px] text-gray-700 leading-[1.75] break-words">{parseLine(line)}</p>);
    i++;
  }
  return elements;
}
