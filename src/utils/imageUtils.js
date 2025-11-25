/**
 * Resizes an image file to a maximum width while maintaining aspect ratio
 * This dramatically speeds up OCR processing without losing text clarity
 *
 * @param {File} file - The image file to resize
 * @param {number} maxWidth - Maximum width in pixels (default: 1600)
 * @param {number} quality - JPEG quality 0-1 (default: 0.9)
 * @returns {Promise<File>} - Resized image file
 */
export async function resizeImage(file, maxWidth = 1600, quality = 0.9) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      // Only resize if image is larger than maxWidth
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to resize image'));
            return;
          }

          // Create a new File object from the blob
          const resizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          resolve(resizedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
}
