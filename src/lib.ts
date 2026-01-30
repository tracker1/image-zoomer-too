/**
 * Image Zoomer Module
 * A browser module that enables zoom/pan functionality on a container element.
 * Designed to work with any UI framework by accepting an EventEmitter for external control.
 */

const MAX_SCALE = 3.0; // 300% max zoom
const ZOOM_STEP = 0.25;

export interface ZoomerState {
  scale: number;
  minScale: number;
  isDragging: boolean;
  lastX: number;
  lastY: number;
  initialPinchDistance: number | null;
  initialPinchScale: number;
  imageNaturalWidth: number;
  imageNaturalHeight: number;
  containerWidth: number;
  containerHeight: number;
}

export interface ZoomerEvents {
  "zoom-in": () => void;
  "zoom-out": () => void;
  "zoom-reset": () => void;
}

/**
 * Minimal EventEmitter interface compatible with eventemitter3
 */
export interface ZoomerEventEmitter {
  on(event: "zoom-in" | "zoom-out" | "zoom-reset", listener: () => void): this;
  off(event: "zoom-in" | "zoom-out" | "zoom-reset", listener: () => void): this;
  emit(event: "zoom-in" | "zoom-out" | "zoom-reset"): boolean;
}

export interface ZoomerInstance {
  getScale: () => number;
  getMinScale: () => number;
  getMaxScale: () => number;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  destroy: () => void;
}

function applyContainerStyles(container: HTMLElement): void {
  container.style.display = "inline-flex";
  container.style.position = "relative";
  container.style.overflow = "auto";
  container.style.cursor = "grab";
  container.style.backgroundColor = "#f8f8f8";
}

function applyContentStyles(content: HTMLElement): void {
  content.style.display = "flex";
  content.style.alignItems = "center";
  content.style.justifyContent = "center";
  content.style.minWidth = "100%";
  content.style.minHeight = "100%";
}

