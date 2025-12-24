import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useCallback, useState } from 'react';
import { Colors, Layout } from '../constants/Colors';
import { getTournaments, deleteTournament } from '../utils/storage';
import { Tournament } from '../types/types';
import { useFocusEffect, Link } from 'expo-router';
import { TournamentCard } from '../components/TournamentCard';
import { Ionicons } from '@expo/vector-icons';
import { CustomAlert, AlertButton } from '../components/CustomAlert';

export default function HomeScreen() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);

    // Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertButtons, setAlertButtons] = useState<AlertButton[]>([]);

    const loadData = async () => {
        setLoading(true);
        const data = await getTournaments();
        setTournaments(data.sort((a, b) => b.createdAt - a.createdAt));
        setLoading(false);
    };

    const handleDelete = (id: string) => {
        setAlertTitle("Delete Tournament");
        setAlertMessage("Are you sure you want to delete this tournament? This action cannot be undone.");
        setAlertButtons([
            {
                text: "Cancel",
                style: "cancel",
                onPress: () => setAlertVisible(false)
            },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    setAlertVisible(false);
                    await deleteTournament(id);
                    loadData();
                }
            }
        ]);
        setAlertVisible(true);
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color={Colors.dark.accent} />
            ) : tournaments.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="football-outline" size={64} color={Colors.dark.gray} />
                    <Text style={styles.emptyText}>No tournaments found</Text>
                    <Text style={styles.emptySubText}>Create your first league or knockout cup!</Text>
                </View>
            ) : (
                <FlatList
                    data={tournaments}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <TournamentCard tournament={item} onDelete={handleDelete} />}
                    contentContainerStyle={styles.list}
                />
            )}

            <Link href="/create" asChild>
                <TouchableOpacity style={styles.fab}>
                    <Ionicons name="add" size={30} color="#000" />
                </TouchableOpacity>
            </Link>

            <CustomAlert
                visible={alertVisible}
                title={alertTitle}
                message={alertMessage}
                buttons={alertButtons}
                onClose={() => setAlertVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Layout.spacing.md,
    },
    list: {
        paddingBottom: 80,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: Colors.dark.text,
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: Layout.spacing.md,
    },
    emptySubText: {
        color: Colors.dark.gray,
        fontSize: 16,
        marginTop: Layout.spacing.sm,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: Layout.spacing.xl,
        right: Layout.spacing.xl,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.dark.accent,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
});
