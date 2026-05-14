import logger from '../utils/logger';

// `agora-token` is loaded lazily so the backend still boots when the package
// isn't installed yet (e.g. fresh `npm install` skipped for some reason). The
// route handler returns 503 with a clear message in that case.
//
// Install: `npm i agora-token` in `suwamed-backend/`. The lib has no runtime
// peer deps and is pure JS.

type AgoraRole = 'patient' | 'doctor' | 'admin';

export interface MintArgs {
  channelName: string;
  uid: number;
  role: AgoraRole;
  expiresInSec: number;
}

let cached: any | null | undefined;

function loadAgora(): any | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cached = require('agora-token');
    return cached;
  } catch (err) {
    logger.warn(`[agora] agora-token package not installed: ${(err as Error).message}`);
    cached = null;
    return null;
  }
}

export function mintAgoraToken(args: MintArgs): string | null {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  if (!appId || !appCertificate) {
    logger.warn('[agora] AGORA_APP_ID or AGORA_APP_CERTIFICATE missing — refusing to mint token');
    return null;
  }
  const lib = loadAgora();
  if (!lib) return null;

  const { RtcTokenBuilder, RtcRole } = lib;
  if (!RtcTokenBuilder || !RtcRole) {
    logger.warn('[agora] agora-token package surface unexpected');
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = now + args.expiresInSec;

  // Doctor + admin get full publisher rights; patient publishes (so their
  // camera/mic can be seen). Both roles act as PUBLISHER in this product —
  // SUBSCRIBER-only would block the patient's video/audio entirely.
  const agoraRole = RtcRole.PUBLISHER;

  try {
    return RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      args.channelName,
      args.uid,
      agoraRole,
      privilegeExpiredTs,
      privilegeExpiredTs,
    );
  } catch (err) {
    logger.error(`[agora] mint failed: ${(err as Error).message}`);
    return null;
  }
}
