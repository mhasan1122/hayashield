let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
  
  // Set up the notification handler so notifications show when the app is in the foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  console.log('Notifications module is not available in Expo Go. Reminders will require a development build.');
}

export const safeNotifications = {
  requestPermissionsAsync: async () => {
    if (!Notifications) return { status: 'denied' };
    try {
      return await Notifications.requestPermissionsAsync();
    } catch (e) {
      return { status: 'denied' };
    }
  },
  cancelAllScheduledNotificationsAsync: async () => {
    if (!Notifications) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
      console.log('Failed to cancel notifications', e);
    }
  },
  scheduleNotificationAsync: async (request: any) => {
    if (!Notifications) return;
    try {
      await Notifications.scheduleNotificationAsync(request);
    } catch (e) {
      console.log('Failed to schedule notification', e);
    }
  }
};

export default safeNotifications;
