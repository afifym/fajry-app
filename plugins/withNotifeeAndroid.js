const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Adds the notifee ForegroundService declaration and required permissions to AndroidManifest.xml.
 * notifee v9 has no Expo config plugin, so we inject manually.
 */
function withNotifeeAndroid(config) {
  return withAndroidManifest(config, (c) => {
    const manifest = c.modResults;
    const application = manifest.manifest.application[0];

    if (!application.service) application.service = [];

    const alreadyDeclared = application.service.some(
      (s) => s.$?.['android:name'] === 'app.notifee.core.ForegroundService',
    );

    if (!alreadyDeclared) {
      application.service.push({
        $: {
          'android:name': 'app.notifee.core.ForegroundService',
          'android:exported': 'false',
          'android:foregroundServiceType': 'dataSync',
          'android:stopWithTask': 'true',
        },
      });
    }

    const existing = (manifest.manifest['uses-permission'] ?? []).map(
      (p) => p.$['android:name'],
    );

    for (const perm of [
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_DATA_SYNC',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.SCHEDULE_EXACT_ALARM',
    ]) {
      if (!existing.includes(perm)) {
        if (!manifest.manifest['uses-permission']) manifest.manifest['uses-permission'] = [];
        manifest.manifest['uses-permission'].push({ $: { 'android:name': perm } });
      }
    }

    return c;
  });
}

module.exports = withNotifeeAndroid;
