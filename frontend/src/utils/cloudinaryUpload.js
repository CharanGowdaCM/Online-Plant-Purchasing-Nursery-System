const CLOUDINARY_CLOUD_NAME = 'dqmujxtfb'; 
const CLOUDINARY_UPLOAD_PRESET = 'software_engineering'; 

/**
 * Uploads an image to Cloudinary and returns metadata
 * @param {File} file - The image file to upload
 * @param {string} [altText] - Optional alt text for the image
 * @returns {Promise<{ image_url: string, public_id: string, alt_text?: string }>}
 */
export const uploadToCloudinary = async (file, altText = '') => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary upload failed:', errorText);
      throw new Error('Failed to upload image to Cloudinary');
    }

    const data = await response.json();

    return {
      image_url: data.secure_url,
      public_id: data.public_id,
      alt_text: altText || data.original_filename || 'Product image',
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};
