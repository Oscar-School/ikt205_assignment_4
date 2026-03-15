## Build
For å kjøre dette projektet trenger man at dette er instalert:  

Node.js  
Expo CLI  

Så intaller alle nødvendige pakker med `npm install`  

Så lag en .env fil med disse variblene  

EXPO_PUBLIC_SUPABASE_URL=https://din-prosjekt-id.supabase.co  
EXPO_PUBLIC_SUPABASE_ANON_KEY=din--anon-key   
(dette er for å kunne koble til supabase, hvis ikke appen har dette krasjer den)  

så kjør `npx expo start` og åpne appen med expo go appen på telefonen.  

For å kjøre testene så kjør `npm test`  


# Krav  
1. The Testing Suite (35%)  

x(10%) Unit Test - Opprettelse & Navigasjon: Lag en test som bekrefter at når et gyldig notat sendes inn, blir det "opprettet" (logikken kjører) og brukeren blir automatisk navigert tilbake til hovedskjermen.  
x(15%) Integration Test - Mocking & Loader: Lag en test som simulerer henting av et notat fra databasen. Testen skal verifisere at en "laste-indikator" (spinner/loader) er synlig mens kallet pågår, og at den forsvinner når det enkelte notatet er lastet inn.  
x(10%) Auth Guard Test - Tilgangskontroll: Test at appens beskyttede innhold (f.eks. "Legg til notat"-skjermen eller selve notatlisten) ikke er tilgjengelig eller synlig dersom brukeren ikke er logget inn.  
 

2. Production Readiness & Optimization (40%)  
  
x(10%) Log Cleanup: Det skal være null console.log-setninger i den endelige innleveringen. Koden skal fremstå profesjonell og "ren".  
x(10%) Resource Management - Kamera: Sørg for at kamerakomponenten ikke kjører i bakgrunnen. Den må enten avmonteres helt (unmount) eller settes i en "pause"-tilstand når brukeren navigerer bort fra skjermen.  

Pagination (Skalering):  

x(10%) Endre logikken for henting av notater slik at appen kun henter de 5 første notatene fra databasen.  
x(10%) Implementer en "Last mer"-knapp (eller automatisk "infinite scroll") som henter de neste 5 notatene.  
 

3. Build & Dokumentasjon (25%)  

x(10%) App Fil: En kjørbar build-fil (f.eks. en .apk for Android) må legges ved. Denne teller alene 10% og må fungere i en emulator eller på en fysisk enhet.  
x(15%) Build-dokumentasjon (README):  

Totalt 100%  
