import * as React from 'react';
import {
  Button,
  Field,
  Input,
  Label,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  Switch,
  ThemeScope,
  extendComponent,
  tokensToStyle,
  useTheme,
} from '@plain/ui';

const RoundSwitch = extendComponent(Switch, {
  displayName: 'RoundSwitch',
  tokens: { 'switch.radius': '999px' },
});

export function InstanceOverridesExample() {
  const id = React.useId();
  const { radius } = useTheme();
  return (
    <div
      role="group"
      aria-label="Individual component overrides"
      style={{ display: 'grid', gap: 16, maxWidth: 400, minWidth: 0 }}
    >
      <p>Current theme radius: {radius}px. Each override stays local.</p>
      {[
        { key: 'theme', label: 'Follow the theme', tokens: {} },
        { key: 'round', label: 'Always round', tokens: { 'switch.radius': '999px' } },
        { key: 'square', label: 'Always square', tokens: { 'switch.radius': '0px' } },
        {
          key: 'thumb',
          label: 'Independent thumb shape',
          tokens: { 'switch.radius': '8px', 'switch.thumb-radius': '2px' },
        },
      ].map(({ key, label, tokens }) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Label htmlFor={`${id}-${key}`} style={{ flex: 1, minWidth: 0 }}>
            {label}
          </Label>
          <Switch id={`${id}-${key}`} defaultChecked style={tokensToStyle(tokens)} />
        </div>
      ))}
      <Field label="Project name">
        <Input
          placeholder="A taller, rounded field"
          style={tokensToStyle({
            'input.radius': '12px',
            'input.height': '48px',
            'input.border': 'var(--ui-outline)',
          })}
        />
      </Field>
    </div>
  );
}

export function ScopedOverridesExample() {
  const id = React.useId();
  return (
    <ThemeScope
      tokens={{ 'button.radius': '999px', 'popover.radius': '16px' }}
      style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline">
            Local settings
          </Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Local appearance">
          <p>The popup keeps this scope's rounding, including through its portal.</p>
          <PopoverClose asChild>
            <Button type="button" style={{ marginTop: 16 }}>
              Done
            </Button>
          </PopoverClose>
        </PopoverContent>
      </Popover>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
        <Label htmlFor={id}>Reusable round switch</Label>
        <RoundSwitch id={id} defaultChecked />
      </div>
    </ThemeScope>
  );
}

export const instanceOverridesCode = `import { Input, Switch, tokensToStyle } from '@plain/ui';

export function LocalOverrides() {
  return (
    <>
      <Switch aria-label="Follow the theme" />
      <Switch
        aria-label="Always round"
        style={tokensToStyle({ 'switch.radius': '999px' })}
      />
      <Switch
        aria-label="Always square"
        style={tokensToStyle({ 'switch.radius': '0px' })}
      />
      <Switch
        aria-label="Independent thumb shape"
        style={tokensToStyle({
          'switch.radius': '8px',
          'switch.thumb-radius': '2px',
        })}
      />
      <Input
        aria-label="Project name"
        style={tokensToStyle({
          'input.radius': '12px',
          'input.height': '48px',
          'input.border': 'var(--ui-outline)',
        })}
      />
    </>
  );
}`;

export const scopedOverridesCode = `import {
  Button, Popover, PopoverTrigger, PopoverContent,
  Switch, ThemeScope, extendComponent,
} from '@plain/ui';

// A reusable component default; caller style can override these tokens again.
export const RoundSwitch = extendComponent(Switch, {
  displayName: 'RoundSwitch',
  tokens: { 'switch.radius': '999px' },
});

export function LocalSettings() {
  return (
    <ThemeScope tokens={{
      'button.radius': '999px',
      'popover.radius': '16px',
    }}>
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button">Local settings</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Local appearance">
          This popup also uses the local scope.
        </PopoverContent>
      </Popover>
      <RoundSwitch aria-label="Notifications" />
    </ThemeScope>
  );
}`;
