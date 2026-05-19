import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

// Single source of truth for the bundled-PDF showcase. When a HealthRecord's
// title matches one of these keys we use the local APK asset instead of the
// remote URL — handy for demos where the Cloudinary delivery is rate-limited
// or the network is unreliable.
const BUNDLED_PRESCRIPTIONS: Record<string, { module: number; filename: string }> = {
  'Prescription - Dr. Chamara': {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    module: require('../../assets/prescriptions/dr-chamara-essential-hypertension.pdf'),
    filename: 'SuwaMed-Prescription-Dr-Chamara.pdf',
  },
};

export const hasBundledPrescription = (recordTitle?: string): boolean => {
  if (!recordTitle) return false;
  return !!BUNDLED_PRESCRIPTIONS[recordTitle];
};

// Resolves the bundled asset to a file:// URI that downstream APIs can consume.
// Copies into the document directory under a friendly filename so the share
// sheet shows "SuwaMed-Prescription-Dr-Chamara.pdf" rather than a hashed name.
const materializeAsset = async (entry: { module: number; filename: string }): Promise<string> => {
  const asset = Asset.fromModule(entry.module);
  if (!asset.localUri) {
    await asset.downloadAsync();
  }
  const sourceUri = asset.localUri || asset.uri;
  const destUri = `${FileSystem.documentDirectory}${entry.filename}`;
  // copyAsync overwrites the destination; safe to call every time
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return destUri;
};

// Download (or share-save) the bundled PDF associated with the given record.
// On Android this brings up the system share sheet with "Save to Files",
// "Drive", and any installed PDF viewers. On iOS it opens the share sheet.
export const downloadBundledPrescription = async (recordTitle: string): Promise<void> => {
  const entry = BUNDLED_PRESCRIPTIONS[recordTitle];
  if (!entry) {
    Alert.alert('Document unavailable', 'No bundled document found for this record.');
    return;
  }
  try {
    const fileUri = await materializeAsset(entry);
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: 'Save prescription',
      });
      return;
    }
    Alert.alert(
      'Downloaded',
      Platform.OS === 'android'
        ? `Saved to ${fileUri}`
        : 'Document saved.'
    );
  } catch (err: any) {
    Alert.alert('Could not save document', err?.message || 'Unexpected error.');
  }
};
