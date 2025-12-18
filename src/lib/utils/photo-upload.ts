import { supabase } from '@/lib/supabaseClient';

/**
 * Upload a photo to Supabase Storage and create a record in cmr_photos
 *
 * @param file - The image file to upload
 * @param cmrId - The CMR document ID
 * @param userId - The user ID
 * @returns The photo record with storage URL
 */
export async function uploadCmrPhoto(
  file: File,
  cmrId: string,
  userId: string
) {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${cmrId}/${timestamp}_${randomString}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: _uploadData, error: uploadError } = await supabase.storage
      .from('cmr-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload photo: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('cmr-photos')
      .getPublicUrl(fileName);

    // Insert record in cmr_photos table
    const { data: photoRecord, error: insertError } = await supabase
      .from('cmr_photos')
      .insert({
        cmr_id: cmrId,
        user_id: userId,
        storage_path: fileName,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      // Try to clean up uploaded file
      await supabase.storage.from('cmr-photos').remove([fileName]);
      throw new Error(`Failed to save photo record: ${insertError.message}`);
    }

    return {
      ...photoRecord,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Photo upload error:', error);
    throw error;
  }
}

/**
 * Fetch all photos for a CMR document
 *
 * @param cmrId - The CMR document ID
 * @returns Array of photo records with URLs
 */
export async function fetchCmrPhotos(cmrId: string) {
  try {
    const { data, error } = await supabase
      .from('cmr_photos')
      .select('*')
      .eq('cmr_id', cmrId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch photos error:', error);
      throw new Error(`Failed to fetch photos: ${error.message}`);
    }

    // Add public URLs to each photo
    const photosWithUrls = data.map((photo) => {
      const { data: urlData } = supabase.storage
        .from('cmr-photos')
        .getPublicUrl(photo.storage_path);

      return {
        ...photo,
        url: urlData.publicUrl,
      };
    });

    return photosWithUrls;
  } catch (error) {
    console.error('Fetch photos error:', error);
    throw error;
  }
}

/**
 * Delete a photo from Storage and database
 *
 * @param photoId - The photo record ID
 * @param storagePath - The storage path of the photo
 */
export async function deleteCmrPhoto(photoId: string, storagePath: string) {
  try {
    // Delete from Storage
    const { error: storageError } = await supabase.storage
      .from('cmr-photos')
      .remove([storagePath]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue anyway to delete from database
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('cmr_photos')
      .delete()
      .eq('id', photoId);

    if (dbError) {
      console.error('Database delete error:', dbError);
      throw new Error(`Failed to delete photo: ${dbError.message}`);
    }
  } catch (error) {
    console.error('Delete photo error:', error);
    throw error;
  }
}
