import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, ArrowUpRight, Plus, ArrowUp, CalendarDays, Bell } from 'lucide-react';
import {
  Button,
  Field,
  Input,
  Textarea,
  Switch,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  DataTable,
  toast,
} from '../../ui';
import { LoginDemo, TeamDemo } from '../showcase';
import { invoices, invoiceColumns } from '../demos';
import { useAppPreferences } from '../preferences';

function DashboardExample() {
  const [period, setPeriod] = React.useState('month');
  const monthly = [26, 39, 33, 51, 43, 62, 49, 72, 60, 78, 69, 90];
  const weekly = [35, 53, 44, 70, 55, 88, 76];
  const chart = period === 'month' ? monthly : weekly;
  const exportInvoices = () => {
    const csvCell = (value: unknown) => `"${String(value).replaceAll('"', '""')}"`;
    const csv = [
      ['Invoice', 'Customer', 'Email', 'Status', 'Amount'],
      ...invoices.map((invoice) => [
        invoice.id,
        invoice.customer,
        invoice.email,
        invoice.status,
        invoice.amount,
      ]),
    ]
      .map((row) => row.map(csvCell).join(','))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'invoices.csv';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className="dashboard-example">
      <div className="dashboard-heading">
        <div>
          <span className="section-eyebrow">Your workspace</span>
          <h2>
            Good morning, Alex<span>.</span>
          </h2>
          <p>A good day to make something happen.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportInvoices}>
          <Download aria-hidden="true" />
          Export
        </Button>
      </div>
      <div className="stat-grid">
        {[
          {
            label: 'Invoice volume',
            value: `$${invoices.reduce((sum, invoice) => sum + invoice.amount, 0).toLocaleString()}`,
            growth: 'All invoices',
          },
          {
            label: 'Paid invoices',
            value: String(invoices.filter((invoice) => invoice.status === 'Paid').length),
            growth: 'Of 8 total',
          },
          {
            label: 'Pending volume',
            value: `$${invoices.filter((invoice) => invoice.status === 'Pending').reduce((sum, invoice) => sum + invoice.amount, 0)}`,
            growth: 'Awaiting payment',
          },
        ].map((stat) => (
          <div className="stat" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <p>
              <span className="stat-growth">{stat.growth}</span>
              <ArrowUpRight size={13} aria-hidden="true" />
            </p>
          </div>
        ))}
      </div>
      <section className="dashboard-chart">
        <div className="chart-heading">
          <div>
            <h3>Project activity</h3>
            <p>A little progress, every day.</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger aria-label="Activity period" className="chart-period">
              <CalendarDays size={14} aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="week">This week</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div
          className="bar-chart"
          role="img"
          aria-label={`Demo ${period === 'month' ? 'monthly' : 'weekly'} project activity: ${chart.join(', ')} events.`}
        >
          {chart.map((value, i) => (
            <div key={i} className="bar-track">
              <div
                className="chart-bar"
                style={{ height: `${value}%` }}
                title={`${value} events`}
              />
              <span>
                {period === 'month'
                  ? String(i * 2 + 1).padStart(2, '0')
                  : ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="invoice-section">
        <div className="invoice-heading">
          <h3>Recent invoices</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast.info('All invoices are displayed in the table below.')}
          >
            <ArrowUp aria-hidden="true" />
            All invoices
          </Button>
        </div>
        <DataTable
          data={invoices}
          columns={invoiceColumns}
          caption="Recent invoices"
          getRowId={(invoice) => invoice.id}
        />
      </section>
    </div>
  );
}

function SettingsExample() {
  const initial = {
    name: 'Studio',
    email: 'hello@studio.co',
    description: 'A small team making thoughtful things.',
    timezone: 'Africa/Cairo',
    notifications: true,
  };
  const [values, setValues] = React.useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('plainui-demo-settings') || 'null');
      return saved && typeof saved.name === 'string' && typeof saved.email === 'string'
        ? { ...initial, ...saved }
        : initial;
    } catch {
      return initial;
    }
  });
  const [saved, setSaved] = React.useState(values);
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  return (
    <div className="settings-example">
      <div className="settings-heading">
        <span className="section-eyebrow">Make yourself at home</span>
        <h2>Workspace settings</h2>
        <p>The details that make this space yours.</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(values);
          try {
            localStorage.setItem('plainui-demo-settings', JSON.stringify(values));
            toast.success('Workspace settings saved');
          } catch {
            toast.info('Saved for this session', { description: 'Local storage is unavailable.' });
          }
        }}
      >
        <section className="settings-section">
          <div>
            <h3>General</h3>
            <p>A name, a few words, a place to begin.</p>
          </div>
          <div className="settings-fields">
            <Field label="Workspace name">
              <Input
                value={values.name}
                required
                onChange={(e) => setValues({ ...values, name: e.target.value })}
              />
            </Field>
            <Field label="Contact email">
              <Input
                value={values.email}
                type="email"
                required
                onChange={(e) => setValues({ ...values, email: e.target.value })}
              />
            </Field>
            <Field label="Description">
              <Textarea
                value={values.description}
                onChange={(e) => setValues({ ...values, description: e.target.value })}
              />
            </Field>
            <Select
              value={values.timezone}
              onValueChange={(timezone) => setValues({ ...values, timezone })}
            >
              <Field label="Timezone">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </Field>
              <SelectContent>
                <SelectItem value="Africa/Cairo">Cairo (Africa/Cairo)</SelectItem>
                <SelectItem value="Europe/London">London (Europe/London)</SelectItem>
                <SelectItem value="America/New_York">New York (America/New_York)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>
        <section className="settings-section">
          <div>
            <h3>Notifications</h3>
            <p>Stay connected, on your terms.</p>
          </div>
          <div className="settings-notifications">
            <Bell size={18} aria-hidden="true" />
            <div>
              <Label htmlFor="settings-emails">Email updates</Label>
              <p>Project updates and team activity.</p>
            </div>
            <Switch
              id="settings-emails"
              checked={values.notifications}
              onCheckedChange={(notifications) => setValues({ ...values, notifications })}
            />
          </div>
        </section>
        <div className="settings-actions">
          <Button variant="outline" disabled={!dirty} onClick={() => setValues(saved)}>
            Discard changes
          </Button>
          <Button type="submit" disabled={!dirty}>
            Save changes
          </Button>
        </div>
      </form>
      <section className="settings-team">
        <TeamDemo />
      </section>
    </div>
  );
}
export default function ExamplesPage() {
  const [params, setParams] = useSearchParams();
  const view = ['dashboard', 'settings', 'authentication'].includes(params.get('view') ?? '')
    ? params.get('view')!
    : 'dashboard';
  const { customize } = useAppPreferences();
  React.useEffect(() => {
    document.title = 'Examples - PlainUI';
  }, []);
  return (
    <div className="examples-page">
      <div className="page-eyebrow">Bring the pieces together</div>
      <h1>
        A starting point.
        <br />
        <span className="muted-heading">For whatever is next.</span>
      </h1>
      <p className="page-lead">Familiar patterns, composed from the same simple foundation.</p>
      <Tabs value={view} onValueChange={(value) => setParams({ view: value })}>
        <div className="example-toolbar">
          <TabsList variant="underline" aria-label="Example application">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="authentication">Authentication</TabsTrigger>
          </TabsList>
          <Button variant="ghost" size="sm" onClick={customize}>
            <Plus aria-hidden="true" />
            Customize
          </Button>
        </div>
        <TabsContent value="dashboard" className="application-example">
          <DashboardExample />
        </TabsContent>
        <TabsContent value="settings" className="application-example">
          <SettingsExample />
        </TabsContent>
        <TabsContent value="authentication" className="authentication-example">
          <LoginDemo />
        </TabsContent>
      </Tabs>
    </div>
  );
}
