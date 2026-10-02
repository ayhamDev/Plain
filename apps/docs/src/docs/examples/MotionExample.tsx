import * as React from 'react';
import { Button, Stack, Badge } from '@plain/ui';
import { MotionProvider, Motion, Presence, springPresets } from '@plain/ui/motion';
export default function MotionExample() {
  const [visible, setVisible] = React.useState(true);
  return (
    <MotionProvider>
      <Stack align="center" gap={3}>
        <div style={{ height: 64, width: 200, display: 'grid', placeItems: 'center' }}>
          <Presence mode="wait">
            {visible && (
              <Motion preset="slide" key="saved" layout transition={springPresets.gentle}>
                <Badge variant="accent">All changes saved</Badge>
              </Motion>
            )}
          </Presence>
        </div>
        <Button variant="outline" onClick={() => setVisible(!visible)}>
          {visible ? 'Hide status' : 'Show status'}
        </Button>
      </Stack>
    </MotionProvider>
  );
}
