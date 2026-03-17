import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useApp } from "@/contexts/app-context";
import { AuthProvider } from "@/contexts/auth-context";
import { SubscriptionProvider, useSubscription } from "@/contexts/subscription-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { trpc, trpcClient } from "@/lib/trpc";

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function XPRewardBridge({ children }: { children: ReactNode }) {
  const { hasXPReward } = useApp();
  const { setHasXPRewardOverride } = useSubscription();

  useEffect(() => {
    setHasXPRewardOverride(hasXPReward);
  }, [hasXPReward, setHasXPRewardOverride]);

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="student" options={{ headerShown: false }} />
      <Stack.Screen name="teacher" options={{ headerShown: false }} />
      <Stack.Screen name="paywall" options={{ headerShown: false, presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SubscriptionProvider>
            <AppProvider>
              <ThemeProvider>
                <XPRewardBridge>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <RootLayoutNav />
                  </GestureHandlerRootView>
                </XPRewardBridge>
              </ThemeProvider>
            </AppProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
