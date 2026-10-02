import * as React from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Settings,
  CreditCard,
  User,
  Search,
  Check,
  ChevronsUpDown,
  Layers,
} from 'lucide-react';
import * as UI from '../ui';
const ExtendedExamples = React.lazy(() => import('./ExtendedExamples'));
const SheetExample = React.lazy(() => import('./examples/SheetExample'));
import { ProjectDemo, DepartmentSelect, PersonAvatar } from './showcase';

export type Invoice = {
  id: string;
  customer: string;
  email: string;
  status: string;
  amount: number;
};
export const invoices: Invoice[] = [
  { id: 'INV-001', customer: 'Alex Morgan', email: 'alex@studio.co', status: 'Paid', amount: 249 },
  {
    id: 'INV-002',
    customer: 'Sophie Chen',
    email: 'sophie@studio.co',
    status: 'Pending',
    amount: 149,
  },
  {
    id: 'INV-003',
    customer: 'James Wilson',
    email: 'james@studio.co',
    status: 'Paid',
    amount: 399,
  },
  { id: 'INV-004', customer: 'Olivia Park', email: 'olivia@studio.co', status: 'Paid', amount: 79 },
  {
    id: 'INV-005',
    customer: 'Noah Davis',
    email: 'noah@studio.co',
    status: 'Pending',
    amount: 249,
  },
  { id: 'INV-006', customer: 'Emma Taylor', email: 'emma@studio.co', status: 'Paid', amount: 149 },
  { id: 'INV-007', customer: 'Liam Smith', email: 'liam@studio.co', status: 'Paid', amount: 299 },
  {
    id: 'INV-008',
    customer: 'Ava Williams',
    email: 'ava@studio.co',
    status: 'Pending',
    amount: 99,
  },
];
export const invoiceColumns: UI.DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Invoice' },
  {
    accessorKey: 'customer',
    header: 'Customer',
    cell: ({ row }) => (
      <div>
        <strong className="table-customer">{row.original.customer}</strong>
        <span className="table-email">{row.original.email}</span>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <UI.Badge variant={row.original.status === 'Paid' ? 'accent' : 'outline'}>
        {row.original.status}
      </UI.Badge>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => <span className="tabular-nums">${row.original.amount.toFixed(2)}</span>,
  },
];

