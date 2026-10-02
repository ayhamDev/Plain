import { createRef, useState } from 'react';
import { H1, P, A, Blockquote, Ol, Li } from '@plain/ui/typography';
import {
  PlainProvider,
  ThemeScope,
  Button,
  Field,
  Input,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DatePicker,
  Combobox,
  DataTable,
  type DataTableColumn,
  type ComponentStyles,
} from '@plain/ui';
import { Button as ModularButton } from '@plain/ui/primitives';
import '@plain/ui/styles.css';

type Record = { id: string; name: string };
const columns: DataTableColumn<Record>[] = [{ accessorKey: 'name', header: 'Name' }];
const styles: ComponentStyles = { 'button.root': 'rounded-full', 'data-table.root': 'space-y-8' };
const anchorRef = createRef<HTMLAnchorElement>();
const quoteRef = createRef<HTMLQuoteElement>();

export function ConsumerApp() {
  const [date, setDate] = useState<Date>();
  return (
    <PlainProvider dir="rtl" styles={styles} tokens={{ radius: '8px' }} persist={false}>
      <ThemeScope tokens={{ accent: '#1d4ed8' }}>
        <H1 size="2xl">Project workspace</H1>
        <P tone="muted" align="start">
          Your current projects.
        </P>
        <A ref={anchorRef} href="/projects" download="projects.txt">
          Projects
        </A>
        <Blockquote ref={quoteRef} cite="https://example.com">
          Project brief
        </Blockquote>
        <Ol start={2}>
          <Li value={3}>Review</Li>
        </Ol>
        <Field label="Project">
          <Input name="project" required />
        </Field>
        <Button variant="accent">Create</Button>
        <ModularButton unstyled className="custom-button">
          Custom
        </ModularButton>
        <DatePicker value={date} onValueChange={setDate} locale="ar" clearLabel="Clear" />
        <Combobox options={[{ label: 'Design', value: 'design' }]} />
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Project</DialogTitle>
            <DialogDescription>Details</DialogDescription>
          </DialogContent>
        </Dialog>
        <DataTable
          data={[{ id: '1', name: 'Design' }]}
          columns={columns}
          getRowId={(row) => row.id}
        />
      </ThemeScope>
    </PlainProvider>
  );
}
