import { useFonts, Sen_400Regular, Sen_700Bold } from '@expo-google-fonts/sen';
import { REM_600SemiBold, REM_700Bold } from '@expo-google-fonts/rem';
import { View, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [fontsLoaded] = useFonts({
    Sen_400Regular,
    Sen_700Bold,
    REM_600SemiBold,
    REM_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <AppNavigator />;
}