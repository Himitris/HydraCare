// app/(apps)/_layout.tsx
import { Stack } from 'expo-router';

export default function AppsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="hydracare"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="running"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="todo"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
