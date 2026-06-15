import { configureStore } from '@reduxjs/toolkit';
import { protectionSlice, focusSlice, streakSlice, settingsSlice } from './slices';

export const store = configureStore({
  reducer: {
    protection: protectionSlice.reducer,
    focus: focusSlice.reducer,
    streak: streakSlice.reducer,
    settings: settingsSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
