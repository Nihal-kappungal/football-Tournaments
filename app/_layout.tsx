import 'react-native-get-random-values';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { Colors } from '../constants/Colors';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>
                <StatusBar style="light" />
                <Stack
                    screenOptions={{
                        headerStyle: {
                            backgroundColor: Colors.dark.surface,
                        },
                        headerTintColor: Colors.dark.text,
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                        contentStyle: {
                            backgroundColor: Colors.dark.background,
                        },
                    }}
                >
                    <Stack.Screen name="index" options={{ title: 'Tournaments' }} />
                    <Stack.Screen name="create/index" options={{ title: 'New Tournament', presentation: 'modal' }} />
                    <Stack.Screen name="create/participants" options={{ title: 'Participants' }} />
                    <Stack.Screen name="tournament/[id]/index" options={{ title: 'Tournament Details' }} />
                    <Stack.Screen name="tournament/[id]/match/[matchId]" options={{ title: 'Match', presentation: 'formSheet' }} />
                </Stack>
            </View>
        </SafeAreaProvider>
    );
}
