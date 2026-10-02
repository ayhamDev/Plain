import { useState } from 'react';
import { Download, RotateCcw, Sun, Moon, Monitor, Check, ChevronDown, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Button,
  Label,
  Field,
  Input,
  ColorPicker,
  Combobox,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  Slider,
  RadioGroup,
  RadioGroupItem,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  useTheme,
  toast,
  type AccentColor,
  type Density,
  type ThemeMode,
  type BorderStyle,
  type ColorScheme,
  type MotionPolicy,
  type ThemeToken,
  tokenNames,
  tokenVariable,
  themeCSS,
} from '@plain/ui';
import { useAppPreferences } from './preferences';
import { CodeBlock } from './shared';

const accents: { value: AccentColor; label: string; color: string }[] = [
  { value: 'neutral', label: 'Neutral', color: '#252826' },
  { value: 'emerald', label: 'Emerald', color: '#087f5b' },
  { value: 'blue', label: 'Blue', color: '#2563eb' },
  { value: 'violet', label: 'Violet', color: '#6d28d9' },
  { value: 'rose', label: 'Rose', color: '#be185d' },
  { value: 'amber', label: 'Amber', color: '#976900' },
];
export function ThemeEditor({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const theme = useTheme();
  const { direction, setDirection, tokens, setTokens } = useAppPreferences();
  const [overrideToken, setOverrideToken] = useState<ThemeToken>('sidebar.background');
  const [overrideValue, setOverrideValue] = useState('');
  const validOverride =
    !overrideValue ||
    typeof CSS === 'undefined' ||
    CSS.supports(
      /radius|height|width|day-size|space-/.test(overrideToken)
        ? 'width'
        : overrideToken.startsWith('duration-')
          ? 'transition-duration'
          : overrideToken.startsWith('ease-')
            ? 'transition-timing-function'
            : overrideToken.includes('shadow')
              ? 'box-shadow'
              : overrideToken === 'font'
                ? 'font-family'
                : overrideToken.endsWith('weight')
                  ? 'font-weight'
                  : overrideToken.startsWith('layer-')
                    ? 'z-index'
                    : overrideToken === 'motion-scale'
                      ? 'opacity'
                      : 'color',
      overrideValue,
    );
  const exportTheme = () => {
    const computed = getComputedStyle(document.documentElement);
    const resolved = Object.fromEntries(
      tokenNames
        .map((key) => [key, computed.getPropertyValue(tokenVariable(key)).trim()])
        .filter(([, value]) => value),
    );
    const css = themeCSS(resolved).replace(
      '\n}\n',
      `\n  color-scheme: ${theme.resolvedMode};\n}\n`,
    );
    const url = URL.createObjectURL(new Blob([css], { type: 'text/css' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'plainui-theme.css';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success('Theme exported');
  };
  return (
    <Sheet side="end" open={open} onOpenChange={onOpenChange}>
      <SheetContent className="theme-editor" side="end">
        <SheetHeader>
          <SheetTitle>Make it yours</SheetTitle>
          <SheetDescription>A few small changes. A whole new feeling.</SheetDescription>
        </SheetHeader>
        <div className="theme-section">
          <Label>Appearance</Label>
          <ToggleGroup
            type="single"
            value={theme.mode}
            onValueChange={(value) => value && theme.setTheme({ mode: value as ThemeMode })}
            aria-label="Color mode"
            className="theme-segmented"
          >
            <ToggleGroupItem value="light">
              <Sun aria-hidden="true" />
              Light
            </ToggleGroupItem>
            <ToggleGroupItem value="dark">
              <Moon aria-hidden="true" />
              Dark
            </ToggleGroupItem>
            <ToggleGroupItem value="system">
              <Monitor aria-hidden="true" />
              System
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="theme-section">
          <div className="theme-label-row">
            <Label>Vibe color</Label>
            <span>
              {theme.color ?? accents.find((accent) => accent.value === theme.accent)?.label}
            </span>
          </div>
          <div className="theme-swatches" role="group" aria-label="Accent color">
            {accents.map((accent) => (
              <Tooltip key={accent.value}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={accent.label}
                    aria-pressed={!theme.color && accent.value === theme.accent}
                    className="color-swatch"
                    style={{ background: accent.color }}
                    onClick={() => {
                      theme.setTheme({ accent: accent.value, color: null });
                    }}
                  >
                    {!theme.color && accent.value === theme.accent && (
                      <Check size={16} aria-hidden="true" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{accent.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
          <div className="theme-source-row">
            <ColorPicker
              aria-label="Source color"
              value={theme.resolvedColor ?? '#252826'}
              onValueChange={(color) => theme.setTheme({ color })}
            />
          </div>
        </div>
        <div className="theme-section">
          <Select
            value={theme.scheme}
            onValueChange={(scheme) => theme.setTheme({ scheme: scheme as ColorScheme })}
          >
            <Field label="Palette">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </Field>
            <SelectContent>
              <SelectItem value="tonal">Tonal</SelectItem>
              <SelectItem value="vibrant">Vibrant</SelectItem>
              <SelectItem value="expressive">Expressive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="theme-section">
          <div className="theme-label-row">
            <Label htmlFor="theme-radius">Corner radius</Label>
            <output>{theme.radius}px</output>
          </div>
          <Slider
            id="theme-radius"
            value={[theme.radius]}
            max={24}
            step={2}
            onValueChange={([radius]) => theme.setTheme({ radius })}
            aria-label="Corner radius"
          />
          <div className="slider-extremes">
            <span>Sharp</span>
            <span>Soft</span>
          </div>
        </div>
        <div className="theme-section">
          <Label>Borders</Label>
          <ToggleGroup
            type="single"
            value={theme.borders}
            onValueChange={(borders) =>
              borders && theme.setTheme({ borders: borders as BorderStyle })
            }
            aria-label="Border treatment"
            className="theme-segmented"
          >
            <ToggleGroupItem value="none">None</ToggleGroupItem>
            <ToggleGroupItem value="subtle">Subtle</ToggleGroupItem>
            <ToggleGroupItem value="strong">Strong</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="theme-section">
          <Select
            value={theme.motion}
            onValueChange={(motion) => theme.setTheme({ motion: motion as MotionPolicy })}
          >
            <Field label="Motion">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </Field>
            <SelectContent>
              <SelectItem value="system">Follow system</SelectItem>
              <SelectItem value="reduced">Reduced</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="theme-section">
          <Label>Density</Label>
          <RadioGroup
            value={theme.density}
            onValueChange={(value) => theme.setTheme({ density: value as Density })}
            aria-label="Control density"
          >
            {[
              { value: 'compact', label: 'Compact', height: 32 },
              { value: 'comfortable', label: 'Comfortable', height: 40 },
              { value: 'spacious', label: 'Spacious', height: 48 },
            ].map((density) => (
              <div className="density-option" key={density.value}>
                <RadioGroupItem value={density.value} id={`density-${density.value}`} />
                <Label htmlFor={`density-${density.value}`}>
                  {density.label}
                  <span>{density.height}px</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div className="theme-section">
          <Label>Direction</Label>
          <ToggleGroup
            type="single"
            value={direction}
            onValueChange={(value) => value && setDirection(value as 'ltr' | 'rtl')}
            aria-label="Layout direction"
            className="theme-segmented"
          >
            <ToggleGroupItem value="ltr">Left to right</ToggleGroupItem>
            <ToggleGroupItem value="rtl">Right to left</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <Collapsible className="theme-advanced">
          <CollapsibleTrigger className="theme-advanced-trigger">
            Advanced
            <ChevronDown size={16} aria-hidden="true" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="theme-section">
              <div className="theme-label-row">
                <Label htmlFor="theme-contrast">Contrast</Label>
                <output>{Math.round(theme.contrast * 100)}%</output>
              </div>
              <Slider
                id="theme-contrast"
                aria-label="Contrast"
                min={0}
                max={1}
                step={0.1}
                value={[theme.contrast]}
                onValueChange={([contrast]) => theme.setTheme({ contrast })}
              />
            </div>
            <div className="theme-section">
              <Field label="Token">
                <Combobox
                  value={overrideToken}
                  onValueChange={(value) => {
                    setOverrideToken(value as ThemeToken);
                    setOverrideValue(tokens[value as ThemeToken] ?? '');
                  }}
                  options={tokenNames.map((value) => ({ value, label: value }))}
                  searchPlaceholder="Find a token..."
                />
              </Field>
              <Field
                label="CSS value"
                error={!validOverride ? 'Enter a valid CSS value.' : undefined}
              >
                <Input
                  value={overrideValue}
                  onChange={(event) => setOverrideValue(event.target.value)}
                  placeholder="var(--ui-background)"
                />
              </Field>
              <div className="theme-override-actions">
                <Button
                  size="sm"
                  disabled={!overrideValue || !validOverride}
                  onClick={() => setTokens({ ...tokens, [overrideToken]: overrideValue })}
                >
                  <Check size={14} aria-hidden="true" />
                  Apply
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!tokens[overrideToken]}
                  onClick={() => {
                    const next = { ...tokens };
                    delete next[overrideToken];
                    setTokens(next);
                    setOverrideValue('');
                  }}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Remove
                </Button>
              </div>
              {Object.entries(tokens).length > 0 && (
                <CodeBlock compact title="Overrides" code={themeCSS(tokens)} language="css" />
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
        <CodeBlock
          compact
          title="Your theme"
          code={`<PlainProvider\n  dir="${direction}"\n  theme={{\n    mode: '${theme.mode}',\n    color: ${theme.resolvedColor ? `'${theme.resolvedColor}'` : 'null'},\n    scheme: '${theme.scheme}',\n    radius: ${theme.radius},\n    density: '${theme.density}',\n    borders: '${theme.borders}',\n    motion: '${theme.motion}',\n    contrast: ${theme.contrast},\n  }}\n>\n  <App />\n</PlainProvider>`}
        />
        <div className="theme-actions">
          <Button
            variant="outline"
            onClick={() => {
              theme.resetTheme();
              setDirection('ltr');
              setTokens({});
              setOverrideValue('');
            }}
          >
            <RotateCcw aria-hidden="true" />
            Reset
          </Button>
          <Button onClick={exportTheme}>
            <Download aria-hidden="true" />
            Export CSS
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
