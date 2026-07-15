const { withAndroidManifest, withProjectBuildGradle } = require('@expo/config-plugins');

const NOTIFEE_MAVEN_REPO =
  'maven { url "$rootDir/../node_modules/@notifee/react-native/android/libs" }';

/**
 * Adds the notifee ForegroundService declaration and required permissions to AndroidManifest.xml.
 * notifee v9 has no Expo config plugin, so we inject manually.
 */
function withNotifeeAndroid(config) {
  config = withProjectBuildGradle(config, (c) => {
    if (c.modResults.contents.includes('@notifee/react-native/android/libs')) {
      return c;
    }

    c.modResults.contents = c.modResults.contents.replace(
      /maven\s*\{\s*url\s*['"]https:\/\/www\.jitpack\.io['"]\s*\}/,
      (match) => `${match}\n    ${NOTIFEE_MAVEN_REPO}`,
    );

    return c;
  });

  return withAndroidManifest(config, (c) => {
    const manifest = c.modResults;
    const application = manifest.manifest.application[0];

    if (!application.service) application.service = [];

    const mainActivity = (application.activity ?? []).find(
      (activity) =>
        activity.$?.['android:name'] === '.MainActivity' ||
        activity.$?.['android:name'] === 'com.afify.fajryapp.MainActivity' ||
        activity.$?.['android:name']?.endsWith('.MainActivity'),
    );

    if (mainActivity?.$) {
      mainActivity.$['android:showWhenLocked'] = 'true';
      mainActivity.$['android:turnScreenOn'] = 'true';
    }

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
      'android.permission.USE_FULL_SCREEN_INTENT',
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
