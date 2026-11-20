import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { PlainProvider, Tabs, TabsList, TabsTrigger, TabsContent, Button } from '@plain/ui';
import '@plain/ui/styles.css';

const sections = [
  'Details',
  'Accounting',
  'UOM',
  'Tax',
  'Inventory',
  'Purchasing',
  'Sales',
  'Manufacturing',
  'Quality',
];
const params = new URLSearchParams(location.search);
function Fixture() {
  const [value, setValue] = React.useState(params.get('initial') ?? 'Details');
  const [narrow, setNarrow] = React.useState(false);
  const vertical = params.get('orientation') === 'vertical';
  return (
    <PlainProvider
      persist={false}
      dir={params.get('dir') === 'rtl' ? 'rtl' : 'ltr'}
      theme={{
        mode: params.get('theme') === 'dark' ? 'dark' : 'light',
        motion: params.get('motion') === 'none' ? 'none' : 'system',
      }}
    >
      <main style={{ padding: 16 }}>
        <h1 style={{ fontSize: 24, marginBottom: 16 }}>Record sections</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          <Button onClick={() => setValue('Quality')}>Select quality</Button>
          <Button onClick={() => setNarrow((old) => !old)}>Resize container</Button>
        </div>
        {params.has('offscreen') && <div style={{ height: 1200 }} />}
        <div style={{ width: narrow ? 280 : '100%', maxWidth: '100%', minWidth: 0 }}>
          <Tabs
            value={value}
            onValueChange={setValue}
            orientation={vertical ? 'vertical' : 'horizontal'}
            activationMode={params.get('manual') === 'true' ? 'manual' : 'automatic'}
          >
            <TabsList
              aria-label="Record sections"
              variant="underline"
              fullWidth
              scrollable
              animated={params.get('animated') !== 'off'}
              indicatorThickness={1}
              size={params.get('size') === 'sm' ? 'sm' : params.get('size') === 'lg' ? 'lg' : 'md'}
              style={vertical ? { height: 180 } : undefined}
            >
              {sections.map((section) => (
                <TabsTrigger key={section} value={section} disabled={section === 'Tax'}>
                  {section}
                </TabsTrigger>
              ))}
            </TabsList>
            {sections.map((section) => (
              <TabsContent key={section} value={section}>
                {section} settings for this record.
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </PlainProvider>
  );
}
const root = createRoot(document.getElementById('root')!);
root.render(<Fixture />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
