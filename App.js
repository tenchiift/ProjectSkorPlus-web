import { useFonts, Sen_400Regular, Sen_700Bold } from '@expo-google-fonts/sen';
import { REM_600SemiBold, REM_700Bold } from '@expo-google-fonts/rem';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Sen-Regular': Sen_400Regular,
    'Sen-Bold': Sen_700Bold,
    'REM-Bold': REM_700Bold,
    'REM-Regular': REM_600SemiBold,
  });

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
