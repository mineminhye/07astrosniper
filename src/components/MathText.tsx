/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathProps {
  math: string;
  block?: boolean;
  key?: React.Key;
}

export function MathFormula({ math, block = false }: MathProps) {
  const html = React.useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
      });
    } catch (e) {
      return math;
    }
  }, [math, block]);

  return block ? (
    <div className="katex-block-wrapper my-2" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <span className="katex-inline-wrapper mx-0.5 inline-block" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

interface RichTextProps {
  text: string;
}

export function RichText({ text }: RichTextProps) {
  if (!text) return null;

  // Supports splitting string by standard LaTeX delimiters standard in the dataset: \\( and \\), \\[ and \\]
  const parts = text.split(/(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('\\(') && part.endsWith('\\)')) {
          const content = part.slice(2, -2);
          return <MathFormula key={index} math={content} block={false} />;
        } else if (part.startsWith('\\[') && part.endsWith('\\]')) {
          const content = part.slice(2, -2);
          return <MathFormula key={index} math={content} block={true} />;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
