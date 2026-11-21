import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  PlainProvider,
  Button,
  Field,
  Input,
  Textarea,
  Slider,
  Sheet,
  Drawer,
  SheetContent,
  DrawerContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
  type SheetSide,
} from '@plain/ui';
import '@plain/ui/styles.css';

const params = new URLSearchParams(location.search);
function Fixture() {
  const [value, setValue] = React.useState([40]);
  const [clicks, setClicks] = React.useState(0);
  const Root = params.get('kind') === 'drawer' ? Drawer : Sheet;
  const Content = params.get('kind') === 'drawer' ? DrawerContent : SheetContent;
  const surface = (
    <div
      data-testid="surface"
      style={{ height: 48, display: 'grid', placeItems: 'center', background: 'var(--ui-muted)' }}
    >
      Drag surface
    </div>
  );
  return (
    <main style={{ padding: 16 }}>
      <h1>Panel gestures</h1>
      <Root
        side={(params.get('side') ?? 'bottom') as SheetSide}
        variant={params.has('detached') ? 'detached' : 'attached'}
        maxWidth={560}
        handleOnly={params.has('handleOnly')}
        dismissible={!params.has('locked')}
      >
        <SheetTrigger asChild>
          <Button>Open panel</Button>
        </SheetTrigger>
        <Content
          showHandle
          onPointerDown={(event) => {
            if (params.has('prevent')) event.preventDefault();
          }}
        >
          <SheetHeader>
            <SheetTitle>Project settings</SheetTitle>
            <SheetDescription>Change this workspace.</SheetDescription>
          </SheetHeader>
          {params.get('side') !== 'top' && surface}
          <div style={{ display: 'grid', gap: 16, paddingBlock: 16, minWidth: 0 }}>
            <Field label="Project name">
              <Input defaultValue="Website redesign" />
            </Field>
            <Field label="Volume">
              <Slider value={value} onValueChange={setValue} thumbLabels={['Volume']} />
            </Field>
            <output aria-label="Volume value">{value[0]}</output>
            <p data-testid="prose">Select this project description without dragging the panel.</p>
            {params.has('form') && (
              <>
                <Field label="Description">
                  <Textarea rows={2} defaultValue={'Project details\n'.repeat(10)} />
                </Field>
                <Field label="Vertical volume">
                  <Slider orientation="vertical" defaultValue={[30]} />
                </Field>
              </>
            )}
            {params.has('nested') && (
              <div data-testid="nested" style={{ overflow: 'auto', height: 100 }}>
                <div style={{ height: 500, width: 1000 }}>
                  <p>Scrollable content</p>
                  {Array.from({ length: 12 }, (_, i) => (
                    <p key={i}>Section {i}</p>
                  ))}
                </div>
              </div>
            )}
            <div data-vaul-no-drag data-testid="custom" style={{ padding: 8 }}>
              Custom widget region
            </div>
            <Button variant="outline" onClick={() => setClicks((value) => value + 1)}>
              Custom action
            </Button>
            <output aria-label="Action count">{clicks}</output>
            {params.has('long') &&
              Array.from({ length: 40 }, (_, i) => (
                <p key={i}>Project update {i + 1}. Scroll this content.</p>
              ))}
            <SheetClose asChild>
              <Button>Done</Button>
            </SheetClose>
            {params.get('side') === 'top' && surface}
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
    theme={{ mode: params.has('dark') ? 'dark' : 'light', motion: 'none' }}
  >
    <Fixture />
  </PlainProvider>,
);
