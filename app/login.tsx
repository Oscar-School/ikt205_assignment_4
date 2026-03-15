import { supabase } from '@/lib/supabase';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert(error.message);
    else Alert.alert('Bruker opprettet');
    setLoading(false);
  }

  async function handleSignIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Velkommen</Text>
      <TextInput placeholder="E-post" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" />
      <TextInput placeholder="Passord" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      <Button title={loading ? "Laster..." : "Logg inn"} onPress={handleSignIn} />
      <Button title="Lag konto" onPress={handleSignUp} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  input: { borderBottomWidth: 1, marginBottom: 20, padding: 8 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }
});