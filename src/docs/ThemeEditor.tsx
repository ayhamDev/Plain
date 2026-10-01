import { Download, RotateCcw, Sun, Moon, Monitor, Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Button,
  Label,
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
} from '../ui';
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
  const { direction, setDirection } = useAppPreferences();
  const exportTheme = () => {
    const computed = getComputedStyle(document.documentElement);
    const keys = [
      'background',
      'foreground',
      'surface',
      'muted',
      'muted-foreground',
      'border',
      'input-border',
      'accent',
      'accent-foreground',
      'accent-soft',
      'danger',
      'danger-soft',
      'radius',
      'control-height',
      'font',
      'shadow',
    ];
    const css = `:root {\n${keys.map((key) => `  --ui-${key}: ${computed.getPropertyValue(`--ui-${key}`).trim()};`).join('\n')}\n  color-scheme: ${theme.resolvedMode};\n}\n`;
    const url = URL.createObjectURL(new Blob([css], { type: 'text/css' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'plainui-theme.css';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success('Theme exported');
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
            <Label>Accent color</Label>
            <span>{accents.find((accent) => accent.value === theme.accent)?.label}</span>
          </div>
          <div className="theme-swatches" role="group" aria-label="Accent color">
            {accents.map((accent) => (
              <Tooltip key={accent.value}>
                <TooltipTrigger asChild>
                  <button
                    aria-label={accent.label}
                    aria-pressed={accent.value === theme.accent}
                    className="color-swatch"
                    style={{ background: accent.color }}
                    onClick={() => theme.setTheme({ accent: accent.value })}
                  >
                    {accent.value === theme.accent && <Check size={16} aria-hidden="true" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{accent.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
        <div className="theme-section">
          <div className="theme-label-row">
            <Label htmlFor="theme-radius">Corner radius</Label>
            <output>{theme.radius}px</output>
          </div>
          <Slider
            id="theme-radius"
            value={[theme.radius]}
            max={16}
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
        <CodeBlock
          compact
          title="Your theme"
          code={`<PlainProvider\n  dir="${direction}"\n  theme={{\n    mode: '${theme.mode}',\n    accent: '${theme.accent}',\n    radius: ${theme.radius},\n    density: '${theme.density}',\n  }}\n>\n  <App />\n</PlainProvider>`}
        />
        <div className="theme-actions">
          <Button
            variant="outline"
            onClick={() => {
              theme.resetTheme();
              setDirection('ltr');
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
