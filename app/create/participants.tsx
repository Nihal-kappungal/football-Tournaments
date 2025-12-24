import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Layout } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { generateLeagueFixtures, generateKnockoutFixtures } from '../../utils/fixtureGenerator';
import { saveTournament } from '../../utils/storage';
import { Participant, Tournament } from '../../types/types';
import { v4 as uuidv4 } from 'uuid';

export default function ParticipantsScreen() {
    const params = useLocalSearchParams<{ name: string; type: string }>();
    const router = useRouter();
    const [names, setNames] = useState<string[]>(['', '', '', '']); // Start with 4 default slots

    const updateName = (text: string, index: number) => {
        const newNames = [...names];
        newNames[index] = text;
        setNames(newNames);
    };

    const addSlot = () => {
        setNames([...names, '']);
    };

    const removeSlot = (index: number) => {
        const newNames = names.filter((_, i) => i !== index);
        setNames(newNames);
    };

    const handleCreate = async () => {
        const validNames = names.map(n => n.trim()).filter(n => n.length > 0);
        if (validNames.length < 2) {
            Alert.alert('Error', 'Please enter at least 2 participants');
            return;
        }

        const participants: Participant[] = validNames.map(name => ({
            id: uuidv4(),
            name,
            stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }
        }));

        const tournamentId = uuidv4();
        const type = params.type as 'LEAGUE' | 'KNOCKOUT';

        let fixtures;
        if (type === 'LEAGUE') {
            fixtures = generateLeagueFixtures(participants, tournamentId);
        } else {
            fixtures = generateKnockoutFixtures(participants, tournamentId);
        }

        const tournament: Tournament = {
            id: tournamentId,
            name: params.name!,
            type,
            participants,
            fixtures,
            status: 'ACTIVE',
            createdAt: Date.now(),
        };

        await saveTournament(tournament);

        // Replace stack so we go back to home then detailed view, or just reset to home and push detailed.
        // Easiest is navigate to root then push details, or replace.
        router.dismissAll();
        router.replace('/');
        // Small delay to allow list reload? Or just replace to home and user clicks on it.
        // Better UX: Open the tournament.
        setTimeout(() => {
            router.push(`/tournament/${tournamentId}`);
        }, 100);
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>Who is playing?</Text>
                <Text style={styles.subtitle}>Enter names of players or teams.</Text>

                {names.map((name, index) => (
                    <View key={index} style={styles.inputRow}>
                        <Text style={styles.index}>{index + 1}.</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={`Player ${index + 1}`}
                            placeholderTextColor={Colors.dark.gray}
                            value={name}
                            onChangeText={(t) => updateName(t, index)}
                        />
                        {names.length > 2 && (
                            <TouchableOpacity onPress={() => removeSlot(index)} style={styles.removeBtn}>
                                <Ionicons name="close-circle" size={24} color={Colors.dark.danger} />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}

                <TouchableOpacity style={styles.addBtn} onPress={addSlot}>
                    <Ionicons name="add-circle" size={24} color={Colors.dark.primary} />
                    <Text style={styles.addBtnText}>Add Participant</Text>
                </TouchableOpacity>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
                    <Text style={styles.createBtnText}>Create Tournament</Text>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.dark.background} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    scroll: {
        padding: Layout.spacing.lg,
        paddingBottom: 100,
    },
    title: {
        color: Colors.dark.text,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        color: Colors.dark.gray,
        fontSize: 16,
        marginBottom: Layout.spacing.lg,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Layout.spacing.md,
    },
    index: {
        color: Colors.dark.gray,
        width: 30,
        fontSize: 16,
        fontVariant: ['tabular-nums'],
    },
    input: {
        flex: 1,
        backgroundColor: Colors.dark.surface,
        color: Colors.dark.text,
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.md,
        fontSize: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    removeBtn: {
        padding: Layout.spacing.sm,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Layout.spacing.md,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: Colors.dark.gray,
        borderRadius: Layout.borderRadius.md,
        gap: 8,
        marginTop: Layout.spacing.sm,
    },
    addBtnText: {
        color: Colors.dark.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.dark.surface,
        padding: Layout.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    createBtn: {
        backgroundColor: Colors.dark.accent,
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    createBtnText: {
        color: Colors.dark.background,
        fontWeight: 'bold',
        fontSize: 18,
    },
});
