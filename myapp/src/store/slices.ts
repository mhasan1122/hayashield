import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import db from '../utils/db';

// --- PROTECTION SLICE ---
interface BlockedLog {
  domain: string;
  timestamp: number;
}

interface ProtectionState {
  vpnEnabled: boolean;
  accessibilityEnabled: boolean;
  blockedDomains: string[];
  blockedApps: string[];
  blockedLogs: BlockedLog[];
}

const loadJson = <T>(key: string, defaultValue: T): T => {
  const data = db.getString(key);
  if (!data) return defaultValue;
  try {
    return JSON.parse(data) as T;
  } catch (e) {
    return defaultValue;
  }
};

const initialProtectionState: ProtectionState = {
  vpnEnabled: db.getBoolean('vpnEnabled') ?? false,
  accessibilityEnabled: db.getBoolean('accessibilityEnabled') ?? false,
  blockedDomains: loadJson<string[]>('blockedDomains', [
    "doubleclick.net",
    "exoclick.com",
    "juicyads.com",
    "popads.net"
  ]),
  blockedApps: loadJson<string[]>('blockedApps', []),
  blockedLogs: loadJson<BlockedLog[]>('blockedLogs', []),
};

export const protectionSlice = createSlice({
  name: 'protection',
  initialState: initialProtectionState,
  reducers: {
    setVpnEnabled: (state, action: PayloadAction<boolean>) => {
      state.vpnEnabled = action.payload;
      db.set('vpnEnabled', action.payload);
    },
    setAccessibilityEnabled: (state, action: PayloadAction<boolean>) => {
      state.accessibilityEnabled = action.payload;
      db.set('accessibilityEnabled', action.payload);
    },
    addBlockedDomain: (state, action: PayloadAction<string>) => {
      const domain = action.payload.trim().toLowerCase();
      if (domain && !state.blockedDomains.includes(domain)) {
        state.blockedDomains.push(domain);
        db.set('blockedDomains', JSON.stringify(state.blockedDomains));
      }
    },
    removeBlockedDomain: (state, action: PayloadAction<string>) => {
      state.blockedDomains = state.blockedDomains.filter(d => d !== action.payload);
      db.set('blockedDomains', JSON.stringify(state.blockedDomains));
    },
    setBlockedAppsList: (state, action: PayloadAction<string[]>) => {
      state.blockedApps = action.payload;
      db.set('blockedApps', JSON.stringify(state.blockedApps));
    },
    logBlockedDomainEvent: (state, action: PayloadAction<BlockedLog>) => {
      state.blockedLogs.unshift(action.payload);
      // Keep only last 100 entries
      if (state.blockedLogs.length > 100) {
        state.blockedLogs.pop();
      }
      db.set('blockedLogs', JSON.stringify(state.blockedLogs));
    },
    clearLogs: (state) => {
      state.blockedLogs = [];
      db.set('blockedLogs', JSON.stringify([]));
    }
  }
});

// --- FOCUS SLICE ---
interface FocusState {
  inFocusMode: boolean;
  focusDuration: number; // in minutes
  focusEndTime: number; // timestamp ms
  focusSessionsCompleted: number;
}

const initialFocusState: FocusState = {
  inFocusMode: db.getBoolean('inFocusMode') ?? false,
  focusDuration: db.getNumber('focusDuration') ?? 25,
  focusEndTime: db.getNumber('focusEndTime') ?? 0,
  focusSessionsCompleted: db.getNumber('focusSessionsCompleted') ?? 0,
};

export const focusSlice = createSlice({
  name: 'focus',
  initialState: initialFocusState,
  reducers: {
    startFocusSession: (state, action: PayloadAction<{ duration: number; endTime: number }>) => {
      state.inFocusMode = true;
      state.focusDuration = action.payload.duration;
      state.focusEndTime = action.payload.endTime;
      db.set('inFocusMode', true);
      db.set('focusDuration', action.payload.duration);
      db.set('focusEndTime', action.payload.endTime);
    },
    stopFocusSession: (state) => {
      state.inFocusMode = false;
      state.focusEndTime = 0;
      db.set('inFocusMode', false);
      db.set('focusEndTime', 0);
    },
    completeFocusSession: (state) => {
      state.inFocusMode = false;
      state.focusEndTime = 0;
      state.focusSessionsCompleted += 1;
      db.set('inFocusMode', false);
      db.set('focusEndTime', 0);
      db.set('focusSessionsCompleted', state.focusSessionsCompleted);
    }
  }
});

