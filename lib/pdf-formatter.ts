const cleanLatex = (text: string): string => {
  return text
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\textit\{([^}]+)\}/g, '$1')
    .replace(/\\textbf\{([^}]+)\}/g, '$1')
    .replace(/\\mathit\{([^}]+)\}/g, '$1')
    .replace(/\\mathbb\{([^}]+)\}/g, '$1')
    .replace(/\\mathcal\{([^}]+)\}/g, '$1')
    .replace(/\\operatorname\{([^}]+)\}/g, '$1')
    .replace(/\\overline\{([^}]+)\}/g, '$1')
    .replace(/\\underline\{([^}]+)\}/g, '$1')
    .replace(/\\vec\{([^}]+)\}/g, '$1')
    .replace(/\\hat\{([^}]+)\}/g, '$1')
    .replace(/\\bar\{([^}]+)\}/g, '$1')
    .replace(/\\tilde\{([^}]+)\}/g, '$1')
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\left\[/g, '[')
    .replace(/\\right\]/g, ']')
    .replace(/\\left\\{/g, '{')
    .replace(/\\right\\}/g, '}')
    .replace(/\\left\|/g, '|')
    .replace(/\\right\|/g, '|')
    .replace(/\\begin\{([^}]+)\}/g, '')
    .replace(/\\end\{([^}]+)\}/g, '')
    .replace(/\\displaystyle/g, '')
    .replace(/\\limits/g, '')
    .replace(/\\\[(.+?)\\\]/gs, '$1')
    .replace(/\$\$(.+?)\$\$/gs, '$1')
    .replace(/\$(.+?)\$/g, '$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\dfrac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\tfrac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\cdot/g, '·')
    .replace(/\\pm/g, '±')
    .replace(/\\mp/g, '∓')
    .replace(/\\sqrt\[3\]\{([^}]+)\}/g, '∛($1)')
    .replace(/\\sqrt\[4\]\{([^}]+)\}/g, '∜($1)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\pi/g, 'π')
    .replace(/\\theta/g, 'θ')
    .replace(/\\Theta/g, 'Θ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\Gamma/g, 'Γ')
    .replace(/\\delta/g, 'δ')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\epsilon/g, 'ε')
    .replace(/\\varepsilon/g, 'ε')
    .replace(/\\zeta/g, 'ζ')
    .replace(/\\eta/g, 'η')
    .replace(/\\phi/g, 'φ')
    .replace(/\\Phi/g, 'Φ')
    .replace(/\\varphi/g, 'φ')
    .replace(/\\Sigma/g, 'Σ')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\Lambda/g, 'Λ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\nu/g, 'ν')
    .replace(/\\xi/g, 'ξ')
    .replace(/\\Xi/g, 'Ξ')
    .replace(/\\rho/g, 'ρ')
    .replace(/\\tau/g, 'τ')
    .replace(/\\omega/g, 'ω')
    .replace(/\\Omega/g, 'Ω')
    .replace(/\\psi/g, 'ψ')
    .replace(/\\Psi/g, 'Ψ')
    .replace(/\\chi/g, 'χ')
    .replace(/\\kappa/g, 'κ')
    .replace(/\\iota/g, 'ι')
    .replace(/\\upsilon/g, 'υ')
    .replace(/\\Upsilon/g, 'Υ')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\^1/g, '¹')
    .replace(/\^0/g, '⁰')
    .replace(/\^\{([^}]+)\}/g, '^($1)')
    .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\ne/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\sim/g, '∼')
    .replace(/\\equiv/g, '≡')
    .replace(/\\cong/g, '≅')
    .replace(/\\propto/g, '∝')
    .replace(/\\infty/g, '∞')
    .replace(/\\rightarrow/g, '→')
    .replace(/\\leftarrow/g, '←')
    .replace(/\\Rightarrow/g, '⇒')
    .replace(/\\Leftarrow/g, '⇐')
    .replace(/\\leftrightarrow/g, '↔')
    .replace(/\\Leftrightarrow/g, '⇔')
    .replace(/\\to/g, '→')
    .replace(/\\in/g, '∈')
    .replace(/\\notin/g, '∉')
    .replace(/\\subset/g, '⊂')
    .replace(/\\subseteq/g, '⊆')
    .replace(/\\supset/g, '⊃')
    .replace(/\\supseteq/g, '⊇')
    .replace(/\\cup/g, '∪')
    .replace(/\\cap/g, '∩')
    .replace(/\\emptyset/g, '∅')
    .replace(/\\forall/g, '∀')
    .replace(/\\exists/g, '∃')
    .replace(/\\neg/g, '¬')
    .replace(/\\land/g, '∧')
    .replace(/\\lor/g, '∨')
    .replace(/\\parallel/g, '∥')
    .replace(/\\perp/g, '⊥')
    .replace(/\\angle/g, '∠')
    .replace(/\\degree/g, '°')
    .replace(/\\circ/g, '°')
    .replace(/\\partial/g, '∂')
    .replace(/\\nabla/g, '∇')
    .replace(/\\int/g, '∫')
    .replace(/\\sum/g, '∑')
    .replace(/\\prod/g, '∏')
    .replace(/\\%/g, '%')
    .replace(/\\&/g, '&')
    .replace(/\\\\/g, '');
};

