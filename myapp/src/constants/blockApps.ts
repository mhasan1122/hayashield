export interface QuickBlockApp {
  name: string;
  packageName: string;
  /** Additional package names blocked together (e.g. Chrome Beta/Canary). */
  variants?: string[];
  icon: string;
}

export const QUICK_BLOCK_APPS: QuickBlockApp[] = [
  {
    name: 'Google Chrome',
    packageName: 'com.android.chrome',
    variants: ['com.chrome.beta', 'com.chrome.dev', 'com.chrome.canary'],
    icon: 'logo-chrome',
  },
  {
    name: 'YouTube',
    packageName: 'com.google.android.youtube',
    icon: 'logo-youtube',
  },
  {
    name: 'TikTok',
    packageName: 'com.zhiliaoapp.musically',
    icon: 'musical-notes',
  },
  {
    name: 'Instagram',
    packageName: 'com.instagram.android',
    icon: 'logo-instagram',
  },
];

const DISPLAY_NAMES: Record<string, string> = QUICK_BLOCK_APPS.reduce(
  (acc, app) => {
    acc[app.packageName] = app.name;
    app.variants?.forEach((variant) => {
      acc[variant] = app.name;
    });
    return acc;
  },
  {} as Record<string, string>
);

export function getQuickBlockPackages(app: QuickBlockApp): string[] {
  return [app.packageName, ...(app.variants ?? [])];
}

export function isQuickBlockActive(blockedApps: string[], app: QuickBlockApp): boolean {
  return getQuickBlockPackages(app).some((pkg) => blockedApps.includes(pkg));
}

export function toggleQuickBlock(
  blockedApps: string[],
  app: QuickBlockApp,
  enable: boolean
): string[] {
  const packages = getQuickBlockPackages(app);
  if (enable) {
    const toAdd = packages.filter((pkg) => !blockedApps.includes(pkg));
    return [...blockedApps, ...toAdd];
  }
  return blockedApps.filter((pkg) => !packages.includes(pkg));
}

export function getAppDisplayName(packageName: string): string {
  return DISPLAY_NAMES[packageName] ?? packageName.split('.').pop() ?? packageName;
}