function applyImageStyles(img: HTMLImageElement): void {
  img.style.display = "block";
  img.style.flexShrink = "0";
  img.style.userSelect = "none";
  // @ts-ignore - webkit vendor prefix
  img.style.webkitUserDrag = "none";
  img.draggable = false;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function applyTransform(
  state: ZoomerState,
  content: HTMLElement,
  img: HTMLImageElement,
): void {
  const scaledWidth = state.imageNaturalWidth * state.scale;
  const scaledHeight = state.imageNaturalHeight * state.scale;

  img.style.width = `${scaledWidth}px`;
  img.style.height = `${scaledHeight}px`;

  // Adjust content alignment based on whether scrolling is needed
  content.style.justifyContent = scaledWidth > state.containerWidth
    ? "flex-start"
    : "center";
  content.style.alignItems = scaledHeight > state.containerHeight
    ? "flex-start"
    : "center";
}

function zoomAt(
  state: ZoomerState,
  container: HTMLElement,
  content: HTMLElement,
  img: HTMLImageElement,
  clientX: number,
  clientY: number,
  delta: number,
): void {
  const rect = container.getBoundingClientRect();
  const oldScale = state.scale;
  const oldScaledWidth = state.imageNaturalWidth * oldScale;
  const oldScaledHeight = state.imageNaturalHeight * oldScale;

  const viewportX = clientX - rect.left;
  const viewportY = clientY - rect.top;

  const oldContentWidth = Math.max(oldScaledWidth, state.containerWidth);
  const oldContentHeight = Math.max(oldScaledHeight, state.containerHeight);

  const imageOffsetX = (oldContentWidth - oldScaledWidth) / 2;
  const imageOffsetY = (oldContentHeight - oldScaledHeight) / 2;

  const imgPixelX = viewportX + container.scrollLeft - imageOffsetX;
  const imgPixelY = viewportY + container.scrollTop - imageOffsetY;

  const imgNormX = imgPixelX / oldScale;
  const imgNormY = imgPixelY / oldScale;

  state.scale = clamp(state.scale * (1 + delta), state.minScale, MAX_SCALE);

  if (state.scale !== oldScale) {
    const newScaledWidth = state.imageNaturalWidth * state.scale;
    const newScaledHeight = state.imageNaturalHeight * state.scale;

    img.style.width = `${newScaledWidth}px`;
    img.style.height = `${newScaledHeight}px`;

    // Adjust content alignment based on whether scrolling is needed
    content.style.justifyContent = newScaledWidth > state.containerWidth
      ? "flex-start"
      : "center";
    content.style.alignItems = newScaledHeight > state.containerHeight
      ? "flex-start"
      : "center";

    if (newScaledWidth > state.containerWidth) {
      const newImgPixelX = imgNormX * state.scale;
      const scrollX = clamp(
        newImgPixelX - viewportX,
        0,
        newScaledWidth - state.containerWidth,
      );
      container.scrollLeft = scrollX;
    }

    if (newScaledHeight > state.containerHeight) {
      const newImgPixelY = imgNormY * state.scale;
      const scrollY = clamp(
        newImgPixelY - viewportY,
        0,
        newScaledHeight - state.containerHeight,
      );
      container.scrollTop = scrollY;
    }
  }
}

function zoomByStep(
  state: ZoomerState,
  container: HTMLElement,
  content: HTMLElement,
  img: HTMLImageElement,
  direction: 1 | -1,
): void {
  const rect = container.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  zoomAt(
    state,
    container,
    content,
    img,
    centerX,
    centerY,
    ZOOM_STEP * direction,
  );
}

function getPinchDistance(touches: TouchList): number {
  const t0 = touches[0]!;
  const t1 = touches[1]!;
  const dx = t0.clientX - t1.clientX;
  const dy = t0.clientY - t1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getPinchCenter(touches: TouchList): { x: number; y: number } {
  const t0 = touches[0]!;
  const t1 = touches[1]!;
  return {
    x: (t0.clientX + t1.clientX) / 2,
    y: (t0.clientY + t1.clientY) / 2,
  };
}

/**
 * Initialize the image zoomer on a container element.
 *
 * @param container - The container element (should have data-image-url attribute)
 * @param emitter - EventEmitter instance to receive zoom-in, zoom-out, zoom-reset events
 * @returns ZoomerInstance with control methods and cleanup
 */
export function initZoomer(
  container: HTMLElement,
  emitter: ZoomerEventEmitter,
): ZoomerInstance {
  const imageUrl = container.dataset.imageUrl;
  if (!imageUrl) {
    throw new Error("Container must have a data-image-url attribute");
  }

  // Store original styles for cleanup
  const originalContainerStyle = container.style.cssText;

  // Apply styles directly to elements
  applyContainerStyles(container);

  const content = document.createElement("div");
  applyContentStyles(content);

  const img = document.createElement("img");
  img.src = imageUrl;
  applyImageStyles(img);

  content.appendChild(img);
  container.appendChild(content);

  const state: ZoomerState = {
    scale: 1,
    minScale: 1,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    initialPinchDistance: null,
    initialPinchScale: 1,
    imageNaturalWidth: 0,
    imageNaturalHeight: 0,
    containerWidth: 0,
    containerHeight: 0,
  };

  const updateContainerSize = () => {
    const rect = container.getBoundingClientRect();
    state.containerWidth = rect.width;
    state.containerHeight = rect.height;
  };

  const calculateFitScale = () => {
    if (state.imageNaturalWidth === 0 || state.imageNaturalHeight === 0) {
      return 1;
    }

    const scaleX = state.containerWidth / state.imageNaturalWidth;
    const scaleY = state.containerHeight / state.imageNaturalHeight;
    return Math.min(scaleX, scaleY, 1);
  };

  const handleImageLoad = () => {
    state.imageNaturalWidth = img.naturalWidth;
    state.imageNaturalHeight = img.naturalHeight;

    updateContainerSize();

    const fitScale = calculateFitScale();
    state.minScale = fitScale;
    state.scale = fitScale;

    applyTransform(state, content, img);
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    state.isDragging = true;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    container.style.cursor = "grabbing";
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!state.isDragging) return;

    const dx = e.clientX - state.lastX;
    const dy = e.clientY - state.lastY;

    container.scrollLeft -= dx;
    container.scrollTop -= dy;

    state.lastX = e.clientX;
    state.lastY = e.clientY;
  };

  const handleMouseUp = () => {
    if (state.isDragging) {
      state.isDragging = false;
      container.style.cursor = "grab";
    }
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();

    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    zoomAt(state, container, content, img, e.clientX, e.clientY, delta);
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]!;
      state.isDragging = true;
      state.lastX = touch.clientX;
      state.lastY = touch.clientY;
    } else if (e.touches.length === 2) {
      state.isDragging = false;
      state.initialPinchDistance = getPinchDistance(e.touches);
      state.initialPinchScale = state.scale;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 1 && state.isDragging) {
      const touch = e.touches[0]!;
      const dx = touch.clientX - state.lastX;
      const dy = touch.clientY - state.lastY;

      container.scrollLeft -= dx;
      container.scrollTop -= dy;

      state.lastX = touch.clientX;
      state.lastY = touch.clientY;
    } else if (e.touches.length === 2 && state.initialPinchDistance !== null) {
      const currentDistance = getPinchDistance(e.touches);
      const pinchCenter = getPinchCenter(e.touches);

      const scaleFactor = currentDistance / state.initialPinchDistance;
      const newScale = clamp(
        state.initialPinchScale * scaleFactor,
        state.minScale,
        MAX_SCALE,
      );

      if (newScale !== state.scale) {
        const delta = newScale / state.scale - 1;
        zoomAt(
          state,
          container,
          content,
          img,
          pinchCenter.x,
          pinchCenter.y,
          delta,
        );
        state.initialPinchDistance = currentDistance;
        state.initialPinchScale = state.scale;
      }
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (e.touches.length === 0) {
      state.isDragging = false;
      state.initialPinchDistance = null;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0]!;
      state.initialPinchDistance = null;
      state.isDragging = true;
      state.lastX = touch.clientX;
      state.lastY = touch.clientY;
    }
  };

  const handleResize = () => {
    const oldMinScale = state.minScale;
    updateContainerSize();
    const newMinScale = calculateFitScale();
    state.minScale = newMinScale;

    // If scale was at min, keep it at new min
    if (state.scale === oldMinScale || state.scale < newMinScale) {
      state.scale = newMinScale;
    }

    applyTransform(state, content, img);
  };

  // Event emitter handlers
  const handleZoomIn = () => {
    zoomByStep(state, container, content, img, 1);
  };

  const handleZoomOut = () => {
    zoomByStep(state, container, content, img, -1);
  };

  const handleZoomReset = () => {
    state.scale = state.minScale;
    applyTransform(state, content, img);
    container.scrollLeft = 0;
    container.scrollTop = 0;
  };

  // Set up event listeners
  img.addEventListener("load", handleImageLoad);
  container.addEventListener("mousedown", handleMouseDown);
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
  container.addEventListener("wheel", handleWheel, { passive: false });
  container.addEventListener("touchstart", handleTouchStart, { passive: true });
  container.addEventListener("touchmove", handleTouchMove, { passive: false });
  container.addEventListener("touchend", handleTouchEnd);
  globalThis.addEventListener("resize", handleResize);

  // Set up emitter listeners
  emitter.on("zoom-in", handleZoomIn);
  emitter.on("zoom-out", handleZoomOut);
  emitter.on("zoom-reset", handleZoomReset);

  // If image is already loaded (cached), trigger manually
  if (img.complete && img.naturalWidth > 0) {
    handleImageLoad();
  }

  return {
    getScale: () => state.scale,
    getMinScale: () => state.minScale,
    getMaxScale: () => MAX_SCALE,
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    zoomReset: handleZoomReset,
    destroy: () => {
      // Remove event listeners
      img.removeEventListener("load", handleImageLoad);
      container.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      globalThis.removeEventListener("resize", handleResize);

      // Remove emitter listeners
      emitter.off("zoom-in", handleZoomIn);
      emitter.off("zoom-out", handleZoomOut);
      emitter.off("zoom-reset", handleZoomReset);

      // Clean up DOM
      content.remove();

      // Restore original container styles
      container.style.cssText = originalContainerStyle;
    },
  };
}

export default { initZoomer };
