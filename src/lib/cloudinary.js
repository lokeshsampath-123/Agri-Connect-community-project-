import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dpdmlb6qx',
  api_key: process.env.CLOUDINARY_API_KEY || '684676944683164',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'u0-WU3WHWzQ0ZBaG1GvdY-1kim4',
  secure: true
});

/**
 * Uploads a base64 encoded image to Cloudinary.
 * @param {string} base64Image - Base64 encoded image string (optionally starts with data:image/...)
 * @returns {Promise<string>} - Secure URL of the uploaded image
 */
export async function uploadImage(base64Image) {
  try {
    if (!base64Image) {
      throw new Error('No image data provided for upload');
    }

    // Ensure base64 prefix is correct
    let formattedBase64 = base64Image;
    if (!base64Image.startsWith('data:image/')) {
      formattedBase64 = `data:image/jpeg;base64,${base64Image}`;
    }

    const uploadResponse = await cloudinary.uploader.upload(formattedBase64, {
      folder: 'agriconnect_scans',
    });

    return uploadResponse.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}
