import { useEffect, useState } from "react";

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Hook that loads an image and returns its natural dimensions.
 *
 * @param url - The URL of the image to load
 * @returns null while loading, or { width, height } once loaded
 */
export function useImageDimensions(
  url: string | null | undefined,
): ImageDimensions | null {
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);

  useEffect(() => {
    if (!url) {
      setDimensions(null);
      return;
    }

    // Reset dimensions when URL changes
    setDimensions(null);

    const img = new Image();

    const handleLoad = () => {
      setDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    const handleError = () => {
      setDimensions(null);
    };

    img.addEventListener("load", handleLoad);
    img.addEventListener("error", handleError);
    img.src = url;

    // If image is already cached, it may have loaded synchronously
    if (img.complete && img.naturalWidth > 0) {
      setDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    }

    return () => {
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
    };
  }, [url]);

  return dimensions;
}

export default useImageDimensions;
