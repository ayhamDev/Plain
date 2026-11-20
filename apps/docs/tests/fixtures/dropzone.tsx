import * as React from 'react';
import { createRoot } from 'react-dom/client';
import * as UI from '@plain/ui';
import '@plain/ui/styles.css';

const params = new URLSearchParams(location.search);
const initial = params.has('default')
  ? [new File(['saved'], 'saved.txt', { type: 'text/plain' })]
  : [];
function Fixture() {
  const ref = React.useRef<HTMLInputElement>(null);
  const [files, setFiles] = React.useState<readonly File[]>(initial);
  const [proposed, setProposed] = React.useState<readonly File[]>(initial);
  const [submitted, setSubmitted] = React.useState<string[]>([]);
  const [calls, setCalls] = React.useState(0);
  const [nativeCalls, setNativeCalls] = React.useState(0);
  const [disabled, setDisabled] = React.useState(params.has('disabled'));
  const [cancelReset, setCancelReset] = React.useState(false);
  return (
    <main style={{ padding: 24, maxWidth: 640, marginInline: 'auto', display: 'grid', gap: 24 }}>
      <UI.H1 size="xl">Project documents</UI.H1>
      <UI.Field label="Attachments" required description="Text documents for review">
        {params.has('fileupload') ? (
          <UI.FileUpload
            ref={ref}
            form="documents"
            name="attachments"
            accept=".txt"
            multiple
            defaultValue={initial}
            value={params.has('controlled') ? files : undefined}
          />
        ) : (
          <UI.Dropzone
            ref={ref}
            form="documents"
            name="attachments"
            accept=".txt"
            multiple
            maxFiles={2}
            maxSize={10}
            required
            disabled={disabled}
            unstyled={params.has('unstyled')}
            defaultValue={initial}
            value={params.has('controlled') ? files : undefined}
            style={
              params.has('custom')
                ? UI.tokensToStyle({
                    'dropzone.radius': '12px',
                    'dropzone.min-height': '160px',
                    'dropzone.focus': '#007e80',
                  })
                : undefined
            }
            label="Add review documents"
            description="Two text files, up to 10 bytes each."
            onChange={() => setNativeCalls((value) => value + 1)}
            onFilesChange={(next) => {
              setCalls((value) => value + 1);
              setProposed(next);
              if (!params.has('hold')) setFiles(next);
            }}
          >
            {params.has('custom')
              ? ({ dragging, files }) => (
                  <UI.Strong>
                    {dragging ? 'Release documents' : `Add files (${files.length} selected)`}
                  </UI.Strong>
                )
              : undefined}
          </UI.Dropzone>
        )}
      </UI.Field>
      <form
        id="documents"
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
        onReset={(event) => {
          if (cancelReset) event.preventDefault();
        }}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(
            new FormData(event.currentTarget)
              .getAll('attachments')
              .filter((item): item is File => item instanceof File && !!item.name)
              .map((item) => item.name),
          );
        }}
      >
        <UI.Button type="submit">Save attachments</UI.Button>
        <UI.Button type="reset" variant="outline">
          Reset attachments
        </UI.Button>
        <UI.Button type="button" variant="outline" onClick={() => ref.current?.focus()}>
          Focus attachments
        </UI.Button>
        <UI.Button type="button" variant="outline" onClick={() => setDisabled(!disabled)}>
          Toggle disabled
        </UI.Button>
        <UI.Button type="button" variant="outline" onClick={() => setFiles(proposed)}>
          Commit proposed files
        </UI.Button>
      </form>
      <UI.Label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <UI.Checkbox
          checked={cancelReset}
          onCheckedChange={(value) => setCancelReset(value === true)}
        />
        Cancel reset
      </UI.Label>
      <output aria-label="Submitted filenames">{JSON.stringify(submitted)}</output>
      <output aria-label="File changes">{calls}</output>
      <output aria-label="Native picker changes">{nativeCalls}</output>
      <output aria-label="Proposed filenames">
        {JSON.stringify(proposed.map((file) => file.name))}
      </output>
    </main>
  );
}
const root = createRoot(document.getElementById('root')!);
root.render(
  <UI.PlainProvider
    persist={false}
    dir={params.get('dir') === 'rtl' ? 'rtl' : 'ltr'}
    theme={{
      mode: params.get('theme') === 'dark' ? 'dark' : 'light',
      motion: params.get('motion') === 'none' ? 'none' : 'system',
    }}
  >
    <Fixture />
  </UI.PlainProvider>,
);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
