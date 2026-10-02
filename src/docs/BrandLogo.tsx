import type { HTMLAttributes } from 'react';

export function BrandLogo({ className = '', ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={`pui-logo ${className}`} role="img" aria-label="P.UI" {...props}>
      <span className="pui-glyph" aria-hidden="true">
        p<span className="pui-pip" />
      </span>
      <span className="pui-word" aria-hidden="true">
        UI
      </span>
    </span>
  );
}
