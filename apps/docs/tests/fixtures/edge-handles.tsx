import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {
  PlainProvider,
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarRail,
  SidebarTrigger,
  SidebarInset,
  Resizable,
  ResizablePanel,
  ResizableHandle,
} from '@plain/ui';
import '@plain/ui/styles.css';

const params = new URLSearchParams(location.search);
function Fixture() {
  return (
    <PlainProvider
      persist={false}
      dir={params.get('dir') === 'rtl' ? 'rtl' : 'ltr'}
      theme={{
        mode: params.get('theme') === 'dark' ? 'dark' : 'light',
        motion: params.get('motion') === 'none' ? 'none' : 'system',
      }}
    >
      <main style={{ padding: 16, display: 'grid', gap: 24 }}>
        <h1 style={{ fontSize: 24 }}>Animated edge handles</h1>
        <SidebarProvider
          mobileBreakpoint={1}
          width="160px"
          style={{
            height: 180,
            width: '100%',
            maxWidth: 640,
            border: '1px solid var(--ui-border)',
          }}
        >
          <Sidebar
            side={params.get('side') === 'end' ? 'end' : 'start'}
            aria-label="App navigation"
          >
            <SidebarHeader>
              <strong>Workspace</strong>
            </SidebarHeader>
            <SidebarContent>
              <p style={{ padding: 16 }}>Projects and files</p>
            </SidebarContent>
            <SidebarRail aria-label="Toggle navigation edge" />
          </Sidebar>
          <SidebarInset asChild>
            <div style={{ padding: 16 }}>
              <SidebarTrigger />
              <p>Workspace content</p>
            </div>
          </SidebarInset>
        </SidebarProvider>
        <Resizable
          mobileOrientation={false}
          orientation={params.get('axis') === 'vertical' ? 'vertical' : 'horizontal'}
          style={{
            width: '100%',
            maxWidth: 640,
            height: 240,
            border: '1px solid var(--ui-border)',
          }}
        >
          <ResizablePanel id="files" minSize="20%" defaultSize="35%">
            <p style={{ padding: 16 }}>Files</p>
          </ResizablePanel>
          <ResizableHandle
            id="files-divider"
            aria-label="Resize files"
            disabled={params.has('disabled')}
            withHandle={params.has('grip')}
          />
          <ResizablePanel id="editor" minSize="20%">
            <p style={{ padding: 16 }}>Editor</p>
          </ResizablePanel>
        </Resizable>
      </main>
    </PlainProvider>
  );
}
const root = createRoot(document.getElementById('root')!);
root.render(<Fixture />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
