import { supabase } from './supabase';
import imageCompression from 'browser-image-compression';

export async function uploadImageToSupabase(file: File): Promise<string> {
  // Compress the image
  const compressedFile = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1024, // Resize to max width/height
    useWebWorker: true,
  });

  const fileExt = compressedFile.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error } = await supabase.storage
    .from("stockflow")
    .upload(filePath, compressedFile);

  if (error) {
    console.error("Image upload error:", error);
    return '';
  }

  const { data: urlData } = supabase.storage
    .from("stockflow")
    .getPublicUrl(filePath);

  return urlData?.publicUrl ?? '';
}