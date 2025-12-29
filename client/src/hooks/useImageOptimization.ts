import { useState, useEffect, useCallback } from 'react';

interface ImageOptimizationOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Hook for client-side image optimization
 */
export function useImageOptimization() {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Compress and resize an image file
   */
  const optimizeImage = useCallback(async (
    file: File,
    options: ImageOptimizationOptions = {}
  ): Promise<Blob> => {
    const {
      quality = 0.8,
      maxWidth = 1920,
      maxHeight = 1080,
      format = 'webp'
    } = options;

    setIsProcessing(true);

    try {
      // Create image element
      const img = await createImageFromFile(file);
      
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      // Use better quality settings
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      const mimeType = format === 'webp' ? 'image/webp' 
        : format === 'png' ? 'image/png' 
        : 'image/jpeg';
      
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          },
          mimeType,
          quality
        );
      });

      return blob;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Generate a blur placeholder for an image
   */
  const generateBlurPlaceholder = useCallback(async (
    file: File,
    size: number = 10
  ): Promise<string> => {
    const img = await createImageFromFile(file);
    
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    ctx.drawImage(img, 0, 0, size, size);
    
    return canvas.toDataURL('image/jpeg', 0.5);
  }, []);

  /**
   * Get image dimensions without loading the full image
   */
  const getImageDimensions = useCallback(async (
    file: File
  ): Promise<{ width: number; height: number }> => {
    const img = await createImageFromFile(file);
    return { width: img.width, height: img.height };
  }, []);

  return {
    optimizeImage,
    generateBlurPlaceholder,
    getImageDimensions,
    isProcessing
  };
}

// Helper function to create image from file
function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export default useImageOptimization;
