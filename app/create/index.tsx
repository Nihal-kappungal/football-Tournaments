import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { Colors, Layout } from '../../constants/Colors';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TournamentType } from '../../types/types';

export default function CreateTournamentScreen() {
    const [name, setName] = useState('');
    const [type, setType] = useState<TournamentType>('LEAGUE');
    const router = useRouter();

    const handleNext = () => {
        if (!name.trim()) {
            alert('Please enter a tournament name');
            return;
        }
        router.push({
            pathname: '/create/participants',
            params: { name, type }
        });
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.label}>Tournament Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Champions League 2024"
                    placeholderTextColor={Colors.dark.gray}
                    value={name}
                    onChangeText={setName}
                    autoFocus
                />

                <Text style={styles.label}>Format</Text>
                <View style={styles.typeContainer}>
                    <TouchableOpacity
                        style={[styles.typeOption, type === 'LEAGUE' && styles.typeSelected]}
                        onPress={() => setType('LEAGUE')}
                    >
                        <Ionicons name="list" size={32} color={type === 'LEAGUE' ? Colors.dark.background : Colors.dark.gray} />
                        <Text style={[styles.typeText, type === 'LEAGUE' && styles.typeTextSelected]}>League</Text>
                        <Text style={[styles.typeDesc, type === 'LEAGUE' && styles.typeDescSelected]}>Round Robin. Everyone plays everyone.</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.typeOption, type === 'KNOCKOUT' && styles.typeSelected]}
                        onPress={() => setType('KNOCKOUT')}
                    >
                        <Ionicons name="git-network" size={32} color={type === 'KNOCKOUT' ? Colors.dark.background : Colors.dark.gray} />
                        <Text style={[styles.typeText, type === 'KNOCKOUT' && styles.typeTextSelected]}>Knockout</Text>
                        <Text style={[styles.typeDesc, type === 'KNOCKOUT' && styles.typeDescSelected]}>Elimination bracket. Winner advances.</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.button} onPress={handleNext}>
                    <Text style={styles.buttonText}>Next</Text>
                    <Ionicons name="arrow-forward" size={20} color={Colors.dark.background} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    scroll: {
        padding: Layout.spacing.lg,
    },
    label: {
        color: Colors.dark.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: Layout.spacing.sm,
        marginTop: Layout.spacing.md,
    },
    input: {
        backgroundColor: Colors.dark.surface,
        color: Colors.dark.text,
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.md,
        fontSize: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    typeContainer: {
        flexDirection: 'row',
        gap: Layout.spacing.md,
    },
    typeOption: {
        flex: 1,
        backgroundColor: Colors.dark.surface,
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        alignItems: 'center',
        gap: 8,
    },
    typeSelected: {
        backgroundColor: Colors.dark.accent,
        borderColor: Colors.dark.accent,
    },
    typeText: {
        color: Colors.dark.text,
        fontWeight: 'bold',
        fontSize: 16,
    },
    typeTextSelected: {
        color: Colors.dark.background,
    },
    typeDesc: {
        color: Colors.dark.gray,
        fontSize: 12,
        textAlign: 'center',
    },
    typeDescSelected: {
        color: 'rgba(0,0,0,0.6)',
    },
    footer: {
        padding: Layout.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    button: {
        backgroundColor: Colors.dark.accent,
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    buttonText: {
        color: Colors.dark.background,
        fontWeight: 'bold',
        fontSize: 18,
    },
});
