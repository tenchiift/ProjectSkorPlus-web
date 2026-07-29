// useForceLandscape — locks the device to landscape while a screen is focused,
// then restores portrait when it loses focus or unmounts.
//
// The app default (app.json) is portrait, so every other screen stays portrait
// automatically. Only the two game screens (OpenWorld + platformer Game) call
// this hook. It's a no-op on web, where orientation locking isn't supported.
import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';

export default function useForceLandscape() {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') return undefined;
      let active = true;

      (async () => {
        try {
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.LANDSCAPE
          );
        } catch (e) {
          // Locking can fail on some devices/emulators; ignore and continue.
        }
      })();

      // On blur/unmount: snap back to portrait so the rest of the app stays
      // upright even if this screen is left mid-rotation.
      return () => {
        active = false;
        (async () => {
          try {
            await ScreenOrientation.lockAsync(
              ScreenOrientation.OrientationLock.PORTRAIT_UP
            );
          } catch (e) {
            // ignore
          }
        })();
      };
    }, [])
  );
}
