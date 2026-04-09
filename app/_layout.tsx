import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import {
  useFonts,
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
  PublicSans_800ExtraBold,
  PublicSans_900Black,
} from '@expo-google-fonts/public-sans';
import { useUserProfileStore } from '../store/userProfileStore';
import { useMedicationStore } from '../store/medicationStore';
import { syncService } from '../services/syncService';
import { medicamentosDB } from '../data/medicamentosDB';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { carregarPerfil } = useUserProfileStore();
  const { carregarMedicacoes } = useMedicationStore();

  const [fontsLoaded] = useFonts({
    'PublicSans-Regular': PublicSans_400Regular,
    'PublicSans-Medium': PublicSans_500Medium,
    'PublicSans-SemiBold': PublicSans_600SemiBold,
    'PublicSans-Bold': PublicSans_700Bold,
    'PublicSans-ExtraBold': PublicSans_800ExtraBold,
    'PublicSans-Black': PublicSans_900Black,
  });

  useEffect(() => {
    async function init() {
      // Baixa do HD ou da rede silenciosamente antes de liberar o app
      const baseDaNuvem = await syncService.getBaseCompleta();
      medicamentosDB.injetarBaseNuvem(baseDaNuvem);

      await Promise.all([carregarPerfil(), carregarMedicacoes()]);
      if (fontsLoaded) SplashScreen.hideAsync();
    }
    if (fontsLoaded) {
      init();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <Stack>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="remedio/[id]"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
