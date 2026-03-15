import { Stack } from 'expo-router'
import 'react-native-reanimated'

import { useAuthContext } from '@/hooks/use-auth-context'
import { useColorScheme } from '@/hooks/use-color-scheme'

// Separate RootNavigator so we can access the AuthContext
function RootNavigator() {
  const { isLoggedIn } = useAuthContext()

  return (
    <Stack>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen name="+not-found" />
    </Stack>
  )
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // The font loading and "if (!loaded)" check are gone!
  // This allows the app to render immediately using system fonts.

  return (
    // Your Stack or Tabs navigation goes here
    <Stack>
       <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}