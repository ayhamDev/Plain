import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Plus,
  MoreHorizontal,
  Mail,
  Bell,
  Check,
  Folder,
  Globe,
  ArrowRight,
  Settings2,
  Fingerprint,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';
import {
  Button,
  Badge,
  Field,
  Input,
  Label,
  Checkbox,
  Switch,
  Progress,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  toast,
  cn,
} from '@plain/ui';

export const teamMembers = [
  {
    name: 'Alex Morgan',
    email: 'alex@studio.co',
    initials: 'AM',
    photo:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces&auto=format',
    role: 'Owner',
  },
  {
    name: 'Sophie Chen',
    email: 'sophie@studio.co',
    initials: 'SC',
    photo:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=faces&auto=format',
    role: 'Editor',
  },
  {
    name: 'James Wilson',
    email: 'james@studio.co',
    initials: 'JW',
    photo:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces&auto=format',
    role: 'Viewer',
  },
];
export function PersonAvatar({
  index = 0,
  size = 'md',
}: {
  index?: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const person = teamMembers[index % teamMembers.length];
  return (
    <Avatar size={size}>
      <AvatarImage src={person.photo} alt={person.name} loading="lazy" />
      <AvatarFallback>{person.initials}</AvatarFallback>
    </Avatar>
  );
}

export function LoginDemo() {
  const id = React.useId();
  const [busy, setBusy] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div className="login-demo">
      <div className="demo-mark">
        <div className="plain-mark" aria-hidden="true">
          p<span />
        </div>
      </div>
      <h3>Welcome back</h3>
      <p>A fresh start to your day.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          timer.current = setTimeout(() => {
            setBusy(false);
            toast.success('Welcome back', {
              description: 'You are signed in to the demo workspace.',
            });
          }, 600);
        }}
      >
        <Field label="Email">
          <Input
            type="email"
            placeholder="you@example.com"
            name="email"
            required
            autoComplete="email"
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            placeholder="Enter your password"
            name="password"
            required
            minLength={6}
            autoComplete="current-password"
          />
        </Field>
        <div className="login-options">
          <div>
            <Checkbox id={id} />
            <Label htmlFor={id}>Remember me</Label>
          </div>
          <Button
            variant="link"
            size="sm"
            type="button"
            onClick={() =>
              toast.info('Password reset', { description: 'This preview does not send email.' })
            }
          >
            Forgot password?
          </Button>
        </div>
        <Button type="submit" className="demo-full-button" loading={busy}>
          Sign in
          <ArrowRight aria-hidden="true" />
        </Button>
      </form>
      <div className="login-divider">
        <span />
        or continue with
        <span />
      </div>
      <Button
        variant="outline"
        className="demo-full-button"
        onClick={() =>
          toast.info('Single sign-on', {
            description: 'Connect your authentication provider in your app.',
          })
        }
      >
        <Fingerprint aria-hidden="true" />
        Single sign-on
      </Button>
    </div>
  );
}

