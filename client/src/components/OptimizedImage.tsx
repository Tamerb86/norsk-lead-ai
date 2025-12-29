import { useState, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  quality?: number;
  sizes?: string;
}

/**
 * Optimized Image component with:
 * - Lazy loading (unless priority)
 * - WebP format support
 * - Responsive srcset
 * - Blur placeholder
 * - Error handling
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  quality = 75,
  sizes = '100vw',
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  // Generate srcset for responsive images
  const generateSrcSet = (baseSrc: string) => {
    // If it's an external URL or data URL, don't generate srcset
    if (baseSrc.startsWith('http') || baseSrc.startsWith('data:')) {
      return undefined;
    }

    const widths = [320, 640, 768, 1024, 1280, 1536];
    return widths
      .filter(w => !width || w <= width * 2)
      .map(w => `${baseSrc} ${w}w`)
      .join(', ');
  };

  // Check WebP support
  useEffect(() => {
    const checkWebP = async () => {
      const webpSupported = await supportsWebP();
      if (webpSupported && src.match(/\.(jpg|jpeg|png)$/i)) {
        // Check if WebP version exists
        const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        setImageSrc(webpSrc);
      }
    };
    checkWebP();
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    // Fallback to original src if WebP fails
    if (imageSrc !== src) {
      setImageSrc(src);
      setHasError(false);
    }
  };

  // Placeholder styles
  const placeholderStyle = placeholder === 'blur' && blurDataURL && !isLoaded
    ? {
        backgroundImage: `url(${blurDataURL})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(20px)',
      }
    : {};

  if (hasError && imageSrc === src) {
    // Show fallback on error
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground',
          className
        )}
        style={{ width, height }}
        role="img"
        aria-label={alt}
      >
        <svg
          className="h-8 w-8 opacity-50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ width, height, ...placeholderStyle }}
    >
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        srcSet={generateSrcSet(imageSrc)}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        {...props}
      />
    </div>
  );
}

// Helper function to check WebP support
async function supportsWebP(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  // Check if already cached
  if (typeof (window as any).__webpSupport !== 'undefined') {
    return (window as any).__webpSupport;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const result = img.width > 0 && img.height > 0;
      (window as any).__webpSupport = result;
      resolve(result);
    };
    img.onerror = () => {
      (window as any).__webpSupport = false;
      resolve(false);
    };
    img.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
  });
}

export default OptimizedImage;
