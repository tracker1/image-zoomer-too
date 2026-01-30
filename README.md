# @tracker1/image-zoomer-too

[![npm version](https://img.shields.io/npm/v/@tracker1/image-zoomer-too.svg)](https://www.npmjs.com/package/@tracker1/image-zoomer-too) [![JSR](https://jsr.io/badges/@tracker1/image-zoomer-too)](https://jsr.io/@tracker1/image-zoomer-too) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A React component for image viewing with zoom/pan support. Designed to work with
any UI framework by using EventEmitter for external control, allowing you to
provide your own zoom controls.

## Features

- **Fit to Container** - Image initially scales to fit within the container
- **Zoom In/Out** - Zoom from fit size up to 300% via mouse wheel, pinch
  gestures, or external controls
- **Pan Support** - Click and drag to pan when zoomed in
- **Touch Gestures** - Pinch to zoom, drag to pan on touch devices
- **External Control** - Use EventEmitter to control zoom from your own UI
  components
- **No Style Injection** - Styles are applied directly to elements, no global
  CSS required

## Installation

### JSR (Deno)

```ts
import { ImageZoomer, useImageZoomer } from "jsr:@tracker1/image-zoomer-too";
```

### NPM

```bash
npm install @tracker1/image-zoomer-too
```

```ts
import { ImageZoomer, useImageZoomer } from "@tracker1/image-zoomer-too";
```

## Usage

### React Component

```tsx
import { ImageZoomer, useImageZoomer } from "@tracker1/image-zoomer-too";

function MyImageViewer() {
  const zoomer = useImageZoomer();

  return (
    <div style={{ width: "100%", height: "500px" }}>
      {/* Your custom zoom controls */}
      <div>
        <button onClick={zoomer.zoomIn}>+</button>
        <button onClick={zoomer.zoomOut}>-</button>
        <button onClick={zoomer.zoomReset}>Reset</button>
      </div>

      {/* The image zoomer component */}
      <ImageZoomer
        imageUrl="/path/to/image.jpg"
        emitter={zoomer.emitter}
        onZoomerReady={zoomer.onZoomerReady}
      />
    </div>
  );
}
```

### useImageDimensions Hook

A utility hook to get image dimensions before rendering:

```tsx
import { useImageDimensions } from "@tracker1/image-zoomer-too";

function MyComponent() {
  const dimensions = useImageDimensions("/path/to/image.jpg");

  if (!dimensions) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      Image size: {dimensions.width} x {dimensions.height}
    </div>
  );
}
```

## API

### React Exports

#### `<ImageZoomer />`

| Prop            | Type                                 | Description                              |
| --------------- | ------------------------------------ | ---------------------------------------- |
| `imageUrl`      | `string`                             | URL of the image to display              |
| `emitter`       | `ZoomerEventEmitter`                 | EventEmitter for receiving zoom commands |
| `className`     | `string?`                            | Optional CSS class name                  |
| `style`         | `React.CSSProperties?`               | Optional inline styles                   |
| `onZoomerReady` | `(instance: ZoomerInstance) => void` | Callback when zoomer is initialized      |

#### `useImageZoomer()`

Returns an object with:

| Property        | Type                     | Description                         |
| --------------- | ------------------------ | ----------------------------------- |
| `emitter`       | `ZoomerEventEmitter`     | EventEmitter to pass to ImageZoomer |
| `instance`      | `ZoomerInstance \| null` | The zoomer instance (after ready)   |
| `zoomIn`        | `() => void`             | Zoom in by one step                 |
| `zoomOut`       | `() => void`             | Zoom out by one step                |
| `zoomReset`     | `() => void`             | Reset to fit size                   |
| `onZoomerReady` | `(instance) => void`     | Callback to pass to ImageZoomer     |

#### `useImageDimensions(url)`

| Parameter | Type                          | Description       |
| --------- | ----------------------------- | ----------------- |
| `url`     | `string \| null \| undefined` | Image URL to load |

Returns `{ width: number, height: number } | null`

## Controls

| Input         | Action                         |
| ------------- | ------------------------------ |
| Mouse wheel   | Zoom in/out at cursor position |
| Click + drag  | Pan the image                  |
| Pinch gesture | Zoom in/out (touch devices)    |
| Touch drag    | Pan the image (touch devices)  |

## Demo

View the live demo at: https://tracker1.github.io/image-zoomer-too/

## License

MIT
