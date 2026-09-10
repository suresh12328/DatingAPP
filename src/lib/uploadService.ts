import { isSupabaseConfigured, supabase } from './supabase';

export interface UploadResult {
  url: string;
  storage_path: string;
  filename: string;
  mimetype: string;
  size: number;
  type: 'image' | 'video';
}

export type UploadCategory = 'avatars' | 'covers' | 'posts' | 'stories' | 'messages' | 'reels';

export type UploadStage = 'idle' | 'selecting' | 'preparing' | 'uploading' | 'processing' | 'success' | 'error';

export interface UploadOptions {
  entityId?: string;
  onProgress?: (percent: number, stage: UploadStage) => void;
  compress?: boolean;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
export const MAX_VIDEO_SIZE_BYTES = 60 * 1024 * 1024; // 60MB

/**
 * Validate file type and size before upload
 */
export function validateMediaFile(
  file: File,
  allowedTypes: ('image' | 'video')[] = ['image', 'video']
): { valid: boolean; error?: string; type: 'image' | 'video' } {
  const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name);
  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name);

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: `Unsupported file format. Please upload JPG, PNG, WEBP, MP4, WEBM, or MOV.`,
      type: 'image'
    };
  }

  if (isImage && !allowedTypes.includes('image')) {
    return { valid: false, error: 'Only video files are allowed here.', type: 'image' };
  }

  if (isVideo && !allowedTypes.includes('video')) {
    return { valid: false, error: 'Only photo files are allowed here.', type: 'video' };
  }

  if (isImage) {
    const isStrictAllowed = ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase()) || /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!isStrictAllowed && file.type) {
      return { valid: false, error: `Invalid image type (${file.type}). Supported: JPG, PNG, WEBP.`, type: 'image' };
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return {
        valid: false,
        error: `Photo is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is 15MB.`,
        type: 'image'
      };
    }
    return { valid: true, type: 'image' };
  }

  if (isVideo) {
    const isStrictAllowed = ALLOWED_VIDEO_TYPES.includes(file.type.toLowerCase()) || /\.(mp4|webm|mov)$/i.test(file.name);
    if (!isStrictAllowed && file.type) {
      return { valid: false, error: `Invalid video type (${file.type}). Supported: MP4, WEBM, MOV.`, type: 'video' };
    }
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      return {
        valid: false,
        error: `Video is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is 60MB.`,
        type: 'video'
      };
    }
    return { valid: true, type: 'video' };
  }

  return { valid: false, error: 'Unrecognized file format.', type: 'image' };
}

/**
 * Optional image optimization / client-side downscaling for oversized photos (> 3MB)
 * to speed up upload times while keeping crisp high-res quality
 */
export async function optimizeImageIfNeeded(file: File, maxDimension = 2400): Promise<File> {
  // Only optimize large JPEG/PNG/WEBP files over 3MB
  if (!file.type.startsWith('image/') || file.size < 3 * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;

        if (width <= maxDimension && height <= maxDimension) {
          resolve(file);
          return;
        }

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(optimizedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.9
        );
      };
      img.onerror = () => resolve(file);
      img.src = url;
    } catch {
      resolve(file);
    }
  });
}

/**
 * Real device upload to storage with live progress updates
 */