export function ProjectDemo() {
  const [complete, setComplete] = React.useState(68);
  const [title, setTitle] = React.useState('Website redesign');
  const [draft, setDraft] = React.useState(title);
  const [open, setOpen] = React.useState(false);
  return (
    <div className="project-demo">
      <div className="demo-title-row">
        <div className="project-icon">
          <Folder size={18} aria-hidden="true" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Project actions">
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                setDraft(title);
                setOpen(true);
              }}
            >
              Rename project
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                setComplete(100);
                toast.success('Project marked complete');
              }}
            >
              Mark complete
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                navigator.clipboard.writeText(`${location.origin}/examples`).then(
                  () => toast.success('Project example link copied'),
                  () => toast.error('Could not copy the link'),
                );
              }}
            >
              Share project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="project-heading">
        <h3>{title}</h3>
        <Badge variant="accent">{complete === 100 ? 'Complete' : 'In progress'}</Badge>
      </div>
      <p>Good things are taking shape.</p>
      <div className="project-progress-label">
        <span>Project progress</span>
        <span>{complete}%</span>
      </div>
      <Progress value={complete} aria-label="Project progress" />
      <div className="project-footer">
        <div className="avatar-stack">
          {teamMembers.map((_, i) => (
            <PersonAvatar key={i} index={i} size="sm" />
          ))}
          <span>+2</span>
        </div>
        <span>Due Oct 24</span>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
            <DialogDescription>Give your project a clear, memorable name.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setTitle(draft.trim());
              setOpen(false);
              toast.success('Project renamed');
            }}
          >
            <Field label="Project name">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                required
                minLength={1}
              />
            </Field>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={!draft.trim()}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function TeamDemo() {
  const [roles, setRoles] = React.useState(teamMembers.map((p) => p.role));
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [invites, setInvites] = React.useState(0);
  return (
    <div className="team-demo">
      <div className="demo-title-row">
        <h3>Your team</h3>
        <Badge variant="outline">{3 + invites} members</Badge>
      </div>
      <p>Better things, together.</p>
      <div className="team-list">
        {teamMembers.map((member, i) => (
          <div className="team-person" key={member.name}>
            <PersonAvatar index={i} />
            <div>
              <strong>{member.name}</strong>
              <span>{member.email}</span>
            </div>
            {i === 0 ? (
              <span className="team-role">Owner</span>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="xs" className="team-role-button">
                    {roles[i]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {['Editor', 'Viewer'].map((role) => (
                    <DropdownMenuItem
                      key={role}
                      onSelect={() =>
                        setRoles((current) => current.map((r, index) => (index === i ? role : r)))
                      }
                    >
                      {role}
                      {roles[i] === role && <Check className="ms-auto" aria-hidden="true" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </div>
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="demo-full-button">
            <Plus aria-hidden="true" />
            Invite a teammate
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>A little more teamwork</DialogTitle>
            <DialogDescription>Invite someone to your demo workspace.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              setInvites((n) => n + 1);
              setInviteOpen(false);
              toast.success('Invitation added', {
                description: `${form.get('invite-email')} added to the demo invitation list.`,
              });
            }}
          >
            <Field label="Email address">
              <Input type="email" name="invite-email" required placeholder="teammate@example.com" />
            </Field>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Add invitation</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PreferencesDemo() {
  const [email, setEmail] = React.useState(true);
  const [push, setPush] = React.useState(false);
  const id = React.useId();
  return (
    <div className="preferences-demo">
      <div className="demo-title-row">
        <h3>Stay in the loop</h3>
        <Bell size={16} className="muted-icon" aria-hidden="true" />
      </div>
      <div className="preference-row">
        <Mail size={16} aria-hidden="true" />
        <div>
          <Label htmlFor={`${id}-email`}>Email notifications</Label>
          <p>The important updates.</p>
        </div>
        <Switch id={`${id}-email`} checked={email} onCheckedChange={setEmail} />
      </div>
      <div className="preference-row">
        <Globe size={16} aria-hidden="true" />
        <div>
          <Label htmlFor={`${id}-push`}>Push notifications</Label>
          <p>A little nudge, in real time.</p>
        </div>
        <Switch id={`${id}-push`} checked={push} onCheckedChange={setPush} />
      </div>
    </div>
  );
}

export function ButtonsDemo() {
  const [saved, setSaved] = React.useState(false);
  return (
    <div className="buttons-demo">
      <div className="button-demo-row">
        <Button size="sm" onClick={() => toast.success('Project created')}>
          <Plus aria-hidden="true" />
          New project
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSaved((p) => !p);
            toast.success(saved ? 'Changes reset' : 'Changes saved');
          }}
        >
          {saved ? <Check aria-hidden="true" /> : null}
          {saved ? 'Saved' : 'Save changes'}
        </Button>
      </div>
      <div className="button-demo-row">
        <Button variant="accent" size="sm" onClick={() => toast.success('Ready to launch')}>
          <ArrowUpRight aria-hidden="true" />
          Publish
        </Button>
        <Button variant="ghost" size="sm" onClick={() => toast.info('Action cancelled')}>
          Cancel
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Open project settings"
          onClick={() => toast.info('Open the Settings example for project preferences.')}
        >
          <Settings2 aria-hidden="true" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Open component documentation" asChild>
          <Link to="/components/button">
            <ExternalLink aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

const LazyCalendarDemo = React.lazy(() => import('./CalendarDemo'));
export function CalendarDemo() {
  return (
    <React.Suspense fallback={<div className="calendar-placeholder" aria-busy="true" />}>
      <LazyCalendarDemo />
    </React.Suspense>
  );
}

export function BillingDemo() {
  const [cycle, setCycle] = React.useState('monthly');
  return (
    <div className="billing-demo">
      <div className="demo-title-row">
        <h3>A little more possibility</h3>
        <Badge variant="outline">Pro</Badge>
      </div>
      <p>For your next big thing.</p>
      <Tabs value={cycle} onValueChange={setCycle}>
        <TabsList aria-label="Billing period">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">
            Yearly<Badge variant="accent">-20%</Badge>
          </TabsTrigger>
        </TabsList>
        {['monthly', 'yearly'].map((value) => (
          <TabsContent key={value} value={value}>
            <div className="billing-amount">
              ${value === 'monthly' ? '19' : '15'}
              <span>/ month</span>
            </div>
            <div className="billing-details">
              <span>
                <Check size={14} aria-hidden="true" />
                Unlimited projects
              </span>
              <span>
                <Check size={14} aria-hidden="true" />
                Your whole team
              </span>
            </div>
            <Button
              variant="outline"
              className="demo-full-button"
              onClick={() =>
                toast.success('Plan selected', {
                  description: `${value === 'monthly' ? 'Monthly' : 'Yearly'} Pro plan selected in the demo.`,
                })
              }
            >
              Choose Pro
              <ArrowUpRight aria-hidden="true" />
            </Button>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export function SmallFeedbackDemo() {
  return (
    <div className="feedback-demo">
      <div className="feedback-success">
        <span>
          <CheckCheck size={17} aria-hidden="true" />
        </span>
        <div>
          <strong>All changes saved</strong>
          <p>One less thing to think about.</p>
        </div>
      </div>
      <div className="badge-demo-row">
        <Badge variant="accent">Active</Badge>
        <Badge>In review</Badge>
        <Badge variant="outline">Draft</Badge>
        <Badge variant="solid">New</Badge>
      </div>
    </div>
  );
}

export function DepartmentSelect({ className, id }: { className?: string; id?: string }) {
  return (
    <Select defaultValue="design">
      <SelectTrigger id={id} aria-label="Department" className={cn(className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="design">Design</SelectItem>
        <SelectItem value="engineering">Engineering</SelectItem>
        <SelectItem value="marketing">Marketing</SelectItem>
      </SelectContent>
    </Select>
  );
}
