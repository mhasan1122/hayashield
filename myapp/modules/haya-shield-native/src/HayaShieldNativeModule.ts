import { NativeModule, requireNativeModule } from 'expo';

declare class HayaShieldNativeModule extends NativeModule {
  checkVpnPermission(): boolean;
  requestVpnPermission(): void;
  startVpn(): void;
  stopVpn(): void;
  isVpnEnabled(): boolean;
  isAccessibilityEnabled(): boolean;
  openAccessibilitySettings(): void;
  setBlockedDomains(domains: string[]): void;
  setBlockedApps(apps: string[]): void;
  setFocusMode(enabled: boolean, endTime: number, apps: string[]): void;
  getPendingBlockedApp(): string | null;
  getInstalledApps(): Array<{ packageName: string; name: string }>;
}

let nativeModule: any = null;
try {
  nativeModule = requireNativeModule('HayaShieldNative');
} catch (e) {
  console.log('HayaShieldNative native module not available in this environment. Running in fallback mode.');
}

export default nativeModule as HayaShieldNativeModule;