// --- STREAK & STATS SLICE ---
interface StreakState {
  daysProtected: number;
  lastProtectedDay: string | null; // "YYYY-MM-DD"
  totalWebsitesBlocked: number;
  dailyBlocksCount: number;
}

const initialStreakState: StreakState = {
  daysProtected: db.getNumber('daysProtected') ?? 1,
  lastProtectedDay: db.getString('lastProtectedDay') ?? null,
  totalWebsitesBlocked: db.getNumber('totalWebsitesBlocked') ?? 0,
  dailyBlocksCount: db.getNumber('dailyBlocksCount') ?? 0,
};

export const streakSlice = createSlice({
  name: 'streak',
  initialState: initialStreakState,
  reducers: {
    incrementBlocksCount: (state) => {
      state.totalWebsitesBlocked += 1;
      state.dailyBlocksCount += 1;
      db.set('totalWebsitesBlocked', state.totalWebsitesBlocked);
      db.set('dailyBlocksCount', state.dailyBlocksCount);
    },
    resetDailyBlocksCount: (state) => {
      state.dailyBlocksCount = 0;
      db.set('dailyBlocksCount', 0);
    },
    updateStreak: (state) => {
      const todayStr = new Date().toISOString().split('T')[0];
      if (state.lastProtectedDay === null) {
        state.daysProtected = 1;
        state.lastProtectedDay = todayStr;
      } else {
        const lastDate = new Date(state.lastProtectedDay);
        const todayDate = new Date(todayStr);
        const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Consecutive day protected
          state.daysProtected += 1;
          state.lastProtectedDay = todayStr;
        } else if (diffDays > 1) {
          // Streak broken
          state.daysProtected = 1;
          state.lastProtectedDay = todayStr;
        }
      }
      db.set('daysProtected', state.daysProtected);
      db.set('lastProtectedDay', state.lastProtectedDay || todayStr);
    }
  }
});

// --- SETTINGS SLICE ---
interface SettingsState {
  notificationsEnabled: boolean;
  morningReminderTime: string;
  eveningReminderTime: string;
  dhikrCount: number;
}

const initialSettingsState: SettingsState = {
  notificationsEnabled: db.getBoolean('notificationsEnabled') ?? true,
  morningReminderTime: db.getString('morningReminderTime') ?? '08:00',
  eveningReminderTime: db.getString('eveningReminderTime') ?? '20:00',
  dhikrCount: db.getNumber('dhikrCount') ?? 0,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState: initialSettingsState,
  reducers: {
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notificationsEnabled = action.payload;
      db.set('notificationsEnabled', action.payload);
    },
    setMorningReminderTime: (state, action: PayloadAction<string>) => {
      state.morningReminderTime = action.payload;
      db.set('morningReminderTime', action.payload);
    },
    setEveningReminderTime: (state, action: PayloadAction<string>) => {
      state.eveningReminderTime = action.payload;
      db.set('eveningReminderTime', action.payload);
    },
    incrementDhikr: (state) => {
      state.dhikrCount += 1;
      db.set('dhikrCount', state.dhikrCount);
    },
    resetDhikr: (state) => {
      state.dhikrCount = 0;
      db.set('dhikrCount', 0);
    }
  }
});

// Export Actions
export const {
  setVpnEnabled,
  setAccessibilityEnabled,
  addBlockedDomain,
  removeBlockedDomain,
  setBlockedAppsList,
  logBlockedDomainEvent,
  clearLogs
} = protectionSlice.actions;

export const {
  startFocusSession,
  stopFocusSession,
  completeFocusSession
} = focusSlice.actions;

export const {
  incrementBlocksCount,
  resetDailyBlocksCount,
  updateStreak
} = streakSlice.actions;

export const {
  setNotificationsEnabled,
  setMorningReminderTime,
  setEveningReminderTime,
  incrementDhikr,
  resetDhikr
} = settingsSlice.actions;
