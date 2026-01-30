import {
  AppShell,
  Button,
  Group,
  Stack,
  Title,
  Text,
  SegmentedControl,
  Box,
  ActionIcon,
} from "@mantine/core";
import { useState } from "react";
import { ImageZoomer, useImageZoomer } from "../../src/mod.tsx";

type ImageSize = "small" | "large";

const IMAGES: Record<ImageSize, { url: string; label: string; dimensions: string }> = {
  small: {
    url: "/small-image.svg",
    label: "Small Image",
    dimensions: "300 x 100 px",
  },
  large: {
    url: "/large-image.svg",
    label: "Large Image",
    dimensions: "3000 x 2000 px",
  },
};

export function App() {
  const [selectedImage, setSelectedImage] = useState<ImageSize>("small");
  const zoomer = useImageZoomer();

  const currentImage = IMAGES[selectedImage];

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
      styles={{
        main: {
          display: "flex",
          flexDirection: "column",
          height: "100vh",
        },
      }}
    >
      <AppShell.Header p="md">
        <Group justify="space-between" h="100%">
          <Title order={3}>Image Zoomer Demo</Title>
          <Group>
            <SegmentedControl
              value={selectedImage}
              onChange={(value) => setSelectedImage(value as ImageSize)}
              data={[
                { value: "small", label: "Small (300x100)" },
                { value: "large", label: "Large (3000x2000)" },
              ]}
            />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Stack h="100%" gap="md">
          <Group justify="space-between" align="center">
            <Text size="sm" c="dimmed">
              {currentImage.label} ({currentImage.dimensions})
            </Text>
            <Group gap="xs">
              <ActionIcon
                variant="default"
                size="lg"
                onClick={zoomer.zoomOut}
                title="Zoom Out"
              >
                −
              </ActionIcon>
              <ActionIcon
                variant="default"
                size="lg"
                onClick={zoomer.zoomIn}
                title="Zoom In"
              >
                +
              </ActionIcon>
              <Button variant="subtle" size="compact-sm" onClick={zoomer.zoomReset}>
                Reset
              </Button>
            </Group>
          </Group>

          <Box
            style={{
              flex: 1,
              display: "flex",
              border: "1px solid var(--mantine-color-gray-3)",
              borderRadius: "var(--mantine-radius-md)",
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            <ImageZoomer
              key={selectedImage}
              imageUrl={currentImage.url}
              emitter={zoomer.emitter}
              onZoomerReady={zoomer.onZoomerReady}
            />
          </Box>

          <Text size="xs" c="dimmed" ta="center">
            Use mouse wheel to zoom, drag to pan. Pinch gestures supported on touch devices.
          </Text>
        </Stack>
      </AppShell.Main>
    </AppShell>
  );
}
