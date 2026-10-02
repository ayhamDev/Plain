import * as React from 'react';
import { ArrowLeft, ArrowRight, Check, FileText, RotateCcw } from 'lucide-react';
import { Button, Badge, Progress } from '../../../ui/primitives';
import { BlockHeading, ConfigField, initialValues, validateFields, exportCsv } from '../helpers';
import type { FormConfig } from '../types';

export function FormBlock({ config }: { config: FormConfig }) {
  const [values, setValues] = React.useState(() => initialValues(config.fields));
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [step, setStep] = React.useState(0);
  const [submitted, setSubmitted] = React.useState(false);
  const groups = [...new Set(config.fields.map((field) => field.group ?? 'Details'))];
  const wizard = config.variant === 'wizard';
  const currentFields = wizard
    ? config.fields.filter((field) => (field.group ?? 'Details') === groups[step])
    : config.fields;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = validateFields(currentFields, values);
    setErrors(next);
    if (Object.keys(next).length) return;
    if (wizard && step < groups.length - 1) setStep(step + 1);
    else {
      const all = validateFields(config.fields, values);
      setErrors(all);
      if (!Object.keys(all).length) setSubmitted(true);
    }
  };
  return (
    <section data-block="forms" data-variant={config.variant} className="pb-form-block">
      <BlockHeading
        title={config.title}
        subtitle={config.subtitle}
        actions={config.variant === 'editor' ? <Badge variant="outline">Draft</Badge> : undefined}
      />
      {submitted ? (
        <div className="pb-form-summary">
          <div className="pb-success-mark">
            <Check aria-hidden="true" />
          </div>
          <h3>
            {config.variant === 'editor'
              ? 'Draft saved'
              : config.variant === 'reservation'
                ? 'Reservation created'
                : config.variant === 'upload'
                  ? 'Asset recorded'
                  : 'Details saved'}
          </h3>
          <dl className="pb-details">
            {config.fields
              .filter((field) => field.type !== 'password')
              .map((field) => (
                <div key={field.name}>
                  <dt>{field.label}</dt>
                  <dd>
                    {field.type === 'checkbox'
                      ? values[field.name] === 'true'
                        ? 'Yes'
                        : 'No'
                      : values[field.name] || 'Not provided'}
                  </dd>
                </div>
              ))}
          </dl>
          <div className="pb-actions">
            <Button variant="outline" onClick={() => setSubmitted(false)}>
              <ArrowLeft aria-hidden="true" />
              Edit details
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                exportCsv(
                  `${config.variant}-submission.csv`,
                  ['Field', 'Value'],
                  config.fields
                    .filter((field) => field.type !== 'password')
                    .map((field) => [field.label, values[field.name]]),
                )
              }
            >
              <FileText aria-hidden="true" />
              Export
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={
            config.variant === 'split' || config.variant === 'reservation'
              ? 'pb-form-split'
              : undefined
          }
        >
          {(config.variant === 'split' || config.variant === 'reservation') && (
            <aside className="pb-form-context">
              <FileText size={24} aria-hidden="true" />
              <h3>{config.variant === 'split' ? 'The role' : 'Your visit'}</h3>
              <p>{config.subtitle}</p>
              <ul>
                <li>
                  {config.variant === 'split'
                    ? 'Thoughtful work with a small team'
                    : 'Materials and refreshments included'}
                </li>
                <li>
                  {config.variant === 'split'
                    ? 'Product and interaction design'
                    : 'Small groups with experienced makers'}
                </li>
                <li>
                  {config.variant === 'split'
                    ? 'Flexible working hours'
                    : 'A seat reserved in your name'}
                </li>
              </ul>
            </aside>
          )}
          <form noValidate className="pb-form" onSubmit={submit}>
            {wizard && (
              <div className="pb-wizard">
                <ol>
                  {groups.map((group, index) => (
                    <li key={group}>
                      <button
                        type="button"
                        aria-current={index === step ? 'step' : undefined}
                        disabled={index > step}
                        onClick={() => {
                          setStep(index);
                          setErrors({});
                        }}
                      >
                        <span>
                          {index < step ? <Check size={14} aria-hidden="true" /> : index + 1}
                        </span>
                        {group}
                      </button>
                    </li>
                  ))}
                </ol>
                <Progress value={((step + 1) / groups.length) * 100} aria-label="Setup progress" />
              </div>
            )}
            {config.variant === 'sections' ? (
              groups.map((group) => (
                <section className="pb-form-section" key={group}>
                  <div>
                    <h3>{group}</h3>
                  </div>
                  <div className="pb-form-fields">
                    {config.fields
                      .filter((field) => (field.group ?? 'Details') === group)
                      .map((field) => (
                        <ConfigField
                          key={field.name}
                          field={field}
                          value={values[field.name]}
                          error={errors[field.name]}
                          onChange={(value) => setValues({ ...values, [field.name]: value })}
                        />
                      ))}
                  </div>
                </section>
              ))
            ) : (
              <div
                className={`pb-form-fields ${config.variant === 'address' ? 'pb-address-grid' : config.variant === 'inline' ? 'pb-inline-form' : ''}`}
              >
                {currentFields.map((field) => (
                  <ConfigField
                    key={field.name}
                    field={field}
                    value={values[field.name]}
                    error={errors[field.name]}
                    onChange={(value) => {
                      setValues({ ...values, [field.name]: value });
                      setErrors({ ...errors, [field.name]: '' });
                    }}
                  />
                ))}
              </div>
            )}
            {config.variant === 'editor' && (
              <output className="pb-caption">
                {(values.body || '').trim().split(/\s+/).filter(Boolean).length} words
              </output>
            )}
            <div className="pb-actions">
              {wizard && step > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(step - 1);
                    setErrors({});
                  }}
                >
                  <ArrowLeft aria-hidden="true" />
                  Back
                </Button>
              )}
              <Button type="submit">
                {wizard && step < groups.length - 1 ? (
                  <ArrowRight aria-hidden="true" />
                ) : (
                  <Check aria-hidden="true" />
                )}
                {wizard && step < groups.length - 1 ? 'Continue' : config.action}
              </Button>
              <Button
                variant="ghost"
                title="Reset form"
                aria-label="Reset form"
                size="icon"
                onClick={() => {
                  setValues(initialValues(config.fields));
                  setErrors({});
                  setStep(0);
                }}
              >
                <RotateCcw aria-hidden="true" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
