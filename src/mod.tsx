// deno-lint-ignore no-unused-vars verbatim-module-syntax
import React, {
  type CSSProperties,
  type JSX,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import EE from "eventemitter3";
import {
  initZoomer,
  type ZoomerEventEmitter,
  type ZoomerEvents,
  type ZoomerInstance,
} from "./lib.ts";

// Handle both default and named export patterns for eventemitter3
// deno-lint-ignore no-explicit-any
const EventEmitter = ((EE as any).default ?? EE) as new <T extends object>() =>
  & ZoomerEventEmitter
  & T;

// Re-export everything from lib for convenience
export * from "./lib.ts";

// Re-export useImageDimensions hook
export {
  type ImageDimensions,
  useImageDimensions,
} from "./useImageDimensions.ts";

// Re-export EventEmitter for consumers
export { EventEmitter };

export interface ImageZoomerProps {
  imageUrl: string;
  emitter: ZoomerEventEmitter;
  className?: string;
  style?: CSSProperties;
  onZoomerReady?: (instance: ZoomerInstance) => void;
}

export function ImageZoomer({
  imageUrl,
  emitter,
  className,
  style,
  onZoomerReady,
}: ImageZoomerProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ZoomerInstance | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const zoomer = initZoomer(container, emitter);
    instanceRef.current = zoomer;

    if (onZoomerReady) {
      onZoomerReady(zoomer);
    }

    return () => {
      zoomer.destroy();
      instanceRef.current = null;
    };
  }, [imageUrl, emitter, onZoomerReady]);

  return (
    <div
      ref={containerRef}
      data-image-url={imageUrl}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        ...style,
      }}
    />
  );
}

export interface UseImageZoomerResult {
  emitter: ZoomerEventEmitter;
  instance: ZoomerInstance | null;
  zoomIn: () => boolean;
  zoomOut: () => boolean;
  zoomReset: () => boolean;
  onZoomerReady: (instance: ZoomerInstance) => void;
}

export function useImageZoomer(): UseImageZoomerResult {
  const [emitter] = useState<ZoomerEventEmitter>(() =>
    new EventEmitter<ZoomerEvents>()
  );
  const [instance, setInstance] = useState<ZoomerInstance | null>(null);

  const zoomIn = useCallback(() => emitter.emit("zoom-in"), [emitter]);
  const zoomOut = useCallback(() => emitter.emit("zoom-out"), [emitter]);
  const zoomReset = useCallback(() => emitter.emit("zoom-reset"), [emitter]);

  const onZoomerReady = useCallback((inst: ZoomerInstance) => {
    setInstance(inst);
  }, []);

  return {
    emitter,
    instance,
    zoomIn,
    zoomOut,
    zoomReset,
    onZoomerReady,
  };
}
