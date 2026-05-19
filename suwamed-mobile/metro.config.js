const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bundle PDF files as static assets so we can `require('./*.pdf')` from app code.
// Metro's default assetExts list covers images and fonts but not pdf — adding it
// here lets us ship a showcase prescription document inside the APK and open it
// instantly without a network round-trip.
config.resolver.assetExts = [...config.resolver.assetExts, 'pdf'];

module.exports = config;
