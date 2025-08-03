// withAndroidQueries.js
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidQueries(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Initialize queries object and package array if they don't exist
    manifest.queries = manifest.queries || {};
    manifest.queries.package = manifest.queries.package || [];

    const packagesToAdd = ['com.globe.gcash.android', 'com.paymaya'];
    const existingPackages = manifest.queries.package.map(p => p.$['android:name']);

    // Add packages only if they aren't already there
    for (const pkg of packagesToAdd) {
        if (!existingPackages.includes(pkg)) {
            manifest.queries.package.push({ $: { 'android:name': pkg } });
        }
    }

    return config;
  });
};