import { supabase } from '@/lib/supabase';
import { useIsFocused } from '@react-navigation/native';
import { decode } from 'base64-arraybuffer';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function Notat() {
  const [tittel, setTittel] = useState("");
  const [notatTekst, setNotatTekst] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isFocused = useIsFocused();

  
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  
  const pickImage = async () => {
    if (!isFocused) return;
    const { status: camera } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: gallery } = await ImagePicker.requestMediaLibraryPermissionsAsync();



    if (camera !== 'granted' || gallery !== 'granted') {
      Alert.alert("Tillatelse kreves", "Vi trenger tilgang til kamera og bildegalleri.");
      return;
    }
    

    Alert.alert("Velg bilde", "Vil du ta et nytt bilde eller velge fra galleriet?", [
      { text: "Kamera", onPress: () => openPicker(true) },
      { text: "Galleri", onPress: () => openPicker(false) },
      { text: "Avbryt", style: "cancel" }
    ]);
  };

  const openPicker = async (useCamera: boolean) => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    };
    const result = useCamera 
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled) setImage(result.assets[0].uri);
  };

  //-------Dette for å se at man ikke kan sende med større filstørrelse------
  const uploadImageToSupabase = async (uri: string) => {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists || fileInfo.size > 15 * 1024 * 1024) {
      throw new Error("Bildet finnes ikke eller er over 15MB.");
    }

    //-------og at det viser frem feilmelding hvis det er feil format----------
    const base64Data = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const fileExt = uri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `notater/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('notat_bilder')
      .upload(filePath, decode(base64Data), { contentType: 'image/jpeg' });

      //-----feilmelding for hvis bildet ikke blir lastet opp til databasen---------
    if (uploadError) throw uploadError;
    return supabase.storage.from('notat_bilder').getPublicUrl(filePath).data.publicUrl;
  };

  
  async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    Alert.alert("Feil", "Du må bruke en fysisk telefon for å teste varsler.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  
  if (!projectId) {
    return null;
  }

  
  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
   
    return token;
  } catch (e) {
    
    return null;
  }
}

  
  const handleSave = async () => {
    if (!tittel.trim() || !notatTekst.trim()) {
      Alert.alert("Tomme felt", "Du må fylle ut både overskrift og tekst.");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Du må være logget inn!");

      
      const token = await registerForPushNotificationsAsync();
      
      
      if (token) {
        await supabase.from('user_tokens').upsert({ 
          user_id: user.id, 
          expo_push_token: token,
          updated_at: new Date().toISOString() 
        });
      }

      let imageUrl = image ? await uploadImageToSupabase(image) : null;

      const { error } = await supabase.from('JobbNotater').insert([
        { 
          tittel: tittel.trim(), 
          tekst: notatTekst.trim(),
          opprettet_av: user?.email,
          bilde_URL: imageUrl,
        }
      ]);

      if (error) throw error;
      
      router.back();
    } catch (e: any) {
      Alert.alert("Feil", e.message);
    } finally {
      setLoading(false);
    }
  };

  const erTom = !tittel.trim() || !notatTekst.trim();

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <View style={styles.container}>
        <View style={styles.topBar}>
          {isKeyboardVisible && (
            <Pressable onPress={() => Keyboard.dismiss()} style={styles.dismissButton}>
              <Text style={styles.dismissText}>Ferdig</Text>
            </Pressable>
          )}
        </View>
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TextInput
            style={styles.title}
            placeholder='Overskrift'
            placeholderTextColor="#666"
            value={tittel}
            onChangeText={setTittel}
          />

          <TextInput
            style={styles.input}
            placeholder="Skriv notatet ditt her..."
            multiline={true}
            value={notatTekst}
            onChangeText={setNotatTekst}
          />

          {image && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <Pressable onPress={() => setImage(null)} style={styles.removeImageButton}>
                <Text style={styles.removeImageText}>Fjern bilde</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        <View style={styles.buttonContainer}>
          <Pressable style={styles.imageButton} onPress={pickImage}>
            <Text style={styles.imageButtonText}>📷 Legg til bilde</Text>
          </Pressable>

          <Pressable 
            style={[styles.saveButton, (erTom || loading) && { backgroundColor: '#ccc' }]} 
            onPress={handleSave}
            disabled={loading || erTom}
          >
            {loading ? (
              <ActivityIndicator color="white" testID="laste-spinner" /> 
            ) : (
              <Text style={styles.saveText}>Lagre notat</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
    title: { fontSize: 32, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
    input: { fontSize: 18, minHeight: 50, textAlignVertical: 'top', marginBottom: 5 },
    imagePreviewContainer: { alignItems: 'center' },
    imagePreview: { width: '100%', height: 250, borderRadius: 10, resizeMode: 'contain' },
    removeImageButton: { marginTop: 10, backgroundColor: '#ff4444', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
    removeImageText: { color: 'white', fontWeight: 'bold' },
    buttonContainer: { paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
    imageButton: { backgroundColor: '#6c757d', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
    imageButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    saveButton: { backgroundColor: '#28a745', padding: 18, borderRadius: 12, alignItems: 'center' },
    saveText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    topBar: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10, height: 20 },
    dismissButton: { paddingVertical: 5, paddingHorizontal: 13, backgroundColor: '#007AFF', borderRadius: 20 },
    dismissText: { color: 'white', fontWeight: '600' },
  });