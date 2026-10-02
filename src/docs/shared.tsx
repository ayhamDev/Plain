import * as React from 'react';
import { Check, Copy, Code2, Download } from 'lucide-react';
import { Button, Tooltip, TooltipTrigger, TooltipContent, toast } from '../ui';

export function IconButton({
  label,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
export function CopyButton({
  text,
  label = 'Copy code',
  size = 'icon',
}: {
  text: string;
  label?: string;
  size?: 'icon' | 'sm';
}) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <Button
      size={size}
      variant="ghost"
      aria-label={copied ? 'Copied' : label}
      title={copied ? 'Copied' : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 1800);
        } catch {
          toast.error('Clipboard access is unavailable. Select the code to copy it.');
        }
      }}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {size !== 'icon' && (copied ? 'Copied' : 'Copy')}
    </Button>
  );
}

function Highlight({ code }: { code: string }) {
  const tokens = code.split(
    /("[^"\n]*"|'[^'\n]*'|\b(?:import|from|export|function|return|const|type|true|false|new|undefined)\b|\b[A-Z][\w]*(?=[\s/>({])|\/\/[^\n]*)/g,
  );
  return (
    <>
      {tokens.map((token, i) => (
        <span
          key={i}
          className={
            token.startsWith('"') || token.startsWith("'")
              ? 'syntax-string'
              : /^(import|from|export|function|return|const|type|true|false|new|undefined)$/.test(
                    token,
                  )
                ? 'syntax-keyword'
                : /^[A-Z]/.test(token)
                  ? 'syntax-component'
                  : token.startsWith('//')
                    ? 'syntax-comment'
                    : undefined
          }
        >
          {token}
        </span>
      ))}
    </>
  );
}
export function CodeBlock({
  code,
  language = 'tsx',
  title,
  compact,
}: {
  code: string;
  language?: string;
  title?: string;
  compact?: boolean;
}) {
  return (
    <div className={`code-block${compact ? ' code-compact' : ''}`}>
      <div className="code-toolbar">
        <span>
          <Code2 size={14} aria-hidden="true" />
          {title ?? language}
        </span>
        <CopyButton text={code} />
      </div>
      <pre tabIndex={0} aria-label={`${title ?? language} code`}>
        <code>
          <Highlight code={code} />
        </code>
      </pre>
    </div>
  );
}
export function PackageDownload({ small }: { small?: boolean }) {
  return (
    <Button variant="outline" size={small ? 'sm' : 'md'} asChild>
      <a href={`${import.meta.env.BASE_URL}plain-ui-0.2.0.tgz`} download>
        <Download aria-hidden="true" />
        Download package
      </a>
    </Button>
  );
}