export function ComponentExample({ slug }: { slug: string }) {
  const id = React.useId();
  const [page, setPage] = React.useState(2);
  const [slider, setSlider] = React.useState([48]);
  const [date, setDate] = React.useState<Date | undefined>(new Date(2026, 9, 14));
  const [input, setInput] = React.useState('');
  const [checked, setChecked] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [billing, setBilling] = React.useState('monthly');
  const saved = () =>
    UI.toast.success('Changes saved', { description: 'Everything is up to date.' });
  switch (slug) {
    case 'button':
      return (
        <div className="demo-wrap">
          <UI.Button onClick={saved}>
            <Plus aria-hidden="true" />
            Create project
          </UI.Button>
          <UI.Button variant="accent" onClick={saved}>
            Publish
          </UI.Button>
          <UI.Button variant="outline" onClick={saved}>
            Outline
          </UI.Button>
          <UI.Button variant="secondary" onClick={saved}>
            Secondary
          </UI.Button>
          <UI.Button variant="ghost" onClick={saved}>
            Ghost
          </UI.Button>
          <UI.Button
            variant="destructive"
            onClick={() => UI.toast.info('Destructive button preview')}
          >
            Delete
          </UI.Button>
          <UI.Button disabled>Disabled</UI.Button>
          <UI.Button loading>Saving</UI.Button>
        </div>
      );
    case 'badge':
      return (
        <div className="demo-wrap">
          <UI.Badge variant="accent">Active</UI.Badge>
          <UI.Badge>In review</UI.Badge>
          <UI.Badge variant="outline">Draft</UI.Badge>
          <UI.Badge variant="solid">New</UI.Badge>
          <UI.Badge variant="destructive">Archived</UI.Badge>
        </div>
      );
    case 'card':
      return (
        <div className="demo-bordered">
          <ProjectDemo />
        </div>
      );
    case 'input':
      return (
        <div className="demo-form-stack">
          <UI.Field label="Email address">
            <UI.Input type="email" placeholder="you@example.com" />
          </UI.Field>
          <UI.Field label="Project name">
            <UI.Input
              placeholder="Your next idea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </UI.Field>
          <UI.Input aria-label="Disabled input example" placeholder="A disabled field" disabled />
        </div>
      );
    case 'textarea':
      return (
        <div className="demo-form-stack">
          <UI.Field label="Description" description={`${input.length}/240 characters`}>
            <UI.Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell us a little about your project..."
              maxLength={240}
              rows={4}
            />
          </UI.Field>
        </div>
      );
    case 'label':
      return (
        <div className="demo-form-stack">
          <UI.Label htmlFor={id}>Project name</UI.Label>
          <UI.Input id={id} placeholder="Your next idea" />
        </div>
      );
    case 'field':
      return (
        <div className="demo-form-stack">
          <UI.Field
            label="Project name"
            description="Visible to everyone on your team."
            required
            error={!input ? 'Please enter a project name.' : undefined}
          >
            <UI.Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Untitled project"
              required
            />
          </UI.Field>
        </div>
      );
    case 'checkbox':
      return (
        <div className="demo-form-stack">
          <div className="demo-check-row">
            <UI.Checkbox
              id={id}
              checked={checked}
              onCheckedChange={(value) => setChecked(value === true)}
            />
            <UI.Label htmlFor={id}>Keep me in the loop</UI.Label>
          </div>
          <div className="demo-check-row">
            <UI.Checkbox id={`${id}-mixed`} checked="indeterminate" />
            <UI.Label htmlFor={`${id}-mixed`}>Some items selected</UI.Label>
          </div>
          <div className="demo-check-row">
            <UI.Checkbox id={`${id}-disabled`} disabled />
            <UI.Label htmlFor={`${id}-disabled`}>Not available</UI.Label>
          </div>
        </div>
      );
    case 'radio-group':
      return (
        <UI.RadioGroup value={billing} onValueChange={setBilling} aria-label="Billing period">
          <div className="demo-check-row">
            <UI.RadioGroupItem value="monthly" id={`${id}-monthly`} />
            <UI.Label htmlFor={`${id}-monthly`}>Monthly billing</UI.Label>
          </div>
          <div className="demo-check-row">
            <UI.RadioGroupItem value="yearly" id={`${id}-yearly`} />
            <UI.Label htmlFor={`${id}-yearly`}>
              Yearly billing <UI.Badge variant="accent">Save 20%</UI.Badge>
            </UI.Label>
          </div>
        </UI.RadioGroup>
      );
    case 'switch':
      return (
        <div className="demo-form-stack">
          <div className="demo-check-row demo-between">
            <UI.Label htmlFor={id}>Email notifications</UI.Label>
            <UI.Switch id={id} checked={checked} onCheckedChange={setChecked} />
          </div>
          <div className="demo-check-row demo-between">
            <UI.Label htmlFor={`${id}-disabled`}>Maintenance mode</UI.Label>
            <UI.Switch id={`${id}-disabled`} disabled />
          </div>
        </div>
      );
    case 'select':
      return (
        <div className="demo-form-stack">
          <UI.Label htmlFor={id}>Department</UI.Label>
          <DepartmentSelect id={id} />
        </div>
      );
    case 'combobox':
      return (
        <div className="demo-form-stack">
          <UI.Combobox
            aria-label="Framework"
            placeholder="Select framework"
            options={[
              { value: 'react', label: 'React' },
              { value: 'next', label: 'Next.js' },
              { value: 'astro', label: 'Astro' },
              { value: 'remix', label: 'Remix' },
              { value: 'vue', label: 'Vue', disabled: true },
            ]}
          />
        </div>
      );
    case 'slider':
      return (
        <div className="demo-form-stack">
          <div className="demo-between">
            <UI.Label htmlFor={id}>Volume</UI.Label>
            <output>{slider[0]}%</output>
          </div>
          <UI.Slider id={id} value={slider} onValueChange={setSlider} aria-label="Volume" />
          <UI.Label>Price range</UI.Label>
          <UI.Slider defaultValue={[20, 80]} thumbLabels={['Minimum price', 'Maximum price']} />
        </div>
      );
    case 'toggle':
      return (
        <div className="demo-wrap">
          <UI.Toggle aria-label="Bold" variant="outline">
            <Bold aria-hidden="true" />
          </UI.Toggle>
          <UI.Toggle aria-label="Italic" variant="outline">
            <Italic aria-hidden="true" />
          </UI.Toggle>
          <UI.Toggle aria-label="Underline" variant="outline">
            <Underline aria-hidden="true" />
          </UI.Toggle>
        </div>
      );
    case 'toggle-group':
      return (
        <UI.ToggleGroup type="single" defaultValue="left" aria-label="Text alignment">
          <UI.ToggleGroupItem value="left" aria-label="Align left">
            <AlignLeft aria-hidden="true" />
          </UI.ToggleGroupItem>
          <UI.ToggleGroupItem value="center" aria-label="Align center">
            <AlignCenter aria-hidden="true" />
          </UI.ToggleGroupItem>
          <UI.ToggleGroupItem value="right" aria-label="Align right">
            <AlignRight aria-hidden="true" />
          </UI.ToggleGroupItem>
        </UI.ToggleGroup>
      );
    case 'accordion':
      return (
        <div className="demo-form-stack">
          <UI.Accordion type="single" collapsible defaultValue="license">
            {[
              [
                'license',
                'Can I use this commercially?',
                'Yes. PlainUI is MIT licensed, including commercial projects.',
              ],
              [
                'customize',
                'Can I make it my own?',
                'Every component accepts native props, classes, styles, and unstyled mode. Shared tokens and named slots connect the system.',
              ],
              [
                'rtl',
                'Does it work right to left?',
                'Yes. Direction-aware primitives and logical spacing support RTL layouts.',
              ],
            ].map(([value, title, body]) => (
              <UI.AccordionItem key={value} value={value}>
                <UI.AccordionTrigger>{title}</UI.AccordionTrigger>
                <UI.AccordionContent>{body}</UI.AccordionContent>
              </UI.AccordionItem>
            ))}
          </UI.Accordion>
        </div>
      );
    case 'tabs':
      return (
        <div className="demo-form-stack">
          <UI.Tabs defaultValue="account">
            <UI.TabsList aria-label="Settings sections">
              <UI.TabsTrigger value="account">Account</UI.TabsTrigger>
              <UI.TabsTrigger value="security">Security</UI.TabsTrigger>
              <UI.TabsTrigger value="billing">Billing</UI.TabsTrigger>
            </UI.TabsList>
            <UI.TabsContent value="account">
              <UI.Field label="Display name">
                <UI.Input defaultValue="Alex Morgan" />
              </UI.Field>
            </UI.TabsContent>
            <UI.TabsContent value="security">
              <UI.Field label="New password">
                <UI.Input
                  type="password"
                  placeholder="Enter a new password"
                  autoComplete="new-password"
                />
              </UI.Field>
            </UI.TabsContent>
            <UI.TabsContent value="billing">
              <DepartmentSelect />
            </UI.TabsContent>
          </UI.Tabs>
        </div>
      );
    case 'dialog':
      return (
        <UI.Dialog open={open} onOpenChange={setOpen}>
          <UI.DialogTrigger asChild>
            <UI.Button variant="outline">Edit profile</UI.Button>
          </UI.DialogTrigger>
          <UI.DialogContent>
            <UI.DialogHeader>
              <UI.DialogTitle>Edit profile</UI.DialogTitle>
              <UI.DialogDescription>Update your public information.</UI.DialogDescription>
            </UI.DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setOpen(false);
                saved();
              }}
            >
              <UI.Field label="Display name">
                <UI.Input defaultValue="Alex Morgan" required />
              </UI.Field>
              <UI.DialogFooter>
                <UI.DialogClose asChild>
                  <UI.Button variant="outline">Cancel</UI.Button>
                </UI.DialogClose>
                <UI.Button type="submit">Save changes</UI.Button>
              </UI.DialogFooter>
            </form>
          </UI.DialogContent>
        </UI.Dialog>
      );
    case 'alert-dialog':
      return (
        <UI.AlertDialog>
          <UI.AlertDialogTrigger asChild>
            <UI.Button variant="outline">Delete project</UI.Button>
          </UI.AlertDialogTrigger>
          <UI.AlertDialogContent>
            <UI.AlertDialogTitle>Delete this project?</UI.AlertDialogTitle>
            <UI.AlertDialogDescription>
              This action cannot be undone. The project and its associated files will be removed.
            </UI.AlertDialogDescription>
            <UI.DialogFooter>
              <UI.AlertDialogCancel>Cancel</UI.AlertDialogCancel>
              <UI.AlertDialogAction onClick={() => UI.toast.success('Demo project deleted')}>
                Delete project
              </UI.AlertDialogAction>
            </UI.DialogFooter>
          </UI.AlertDialogContent>
        </UI.AlertDialog>
      );
    case 'sheet':
      return (
        <React.Suspense fallback={<UI.Spinner />}>
          <SheetExample />
        </React.Suspense>
      );
    case 'drawer':
      return (
        <UI.Drawer>
          <UI.DrawerTrigger asChild>
            <UI.Button variant="outline">Quick actions</UI.Button>
          </UI.DrawerTrigger>
          <UI.DrawerContent>
            <div className="drawer-demo-content">
              <UI.DrawerTitle>What is next?</UI.DrawerTitle>
              <UI.DrawerDescription>Choose a next step for your project.</UI.DrawerDescription>
              <div className="demo-wrap">
                <UI.DrawerClose asChild>
                  <UI.Button onClick={() => UI.toast.success('Demo project created')}>
                    <Plus aria-hidden="true" />
                    New project
                  </UI.Button>
                </UI.DrawerClose>
                <UI.DrawerClose asChild>
                  <UI.Button variant="outline">Back to work</UI.Button>
                </UI.DrawerClose>
              </div>
            </div>
          </UI.DrawerContent>
        </UI.Drawer>
      );
    case 'dropdown-menu':
      return (
        <UI.DropdownMenu>
          <UI.DropdownMenuTrigger asChild>
            <UI.Button variant="outline">
              Project actions
              <ChevronsUpDown aria-hidden="true" />
            </UI.Button>
          </UI.DropdownMenuTrigger>
          <UI.DropdownMenuContent>
            <UI.DropdownMenuLabel>Project</UI.DropdownMenuLabel>
            <UI.DropdownMenuItem onSelect={saved}>
              <Settings aria-hidden="true" />
              Edit project
            </UI.DropdownMenuItem>
            <UI.DropdownMenuItem onSelect={saved}>
              <Layers aria-hidden="true" />
              Duplicate
            </UI.DropdownMenuItem>
            <UI.DropdownMenuSeparator />
            <UI.DropdownMenuCheckboxItem checked={checked} onCheckedChange={setChecked}>
              Show archived
            </UI.DropdownMenuCheckboxItem>
            <UI.DropdownMenuSub>
              <UI.DropdownMenuSubTrigger>Move to</UI.DropdownMenuSubTrigger>
              <UI.DropdownMenuSubContent>
                <UI.DropdownMenuItem onSelect={saved}>Personal workspace</UI.DropdownMenuItem>
                <UI.DropdownMenuItem onSelect={saved}>Team workspace</UI.DropdownMenuItem>
              </UI.DropdownMenuSubContent>
            </UI.DropdownMenuSub>
            <UI.DropdownMenuSeparator />
            <UI.DropdownMenuItem
              destructive
              onSelect={() => UI.toast.info('Demo project archived')}
            >
              Archive project
            </UI.DropdownMenuItem>
          </UI.DropdownMenuContent>
        </UI.DropdownMenu>
      );
    case 'popover':
      return (
        <UI.Popover>
          <UI.PopoverTrigger asChild>
            <UI.Button variant="outline">Dimensions</UI.Button>
          </UI.PopoverTrigger>
          <UI.PopoverContent className="w-64" align="start">
            <div className="demo-form-stack">
              <UI.Field label="Width">
                <UI.Input type="number" defaultValue={1280} min={1} />
              </UI.Field>
              <UI.Field label="Height">
                <UI.Input type="number" defaultValue={720} min={1} />
              </UI.Field>
            </div>
          </UI.PopoverContent>
        </UI.Popover>
      );
    case 'tooltip':
      return (
        <UI.Tooltip>
          <UI.TooltipTrigger asChild>
            <UI.Button variant="outline" size="icon" aria-label="Project settings">
              <Settings aria-hidden="true" />
            </UI.Button>
          </UI.TooltipTrigger>
          <UI.TooltipContent>Project settings</UI.TooltipContent>
        </UI.Tooltip>
      );
    case 'command':
      return (
        <div className="demo-bordered">
          <UI.Command label="Quick actions">
            <UI.CommandInput aria-label="Search actions" placeholder="What would you like to do?" />
            <UI.CommandList>
              <UI.CommandEmpty>No results found.</UI.CommandEmpty>
              <UI.CommandGroup heading="Quick actions">
                <UI.CommandItem onSelect={saved}>
                  <Plus aria-hidden="true" />
                  New project
                </UI.CommandItem>
                <UI.CommandItem onSelect={saved}>
                  <User aria-hidden="true" />
                  Invite a teammate
                </UI.CommandItem>
                <UI.CommandItem onSelect={saved}>
                  <CreditCard aria-hidden="true" />
                  Billing
                </UI.CommandItem>
              </UI.CommandGroup>
              <UI.CommandSeparator />
              <UI.CommandGroup heading="Preferences">
                <UI.CommandItem onSelect={saved}>
                  <Settings aria-hidden="true" />
                  Settings
                </UI.CommandItem>
              </UI.CommandGroup>
            </UI.CommandList>
          </UI.Command>
        </div>
      );
    case 'alert':
      return (
        <div className="demo-form-stack demo-wide">
          <UI.Alert variant="success">
            <UI.AlertTitle>You are all set</UI.AlertTitle>
            <UI.AlertDescription>Your changes have been saved.</UI.AlertDescription>
          </UI.Alert>
          <UI.Alert variant="destructive">
            <UI.AlertTitle>Something needs your attention</UI.AlertTitle>
            <UI.AlertDescription>Please check your payment details.</UI.AlertDescription>
          </UI.Alert>
        </div>
      );
    case 'toast':
      return (
        <div className="demo-wrap">
          <UI.Button variant="outline" onClick={saved}>
            <Check aria-hidden="true" />
            Success
          </UI.Button>
          <UI.Button
            variant="outline"
            onClick={() =>
              UI.toast.error('Something went wrong', { description: 'Please try again.' })
            }
          >
            Error
          </UI.Button>
          <UI.Button
            variant="outline"
            onClick={() =>
              UI.toast('Project archived', {
                action: { label: 'Undo', onClick: () => UI.toast.success('Project restored') },
              })
            }
          >
            With action
          </UI.Button>
        </div>
      );
    case 'avatar':
      return (
        <div className="demo-wrap">
          <PersonAvatar size="lg" />
          <PersonAvatar index={1} />
          <PersonAvatar index={2} size="sm" />
          <UI.Avatar>
            <UI.AvatarFallback>JD</UI.AvatarFallback>
          </UI.Avatar>
        </div>
      );
    case 'breadcrumb':
      return (
        <UI.Breadcrumb>
          <UI.BreadcrumbList>
            <UI.BreadcrumbItem>
              <UI.BreadcrumbLink href="/">Home</UI.BreadcrumbLink>
            </UI.BreadcrumbItem>
            <UI.BreadcrumbSeparator />
            <UI.BreadcrumbItem>
              <UI.BreadcrumbLink href="/examples">Projects</UI.BreadcrumbLink>
            </UI.BreadcrumbItem>
            <UI.BreadcrumbSeparator />
            <UI.BreadcrumbItem>
              <UI.BreadcrumbPage>Website redesign</UI.BreadcrumbPage>
            </UI.BreadcrumbItem>
          </UI.BreadcrumbList>
        </UI.Breadcrumb>
      );
    case 'pagination':
      return (
        <div className="demo-form-stack">
          <UI.Pagination page={page} pageCount={10} onPageChange={setPage} />
          <p className="demo-muted" role="status">
            Page {page} of 10
          </p>
        </div>
      );
    case 'navigation-menu':
      return (
        <UI.NavigationMenu>
          <UI.NavigationMenuList>
            <UI.NavigationMenuItem>
              <UI.NavigationMenuTrigger>Explore</UI.NavigationMenuTrigger>
              <UI.NavigationMenuContent>
                <UI.NavigationMenuLink href="/components">Components</UI.NavigationMenuLink>
                <UI.NavigationMenuLink href="/docs/installation">
                  Documentation
                </UI.NavigationMenuLink>
              </UI.NavigationMenuContent>
            </UI.NavigationMenuItem>
            <UI.NavigationMenuItem>
              <UI.NavigationMenuLink href="/examples">Examples</UI.NavigationMenuLink>
            </UI.NavigationMenuItem>
          </UI.NavigationMenuList>
        </UI.NavigationMenu>
      );
    case 'table':
      return (
        <div className="demo-table">
          <UI.Table aria-label="Recent invoices">
            <UI.TableHeader>
              <UI.TableRow>
                <UI.TableHead>Invoice</UI.TableHead>
                <UI.TableHead>Status</UI.TableHead>
                <UI.TableHead>Amount</UI.TableHead>
              </UI.TableRow>
            </UI.TableHeader>
            <UI.TableBody>
              {invoices.slice(0, 4).map((invoice) => (
                <UI.TableRow key={invoice.id}>
                  <UI.TableCell>{invoice.id}</UI.TableCell>
                  <UI.TableCell>
                    <UI.Badge variant={invoice.status === 'Paid' ? 'accent' : 'outline'}>
                      {invoice.status}
                    </UI.Badge>
                  </UI.TableCell>
                  <UI.TableCell>${invoice.amount.toFixed(2)}</UI.TableCell>
                </UI.TableRow>
              ))}
            </UI.TableBody>
          </UI.Table>
        </div>
      );
    case 'data-table':
      return (
        <div className="demo-table">
          <UI.DataTable
            data={invoices}
            columns={invoiceColumns}
            caption="Customer invoices"
            getRowId={(invoice) => invoice.id}
            pageSize={5}
            selectable
            filterFields={[
              {
                id: 'status',
                label: 'Status',
                type: 'select',
                options: [
                  { value: 'Paid', label: 'Paid' },
                  { value: 'Pending', label: 'Pending' },
                ],
              },
              { id: 'amount', label: 'Amount', type: 'number' },
              { id: 'customer', label: 'Customer', type: 'text' },
            ]}
            selectionActions={(table) => (
              <UI.Button size="sm" variant="outline" onClick={() => table.resetRowSelection(true)}>
                Clear selected invoices
              </UI.Button>
            )}
          />
        </div>
      );
    case 'calendar':
      return (
        <UI.Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          defaultMonth={new Date(2026, 9)}
          aria-label="Select project date"
        />
      );
    case 'date-picker':
      return (
        <div className="demo-form-stack">
          <UI.Field label="Due date">
            <UI.DatePicker value={date} onValueChange={setDate} name="due-date" />
          </UI.Field>
        </div>
      );
    case 'progress':
      return (
        <div className="demo-form-stack">
          <div className="demo-between">
            <UI.Label>Project completion</UI.Label>
            <output>{slider[0]}%</output>
          </div>
          <UI.Progress value={slider[0]} aria-label="Project completion" />
          <UI.Slider
            value={slider}
            onValueChange={setSlider}
            aria-label="Adjust project completion"
          />
        </div>
      );
    case 'skeleton':
      return (
        <div
          className="demo-form-stack"
          role="status"
          aria-label="Loading profile preview"
          aria-busy="true"
        >
          <div className="demo-check-row">
            <UI.Skeleton className="size-10 rounded-full" />
            <div className="space-y-2">
              <UI.Skeleton className="h-3 w-36" />
              <UI.Skeleton className="h-3 w-24" />
            </div>
          </div>
          <UI.Skeleton className="h-24 w-full" />
        </div>
      );
    case 'spinner':
      return (
        <div className="demo-check-row">
          <UI.Spinner label="Loading projects" />
          <span className="demo-muted">Loading projects</span>
        </div>
      );
    case 'separator':
      return (
        <div className="demo-form-stack">
          <span>Account</span>
          <UI.Separator />
          <div className="demo-check-row">
            <span>Profile</span>
            <UI.Separator orientation="vertical" className="h-5" />
            <span>Settings</span>
            <UI.Separator orientation="vertical" className="h-5" />
            <span>Security</span>
          </div>
        </div>
      );
    case 'scroll-area':
      return (
        <UI.ScrollArea className="h-56 w-72 rounded-ui border">
          <div className="p-4">
            <h3 className="mb-3 text-sm font-medium">Your projects</h3>
            {Array.from({ length: 20 }, (_, i) => (
              <div className="border-b py-2 text-sm last:border-0" key={i}>
                Project {String(i + 1).padStart(2, '0')}
              </div>
            ))}
          </div>
        </UI.ScrollArea>
      );
    case 'collapsible':
      return (
        <UI.Collapsible open={open} onOpenChange={setOpen} className="demo-form-stack">
          <UI.CollapsibleTrigger asChild>
            <UI.Button variant="outline">
              {open ? 'Hide' : 'Show'} project details
              <ChevronsUpDown aria-hidden="true" />
            </UI.Button>
          </UI.CollapsibleTrigger>
          <UI.CollapsibleContent>
            <p className="demo-muted">
              Started October 1. Five people are making good things happen.
            </p>
          </UI.CollapsibleContent>
        </UI.Collapsible>
      );
    case 'aspect-ratio':
      return (
        <div className="aspect-demo">
          <UI.AspectRatio ratio={16 / 9}>
            <img
              src="https://images.unsplash.com/photo-1472396961693-142e6e269027?w=900&auto=format&fit=crop&q=80"
              alt="Sunlit mountain landscape with forest and a lake"
              loading="lazy"
            />
          </UI.AspectRatio>
        </div>
      );
    case 'kbd':
      return (
        <div className="demo-check-row demo-muted">
          <Search size={16} aria-hidden="true" />
          Search anything <UI.Kbd>Ctrl</UI.Kbd>
          <UI.Kbd>K</UI.Kbd>
        </div>
      );
    case 'empty-state':
      return (
        <UI.EmptyState
          title="Room for your next idea"
          description="No projects yet. Start with something small."
          action={
            <UI.Button onClick={() => UI.toast.success('Your first demo project is ready')}>
              <Plus aria-hidden="true" />
              Create project
            </UI.Button>
          }
        />
      );
    default:
      return (
        <React.Suspense fallback={<UI.Spinner label="Loading example" />}>
          <ExtendedExamples slug={slug} />
        </React.Suspense>
      );
  }
}
