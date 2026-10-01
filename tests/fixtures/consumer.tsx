import { useState } from 'react';
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
} from '@plainui/react';
import { Button as ModularButton } from '@plainui/react/primitives';
import '@plainui/react/styles.css';

type Record = { id: string; name: string };
const columns: DataTableColumn<Record>[] = [{ accessorKey: 'name', header: 'Name' }];
const styles: ComponentStyles = { 'button.root': 'rounded-full', 'data-table.root': 'space-y-8' };

export function ConsumerApp() {
  const [date, setDate] = useState<Date>();
  return (
    <PlainProvider dir="rtl" styles={styles} tokens={{ radius: '8px' }} persist={false}>
      <ThemeScope tokens={{ accent: '#1d4ed8' }}>
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
