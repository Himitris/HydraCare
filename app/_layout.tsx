import { Slot, useRouter } from 'expo-router';
import { View } from 'react-native';
import AppSwitcher from './AppSwitcher';

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Slot />
      <AppSwitcher />
    </View>
  );
}