export async function uploadMediaFile(
  file: File,
  category: UploadCategory,
  userId: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { onProgress, entityId, compress = true } = options;

  onProgress?.(5, 'preparing');

  // Validate
  const validation = validateMediaFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file');
  }

  // Optimize image if eligible
  let uploadableFile = file;
  if (validation.type === 'image' && compress) {
    try {
      uploadableFile = await optimizeImageIfNeeded(file);
    } catch (e) {
      console.warn('Image optimization skipped:', e);
    }
  }

  onProgress?.(15, 'uploading');

  // 1. Try Supabase Storage if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || (validation.type === 'video' ? 'mp4' : 'jpg');
      const timestamp = Date.now();
      let storagePath = '';

      if (category === 'avatars') {
        storagePath = `${userId}/profile-${timestamp}.${ext}`;
      } else if (category === 'covers') {
        storagePath = `${userId}/cover-${timestamp}.${ext}`;
      } else if (category === 'posts') {
        storagePath = `${userId}/${entityId || 'feed'}/post-${timestamp}.${ext}`;
      } else if (category === 'stories') {
        storagePath = `${userId}/${entityId || 'story'}/story-${timestamp}.${ext}`;
      } else if (category === 'reels') {
        storagePath = `${userId}/reels/reel-${timestamp}.${ext}`;
      } else {
        storagePath = `${userId}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
      }

      onProgress?.(45, 'uploading');

      const { data, error } = await supabase.storage
        .from(category)
        .upload(storagePath, uploadableFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from(category)
          .getPublicUrl(data.path);

        onProgress?.(95, 'processing');
        onProgress?.(100, 'success');

        return {
          url: publicUrlData.publicUrl,
          storage_path: data.path,
          filename: file.name,
          mimetype: file.type,
          size: file.size,
          type: validation.type
        };
      }
      console.warn('Supabase upload fell back to backend upload:', error?.message);
    } catch (supabaseErr) {
      console.warn('Supabase storage exception, falling back to local backend:', supabaseErr);
    }
  }

  // 2. Upload to Express backend storage (/api/upload) using XMLHttpRequest for real progress
  return new Promise<UploadResult>((resolve, reject) => {
    const formData = new FormData();
    formData.append('category', category);
    formData.append('userId', userId);
    if (entityId) {
      formData.append('entityId', entityId);
    }
    formData.append('file', uploadableFile);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        // Map upload progress from 20% to 90%
        const percent = Math.round(20 + (event.loaded / event.total) * 70);
        onProgress?.(percent, 'uploading');
      }
    };

    xhr.onload = () => {
      onProgress?.(95, 'processing');
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.file) {
            onProgress?.(100, 'success');
            resolve({
              url: res.file.url,
              storage_path: res.file.storage_path,
              filename: res.file.filename,
              mimetype: res.file.mimetype,
              size: res.file.size,
              type: res.file.type || validation.type
            });
          } else {
            onProgress?.(100, 'error');
            reject(new Error(res.error || 'Server rejected file upload'));
          }
        } catch (e: any) {
          onProgress?.(100, 'error');
          reject(new Error('Failed to parse upload server response'));
        }
      } else {
        onProgress?.(100, 'error');
        try {
          const res = JSON.parse(xhr.responseText);
          reject(new Error(res.error || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      onProgress?.(100, 'error');
      reject(new Error('Network error during file upload. Please check your connection.'));
    };

    xhr.send(formData);
  });
}

/**
 * Reverse geocode latitude and longitude into human-readable city, state
 */
export async function reverseGeocode(lat: number, lng: number): Promise<{ label: string; city: string; state: string; country: string }> {
  try {
    const res = await fetch(`/api/location/reverse-geocode?lat=${lat}&lng=${lng}`);
    if (res.ok) {
      const data = await res.json();
      return {
        label: data.label || `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
        city: data.city || '',
        state: data.state || '',
        country: data.country || ''
      };
    }
  } catch (err) {
    console.warn('Reverse geocode error:', err);
  }

  return {
    label: `${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`,
    city: '',
    state: '',
    country: ''
  };
}

/**
 * Upload generic document or file to server
 */
export async function uploadGenericFile(
  file: File,
  userId: string,
  category: UploadCategory = 'messages'
): Promise<{ url: string; filename: string; size: number; mimetype: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);
  formData.append('category', category);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    throw new Error(`Upload failed with status ${res.status}`);
  }

  const data = await res.json();
  if (!data.success || !data.file) {
    throw new Error(data.error || 'Server rejected file upload');
  }

  return {
    url: data.file.url,
    filename: data.file.original_name || data.file.filename,
    size: data.file.size,
    mimetype: data.file.mimetype
  };
}

