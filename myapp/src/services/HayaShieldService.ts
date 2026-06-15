import HayaShieldNativeModule from '../../modules/haya-shield-native/src/HayaShieldNativeModule';

export interface InstalledApp {
  packageName: string;
  name: string;
}

export interface BlockedDomainEvent {
  domain: string;
  timestamp: number;
}

const HayaShieldService = {
  /**
   * Check if VPN permission is granted.
   */
  checkVpnPermission(): boolean {
    if (!HayaShieldNativeModule) return false;
    try {
      return HayaShieldNativeModule.checkVpnPermission();
    } catch (e) {
      return false;
    }
  },

  /**
   * Request VPN permission from the user (shows system dialog).
   */
  requestVpnPermission(): void {
    if (!HayaShieldNativeModule) return;
    try {
      HayaShieldNativeModule.requestVpnPermission();
    } catch (e) {
      console.log('Failed to request VPN permission', e);
    }
  },

  /**
   * Start the local DNS filtering VPN.
   */
  startVpn(): void {
    if (!HayaShieldNativeModule) return;
    try {
      HayaShieldNativeModule.startVpn();
    } catch (e) {
      console.log('Failed to start VPN', e);
    }
  },

  /**
   * Stop the local DNS filtering VPN.
   */
  stopVpn(): void {
    if (!HayaShieldNativeModule) return;
    try {
      HayaShieldNativeModule.stopVpn();
    } catch (e) {
      console.log('Failed to stop VPN', e);
    }
  },

  /**
   * Check if the VPN service is currently active.
   */
  isVpnEnabled(): boolean {
    if (!HayaShieldNativeModule) return false;
    try {
      return HayaShieldNativeModule.isVpnEnabled();
    } catch (e) {
      return false;
    }
  },

  /**
   * Check if the Haya Shield App Blocker Accessibility Service is active in system settings.
   */
  isAccessibilityEnabled(): boolean {
    if (!HayaShieldNativeModule) return false;
    try {
      return HayaShieldNativeModule.isAccessibilityEnabled();
    } catch (e) {
      return false;
    }
  },

  /**
   * Open the Accessibility settings screen so the user can enable the service.
   */
  openAccessibilitySettings(): void {
    if (!HayaShieldNativeModule) return;
    try {
      HayaShieldNativeModule.openAccessibilitySettings();
    } catch (e) {
      console.log('Failed to open Accessibility settings', e);
    }
  },

  /**
   * Update the Kotlin VPN service with the list of blocked domains.
   */
  setBlockedDomains(domains: string[]): void {
    if (!HayaShieldNativeModule) return;
    try {
      HayaShieldNativeModule.setBlockedDomains(domains);
    } catch (e) {
      console.log('Failed to set blocked domains', e);
    }
  },

  /**
   * Update the Kotlin App Blocker service with the list of blocked application packages.
   */
  setBlockedApps(apps: string[]): void {
    if (!HayaShieldNativeModule) return;
    try {
      HayaShieldNativeModule.setBlockedApps(apps);
    } catch (e) {
      console.log('Failed to set blocked apps', e);
    }
  },

  /**
   * Set Focus Mode parameters in the App Blocker.
   * @param enabled Whether focus mode is currently active.
   * @param endTime Timestamp (ms) when focus mode ends.
   * @param apps List of application package names to block during focus mode.
   */
  setFocusMode(enabled: boolean, endTime: number, apps: string[]): void {
    if (!HayaShieldNativeModule) return;
    try {
      HayaShieldNativeModule.setFocusMode(enabled, endTime, apps);
    } catch (e) {
      console.log('Failed to set Focus Mode', e);
    }
  },

  /**
   * Check if the Accessibility Service recently blocked an app and needs Haya Shield to display the reminder screen.
   * Clears the pending app after fetching.
   */
  getPendingBlockedApp(): string | null {
    if (!HayaShieldNativeModule) return null;
    try {
      return HayaShieldNativeModule.getPendingBlockedApp();
    } catch (e) {
      return null;
    }
  },

  /**
   * Get all user-launchable apps installed on the device.
   */
  getInstalledApps(): InstalledApp[] {
    if (!HayaShieldNativeModule) {
      // Mock list fallback when native module is missing (e.g. running in Expo Go or non-Android environment)
      return [
        { name: 'Google Chrome', packageName: 'com.android.chrome' },
        { name: 'TikTok', packageName: 'com.zhiliaoapp.musically' },
        { name: 'Instagram', packageName: 'com.instagram.android' },
        { name: 'YouTube', packageName: 'com.google.android.youtube' },
        { name: 'Facebook', packageName: 'com.facebook.katana' },
        { name: 'Snapchat', packageName: 'com.snapchat.android' },
        { name: 'Twitter / X', packageName: 'com.twitter.android' },
        { name: 'Netflix', packageName: 'com.netflix.mediaclient' },
        { name: 'Reddit', packageName: 'com.reddit.frontpage' }
      ];
    }
    try {
      return HayaShieldNativeModule.getInstalledApps();
    } catch (e) {
      return [];
    }
  },

  /**
   * Register a listener for blocked domain events from the VPN service.
   */
  addBlockedDomainListener(callback: (event: BlockedDomainEvent) => void) {
    if (!HayaShieldNativeModule) {
      return { remove: () => {} };
    }
    try {
      return (HayaShieldNativeModule as any).addListener('onBlockedDomain', callback);
    } catch (e) {
      return { remove: () => {} };
    }
  }
};

export default HayaShieldService;
