// Re-export the native module. On web, it will be resolved to IosAlarmKitModule.web.ts
// and on native platforms to IosAlarmKitModule.ts
export { default } from './src/IosAlarmKitModule';
export * from './src/IosAlarmKit.types';
