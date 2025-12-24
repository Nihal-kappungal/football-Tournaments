import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Layout } from '../constants/Colors';
import { Tournament } from '../types/types';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';

interface Props {
    tournament: Tournament;
}

export const TournamentCard = ({ tournament }: Props) => {
    return (
        <Link href={`/tournament/${tournament.id}`} asChild>
            <TouchableOpacity style={styles.card} activeOpacity={0.8}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={tournament.type === 'LEAGUE' ? 'trophy' : 'git-network'}
                            size={24}
                            color={Colors.dark.accent}
                        />
                    </View>
                    <View style={styles.info}>
                        <Text style={styles.name}>{tournament.name}</Text>
                        <Text style={styles.type}>{tournament.type} • {tournament.participants.length} Players</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.dark.gray} />
                </View>
                <View style={styles.statusRow}>
                    <View style={[styles.badge, { backgroundColor: tournament.status === 'ACTIVE' ? Colors.dark.primary : Colors.dark.gray }]}>
                        <Text style={styles.badgeText}>{tournament.status}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Link>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.dark.surface,
        borderRadius: Layout.borderRadius.md,
        padding: Layout.spacing.md,
        marginBottom: Layout.spacing.md,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Layout.spacing.sm,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 215, 0, 0.1)', // Gold with opacity
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Layout.spacing.md,
    },
    info: {
        flex: 1,
    },
    name: {
        color: Colors.dark.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    type: {
        color: Colors.dark.gray,
        fontSize: 14,
        marginTop: 2,
    },
    statusRow: {
        flexDirection: 'row',
        marginTop: Layout.spacing.xs,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});
