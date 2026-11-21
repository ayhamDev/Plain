import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  PlainProvider,
  ThemeScope,
  Button,
  Input,
  Slider,
  Sheet,
  SheetContent,
  SheetHandle,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  Drawer,
  DrawerContent,
  useTheme,
  tokensToStyle,
  type SheetSide,
} from '@plain/ui';
import '@plain/ui/styles.css';

const params = new URLSearchParams(location.search);
const side = (params.get('side') ?? 'bottom') as SheetSide;
const variant =
  params.get('variant') === 'detached'
    ? 'detached'
    : params.get('variant') === 'floating'
      ? 'floating'
      : 'attached';
function Workspace() {
  const { resolvedMode, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState([40]);
  const [scroll, setScroll] = React.useState(0);
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  const [snap, setSnap] = React.useState<number | string | null>(params.has('snap') ? 0.5 : 1);
  const ref = React.useRef<HTMLDivElement>(null);
  const Root = params.get('kind') === 'sheet' ? Sheet : Drawer;
  const Content = params.get('kind') === 'sheet' ? SheetContent : DrawerContent;
  return (
    <main style={{ padding: 16 }}>
      <h1>Panel overdrag backgrounds</h1>
      {params.has('container') && (
        <div
          ref={setContainer}
          data-testid="panel-container"
          style={{ position: 'relative', width: 600, height: 500, marginTop: 24 }}
        />
      )}
      <Root
        side={side}
        variant={variant}
        size={params.has('full') ? 'full' : 'md'}
        gap={params.has('wide-gap') ? 40 : 12}
        container={params.has('container') ? container : undefined}
        open={open}
        onOpenChange={setOpen}
        {...(params.has('snap')
          ? { snapPoints: [0.5, 1], activeSnapPoint: snap, setActiveSnapPoint: setSnap }
          : {})}
        maxWidth={params.has('bounded') ? 320 : undefined}
      >
        <SheetTrigger asChild>
          <Button>Open panel</Button>
        </SheetTrigger>
        <Content
          ref={ref}
          showHandle
          maxWidth={params.has('content-bounded') ? 280 : undefined}
          unstyled={params.has('unstyled')}
          style={{
            ...(params.has('rounded') ? tokensToStyle({ 'sheet.radius': '32px' }) : {}),
            ...(params.has('inline')
              ? {
                  backgroundColor: '#36584a',
                  ...tokensToStyle({
                    'sheet.foreground': '#ffffff',
                    'muted-foreground': '#c9d8cf',
                  }),
                }
              : {}),
          }}
          onScroll={(event) => setScroll(event.currentTarget.scrollTop)}
        >
          <SheetHandle />
          <SheetTitle>Overflow panel</SheetTitle>
          <SheetDescription>
            Pull beyond the resting edge. The background should stay connected.
          </SheetDescription>
          <div style={{ display: 'grid', gap: 16, paddingBlock: 16 }}>
            {params.has('snap') && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button onClick={() => setSnap(1)}>Expand fully</Button>
                <Button onClick={() => setSnap(0.5)}>Half height</Button>
              </div>
            )}
            <Input aria-label="Project name" placeholder="Project name" />
            <Slider aria-label="Volume" value={value} onValueChange={setValue} />
            <output aria-label="Volume value">{value[0]}</output>
            <Button onClick={() => setTheme({ mode: resolvedMode === 'light' ? 'dark' : 'light' })}>
              Change theme
            </Button>
            <Button variant="outline" onClick={() => ref.current?.focus()}>
              Focus panel
            </Button>
            {params.has('long') &&
              Array.from({ length: 60 }, (_, index) => (
                <p key={index}>Section {index + 1}: a scrollable project update.</p>
              ))}
            <Button onClick={() => setOpen(false)}>Last action</Button>
            <output aria-label="Native scroll">{Math.round(scroll)}</output>
            <output aria-label="Snap value">{snap}</output>
          </div>
        </Content>
      </Root>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(
  <PlainProvider
    persist={false}
    dir={params.get('dir') === 'rtl' ? 'rtl' : 'ltr'}
    theme={{
      mode: params.get('theme') === 'dark' ? 'dark' : 'light',
      motion: params.has('reduced') ? 'none' : 'system',
    }}
  >
    {params.has('scoped') ? (
      <ThemeScope
        mode="dark"
        tokens={{ 'sheet.background': '#263d35', 'sheet.foreground': '#ffffff' }}
      >
        <Workspace />
      </ThemeScope>
    ) : (
      <Workspace />
    )}
  </PlainProvider>,
);
