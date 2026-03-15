import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

export default function Visning() {
  const { id, tittel: initialTittel, tekst: initialTekst, opprettet_av, bilde_URL } = useLocalSearchParams();
  const router = useRouter();

  
  const [tittel, setTittel] = useState(initialTittel as string);
  const [tekst, setTekst] = useState(initialTekst as string);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  const handleUpdate = async () => {
    if (!tittel.trim() || !tekst.trim()) {
      Alert.alert("Feil", "Feltene kan ikke være tomme.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('JobbNotater')
        .update({ 
          tittel: tittel, 
          tekst: tekst, 
          redigert: new Date().toISOString()
        })
        .eq('id', id); 

      if (error) throw error;

      Alert.alert("Suksess", "Notatet ble oppdatert!");
      router.back();
    } catch (error: any) {
      Alert.alert("Kunne ikke oppdatere", error.message);
    } finally {
      setLoading(false);
    }
  };
const handleDelete = () => {
  Alert.alert(
    "Slett notat",
    "Er du sikker?",
    [
      { text: "Avbryt", style: "cancel" },
      { 
        text: "Slett", 
        style: "destructive", 
        onPress: async () => {
          try {
            setLoading(true);
            const { error } = await supabase
              .from('JobbNotater')
              .delete()
              .eq('id', id);

            if (error) throw error;

            
            router.back();

            setTimeout(() => {
              Alert.alert("Suksess", "Notatet ble slettet.");
            }, 100);

          } catch (error: any) {
            Alert.alert("Kunne ikke slette", error.message);
          } finally {
            setLoading(false);
          }
        }
      }
    ]
  );
};
 

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.infoText}>Skrevet av: {opprettet_av}</Text>
        
        <TextInput
          style={styles.titleInput}
          value={tittel}
          onChangeText={setTittel}
          placeholder="Overskrift"
          multiline
          scrollEnabled={false} 
        />
        
        <TextInput
          style={styles.contentInput}
          value={tekst}
          onChangeText={setTekst}
          placeholder="Start å skrive..."
          multiline
          scrollEnabled={false} 
        />

        
        {bilde_URL && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: bilde_URL as string }} 
              style={styles.image} 
            />
          </View>
        )}

        <Pressable 
          style={[styles.updateButton, loading && { opacity: 0.7 }]} 
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.updateButtonText}>Lagre endringer</Text>}
        </Pressable>

        <Pressable 
          style={styles.deleteButton} 
          onPress={handleDelete}
          disabled={loading}
        >
          <Text style={styles.deleteButtonText}>Slett notat</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    width: '100%',
    height: 300,
    marginVertical: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', 
  },
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20 },
  infoText: { fontSize: 12, color: '#888', marginBottom: 10 },
  titleInput: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    color: '#1a1a1a',
    padding: 0 
  },
  contentInput: { 
    fontSize: 18, 
    lineHeight: 26, 
    color: '#333', 
    minHeight: 200, 
    textAlignVertical: 'top' 
  },
  updateButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 50
  },
  updateButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  readOnlyNote: { 
    marginTop: 20, 
    color: '#e74c3c', 
    fontStyle: 'italic', 
    textAlign: 'center' 
  },
  deleteButton: {
  marginTop: 15,
  padding: 18,
  borderRadius: 12,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#e74c3c', 
  marginBottom: 50,
},
deleteButtonText: {
  color: '#e74c3c',
  fontSize: 16,
  fontWeight: '600',
},
});