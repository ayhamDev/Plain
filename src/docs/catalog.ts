import { extendedComponents } from './extended-catalog.ts';

export type Category =
  | 'Actions'
  | 'Forms'
  | 'Navigation'
  | 'Feedback'
  | 'Overlays'
  | 'Layout'
  | 'Virtualization'
  | 'Scheduling'
  | 'Charts'
  | 'Typography'
  | 'Motion';
export interface PropDefinition {
  name: string;
  type: string;
  defaultValue?: string;
  description: string;
}
export interface ComponentDefinition {
  slug: string;
  name: string;
  category: Category;
  description: string;
  imports: string[];
  code: string;
  props: PropDefinition[];
  accessibility: string;
  usage?: string;
  entry?: string;
  setup?: string;
  functionSetup?: string;
  stylesheet?: string;
}
const prop = (
  name: string,
  type: string,
  description: string,
  defaultValue?: string,
): PropDefinition => ({ name, type, description, defaultValue });
const controlled = [
  prop(
    'value / defaultValue',
    'string',
    'Use value for controlled state, or defaultValue for an initial value.',
  ),
  prop('onValueChange', '(value: string) => void', 'Called when the selected value changes.'),
];
const checked = [
  prop(
    'checked / defaultChecked',
    'boolean',
    'Use checked for controlled state, or defaultChecked for an initial state.',
  ),
  prop('onCheckedChange', '(checked: boolean) => void', 'Called when the checked state changes.'),
  prop('disabled', 'boolean', 'Prevents interaction.', 'false'),
];
const overlay = [
  prop('open / defaultOpen', 'boolean', 'Control the open state, or set its initial value.'),
  prop('onOpenChange', '(open: boolean) => void', 'Called when the overlay opens or closes.'),
];
const definition = (
  slug: string,
  name: string,
  category: Category,
  description: string,
  imports: string[],
  code: string,
  props: PropDefinition[],
  accessibility: string,
  usage?: string,
): ComponentDefinition => ({
  slug,
  name,
  category,
  description,
  imports,
  code,
  props,
  accessibility,
  usage,
});

