import * as UI from '../../ui';

export default function SheetExample() {
  return (
    <UI.Inline gap={2} justify="center" wrap>
      <UI.Sheet side="end">
        <UI.SheetTrigger asChild>
          <UI.Button variant="outline">Open settings</UI.Button>
        </UI.SheetTrigger>
        <UI.SheetContent>
          <UI.SheetHeader>
            <UI.SheetTitle>Project settings</UI.SheetTitle>
            <UI.SheetDescription>A few details to make this space yours.</UI.SheetDescription>
          </UI.SheetHeader>
          <UI.Stack gap={3}>
            <UI.Field label="Project name">
              <UI.Input defaultValue="Website redesign" />
            </UI.Field>
            <UI.Field label="Description">
              <UI.Textarea defaultValue="Good things are taking shape." />
            </UI.Field>
            <UI.SheetClose asChild>
              <UI.Button onClick={() => UI.toast.success('Settings saved')}>Save changes</UI.Button>
            </UI.SheetClose>
          </UI.Stack>
        </UI.SheetContent>
      </UI.Sheet>
      <UI.Sheet side="bottom" snapPoints={[0.4, 0.85]}>
        <UI.SheetTrigger asChild>
          <UI.Button variant="outline">Snap points</UI.Button>
        </UI.SheetTrigger>
        <UI.SheetContent>
          <UI.SheetHandle />
          <UI.SheetHeader>
            <UI.SheetTitle>Project activity</UI.SheetTitle>
            <UI.SheetDescription>Today in the workspace.</UI.SheetDescription>
          </UI.SheetHeader>
          <UI.Timeline
            items={[
              {
                id: 'created',
                title: 'Workspace created',
                description: 'The team has joined.',
                time: '09:00',
              },
              {
                id: 'review',
                title: 'Design review',
                description: 'Ready for feedback.',
                time: '11:30',
              },
            ]}
          />
        </UI.SheetContent>
      </UI.Sheet>
      <UI.ThemeScope
        dir="rtl"
        mode="light"
        tokens={{
          surface: '#f5f6fb',
          foreground: '#202321',
          primary: '#2756b3',
          'primary-foreground': '#fff',
        }}
      >
        <UI.Sheet side="end">
          <UI.SheetTrigger asChild>
            <UI.Button variant="outline">Regional settings</UI.Button>
          </UI.SheetTrigger>
          <UI.SheetContent>
            <UI.SheetHeader>
              <UI.SheetTitle>
                {
                  '\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0645\u0634\u0631\u0648\u0639'
                }
              </UI.SheetTitle>
              <UI.SheetDescription>
                {
                  '\u0645\u0633\u0627\u062d\u0629 \u0639\u0645\u0644 \u0627\u0644\u0641\u0631\u064a\u0642'
                }
              </UI.SheetDescription>
            </UI.SheetHeader>
            <UI.Field label={'\u0627\u0633\u0645 \u0627\u0644\u0645\u0634\u0631\u0648\u0639'}>
              <UI.Input
                defaultValue={
                  '\u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0627\u0644\u062c\u062f\u064a\u062f'
                }
              />
            </UI.Field>
          </UI.SheetContent>
        </UI.Sheet>
      </UI.ThemeScope>
    </UI.Inline>
  );
}
