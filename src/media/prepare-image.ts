import type { ImagePickerAsset } from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export type PreparedFile = { uri: string; mimeType: string; width: number; height: number };

const MAX_SIDE = 2048;
const JPEG_QUALITY = 0.85;

/**
 * Converts a picked image to JPEG and scales it so the longest side is at most
 * 2048 px. The server re-encodes it again; this step only saves upload time and
 * converts HEIC, which the server does not accept.
 */
export async function prepareImage(asset: ImagePickerAsset): Promise<PreparedFile> {
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > MAX_SIDE) {
    context.resize(asset.width >= asset.height ? { width: MAX_SIDE, height: null } : { width: null, height: MAX_SIDE });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
  return { uri: result.uri, mimeType: 'image/jpeg', width: result.width, height: result.height };
}
