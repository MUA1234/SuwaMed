import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

// The one PDF we ship in the APK for the prescription showcase. Any health
// record whose category is "prescription" routes here regardless of title —
// the Cloudinary URL on a prescription record is unreliable on the demo
// account (PDF/ZIP delivery is restricted on the free tier), so bundling
// guarantees the Download button always works.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const BUNDLED_PDF_MODULE = require('../../assets/prescriptions/dr-chamara-essential-hypertension.pdf');

type BundleEntry = { module: number; filename: string };

const resolveBundle = (record?: { title?: string; category?: string }): BundleEntry | null => {
  if (!record) return null;
  // Match either by category or by a "Prescription -" title prefix so that
  // both seed-shaped HealthRecords and ad-hoc ones download the bundled PDF.
  const isPrescription =
    record.category === 'prescription' ||
    (typeof record.title === 'string' && /^prescription\b/i.test(record.title.trim()));
  if (!isPrescription) return null;
  const safeTitle = (record.title || 'Prescription').replace(/[^a-zA-Z0-9._-]+/g, '-');
  return { module: BUNDLED_PDF_MODULE, filename: `SuwaMed-${safeTitle}.pdf` };
};

export const hasBundledPrescription = (recordOrTitle?: any): boolean => {
  if (!recordOrTitle) return false;
  // Backwards-compat: callers used to pass just a title string.
  if (typeof recordOrTitle === 'string') {
    return !!resolveBundle({ title: recordOrTitle });
  }
  return !!resolveBundle(recordOrTitle);
};

const materializeAsset = async (entry: BundleEntry): Promise<string> => {
  const asset = Asset.fromModule(entry.module);
  if (!asset.localUri) {
    await asset.downloadAsync();
  }
  const sourceUri = asset.localUri || asset.uri;
  const destUri = `${FileSystem.documentDirectory}${entry.filename}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return destUri;
};

// Hand the bundled PDF to the OS share/save sheet. On iOS this is the
// standard "Save to Files" experience; on Android it's the share sheet with
// the same option plus Drive, WhatsApp, etc.
export const downloadBundledPrescription = async (recordOrTitle: any): Promise<void> => {
  const record = typeof recordOrTitle === 'string' ? { title: recordOrTitle } : recordOrTitle;
  const entry = resolveBundle(record);
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
      Platform.OS === 'android' ? `Saved to ${fileUri}` : 'Document saved.'
    );
  } catch (err: any) {
    Alert.alert('Could not save document', err?.message || 'Unexpected error.');
  }
};