const convertMarkdownTableToHtml = (tableLines: string[]): string => {
  if (tableLines.length < 2) return '';
  
  const parseRow = (line: string): string[] => {
    return line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(cell => cell.trim());
  };

  const headerCells = parseRow(tableLines[0]);
  let html = '<table><thead><tr>';
  for (const cell of headerCells) {
    html += `<th>${cell}</th>`;
  }
  html += '</tr></thead><tbody>';

  for (let i = 2; i < tableLines.length; i++) {
    const cells = parseRow(tableLines[i]);
    html += '<tr>';
    for (const cell of cells) {
      html += `<td>${cell}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  return html;
};

export const markdownToHtml = (markdown: string): string => {
  const cleaned = cleanLatex(markdown);
  const lines = cleaned.split('\n');
  const htmlParts: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      htmlParts.push('<div style="height:8px"></div>');
      i++;
      continue;
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        const tl = lines[i].trim();
        if (!/^\|[\s-:|]+\|$/.test(tl)) {
          tableLines.push(tl);
        } else if (tableLines.length === 1) {
          tableLines.push(tl);
        }
        i++;
      }
      if (tableLines.length >= 1) {
        htmlParts.push(convertMarkdownTableToHtml(tableLines));
      }
      continue;
    }

    if (/^[═━─]{3,}/.test(trimmed) || /^[-=]{5,}$/.test(trimmed)) {
      htmlParts.push('<hr class="section-divider"/>');
      i++;
      continue;
    }

    if (trimmed.startsWith('#### ')) {
      const text = trimmed.slice(5);
      htmlParts.push(`<h4>${formatInlineMarkdown(text)}</h4>`);
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      const text = trimmed.slice(4);
      htmlParts.push(`<h3>${formatInlineMarkdown(text)}</h3>`);
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      const text = trimmed.slice(3);
      htmlParts.push(`<h2>${formatInlineMarkdown(text)}</h2>`);
      i++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      const text = trimmed.slice(2);
      htmlParts.push(`<h1>${formatInlineMarkdown(text)}</h1>`);
      i++;
      continue;
    }

    if (/^\*\*Question\s+\d+/.test(trimmed) || /^\*\*Q\d+/.test(trimmed)) {
      const text = formatInlineMarkdown(trimmed);
      htmlParts.push(`<div class="question-header">${text}</div>`);
      i++;
      continue;
    }

    if (/^\(([ivxlcdm]+|[a-z]|[A-Z])\)\s/.test(trimmed)) {
      const optionLines: string[] = [];
      while (i < lines.length) {
        const cl = lines[i].trim();
        if (cl.length === 0 && optionLines.length > 0) break;
        if (optionLines.length > 0 && !(/^\(([ivxlcdm]+|[a-z]|[A-Z])\)\s/.test(cl)) && cl.length > 0) {
          optionLines[optionLines.length - 1] += ' ' + cl;
          i++;
          continue;
        }
        if (/^\(([ivxlcdm]+|[a-z]|[A-Z])\)\s/.test(cl)) {
          optionLines.push(cl);
        } else if (cl.length === 0) {
          break;
        }
        i++;
      }
      htmlParts.push('<div class="options-group">');
      for (const opt of optionLines) {
        const match = opt.match(/^\(([ivxlcdm]+|[a-z]|[A-Z])\)\s(.*)$/);
        if (match) {
          htmlParts.push(`<div class="option-item"><span class="option-label">(${match[1]})</span> <span>${formatInlineMarkdown(match[2])}</span></div>`);
        } else {
          htmlParts.push(`<div class="option-item">${formatInlineMarkdown(opt)}</div>`);
        }
      }
      htmlParts.push('</div>');
      continue;
    }

    if (/^[a-d]\)\s/.test(trimmed) || /^[A-D]\)\s/.test(trimmed)) {
      const mcqOptions: string[] = [];
      while (i < lines.length) {
        const cl = lines[i].trim();
        if (/^[a-dA-D]\)\s/.test(cl)) {
          mcqOptions.push(cl);
          i++;
        } else {
          break;
        }
      }
      htmlParts.push('<div class="mcq-options">');
      for (const opt of mcqOptions) {
        htmlParts.push(`<div class="mcq-option">${formatInlineMarkdown(opt)}</div>`);
      }
      htmlParts.push('</div>');
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length) {
        const cl = lines[i].trim();
        if (/^\d+\.\s/.test(cl)) {
          const text = cl.replace(/^\d+\.\s/, '');
          listItems.push(text);
          i++;
        } else if (cl.length > 0 && !/^[#*\-|═━─]/.test(cl) && !/^\d+\.\s/.test(cl) && listItems.length > 0 && !(/^\(/.test(cl)) && !(/^[a-dA-D]\)/.test(cl))) {
          listItems[listItems.length - 1] += ' ' + cl;
          i++;
        } else {
          break;
        }
      }
      htmlParts.push('<ol class="numbered-list">');
      for (const item of listItems) {
        htmlParts.push(`<li>${formatInlineMarkdown(item)}</li>`);
      }
      htmlParts.push('</ol>');
      continue;
    }

    if (/^[-•]\s/.test(trimmed)) {
      const bulletItems: string[] = [];
      while (i < lines.length) {
        const cl = lines[i].trim();
        if (/^[-•]\s/.test(cl)) {
          bulletItems.push(cl.replace(/^[-•]\s/, ''));
          i++;
        } else if (cl.length > 0 && bulletItems.length > 0 && !(/^[#*|═━─\d]/.test(cl)) && !(/^\(/.test(cl))) {
          bulletItems[bulletItems.length - 1] += ' ' + cl;
          i++;
        } else {
          break;
        }
      }
      htmlParts.push('<ul class="bullet-list">');
      for (const item of bulletItems) {
        htmlParts.push(`<li>${formatInlineMarkdown(item)}</li>`);
      }
      htmlParts.push('</ul>');
      continue;
    }

    if (/^\[DIAGRAM:|^\[FIGURE:|^\[PICTURE:/i.test(trimmed)) {
      let diagramText = trimmed;
      while (i + 1 < lines.length && !diagramText.includes(']')) {
        i++;
        diagramText += ' ' + lines[i].trim();
      }
      htmlParts.push(`<div class="diagram-box">${formatInlineMarkdown(diagramText)}</div>`);
      i++;
      continue;
    }

    if (/^\[COMPETENCY-BASED\]/i.test(trimmed)) {
      htmlParts.push(`<div class="competency-tag">COMPETENCY-BASED</div>`);
      const remainingText = trimmed.replace(/^\[COMPETENCY-BASED\]\s*/i, '');
      if (remainingText.length > 0) {
        htmlParts.push(`<p>${formatInlineMarkdown(remainingText)}</p>`);
      }
      i++;
      continue;
    }

    if (/^(OR|or)$/.test(trimmed)) {
      htmlParts.push(`<div class="or-divider">OR</div>`);
      i++;
      continue;
    }

    if (/^(SECTION\s+[A-Z]|PART\s+[IVX]+)/i.test(trimmed)) {
      htmlParts.push(`<div class="section-title">${formatInlineMarkdown(trimmed)}</div>`);
      i++;
      continue;
    }

    if (/^(Time:|GENERAL INSTRUCTIONS|Maximum Marks|IMPORTANT|ANSWER KEY)/i.test(trimmed)) {
      htmlParts.push(`<div class="exam-meta">${formatInlineMarkdown(trimmed)}</div>`);
      i++;
      continue;
    }

    htmlParts.push(`<p>${formatInlineMarkdown(trimmed)}</p>`);
    i++;
  }

  return htmlParts.join('\n');
};

const formatInlineMarkdown = (text: string): string => {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(\d+)\s*marks?\]/gi, '<span class="marks">[$1 marks]</span>')
    .replace(/\[(\d+)\]/g, '<span class="marks">[$1]</span>');
};

interface PdfOptions {
  title: string;
  subtitle: string;
  board: string;
  grade: number;
  subject: string;
  contentType: string;
  accentColor?: string;
}

export const generatePdfHtml = (content: string, options: PdfOptions): string => {
  const accent = options.accentColor || '#1e40af';
  const formattedBody = markdownToHtml(content);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <style>
    @page {
      margin: 20mm 15mm 20mm 15mm;
      size: A4;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
      font-size: 12pt;
      line-height: 1.65;
      color: #1a1a2e;
      background: #fff;
      padding: 0;
    }

    .pdf-header {
      text-align: center;
      border-bottom: 3px double ${accent};
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .pdf-header h1 {
      font-size: 22pt;
      color: ${accent};
      margin-bottom: 4px;
      letter-spacing: 0.5px;
    }
    .pdf-header .subtitle {
      font-size: 13pt;
      color: #475569;
      margin-bottom: 8px;
    }
    .pdf-header .meta-row {
      font-size: 10pt;
      color: #64748b;
    }
    .pdf-header .meta-row strong {
      color: #334155;
    }

    h1 { font-size: 18pt; color: ${accent}; margin: 20px 0 10px; border-bottom: 2px solid ${accent}22; padding-bottom: 6px; }
    h2 { font-size: 15pt; color: #1e293b; margin: 18px 0 8px; border-left: 4px solid ${accent}; padding-left: 10px; }
    h3 { font-size: 13pt; color: #334155; margin: 14px 0 6px; }
    h4 { font-size: 12pt; color: #475569; margin: 10px 0 4px; }

    p { margin: 6px 0; text-align: justify; }

    strong { color: #1e293b; }

    .question-header {
      background: ${accent}0D;
      border: 1px solid ${accent}33;
      border-radius: 6px;
      padding: 10px 14px;
      margin: 18px 0 10px;
      font-weight: 700;
      font-size: 12.5pt;
      color: ${accent};
      page-break-inside: avoid;
    }

    .options-group {
      margin: 8px 0 8px 20px;
      page-break-inside: avoid;
    }
    .option-item {
      padding: 4px 0 4px 8px;
      margin: 2px 0;
      line-height: 1.55;
    }
    .option-label {
      font-weight: 600;
      color: ${accent};
      min-width: 36px;
      display: inline-block;
    }

    .mcq-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 24px;
      margin: 6px 0 10px 24px;
      page-break-inside: avoid;
    }
    .mcq-option {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11pt;
    }
    .mcq-option:nth-child(odd) { background: #f8fafc; }

    ol.numbered-list {
      margin: 8px 0 8px 28px;
      list-style-type: decimal;
    }
    ol.numbered-list li {
      padding: 3px 0;
      margin: 2px 0;
      page-break-inside: avoid;
    }

    ul.bullet-list {
      margin: 8px 0 8px 24px;
      list-style-type: disc;
    }
    ul.bullet-list li {
      padding: 3px 0;
      margin: 2px 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 11pt;
      page-break-inside: avoid;
    }
    th {
      background: ${accent}15;
      color: ${accent};
      font-weight: 700;
      border: 1px solid ${accent}44;
      padding: 8px 10px;
      text-align: left;
    }
    td {
      border: 1px solid #e2e8f0;
      padding: 7px 10px;
      text-align: left;
    }
    tr:nth-child(even) td { background: #f8fafc; }

    .marks {
      display: inline-block;
      background: ${accent}15;
      color: ${accent};
      font-weight: 700;
      font-size: 10pt;
      padding: 1px 6px;
      border-radius: 4px;
      margin-left: 4px;
    }

    .section-divider {
      border: none;
      border-top: 2px solid ${accent}44;
      margin: 20px 0;
    }

    .section-title {
      text-align: center;
      font-size: 14pt;
      font-weight: 700;
      color: ${accent};
      background: ${accent}0A;
      padding: 10px;
      margin: 20px 0 12px;
      border-radius: 6px;
      border: 1px solid ${accent}22;
      text-transform: uppercase;
      letter-spacing: 1px;
      page-break-after: avoid;
    }

    .exam-meta {
      font-size: 11pt;
      color: #334155;
      padding: 4px 0;
      line-height: 1.6;
    }
    .exam-meta strong { color: #1e293b; }

    .diagram-box {
      background: #fefce8;
      border: 1px dashed #ca8a04;
      border-radius: 6px;
      padding: 12px 16px;
      margin: 10px 0;
      font-style: italic;
      color: #713f12;
      font-size: 11pt;
      page-break-inside: avoid;
    }

    .competency-tag {
      display: inline-block;
      background: #dcfce7;
      color: #166534;
      font-weight: 700;
      font-size: 9pt;
      padding: 3px 10px;
      border-radius: 12px;
      border: 1px solid #86efac;
      margin: 8px 0 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .or-divider {
      text-align: center;
      font-weight: 700;
      font-size: 13pt;
      color: ${accent};
      margin: 12px 0;
      position: relative;
    }
    .or-divider::before, .or-divider::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 35%;
      height: 1px;
      background: ${accent}44;
    }
    .or-divider::before { left: 0; }
    .or-divider::after { right: 0; }

    code {
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 10.5pt;
    }

    .pdf-footer {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 9pt;
    }
  </style>
</head>
<body>
  <div class="pdf-header">
    <h1>${options.title}</h1>
    <div class="subtitle">${options.subtitle}</div>
    <div class="meta-row">
      <strong>Subject:</strong> ${options.subject} &nbsp;|&nbsp;
      <strong>Grade:</strong> ${options.grade} &nbsp;|&nbsp;
      <strong>Board:</strong> ${options.board}
    </div>
  </div>
  <div class="pdf-body">
    ${formattedBody}
  </div>
  <div class="pdf-footer">
    Generated by ShikshaSetu AI &nbsp;|&nbsp; ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
  </div>
</body>
</html>`;
};
