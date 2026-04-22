"use client";

import React from 'react';

type SafeRichTextProps = {
  text: string;
  className?: string;
};

const normalizeText = (text: string) =>
  text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?strong>/gi, '**')
    .replace(/<[^>]+>/g, '');

const renderInline = (line: string) => {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

export const SafeRichText: React.FC<SafeRichTextProps> = ({ text, className }) => {
  const paragraphs = normalizeText(text).split(/\n{2,}/);

  return (
    <span className={className}>
      {paragraphs.map((paragraph, paragraphIndex) => (
        <span key={paragraphIndex} className={paragraphIndex > 0 ? 'mt-2 block' : 'block'}>
          {paragraph.split('\n').map((line, lineIndex) => (
            <React.Fragment key={lineIndex}>
              {lineIndex > 0 && <br />}
              {renderInline(line)}
            </React.Fragment>
          ))}
        </span>
      ))}
    </span>
  );
};