export const components: ComponentDefinition[] = [
  definition(
    'button',
    'Button',
    'Actions',
    'A clear next step. Seven variants, four sizes, and no unnecessary noise.',
    ['Button'],
    '<Button variant="primary">Create project</Button>\n<Button variant="outline">Cancel</Button>\n<Button variant="accent" loading>Saving</Button>',
    [
      prop(
        'variant',
        'primary | accent | secondary | outline | ghost | destructive | link',
        'The visual treatment.',
        'primary',
      ),
      prop(
        'size',
        'xs | sm | md | lg | icon',
        'The control size. md follows the density token.',
        'md',
      ),
      prop('loading', 'boolean', 'Shows a spinner and prevents repeat actions.', 'false'),
      prop('asChild', 'boolean', 'Compose button styling with a single child element.', 'false'),
      prop('disabled', 'boolean', 'Prevents mouse and keyboard activation.', 'false'),
    ],
    'Native button semantics, a visible focus ring, and aria-busy during loading. Provide an aria-label for icon-only buttons.',
    'Use one primary action per section. Use asChild with an anchor when the action navigates.',
  ),
  definition(
    'badge',
    'Badge',
    'Feedback',
    'Small, considered labels for status, counts, and context.',
    ['Badge'],
    '<Badge variant="accent">Active</Badge>\n<Badge variant="outline">Draft</Badge>\n<Badge variant="destructive">Archived</Badge>',
    [
      prop(
        'variant',
        'default | accent | outline | solid | destructive',
        'The visual treatment.',
        'default',
      ),
    ],
    'Status is conveyed in text, as well as color. Use a live region on the parent when a status changes asynchronously.',
  ),
  definition(
    'card',
    'Card',
    'Layout',
    'A quiet frame for related content, with composable structure.',
    ['Card', 'CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'CardFooter', 'Button'],
    '<Card>\n  <CardHeader>\n    <CardTitle>Your next project</CardTitle>\n    <CardDescription>Start with a small idea.</CardDescription>\n  </CardHeader>\n  <CardContent>Make something useful.</CardContent>\n  <CardFooter><Button>Create project</Button></CardFooter>\n</Card>',
    [prop('className', 'string', 'Customize padding, width, or layout on any part.')],
    'CardTitle renders a level-three heading. Match the heading hierarchy of your page when composing card content.',
  ),
  definition(
    'input',
    'Input',
    'Forms',
    'A familiar input with crisp borders and a purposeful focus state.',
    ['Field', 'Input'],
    '<Field label="Email address" required>\n  <Input type="email" placeholder="you@example.com" required />\n</Field>',
    [
      prop(
        'type',
        'HTML input type',
        'Supports email, password, number, date, file, and standard HTML input types.',
        'text',
      ),
      prop('aria-invalid', 'boolean', 'Displays the invalid state.'),
      prop('disabled', 'boolean', 'Prevents interaction.', 'false'),
      prop('value / defaultValue', 'string | number', 'Controlled or uncontrolled input value.'),
    ],
    'Always supply a visible label. Use Field to associate labels, helper text, and validation errors. Native HTML form attributes pass through.',
  ),
  definition(
    'textarea',
    'Textarea',
    'Forms',
    'A little more room for thoughts, notes, and descriptions.',
    ['Field', 'Textarea'],
    '<Field label="Description">\n  <Textarea placeholder="What are you working on?" rows={4} />\n</Field>',
    [
      prop('rows', 'number', 'The initial number of visible text lines.', '3'),
      prop('disabled', 'boolean', 'Prevents interaction.', 'false'),
    ],
    'Use a visible label and associate validation messages with aria-describedby. Textarea supports native form attributes.',
  ),
  definition(
    'label',
    'Label',
    'Forms',
    'A dependable label for every form control.',
    ['Label', 'Input'],
    '<Label htmlFor="project-name">Project name</Label>\n<Input id="project-name" placeholder="My new idea" />',
    [prop('htmlFor', 'string', 'The id of the associated input.')],
    'Clicking the label focuses its associated input. Label is built on Radix Label.',
  ),
  definition(
    'field',
    'Form field',
    'Forms',
    'Labels, hints, and errors, connected automatically.',
    ['Field', 'Input'],
    '<Field label="Project name" description="Visible to your team." error="Please enter a project name." required>\n  <Input placeholder="Untitled project" required />\n</Field>',
    [
      prop('label', 'string', 'Visible text identifying the control.'),
      prop('description', 'string', 'Optional helper text.'),
      prop('error', 'string', 'Validation message; also sets aria-invalid on the child.'),
      prop('required', 'boolean', 'Sets aria-required and displays a required marker.'),
      prop('children', 'ReactElement', 'A single control accepting id and ARIA attributes.'),
    ],
    'Field uses stable React ids and connects the label, description, and error. Required fields still need native required or application validation.',
  ),
  definition(
    'checkbox',
    'Checkbox',
    'Forms',
    'Simple selection, including an indeterminate state.',
    ['Checkbox', 'Label'],
    '<div className="flex items-center gap-2">\n  <Checkbox id="terms" defaultChecked />\n  <Label htmlFor="terms">I agree to the terms</Label>\n</div>',
    [
      prop('checked', 'boolean | "indeterminate"', 'The controlled selection state.'),
      ...checked.slice(1),
      prop('name', 'string', 'Includes the checkbox in native form submission.'),
    ],
    'Space toggles the checkbox. Connect a Label or supply aria-label. Radix handles indeterminate and form semantics.',
  ),
  definition(
    'radio-group',
    'Radio group',
    'Forms',
    'One choice from a short set of mutually exclusive options.',
    ['RadioGroup', 'RadioGroupItem', 'Label'],
    '<RadioGroup defaultValue="monthly" aria-label="Billing period">\n  <div className="flex items-center gap-2">\n    <RadioGroupItem id="monthly" value="monthly" />\n    <Label htmlFor="monthly">Monthly</Label>\n  </div>\n  <div className="flex items-center gap-2">\n    <RadioGroupItem id="yearly" value="yearly" />\n    <Label htmlFor="yearly">Yearly</Label>\n  </div>\n</RadioGroup>',
    controlled,
    'Arrow keys move between choices, and Space selects. Give the group an accessible name and label each option.',
  ),
  definition(
    'switch',
    'Switch',
    'Forms',
    'An immediate on-or-off setting.',
    ['Switch', 'Label'],
    '<div className="flex items-center justify-between gap-8">\n  <Label htmlFor="notifications">Email notifications</Label>\n  <Switch id="notifications" defaultChecked />\n</div>',
    checked,
    'Space and Enter toggle the state. A switch needs a label that describes the setting without changing between states.',
  ),
  definition(
    'select',
    'Select',
    'Forms',
    'A compact choice with keyboard navigation and typeahead.',
    ['Select', 'SelectTrigger', 'SelectValue', 'SelectContent', 'SelectItem'],
    '<Select defaultValue="design">\n  <SelectTrigger aria-label="Department"><SelectValue placeholder="Select department" /></SelectTrigger>\n  <SelectContent>\n    <SelectItem value="design">Design</SelectItem>\n    <SelectItem value="engineering">Engineering</SelectItem>\n    <SelectItem value="marketing">Marketing</SelectItem>\n  </SelectContent>\n</Select>',
    [
      ...controlled,
      prop('name', 'string', 'Includes the value in native form submission.'),
      prop(
        'position',
        'popper | item-aligned',
        'Popper anchors beside the trigger; item-aligned centers the selected option over it. Side, align, and sideOffset apply only to popper.',
        'popper',
      ),
    ],
    'Radix provides focus management, typeahead, arrow keys, Home, End, and Escape. Label SelectTrigger with Field or aria-label.',
  ),
  definition(
    'combobox',
    'Combobox',
    'Forms',
    'Search a longer list without losing your place.',
    ['Combobox'],
    '<Combobox\n  aria-label="Framework"\n  placeholder="Select framework"\n  options={[\n    { value: "react", label: "React" },\n    { value: "next", label: "Next.js" },\n    { value: "astro", label: "Astro" },\n  ]}\n/>',
    [
      prop(
        'options',
        'ComboboxOption[]',
        'Options with value, label, optional disabled, and search keywords.',
      ),
      ...controlled,
      prop('placeholder', 'string', 'Text before selection.', 'Select an option'),
      prop('searchPlaceholder', 'string', 'The search input label.', 'Search options...'),
      prop('name', 'string', 'A hidden input for native form submission.'),
    ],
    'Built on Radix Popover and cmdk. Type to filter, arrow keys to move, Enter to select, and Escape to close.',
  ),
  definition(
    'slider',
    'Slider',
    'Forms',
    'Precise numeric adjustment, from a single value to a range.',
    ['Slider'],
    '<Slider defaultValue={[48]} min={0} max={100} step={1} aria-label="Volume" />\n<Slider defaultValue={[20, 80]} thumbLabels={["Minimum price", "Maximum price"]} />',
    [
      prop('value / defaultValue', 'number[]', 'One value per thumb.'),
      prop('min / max', 'number', 'Range limits.', '0 / 100'),
      prop('step', 'number', 'Increment between values.', '1'),
      prop('thumbLabels', 'string[]', 'Accessible names for individual thumbs.'),
      prop('onValueChange', '(values: number[]) => void', 'Called during adjustment.'),
      prop('onValueCommit', '(values: number[]) => void', 'Called after a completed adjustment.'),
    ],
    'Arrow keys adjust by one step. Home and End jump to limits. Label every thumb when using a range.',
  ),
  definition(
    'toggle',
    'Toggle',
    'Actions',
    'A single pressed state, ideal for compact toolbars.',
    ['Toggle'],
    '<Toggle aria-label="Bold" variant="outline">B</Toggle>',
    [
      prop('pressed / defaultPressed', 'boolean', 'Controlled or initial pressed state.'),
      prop('onPressedChange', '(pressed: boolean) => void', 'Called when toggled.'),
      prop('variant', 'default | outline', 'The visual treatment.', 'default'),
    ],
    'Uses aria-pressed and native button keyboard interaction. Supply aria-label when the content is an icon or abbreviation.',
  ),
  definition(
    'toggle-group',
    'Toggle group',
    'Actions',
    'A set of related toggle buttons with a shared selection model.',
    ['ToggleGroup', 'ToggleGroupItem'],
    '<ToggleGroup type="single" defaultValue="left" aria-label="Text alignment">\n  <ToggleGroupItem value="left" aria-label="Align left">Left</ToggleGroupItem>\n  <ToggleGroupItem value="center" aria-label="Align center">Center</ToggleGroupItem>\n  <ToggleGroupItem value="right" aria-label="Align right">Right</ToggleGroupItem>\n</ToggleGroup>',
    [
      prop('type', 'single | multiple', 'Whether one or several values can be selected.'),
      prop(
        'value / defaultValue',
        'string | string[]',
        'The selection; an array for multiple mode.',
      ),
      prop('onValueChange', '(value) => void', 'Called when selection changes.'),
    ],
    'Arrow keys move focus within the group. Each item exposes its pressed state. Supply a group label and item labels.',
  ),
  definition(
    'accordion',
    'Accordion',
    'Layout',
    'Reveal detail only when it is needed.',
    ['Accordion', 'AccordionItem', 'AccordionTrigger', 'AccordionContent'],
    '<Accordion type="single" collapsible>\n  <AccordionItem value="shipping">\n    <AccordionTrigger>Can I use this commercially?</AccordionTrigger>\n    <AccordionContent>Yes. PlainUI is MIT licensed.</AccordionContent>\n  </AccordionItem>\n</Accordion>',
    [
      prop('type', 'single | multiple', 'Allow one or many expanded sections.'),
      prop('collapsible', 'boolean', 'Allow all sections to close in single mode.', 'false'),
      ...controlled,
    ],
    'Radix provides expanded states, content associations, and arrow-key navigation. Trigger headings retain a clear document structure.',
  ),
  definition(
    'tabs',
    'Tabs',
    'Navigation',
    'Related views, with clear selection and a stable layout.',
    ['Tabs', 'TabsList', 'TabsTrigger', 'TabsContent'],
    '<Tabs defaultValue="account">\n  <TabsList aria-label="Settings sections">\n    <TabsTrigger value="account">Account</TabsTrigger>\n    <TabsTrigger value="security">Security</TabsTrigger>\n  </TabsList>\n  <TabsContent value="account">Your account settings.</TabsContent>\n  <TabsContent value="security">Your security settings.</TabsContent>\n</Tabs>',
    [
      ...controlled,
      prop('variant', 'segmented | underline', 'TabsList presentation.', 'segmented'),
      prop(
        'activationMode',
        'automatic | manual',
        'Whether focus also activates a tab.',
        'automatic',
      ),
    ],
    'Tab enters the tab list; arrow keys move between tabs. Panels are associated with their triggers. Use manual activation for expensive remote views.',
  ),
  definition(
    'dialog',
    'Dialog',
    'Overlays',
    'A focused space for a short task.',
    [
      'Dialog',
      'DialogTrigger',
      'DialogContent',
      'DialogHeader',
      'DialogTitle',
      'DialogDescription',
      'DialogFooter',
      'DialogClose',
      'Button',
    ],
    '<Dialog>\n  <DialogTrigger asChild><Button>Edit profile</Button></DialogTrigger>\n  <DialogContent>\n    <DialogHeader>\n      <DialogTitle>Edit profile</DialogTitle>\n      <DialogDescription>Update your public information.</DialogDescription>\n    </DialogHeader>\n    <DialogFooter><DialogClose asChild><Button>Done</Button></DialogClose></DialogFooter>\n  </DialogContent>\n</Dialog>',
    [
      ...overlay,
      prop('showClose', 'boolean', 'Display the close button on DialogContent.', 'true'),
      prop('modal', 'boolean', 'Trap focus and hide background content.', 'true'),
    ],
    'Focus is trapped while open and restored to the trigger on close. Include DialogTitle and DialogDescription. Escape closes the dialog.',
  ),
  definition(
    'alert-dialog',
    'Alert dialog',
    'Overlays',
    'A deliberate confirmation before an important action.',
    [
      'AlertDialog',
      'AlertDialogTrigger',
      'AlertDialogContent',
      'AlertDialogTitle',
      'AlertDialogDescription',
      'AlertDialogCancel',
      'AlertDialogAction',
      'DialogFooter',
      'Button',
    ],
    '<AlertDialog>\n  <AlertDialogTrigger asChild><Button variant="outline">Delete project</Button></AlertDialogTrigger>\n  <AlertDialogContent>\n    <AlertDialogTitle>Delete this project?</AlertDialogTitle>\n    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>\n    <DialogFooter>\n      <AlertDialogCancel>Cancel</AlertDialogCancel>\n      <AlertDialogAction>Delete project</AlertDialogAction>\n    </DialogFooter>\n  </AlertDialogContent>\n</AlertDialog>',
    overlay,
    'Focus starts on the cancel action. Outside clicks do not dismiss the confirmation. Include a clear title, description, and cancel action.',
  ),
  definition(
    'sheet',
    'Sheet',
    'Overlays',
    'A side panel that keeps the current page in context.',
    [
      'Sheet',
      'SheetTrigger',
      'SheetContent',
      'SheetHeader',
      'SheetTitle',
      'SheetDescription',
      'Button',
    ],
    '<Sheet side="end">\n  <SheetTrigger asChild><Button variant="outline">Open settings</Button></SheetTrigger>\n  <SheetContent>\n    <SheetHeader>\n      <SheetTitle>Project settings</SheetTitle>\n      <SheetDescription>Make this space your own.</SheetDescription>\n    </SheetHeader>\n  </SheetContent>\n</Sheet>',
    [
      ...overlay,
      prop(
        'side',
        'start | end | left | right | top | bottom',
        'Root panel edge. Logical start/end follow the local text direction.',
        'end',
      ),
      prop(
        'snapPoints',
        '(number | string)[]',
        'Optional Vaul snap positions: viewport fractions or pixel strings.',
      ),
      prop(
        'activeSnapPoint',
        'number | string | null',
        'Controlled snap point; pair with setActiveSnapPoint.',
      ),
      prop('dismissible', 'boolean', 'Allow drag, Escape, and outside dismissal.', 'true'),
      prop('showClose', 'boolean', 'Display the SheetContent close control.', 'true'),
    ],
    'Vaul provides focus trapping, touch dragging, and snap points. Include SheetTitle and SheetDescription. SheetHandle can cycle snap points with Enter or Space; Escape restores focus to the trigger.',
    'Set the edge on Sheet so Vaul knows its direction before opening. SheetContent side remains available for compatibility; the root side takes precedence. Portals inherit the nearest ThemeScope.',
  ),
  definition(
    'drawer',
    'Drawer',
    'Overlays',
    'A bottom panel for compact, mobile-friendly tasks.',
    [
      'Drawer',
      'DrawerTrigger',
      'DrawerContent',
      'DrawerHandle',
      'DrawerTitle',
      'DrawerDescription',
      'Button',
    ],
    '<Drawer snapPoints={[0.5, 0.9]}>\n  <DrawerTrigger asChild><Button variant="outline">Quick actions</Button></DrawerTrigger>\n  <DrawerContent>\n    <DrawerHandle />\n    <DrawerTitle>Quick actions</DrawerTitle>\n    <DrawerDescription>Choose your next step.</DrawerDescription>\n  </DrawerContent>\n</Drawer>',
    [
      ...overlay,
      prop('snapPoints', '(number | string)[]', 'Optional fractional or pixel snap positions.'),
      prop(
        'activeSnapPoint',
        'number | string | null',
        'Controlled snap position; pair with setActiveSnapPoint.',
      ),
      prop('dismissible', 'boolean', 'Allow swipe, Escape, and outside dismissal.', 'true'),
      prop('showClose', 'boolean', 'Display the DrawerContent close control.', 'true'),
    ],
    'A Vaul bottom panel with focus trapping, touch gestures, safe-area padding, background dismissal, and Escape support. Include a title and description. The handle supports keyboard snap cycling.',
    'Drawer defaults to the bottom edge and shares the Sheet motion, token, scoped portal, and gesture APIs. Prefer a compact task over putting an entire page in a drawer.',
  ),
  definition(
    'dropdown-menu',
    'Dropdown menu',
    'Overlays',
    'Actions and preferences, right where they are needed.',
    [
      'DropdownMenu',
      'DropdownMenuTrigger',
      'DropdownMenuContent',
      'DropdownMenuItem',
      'DropdownMenuSeparator',
      'Button',
    ],
    '<DropdownMenu>\n  <DropdownMenuTrigger asChild><Button variant="outline">Actions</Button></DropdownMenuTrigger>\n  <DropdownMenuContent align="end">\n    <DropdownMenuItem>Edit project</DropdownMenuItem>\n    <DropdownMenuItem>Duplicate</DropdownMenuItem>\n    <DropdownMenuSeparator />\n    <DropdownMenuItem destructive>Delete project</DropdownMenuItem>\n  </DropdownMenuContent>\n</DropdownMenu>',
    [
      ...overlay,
      prop('align', 'start | center | end', 'Content alignment.', 'center'),
      prop('modal', 'boolean', 'Opt into modal focus and background behavior.', 'false'),
      prop('destructive', 'boolean', 'Danger styling for a menu item.'),
      prop('onSelect', '(event) => void', 'Called when a menu item is activated.'),
    ],
    'Arrow keys navigate; typeahead finds items; Escape restores focus. Checkbox, radio, and submenu variants are also exported.',
  ),
  definition(
    'popover',
    'Popover',
    'Overlays',
    'A small surface for contextual content and controls.',
    ['Popover', 'PopoverTrigger', 'PopoverContent', 'Button'],
    '<Popover>\n  <PopoverTrigger asChild><Button variant="outline">Dimensions</Button></PopoverTrigger>\n  <PopoverContent align="start">Set the width and height of your layout.</PopoverContent>\n</Popover>',
    [
      ...overlay,
      prop('side', 'top | right | bottom | left', 'Preferred placement.', 'bottom'),
      prop('align', 'start | center | end', 'Alignment to the trigger.', 'center'),
      prop('sideOffset', 'number', 'Distance from the trigger in pixels.', '8'),
    ],
    'Focus moves into interactive content and returns on dismissal. Escape closes the popover. Use a dialog for larger or blocking tasks.',
  ),
  definition(
    'tooltip',
    'Tooltip',
    'Overlays',
    'A little context for an unfamiliar icon.',
    ['TooltipProvider', 'Tooltip', 'TooltipTrigger', 'TooltipContent', 'Button'],
    '<TooltipProvider>\n  <Tooltip>\n    <TooltipTrigger asChild><Button variant="outline">Save</Button></TooltipTrigger>\n    <TooltipContent>Save changes</TooltipContent>\n  </Tooltip>\n</TooltipProvider>',
    [
      prop('delayDuration', 'number', 'TooltipProvider delay in milliseconds.', '700'),
      prop('side', 'top | right | bottom | left', 'Placement of TooltipContent.', 'top'),
      ...overlay,
    ],
    'Opens on hover and keyboard focus. A tooltip supplements an accessible name; do not put essential information or interactive controls in it.',
  ),
  definition(
    'command',
    'Command',
    'Actions',
    'A fast, searchable list for destinations and actions.',
    ['Command', 'CommandInput', 'CommandList', 'CommandEmpty', 'CommandGroup', 'CommandItem'],
    '<Command aria-label="Quick actions">\n  <CommandInput placeholder="Search actions..." aria-label="Search actions" />\n  <CommandList>\n    <CommandEmpty>No results found.</CommandEmpty>\n    <CommandGroup heading="Actions">\n      <CommandItem onSelect={() => console.log("New project")}>New project</CommandItem>\n      <CommandItem>Open settings</CommandItem>\n    </CommandGroup>\n  </CommandList>\n</Command>',
    [
      prop('value / defaultValue', 'string', 'Selected command value.'),
      prop('onSelect', '(value: string) => void', 'CommandItem activation handler.'),
      prop('keywords', 'string[]', 'Extra search terms for an item.'),
      prop('shouldFilter', 'boolean', 'Use built-in filtering, or filter externally.', 'true'),
    ],
    'cmdk manages the combobox and listbox interaction. Label the search input. Arrow keys navigate, and Enter activates a command.',
  ),
  definition(
    'alert',
    'Alert',
    'Feedback',
    'Information that deserves a moment of attention.',
    ['Alert', 'AlertTitle', 'AlertDescription'],
    '<Alert variant="success">\n  <AlertTitle>You are all set</AlertTitle>\n  <AlertDescription>Your changes have been saved.</AlertDescription>\n</Alert>',
    [
      prop(
        'variant',
        'info | success | warning | destructive',
        'Semantic treatment and icon.',
        'info',
      ),
      prop('icon', 'ReactNode', 'Replace the default icon.'),
    ],
    'Alert uses role=alert. Use clear text, and reserve alerts for timely messages. Icons and color never carry the only meaning.',
  ),
  definition(
    'toast',
    'Toast',
    'Feedback',
    'Brief feedback that does not interrupt the flow.',
    ['Toaster', 'toast', 'Button'],
    '<>\n  <Button onClick={() => toast.success("Changes saved", { description: "Your team is up to date." })}>Save changes</Button>\n  <Toaster />\n</>',
    [
      prop(
        'position',
        'top-left | top-center | top-right | bottom-left | bottom-center | bottom-right',
        'Placement of the toast stack.',
        'bottom-right (LTR) / bottom-left (RTL)',
      ),
      prop('duration', 'number', 'Display duration in milliseconds.', '4000'),
      prop('closeButton', 'boolean', 'Display an optional close control.', 'false'),
    ],
    'Sonner announces notifications to assistive technology. Add one Toaster at your application root; keep actionable or critical messages visible elsewhere.',
  ),
  definition(
    'avatar',
    'Avatar',
    'Feedback',
    'A person at a glance, with a dependable text fallback.',
    ['Avatar', 'AvatarImage', 'AvatarFallback'],
    '<Avatar size="md">\n  <AvatarImage src="/team/alex.jpg" alt="Alex Morgan" />\n  <AvatarFallback>AM</AvatarFallback>\n</Avatar>',
    [
      prop('size', 'sm | md | lg', 'Avatar dimensions.', 'md'),
      prop('src', 'string', 'AvatarImage source.'),
      prop('delayMs', 'number', 'Delay before AvatarFallback appears.'),
    ],
    'Use meaningful alternative text when the avatar identifies a person. Use empty alt text when the same name appears immediately beside it.',
  ),
  definition(
    'breadcrumb',
    'Breadcrumb',
    'Navigation',
    'A clear path back through the current hierarchy.',
    [
      'Breadcrumb',
      'BreadcrumbList',
      'BreadcrumbItem',
      'BreadcrumbLink',
      'BreadcrumbSeparator',
      'BreadcrumbPage',
    ],
    '<Breadcrumb>\n  <BreadcrumbList>\n    <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>\n    <BreadcrumbSeparator />\n    <BreadcrumbItem><BreadcrumbPage>Projects</BreadcrumbPage></BreadcrumbItem>\n  </BreadcrumbList>\n</Breadcrumb>',
    [prop('href', 'string', 'Destination for BreadcrumbLink.')],
    'The navigation landmark is named Breadcrumb. BreadcrumbPage has aria-current=page, and separators are hidden from assistive technology.',
  ),
  definition(
    'pagination',
    'Pagination',
    'Navigation',
    'A compact way through longer collections.',
    ['Pagination'],
    '<Pagination page={2} pageCount={10} onPageChange={(page) => console.log(page)} />',
    [
      prop('page', 'number', 'The current one-based page.'),
      prop('pageCount', 'number', 'Total number of pages.'),
      prop('onPageChange', '(page: number) => void', 'Called with a one-based page.'),
    ],
    'Controls have descriptive labels, the current page has aria-current, and boundary controls are disabled. Update results when onPageChange fires.',
  ),
  definition(
    'navigation-menu',
    'Navigation menu',
    'Navigation',
    'Top-level destinations with optional, structured submenus.',
    ['NavigationMenu', 'NavigationMenuList', 'NavigationMenuItem', 'NavigationMenuLink'],
    '<NavigationMenu>\n  <NavigationMenuList>\n    <NavigationMenuItem><NavigationMenuLink href="/components">Components</NavigationMenuLink></NavigationMenuItem>\n    <NavigationMenuItem><NavigationMenuLink href="/docs/installation">Documentation</NavigationMenuLink></NavigationMenuItem>\n  </NavigationMenuList>\n</NavigationMenu>',
    controlled,
    'Radix provides keyboard navigation and submenu focus behavior. Links keep native semantics. NavigationMenuTrigger and Content support richer menus.',
  ),
  definition(
    'table',
    'Table',
    'Layout',
    'Semantic, readable rows with just enough structure.',
    ['Table', 'TableHeader', 'TableRow', 'TableHead', 'TableBody', 'TableCell'],
    '<Table aria-label="Projects">\n  <TableHeader><TableRow><TableHead>Project</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>\n  <TableBody><TableRow><TableCell>Website redesign</TableCell><TableCell>Active</TableCell></TableRow></TableBody>\n</Table>',
    [
      prop('className', 'string', 'Customize the table or any structural part.'),
      prop(
        'wrapperProps',
        'HTMLAttributes<HTMLDivElement>',
        'Customize the scroll region and its accessible label.',
      ),
    ],
    'Native table elements preserve row and column relationships. Headers default to scope=col. Use a caption or accessible name. Overflowing tables expose a keyboard-focusable scroll region.',
  ),
  definition(
    'data-table',
    'Data table',
    'Layout',
    'Search, sort, and paginate your data with a typed, headless core.',
    ['DataTable', 'type DataTableColumn'],
    'type Project = { name: string; status: string };\nconst columns: DataTableColumn<Project>[] = [\n  { accessorKey: "name", header: "Project" },\n  { accessorKey: "status", header: "Status" },\n];\nconst data = [\n  { name: "Website redesign", status: "Active" },\n  { name: "Mobile app", status: "Draft" },\n];\n\n<DataTable data={data} columns={columns} caption="Projects" />',
    [
      prop('data', 'T[]', 'Stable array of records.'),
      prop('columns', 'DataTableColumn<T>[]', 'Typed TanStack Table v9 column definitions.'),
      prop('pageSize', 'number', 'Initial records per page.', '10'),
      prop('searchable', 'boolean', 'Show global search.', 'true'),
      prop('loading', 'boolean', 'Display an accessible loading state.'),
      prop('caption', 'string', 'Accessible table name.', 'Records'),
      prop('getRowId', '(row: T) => string', 'Stable record identity, essential for selection.'),
      prop(
        'table',
        'DataTableInstance<T>',
        'Externally owned table from useDataTable; data and columns are then unnecessary.',
      ),
      prop(
        'tableOptions',
        'UseDataTableOptions<T>',
        'TanStack v9 state, per-slice callbacks, manual pagination/filtering/sorting, rowCount and column definitions.',
      ),
      prop(
        'filterFields',
        'DataTableFilterField[]',
        'Column IDs, labels, text/number/date/select/boolean types, options, operators and custom tests.',
      ),
      prop(
        'selectable / columnControls',
        'boolean',
        'Page/row selection and column visibility controls.',
        'false / true',
      ),
      prop(
        'selectionActions',
        '(table) => ReactNode',
        'Application commands for selected IDs, including IDs outside loaded server pages.',
      ),
      prop(
        'pageSizes',
        'number[]',
        'Rows-per-page choices with first/last, range and page jump controls.',
        '[10, 25, 50, 100]',
      ),
      prop(
        'toolbar / footer',
        'ReactNode | (table) => ReactNode',
        'Replace standard controls; DataTableToolbar, DataTableFilters and DataTablePagination are separately exported.',
      ),
      prop(
        'rowProps / renderDetail',
        '(row) => props | ReactNode',
        'Customize row interactions and application-owned detail content.',
      ),
    ],
    'Sort headers are buttons with aria-sort on the column. Search is labeled; loading is announced. Use stable data and column definitions for efficient renders.',
    'Use useDataTable for application-owned state and DataTableView for rendering. Query filters combine with AND/OR and global search; incomplete rules do not filter rows. Date filters compare UTC calendar days, ignoring clock time; use a field test for another timezone or timestamp policy. Manual pagination, sorting and filtering pass requests to your callbacks; provide loaded data and rowCount/pageCount. URL state, persistence and virtualized rendering remain application-owned. Shift-click selects a range in the loaded row order. Use native table options for column pinning/order/visibility, custom accessors and cell renderers.',
  ),
  definition(
    'calendar',
    'Calendar',
    'Forms',
    'Date selection with a familiar month view.',
    ['Calendar'],
    '<Calendar mode="single" defaultMonth={new Date(2026, 9)} />',
    [
      prop('mode', 'single | multiple | range', 'Date selection mode.'),
      prop('selected', 'Date | Date[] | DateRange', 'Selected date(s), depending on mode.'),
      prop('onSelect', '(selection) => void', 'Called when dates are selected.'),
      prop('disabled', 'Matcher | Matcher[]', 'Dates unavailable for selection.'),
      prop('locale', 'Locale', 'Localized calendar labels.'),
      prop('showOutsideDays', 'boolean', 'Show days from adjacent months.', 'true'),
    ],
    'React DayPicker handles calendar keyboard navigation and localized labels. Label the calendar when multiple date controls are present. All DayPicker props are supported.',
  ),
  definition(
    'date-picker',
    'Date picker',
    'Forms',
    'A date control that stays compact until you need it.',
    ['DatePicker'],
    '<DatePicker aria-label="Due date" placeholder="Choose a due date" name="dueDate" />',
    [
      prop('value / defaultValue', 'Date', 'Controlled or initial selected date.'),
      prop('onValueChange', '(date: Date | undefined) => void', 'Called on selection or clearing.'),
      prop('clearable', 'boolean', 'Allow clearing the selected date.', 'true'),
      prop('calendarProps', 'CalendarProps', 'Pass locale, disabled dates, or month limits.'),
      prop(
        'locale',
        'string',
        'Intl locale for the trigger date. Set the calendar locale separately.',
        'en',
      ),
      prop('clearLabel', 'string', 'Localized text for the clear action.', 'Clear date'),
      prop('name', 'string', 'Submits the date in local YYYY-MM-DD format.'),
    ],
    'The trigger opens a keyboard-accessible calendar and restores focus on selection. Provide a visible Field label or aria-label.',
  ),
  definition(
    'progress',
    'Progress',
    'Feedback',
    'A calm, clear indication of how far along a task is.',
    ['Progress'],
    '<Progress value={64} aria-label="Project completion" />',
    [
      prop('value', 'number | null', 'Progress value; null means indeterminate.'),
      prop('max', 'number', 'Maximum value.', '100'),
    ],
    'Radix exposes progressbar semantics, current value, and maximum. Supply an accessible name. Use nearby text to explain the ongoing task.',
  ),
  definition(
    'skeleton',
    'Skeleton',
    'Feedback',
    'A restrained placeholder that preserves the upcoming layout.',
    ['Skeleton'],
    '<div className="flex items-center gap-3">\n  <Skeleton className="size-10 rounded-full" />\n  <div className="space-y-2">\n    <Skeleton className="h-3 w-32" />\n    <Skeleton className="h-3 w-24" />\n  </div>\n</div>',
    [prop('className', 'string', 'Set dimensions to match the loaded content.')],
    'Skeleton is decorative and hidden from screen readers. Mark the loading region aria-busy and provide a status message separately. Reduced motion is respected.',
  ),
  definition(
    'spinner',
    'Spinner',
    'Feedback',
    'A small sign that work is in progress.',
    ['Spinner'],
    '<Spinner label="Loading projects" />',
    [prop('label', 'string', 'Screen reader announcement.', 'Loading')],
    'Uses role=status with visually hidden text. The rotating icon is decorative; animation is disabled under reduced motion.',
  ),
  definition(
    'separator',
    'Separator',
    'Layout',
    'A quiet boundary between related sections.',
    ['Separator'],
    '<Separator />\n<Separator orientation="vertical" className="h-8" />',
    [
      prop('orientation', 'horizontal | vertical', 'Line direction.', 'horizontal'),
      prop('decorative', 'boolean', 'Hide the line from assistive technology.', 'true'),
    ],
    'Decorative separators are hidden. Set decorative=false when the separator conveys a meaningful structural boundary.',
  ),
  definition(
    'scroll-area',
    'Scroll area',
    'Layout',
    'Contained scrolling with a subtle, consistent scrollbar.',
    ['ScrollArea'],
    '<ScrollArea className="h-48">\n  <div className="space-y-4 p-4">\n    {Array.from({ length: 20 }, (_, i) => <p key={i}>Record {i + 1}</p>)}\n  </div>\n</ScrollArea>',
    [prop('type', 'auto | always | scroll | hover', 'Scrollbar visibility.', 'hover')],
    'Radix preserves native scrolling and keyboard navigation. Provide a constrained height. ScrollBar is exported for horizontal scrollbars.',
  ),
  definition(
    'collapsible',
    'Collapsible',
    'Layout',
    'One small section, open or closed.',
    ['Collapsible', 'CollapsibleTrigger', 'CollapsibleContent', 'Button'],
    '<Collapsible>\n  <CollapsibleTrigger asChild><Button variant="outline">Show details</Button></CollapsibleTrigger>\n  <CollapsibleContent>Additional project details.</CollapsibleContent>\n</Collapsible>',
    overlay,
    'Radix connects the trigger and content with aria-expanded and aria-controls. Enter or Space toggles the section.',
  ),
  definition(
    'aspect-ratio',
    'Aspect ratio',
    'Layout',
    'Keep images and media in a predictable frame.',
    ['AspectRatio'],
    '<AspectRatio ratio={16 / 9}>\n  <img src="/landscape.jpg" alt="Mountain landscape" className="size-full object-cover" />\n</AspectRatio>',
    [prop('ratio', 'number', 'Width divided by height.', '1')],
    'A layout utility with no added semantics. Supply appropriate alternative text for the content inside it.',
  ),
  definition(
    'kbd',
    'Keyboard key',
    'Actions',
    'A familiar typographic treatment for keyboard keys.',
    ['Kbd'],
    '<span>Search <Kbd>Ctrl</Kbd> <Kbd>K</Kbd></span>',
    [prop('children', 'ReactNode', 'The key name or symbol.')],
    'Renders the semantic kbd element. Displaying a shortcut does not register it; handle keyboard events in your application.',
  ),
  definition(
    'empty-state',
    'Empty state',
    'Feedback',
    'A useful starting point when there is nothing here yet.',
    ['EmptyState', 'Button'],
    '<EmptyState\n  title="No projects yet"\n  description="Your next idea starts here."\n  action={<Button>Create project</Button>}\n/>',
    [
      prop('title', 'ReactNode', 'Optional shorthand heading.'),
      prop('description', 'ReactNode', 'Optional context or next step.'),
      prop('icon', 'ReactNode', 'A custom decorative icon.'),
      prop('action', 'ReactNode', 'An optional recovery or creation action.'),
      prop(
        'children',
        'ReactNode',
        'Compose EmptyStateIcon, Content, Title, Description and Actions instead of shorthand props.',
      ),
      prop(
        'align / orientation',
        'center | start / vertical | horizontal',
        'Content alignment and arrangement.',
        'center / vertical',
      ),
    ],
    'EmptyState is a layout primitive, not a required application schema. Supply children for arbitrary content, illustrations and actions. EmptyStateTitle is an h3; use a different semantic heading inside Content when the page hierarchy requires it. Native props and refs apply to every part.',
  ),
  ...extendedComponents,
];

export const categories: Category[] = [
  'Actions',
  'Forms',
  'Navigation',
  'Feedback',
  'Overlays',
  'Layout',
  'Virtualization',
  'Scheduling',
  'Charts',
  'Typography',
  'Motion',
];
export const getComponent = (slug: string) =>
  components.find((component) => component.slug === slug);
export function componentCode(component: ComponentDefinition) {
  const imports = `import { ${component.imports.join(', ')} } from '${component.entry ?? '@plain/ui'}';${component.stylesheet ? `\nimport '${component.stylesheet}';` : ''}`;
  const split = component.slug === 'data-table' ? component.code.indexOf('\n\n<DataTable') : -1;
  const prefix = component.setup
    ? `${component.setup}\n\n`
    : split >= 0
      ? `${component.code.slice(0, split)}\n\n`
      : '';
  const jsx = split >= 0 ? component.code.slice(split + 2) : component.code;
  return `${imports}\n\n${prefix}export function Example() {\n${
    component.functionSetup
      ? component.functionSetup
          .split('\n')
          .map((line) => `  ${line}`)
          .join('\n') + '\n'
      : ''
  }  return (\n    <>\n${jsx
    .split('\n')
    .map((line) => `      ${line}`)
    .join('\n')}\n    </>\n  );\n}`;
}
export const guideLinks = [
  { slug: 'introduction', title: 'Introduction' },
  { slug: 'installation', title: 'Installation' },
  { slug: 'versions', title: 'Documentation versions' },
  { slug: 'theming', title: 'Theming' },
  { slug: 'tokens', title: 'Design tokens' },
  { slug: 'accessibility', title: 'Accessibility' },
  { slug: 'performance', title: 'Performance' },
  { slug: 'motion', title: 'Motion' },
  { slug: 'layouts', title: 'Layouts' },
  { slug: 'virtualization', title: 'Virtualization' },
  { slug: 'charts', title: 'Charts' },
  { slug: 'scheduling', title: 'Scheduling' },
];
