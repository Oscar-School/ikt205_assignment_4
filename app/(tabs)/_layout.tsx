import AuthScreen from '@/app/login'; // Importer skjermen vi lagde over
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Sjekk nåværende session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    // Lytt på endringer (inn-/utlogging)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!initialized) return null; // Vent til vi vet om brukeren er logget inn

  // Hvis ingen session, vis AuthScreen
  if (!session) {
    return <AuthScreen />;
  }

  // Hvis logget inn, vis den vanlige appen (index, visning, osv.)
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="notat" options={{ title: "Nytt notat" }} />
      <Stack.Screen name="visning" options={{ title: "Ditt notat" }} />
    </Stack>
  );
}