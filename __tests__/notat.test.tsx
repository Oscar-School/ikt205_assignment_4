import { supabase } from '@/lib/supabase';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert } from 'react-native';
import Notat from '../app/(tabs)/notat';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Mock FileSystem 
jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1000 }),
  readAsStringAsync: jest.fn().mockResolvedValue('base64string'),
  EncodingType: { Base64: 'base64' },
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(() => ({
    upsert: jest.fn().mockResolvedValue({ error: null }),
    insert: jest.fn(() => 
      new Promise((resolve) => 
        setTimeout(() => resolve({ error: null }), 100) // 100ms forsinkelse
      )
    ),
  })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'http://test.com' } }),
      })),
    },
  },
}));

// Mocking av Device/Notifications
jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-constants', () => ({ expoConfig: { extra: { eas: { projectId: '123' } } } }));
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'token' }),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useIsFocused: jest.fn(() => true), 
}));

describe('Notat Komponent - Oppgave Testing Suite', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // (10%) UNIT TEST: Opprettelse & Navigasjon
  test('skal navigere tilbake når et gyldig notat lagres', async () => {
    const mockBack = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ back: mockBack });
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: '1', email: 't@t.no' } } });

    const { getByPlaceholderText, getByText } = render(<Notat />);

    fireEvent.changeText(getByPlaceholderText('Overskrift'), 'Test Tittel');
    fireEvent.changeText(getByPlaceholderText('Skriv notatet ditt her...'), 'Test Innhold');
    

    fireEvent.press(getByText('Lagre notat'));

    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });
  });

  // (15%) INTEGRATION TEST: Mocking & Loader
  test('skal vise laste-indikator mens lagring pågår', async () => {
  (supabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: { id: 'user-123' } }
  });

  const { getByPlaceholderText, getByText, queryByTestId } = render(<Notat />);

  fireEvent.changeText(getByPlaceholderText('Overskrift'), 'Laste-test');
  fireEvent.changeText(getByPlaceholderText('Skriv notatet ditt her...'), 'Venter...');

  fireEvent.press(getByText('Lagre notat'));

  await waitFor(() => {
    expect(queryByTestId('laste-spinner')).toBeTruthy();
  });

  await waitFor(() => {
    expect(queryByTestId('laste-spinner')).toBeFalsy();
  });
});

  // (10%) AUTH GUARD TEST: Tilgangskontroll
  test('skal vise feilmelding hvis brukeren ikke er logget inn', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } });
    const spyAlert = jest.spyOn(Alert, 'alert');

    const { getByPlaceholderText, getByText } = render(<Notat />);
    
    fireEvent.changeText(getByPlaceholderText('Overskrift'), 'Ulovlig');
    fireEvent.changeText(getByPlaceholderText('Skriv notatet ditt her...'), 'Ulovlig');
    
    fireEvent.press(getByText('Lagre notat'));

    await waitFor(() => {
      expect(spyAlert).toHaveBeenCalledWith("Feil", "Du må være logget inn!");
    });
  });
});