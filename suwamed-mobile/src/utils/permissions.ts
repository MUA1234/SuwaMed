import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform, Alert, Linking } from 'react-native';

// ---------------------------------------------------------------------------
// Image post-processing
//
// Phone cameras shoot 3000×4000 photos at 8–12 MB each. Uploading those to
// our Cloudinary bucket from a Sri Lankan 3G connection takes 20–40 seconds
// and frequently times out. We resize to a 1600px long edge and re-encode at
// 0.75 JPEG quality before returning — final size is typically 200–500 KB
// for typical photos, which uploads in 1–3 s on the same connection.
//
// The resize keeps EXIF-driven orientation correct by re-encoding (manipulator
// strips EXIF). Quality is fine for medical record scans and ID documents at
// 1600px wide.
// ---------------------------------------------------------------------------

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.75;

async function compressImage(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_DIMENSION } }],
      {
        compress: JPEG_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );
    return result.uri;
  } catch {
    // If manipulation fails for any reason (corrupt image, missing native
    // module in Expo Go) fall back to the original — better to upload the
    // big file than to fail the whole flow.
    return uri;
  }
}

export const requestCameraPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Camera permission is needed to take photos. Please enable it in settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }
  return true;
};

export const requestMediaLibraryPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Photo library access is needed to select images. Please enable it in settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }
  return true;
};

export const pickImage = async (): Promise<string | null> => {
  const hasPermission = await requestMediaLibraryPermission();
  if (!hasPermission) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    return await compressImage(result.assets[0].uri);
  }
  return null;
};

export const takePhoto = async (): Promise<string | null> => {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) return null;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    return await compressImage(result.assets[0].uri);
  }
  return null;
};

export const pickDocument = async (): Promise<string | null> => {
  // Document/health-record picker — no aspect crop, just compress so a 12 MB
  // phone photo of a prescription doesn't strangle the upload.
  const hasPermission = await requestMediaLibraryPermission();
  if (!hasPermission) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    return await compressImage(result.assets[0].uri);
  }
  return null;
};
