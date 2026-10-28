import { InspectionResult } from '../types';

const STORAGE_KEY = 'corrosion_detection_history_v1';
const MAX_HISTORY_ENTRIES = 20;

/**
 * Compresses an image data URL or object URL into a lightweight thumbnail (~160x160 max)
 * to safely store up to 20 inspection records in localStorage without exceeding quotas.
 */
export async function createThumbnail(imageUrl: string, maxDimension = 180, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

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
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(imageUrl);
      }
    };
    img.onerror = () => {
      resolve(imageUrl);
    };
    img.src = imageUrl;
  });
}

/**
 * Loads saved inspection history from localStorage.
 */
export function getSavedHistory(): InspectionResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to read inspection history from localStorage:', err);
    return [];
  }
}

/**
 * Saves a new inspection result to history (limited to the 20 most recent entries).
 */
export async function saveInspectionResult(result: InspectionResult): Promise<InspectionResult[]> {
  try {
    const existing = getSavedHistory();
    // Ensure unique ID and prepend newest
    const filtered = existing.filter((item) => item.id !== result.id);
    const updated = [result, ...filtered].slice(0, MAX_HISTORY_ENTRIES);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (quotaError) {
      console.warn('LocalStorage quota exceeded, attempting to save with aggressive compression...');
      // Fallback: strip full imageUrl and keep only thumbnailUrl for stored older items
      const trimmed = updated.map((item, index) => {
        if (index > 2) {
          return { ...item, imageUrl: item.thumbnailUrl };
        }
        return item;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    }

    return updated;
  } catch (err) {
    console.error('Failed to save inspection result to localStorage:', err);
    return getSavedHistory();
  }
}

/**
 * Deletes a single inspection entry by ID.
 */
export function deleteHistoryItem(id: string): InspectionResult[] {
  try {
    const existing = getSavedHistory();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to delete history item:', err);
    return getSavedHistory();
  }
}

/**
 * Clears all history from localStorage.
 */
export function clearAllHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear history:', err);
  }
}
