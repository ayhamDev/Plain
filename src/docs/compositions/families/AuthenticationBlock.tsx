import * as React from 'react';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Button, Badge } from '../../../ui/primitives';
import { Checkbox, Field, Input, Label } from '../../../ui/forms';
import { BlockHeading, ChoiceSelect, Status } from '../helpers';
import type { AuthenticationConfig } from '../types';

function PasswordField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="pb-password">
      <Field label={label} required error={error}>
        <Input
          type={visible ? 'text' : 'password'}
          value={value}
          autoComplete={label === 'Password' ? 'current-password' : 'new-password'}
          onChange={(event) => onChange(event.target.value)}
        />
      </Field>
      <Button
        variant="ghost"
        size="icon"
        title={visible ? 'Hide password' : 'Show password'}
        aria-label={visible ? 'Hide password' : 'Show password'}
        onClick={() => setVisible(!visible)}
      >
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </Button>
    </div>
  );
}
export function AuthenticationBlock({ config }: { config: AuthenticationConfig }) {
  const consentId = React.useId();
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [code, setCode] = React.useState('');
  const [generated, setGenerated] = React.useState('104208');
  const [choice, setChoice] = React.useState(config.choices?.[0]?.value ?? '');
  const [consent, setConsent] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [stage, setStage] = React.useState<'form' | 'link' | 'complete' | 'reset' | 'declined'>(
    'form',
  );
  const [feedback, setFeedback] = React.useState('');
  const [completedVariant, setCompletedVariant] = React.useState(config.variant);
  const variant =
    stage === 'reset' ? 'reset' : stage === 'complete' ? completedVariant : config.variant;
  const needsEmail = ['password', 'signup', 'magic-link', 'recovery', 'workspace'].includes(
    variant,
  );
  const needsPassword = ['password', 'signup', 'reset'].includes(variant);
  const needsName = ['signup', 'invitation'].includes(variant);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (needsEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = 'Enter a valid email address.';
    if (needsName && !name.trim()) next.name = 'Enter your name.';
    if (needsPassword && password.length < 8) next.password = 'Use at least 8 characters.';
    if (variant === 'reset' && password !== confirm) next.confirm = 'Passwords must match.';
    if (variant === 'signup' && !consent) next.consent = 'Accept the terms to continue.';
    if (variant === 'verification' && code !== generated)
      next.code = 'The verification code does not match.';
    if (variant === 'unlock' && code !== '1042') next.code = 'The PIN does not match.';
    setErrors(next);
    if (Object.keys(next).length) return;
    if (['magic-link', 'recovery'].includes(variant)) setStage('link');
    else {
      setCompletedVariant(variant);
      setStage('complete');
    }
    setPassword('');
    setConfirm('');
  };
  const reset = () => {
    setStage('form');
    setErrors({});
    setCode('');
    setFeedback('');
  };
  return (
    <section data-block="authentication" className="pb-auth">
      <div className="pb-auth-brand">
        <span className="pb-brand-mark">{config.brand.slice(0, 1)}</span>
        <strong>{config.brand}</strong>
        <Badge variant="outline">Account</Badge>
      </div>
      <div className="pb-auth-body">
        {stage === 'complete' ? (
          <div className="pb-auth-result">
            <ShieldCheck size={32} aria-hidden="true" />
            <h2>
              {variant === 'invitation'
                ? 'You joined the team'
                : variant === 'device'
                  ? 'Device paired'
                  : variant === 'reset'
                    ? 'Password updated'
                    : 'Your account'}
            </h2>
            <p>{name || email || choice || config.brand}</p>
            <dl className="pb-details">
              <div>
                <dt>Workspace</dt>
                <dd>{choice || config.brand}</dd>
              </div>
              <div>
                <dt>Session</dt>
                <dd>Active</dd>
              </div>
            </dl>
            <Button variant="outline" onClick={reset}>
              <LockKeyhole aria-hidden="true" />
              {variant === 'device' ? 'Revoke pairing' : 'Sign out'}
            </Button>
          </div>
        ) : stage === 'declined' ? (
          <div className="pb-auth-result">
            <X size={30} aria-hidden="true" />
            <h2>Invitation declined</h2>
            <Button variant="outline" onClick={reset}>
              Review invitation
            </Button>
          </div>
        ) : stage === 'link' ? (
          <div className="pb-auth-result">
            <KeyRound size={30} aria-hidden="true" />
            <h2>{config.variant === 'recovery' ? 'Reset request ready' : 'Access link ready'}</h2>
            <p>{email}</p>
            <Button onClick={() => setStage(config.variant === 'recovery' ? 'reset' : 'complete')}>
              <ArrowRight aria-hidden="true" />
              {config.variant === 'recovery' ? 'Choose new password' : 'Open access link'}
            </Button>
            <Button variant="ghost" onClick={reset}>
              Change email
            </Button>
          </div>
        ) : (
          <>
            <BlockHeading
              title={stage === 'reset' ? 'Choose a new password' : config.title}
              subtitle={config.subtitle}
            />
            <form className="pb-form" noValidate onSubmit={submit}>
              {needsName && (
                <Field label="Full name" required error={errors.name}>
                  <Input
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Avery Morgan"
                  />
                </Field>
              )}
              {needsEmail && (
                <Field label="Email address" required error={errors.email}>
                  <Input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </Field>
              )}
              {config.choices && (
                <Field label={variant === 'workspace' ? 'Workspace' : 'Your role'}>
                  <ChoiceSelect
                    label={variant === 'workspace' ? 'Workspace' : 'Your role'}
                    value={choice}
                    onChange={setChoice}
                    choices={config.choices}
                  />
                </Field>
              )}
              {needsPassword && (
                <PasswordField
                  label={variant === 'reset' ? 'New password' : 'Password'}
                  value={password}
                  onChange={setPassword}
                  error={errors.password}
                />
              )}
              {variant === 'signup' && password && (
                <div
                  className="pb-strength"
                  aria-label={`Password strength: ${password.length >= 12 ? 'Strong' : password.length >= 8 ? 'Good' : 'Too short'}`}
                >
                  <meter min={0} max={12} value={password.length} />
                  <span>
                    {password.length >= 12 ? 'Strong' : password.length >= 8 ? 'Good' : 'Too short'}
                  </span>
                </div>
              )}
              {variant === 'reset' && (
                <PasswordField
                  label="Confirm password"
                  value={confirm}
                  onChange={setConfirm}
                  error={errors.confirm}
                />
              )}
              {variant === 'signup' && (
                <div className="pb-check-field">
                  <Checkbox
                    id={consentId}
                    checked={consent}
                    aria-label="I agree to the terms"
                    onCheckedChange={(checked) => setConsent(checked === true)}
                  />
                  <Label htmlFor={consentId}>I agree to the workspace terms</Label>
                  {errors.consent && <p role="alert">{errors.consent}</p>}
                </div>
              )}
              {['verification', 'unlock'].includes(variant) && (
                <>
                  <Field
                    label={variant === 'unlock' ? 'Session PIN' : 'Verification code'}
                    required
                    error={errors.code}
                  >
                    <Input
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={variant === 'unlock' ? 4 : 6}
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                      placeholder={variant === 'unlock' ? '1042' : '000000'}
                      className="pb-code-input"
                    />
                  </Field>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (variant === 'verification') {
                        setGenerated('104208');
                        setFeedback('Code: 104208');
                      } else setFeedback('Session PIN: 1042');
                    }}
                  >
                    <KeyRound aria-hidden="true" />
                    {variant === 'verification' ? 'Generate code' : 'Show session PIN'}
                  </Button>
                </>
              )}
              {variant === 'device' && (
                <div className="pb-device-code">
                  <span>Pairing code</span>
                  <output>
                    {generated.slice(0, 3)}-{generated.slice(3)}
                  </output>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setGenerated(String(Math.floor(100000 + Math.random() * 900000)))
                    }
                  >
                    <KeyRound aria-hidden="true" />
                    New code
                  </Button>
                </div>
              )}
              {variant === 'password' && (
                <div className="pb-row">
                  <Label className="pb-check-field">
                    <Checkbox
                      checked={consent}
                      onCheckedChange={(checked) => setConsent(checked === true)}
                    />
                    Remember this session
                  </Label>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setStage('reset');
                      setErrors({});
                    }}
                  >
                    Reset password
                  </Button>
                </div>
              )}
              <Button type="submit">
                <ArrowRight aria-hidden="true" />
                {stage === 'reset' ? 'Update password' : config.action}
              </Button>
              {variant === 'invitation' && (
                <Button variant="ghost" onClick={() => setStage('declined')}>
                  Decline invitation
                </Button>
              )}
            </form>
          </>
        )}
        <Status>{feedback}</Status>
      </div>
      <footer className="pb-auth-footer">
        <Check size={13} aria-hidden="true" />
        {config.brand} workspace
      </footer>
    </section>
  );
}
