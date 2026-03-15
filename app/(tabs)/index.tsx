import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

interface NotatType {
  id: string; 
  tittel: string;
  tekst: string;
  opprettet_av: string; 
  redigert: string;
  bilde_URL: string;
}

export default function Index() {
  const [notater, setNotater] = useState<NotatType[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false); // Ny state for "Last mer"
  const [page, setPage] = useState(0); // Holder styr på paginering
  const [hasMore, setHasMore] = useState(true); // Sjekker om det er flere notater
  
  const ITEMS_PER_PAGE = 5; // (10%) Krav: Hent kun 5 om gangen
  const router = useRouter();

  // Funksjon for å hente data (brukes både ved start og ved "Last mer")
  const fetchData = async (pageNum: number, shouldAppend: boolean = false) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserEmail(user.email ?? null);

    // (10%) Paginering Logikk: Beregn start og slutt indeks
    const from = pageNum * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error } = await supabase
      .from('JobbNotater')
      .select('*')
      .order('redigert', { ascending: false })
      .range(from, to); // (10%) Krav: Bruk .range(start, end)

    if (error) {
      console.error("Feil ved henting:", error.message);
    } else {
      if (data) {
        // Hvis vi får færre enn 5 notater, betyr det at det ikke er flere igjen i DB
        if (data.length < ITEMS_PER_PAGE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        // Oppdater listen (legg til nye data eller erstatt hele hvis det er side 0)
        setNotater(prev => shouldAppend ? [...prev, ...data] : data);
      }
    }
    setLoading(false);
    setLoadingMore(false);
  };

  useFocusEffect(
    useCallback(() => {
      setPage(0); // Reset side når vi kommer tilbake til skjermen
      fetchData(0, false);
    }, [])
  );

  // (10%) Implementasjon av "Last mer" funksjon
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage, true);
    }
  };

  const loggUt = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.userBadge}>Logget inn som: {userEmail}</Text>
            <Text style={styles.title}>Jobb Notater</Text>
          </View>
          <Pressable onPress={loggUt} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logg ut</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color="black" />
          ) : notater.length === 0 ? (
            <Text style={styles.emptyText}>Ingen jobbnotater ennå...</Text>
          ) : (
            <FlatList
              data={notater}
              keyExtractor={(item) => item.id.toString()}
              style={{ width: '100%' }}
              renderItem={({ item }) => (
                <Pressable 
                  style={styles.notatKort}
                  onPress={() => router.push({
                    pathname: "/visning",
                    params: { 
                      id: item.id, 
                      tittel: item.tittel, 
                      tekst: item.tekst, 
                      opprettet_av: item.opprettet_av, 
                      bilde_URL: item.bilde_URL
                    }
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notatTittel}>{item.tittel}</Text>
                      <Text numberOfLines={1} style={styles.notatSnippet}>{item.tekst}</Text>
                    </View>
                    {item.bilde_URL && (
                      <Image 
                        source={{ uri: item.bilde_URL }} 
                        style={{ width: 50, height: 50, borderRadius: 8, marginLeft: 10 }} 
                        resizeMode="cover" 
                      />
                    )}
                  </View>
                </Pressable>
              )}
              // (10%) "Last mer" knapp i bunnen av listen
              ListFooterComponent={() => (
                hasMore ? (
                  <Pressable 
                    onPress={handleLoadMore} 
                    style={styles.loadMoreButton}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <ActivityIndicator color="#007AFF" />
                    ) : (
                      <Text style={styles.loadMoreText}>Last mer</Text>
                    )}
                  </Pressable>
                ) : (
                  <Text style={styles.noMoreText}>Ingen flere notater</Text>
                )
              )}
            />
          )}
        </View>

        <Pressable onPress={() => router.push("/notat")} style={styles.button}>
          <Text style={styles.buttonText}>+ Lag nytt jobbnotat</Text>
        </Pressable>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... dine eksisterende stiler ...
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 10,
  },
  userBadge: { fontSize: 12, color: '#666', marginBottom: 4 },
  title: { fontSize: 28, fontWeight: "bold" },
  content: { flex: 1, marginTop: 20, width: '100%' },
  notatKort: {
    width: '100%',
    padding: 18,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  notatTittel: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  notatSnippet: { color: '#666', marginTop: 4 },
  button: { backgroundColor: "black", padding: 18, borderRadius: 15, alignItems: "center", marginBottom: 20 },
  buttonText: { color: "white", fontSize: 18, fontWeight: "600" },
  logoutText: { color: '#007AFF', fontSize: 14, fontWeight: '500' },
  emptyText: { color: '#999', marginTop: 50, textAlign: 'center' },
  logoutButton: { marginTop: 10, right: 0, position: 'absolute' },
  
  // Nye stiler for paginering
  loadMoreButton: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loadMoreText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
  noMoreText: {
    textAlign: 'center',
    color: '#aaa',
    padding: 15,
    marginBottom: 20,
    fontStyle: 'italic',
  }
});