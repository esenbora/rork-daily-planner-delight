import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { TaskProvider } from "@/contexts/TaskContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import ErrorBoundary from "@/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="focus" />
      <Stack.Screen name="subscription" options={{ presentation: 'modal' }} />
      <Stack.Screen name="weekly" options={{ presentation: 'modal' }} />
      <Stack.Screen name="statistics" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="legal" options={{ presentation: 'modal' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <SubscriptionProvider>
              <TaskProvider>
                <RootLayoutNav />
              </TaskProvider>
            </SubscriptionProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
