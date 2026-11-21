import * as React from 'react';
import { Plus, RotateCcw, ArrowUpDown, X } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Field,
  Grid,
  Inline,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Switch,
  type LayoutPresenceOptions,
} from '@plain/ui';

const initial = ['Research notes', 'Design review', 'Release checklist'];
export const layoutPresenceCode = `import { Card, Grid } from '@plain/ui';

<Grid
  columns={{ base: 1, sm: 2, lg: 3 }}
  presence={{ preset: 'fade', initial: true, stagger: 32, layout: true }}
>
  {projects.map((project) => (
    <Card key={project.id}>{project.name}</Card>
  ))}
</Grid>`;

export function LayoutPresenceExample() {
  const [items, setItems] = React.useState(initial.map((name, id) => ({ id, name })));
  const next = React.useRef(3);
  const [preset, setPreset] = React.useState<LayoutPresenceOptions['preset']>('fade');
  const [animateInitial, setAnimateInitial] = React.useState(true);
  const [replay, setReplay] = React.useState(0);
  return (
    <section aria-label="Layout presence example" className="layout-presence-example">
      <Stack gap={2}>
        <Inline gap={2} align="end">
          <Field label="Transition">
            <Select
              value={preset}
              onValueChange={(value) => setPreset(value as LayoutPresenceOptions['preset'])}
            >
              <SelectTrigger aria-label="Transition">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['fade', 'slide', 'scale'].map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Animate first render">
            <Switch checked={animateInitial} onCheckedChange={setAnimateInitial} />
          </Field>
        </Inline>
        <Inline gap={1}>
          <Button
            variant="outline"
            onClick={() => {
              const id = next.current++;
              setItems((current) => [...current, { id, name: `Project ${id + 1}` }]);
            }}
          >
            <Plus />
            Add project
          </Button>
          <Button
            variant="outline"
            disabled={items.length < 2}
            onClick={() => setItems((current) => [...current].reverse())}
          >
            <ArrowUpDown />
            Reverse order
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setItems(initial.map((name, id) => ({ id, name })));
              setReplay((value) => value + 1);
            }}
          >
            <RotateCcw />
            Replay entrance
          </Button>
        </Inline>
        <p aria-live="polite" style={{ color: 'var(--ui-muted-foreground)', margin: 0 }}>
          {items.length} projects
        </p>
        <Grid
          key={replay}
          data-testid="presence-projects"
          columns={{ base: 1, sm: 2, lg: 3 }}
          presence={{ preset, initial: animateInitial, stagger: 32, layout: true }}
        >
          {items.map((item) => (
            <Card key={item.id} size="sm" data-project={item.id}>
              <CardHeader>
                <Inline justify="between" wrap={false}>
                  <CardTitle>{item.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${item.name}`}
                    onClick={() =>
                      setItems((current) => current.filter((candidate) => candidate.id !== item.id))
                    }
                  >
                    <X />
                  </Button>
                </Inline>
                <CardDescription>Ready for the next step.</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </Grid>
        {!items.length && <p>All clear. Add a project to see its entrance.</p>}
      </Stack>
    </section>
  );
}
