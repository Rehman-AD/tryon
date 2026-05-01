/**
 * Image compression utilities for Firebase RTDB storage.
 * All images stored as Base64 JPEG strings.
 */

/**
 * Compress and resize an image file to a Base64 JPEG string.
 * Used for profile avatars (200x200) and full-body photos (500px tall).
 */
export function compressImageToBase64(
  file: File,
  maxSize: number = 200,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL("image/jpeg", quality);
        resolve(base64);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress a product image into two sizes for the store.
 * Returns { thumbnail: base64, medium: base64 }
 *
 * Thumbnail: 150px wide, quality 0.7 (~10-15KB)
 * Medium: 400px wide, quality 0.8 (~30-50KB)
 */
export async function compressProductImages(
  file: File
): Promise<{ thumbnail: string; medium: string }> {
  const [thumbnail, medium] = await Promise.all([
    compressImageByWidth(file, 150, 0.7),
    compressImageByWidth(file, 400, 0.8),
  ]);
  return { thumbnail, medium };
}

/**
 * Compress an image by target width (maintains aspect ratio).
 */
function compressImageByWidth(
  file: File,
  targetWidth: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");

        const scale = targetWidth / img.width;
        const width = targetWidth;
        const height = Math.round(img.height * scale);

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL("image/jpeg", quality);
        resolve(base64);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress a full-body image for profile storage.
 * Target: 500px tall, quality 0.8 (~40-60KB)
 */
export function compressFullBodyImage(file: File): Promise<string> {
  return compressImageToBase64(file, 500, 0.8);
}
