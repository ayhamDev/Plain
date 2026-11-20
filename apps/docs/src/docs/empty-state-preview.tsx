import * as React from 'react';
import * as UI from '@plain/ui';
import type { PropPreview } from './previews';

type State = PropPreview['defaults'];
const labels = [
  'Create project',
  'Import projects',
  'Documentation',
  'Invite a teammate',
  'Contact support',
];
const variants = ['primary', 'secondary', 'outline', 'ghost', 'ghost'] as const;

function EmptyPreview({ state }: { state: State }) {
  const [message, setMessage] = React.useState('Start fresh, or bring your existing work.');
  return (
    <UI.EmptyState
      size={state.size as UI.EmptyStateProps['size']}
      variant={state.variant as UI.EmptyStateProps['variant']}
      align={state.align as UI.EmptyStateProps['align']}
      orientation={state.orientation as UI.EmptyStateProps['orientation']}
    >
      {!!state.showMedia && (
        <UI.EmptyStateMedia
          variant="icon"
          shape={state.mediaShape as UI.EmptyStateMediaProps['shape']}
        >
          <span aria-hidden="true" style={{ fontWeight: 600 }}>
            P
          </span>
        </UI.EmptyStateMedia>
      )}
      <UI.EmptyStateContent>
        <UI.EmptyStateTitle asChild>
          <h2>No projects yet</h2>
        </UI.EmptyStateTitle>
        {!!state.showDescription && (
          <UI.EmptyStateDescription>
            Your workspace is ready for its first project.
          </UI.EmptyStateDescription>
        )}
        {!!state.showForm && (
          <form
            style={{ display: 'grid', gap: 8, width: 320, maxWidth: '100%' }}
            onSubmit={(event) => {
              event.preventDefault();
              const name = String(new FormData(event.currentTarget).get('project') ?? '').trim();
              if (name) setMessage(`${name} created in this demo.`);
            }}
          >
            <UI.Field label="Project name">
              <UI.Input name="project" required placeholder="Website redesign" />
            </UI.Field>
            <UI.Button type="submit">Create named project</UI.Button>
          </form>
        )}
        {Number(state.actionCount) > 0 && (
          <UI.EmptyStateActions layout={state.actionsLayout as UI.EmptyStateActionsProps['layout']}>
            {labels.slice(0, Number(state.actionCount)).map((label, index) =>
              index === 2 ? (
                <UI.Button key={label} variant={variants[index]} asChild>
                  <a href="/docs/introduction">{label}</a>
                </UI.Button>
              ) : (
                <UI.Button
                  key={label}
                  variant={variants[index]}
                  onClick={() => setMessage(`${label} selected in this demo.`)}
                >
                  {label}
                </UI.Button>
              ),
            )}
          </UI.EmptyStateActions>
        )}
        {!!state.showFooter && (
          <UI.EmptyStateFooter>
            <span role="status">{message}</span>
          </UI.EmptyStateFooter>
        )}
      </UI.EmptyStateContent>
    </UI.EmptyState>
  );
}

export const emptyStatePreview: PropPreview = {
  defaults: {
    size: 'md',
    variant: 'default',
    align: 'center',
    orientation: 'vertical',
    actionCount: 3,
    actionsLayout: 'row',
    showMedia: true,
    mediaShape: 'circle',
    showDescription: true,
    showFooter: true,
    showForm: false,
  },
  controls: [
    { name: 'size', options: ['sm', 'md', 'lg'] },
    { name: 'variant', options: ['default', 'muted', 'outlined'] },
    { name: 'align', options: ['center', 'start'] },
    { name: 'orientation', options: ['vertical', 'horizontal'] },
    { name: 'actionCount', min: 0, max: 5 },
    { name: 'actionsLayout', options: ['row', 'column'] },
    { name: 'showMedia' },
    { name: 'mediaShape', options: ['circle', 'rounded', 'square'] },
    { name: 'showDescription' },
    { name: 'showFooter' },
    { name: 'showForm' },
  ],
  render: (state) => <EmptyPreview state={state} />,
  code: (
    s,
  ) => `const [message, setMessage] = React.useState('Start fresh, or bring your existing work.');

<EmptyState size="${s.size}" variant="${s.variant}" align="${s.align}" orientation="${s.orientation}">
  ${s.showMedia ? `<EmptyStateMedia variant="icon" shape="${s.mediaShape}"><span aria-hidden="true" style={{ fontWeight: 600 }}>P</span></EmptyStateMedia>` : ''}
  <EmptyStateContent>
    <EmptyStateTitle asChild><h2>No projects yet</h2></EmptyStateTitle>
    ${s.showDescription ? '<EmptyStateDescription>Your workspace is ready for its first project.</EmptyStateDescription>' : ''}
    ${
      s.showForm
        ? `<form style={{ display: 'grid', gap: 8, width: 320, maxWidth: '100%' }} onSubmit={(event) => {
      event.preventDefault();
      const name = String(new FormData(event.currentTarget).get('project') ?? '').trim();
      if (name) setMessage(name + ' created in this demo.');
    }}>
      <Field label="Project name"><Input name="project" required placeholder="Website redesign" /></Field>
      <Button type="submit">Create named project</Button>
    </form>`
        : ''
    }
    ${
      Number(s.actionCount) > 0
        ? `<EmptyStateActions layout="${s.actionsLayout}">
      ${labels
        .slice(0, Number(s.actionCount))
        .map((label, index) =>
          index === 2
            ? `<Button variant="${variants[index]}" asChild><a href="/docs/introduction">${label}</a></Button>`
            : `<Button variant="${variants[index]}" onClick={() => setMessage('${label} selected in this demo.')}>${label}</Button>`,
        )
        .join('\n      ')}
    </EmptyStateActions>`
        : ''
    }
    ${s.showFooter ? '<EmptyStateFooter><span role="status">{message}</span></EmptyStateFooter>' : ''}
  </EmptyStateContent>
</EmptyState>`,
};
