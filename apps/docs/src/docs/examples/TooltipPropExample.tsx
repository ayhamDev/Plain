import * as React from 'react';
import { Button, Badge, Card, Field, Input, Stack, Inline, Strong, P, toast } from '@plain/ui';
import { Settings, Copy, Upload } from 'lucide-react';

export default function TooltipPropExample() {
  const input = React.useRef<HTMLInputElement>(null);
  return (
    <Stack gap={6} style={{ width: '100%', maxWidth: 440 }}>
      <Inline gap={3}>
        <Button
          size="icon"
          variant="outline"
          aria-label="Project settings"
          tooltip="Project settings"
          onClick={() => input.current?.focus()}
        >
          <Settings aria-hidden="true" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          aria-label="Copy project link"
          tooltip={{
            content: 'Copy a link to share this project',
            side: 'bottom',
            delayDuration: 200,
          }}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText('https://github.com/ayhamDev/Plain');
              toast.success('Project link copied');
            } catch {
              toast.error('Select and copy the project link from the address bar.');
            }
          }}
        >
          <Copy aria-hidden="true" />
        </Button>
        <Button disabled variant="outline" tooltip="Choose a file before uploading">
          <Upload aria-hidden="true" />
          Upload
        </Button>
        <Badge tooltip="Only invited team members can access this project">Private</Badge>
      </Inline>
      <Field label="Project name" description="Shown in your workspace.">
        <Input
          ref={input}
          name="project"
          defaultValue="Website redesign"
          tooltip={{ content: 'Choose a name your team will recognize', side: 'right' }}
        />
      </Field>
      <Card variant="filled" tooltip="Project details can be updated at any time">
        <Strong>Website redesign</Strong>
        <P tone="muted" size="sm">
          Hover or use Tab to discover additional context.
        </P>
      </Card>
    </Stack>
  );
}
