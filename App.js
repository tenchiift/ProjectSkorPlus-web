import { useEffect } from 'react';
import { useFonts, Sen_400Regular, Sen_700Bold } from '@expo-google-fonts/sen';
import { REM_600SemiBold, REM_700Bold } from '@expo-google-fonts/rem';
import { View, ActivityIndicator, Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Sen-Regular': Sen_400Regular,
    'Sen-Bold': Sen_700Bold,
    'REM-Bold': REM_700Bold,
    'REM-Regular': REM_600SemiBold,
  });

  // App-wide default: portrait. app.json keeps native orientation "default" so
  // the OS permits landscape; we enforce portrait here at startup, and the two
  // game screens (OpenWorld + Game) flip to landscape via useForceLandscape and
  // restore portrait on exit.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
