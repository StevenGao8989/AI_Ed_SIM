import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface KaTeXRendererProps {
  children: string;
  className?: string;
}

interface MathError {
  message: string;
}

export default function KaTeXRenderer({ children, className = '' }: KaTeXRendererProps) {
  // 解析文本中的数学公式
  const renderMathContent = (text: string) => {
    // 匹配行内公式 $...$ 和块级公式 $$...$$
    const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        // 块级公式
        const math = part.slice(2, -2);
        return (
          <BlockMath 
            key={index} 
            math={math}
            errorColor="#cc0000"
            renderError={(error: MathError) => (
              <span style={{ color: 'red', fontStyle: 'italic' }}>
                公式渲染错误: {error.message}
              </span>
            )}
          />
        );
      } else if (part.startsWith('$') && part.endsWith('$')) {
        // 行内公式
        const math = part.slice(1, -1);
        return (
          <InlineMath 
            key={index} 
            math={math}
            errorColor="#cc0000"
            renderError={(error: MathError) => (
              <span style={{ color: 'red', fontStyle: 'italic' }}>
                公式渲染错误: {error.message}
              </span>
            )}
          />
        );
      } else {
        // 普通文本
        return <span key={index}>{part}</span>;
      }
    });
  };

  return (
    <div className={className}>
      {renderMathContent(children)}
    </div>
  );
}
