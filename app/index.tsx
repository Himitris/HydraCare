// app/index.tsx
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirection vers HydraCare par défaut avec un délai pour permettre le montage du layout
    const timer = setTimeout(() => {
      router.replace('/(apps)/hydracare');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return <View style={{ flex: 1 }} />;
}
