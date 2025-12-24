import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Layout } from '../constants/Colors';
import { Match, Participant } from '../types/types';
import { Link } from 'expo-router';

interface Props {
    match: Match;
    participants: Participant[];
}

export const FixtureItem = ({ match, participants }: Props) => {
    const home = participants.find(p => p.id === match.homeTeamId);
    const away = participants.find(p => p.id === match.awayTeamId);

    if (!home || !away) return null;

    return (
        <Link href={`/tournament/${match.tournamentId}/match/${match.id}`} asChild>
            <TouchableOpacity style={styles.card}>
                <View style={styles.teamContainer}>
                    <Text style={[styles.teamName, styles.homeName]}>{home.name}</Text>
                    {match.isPlayed ? (
                        <Text style={styles.score}>{match.homeScore}</Text>
                    ) : null}
                </View>

                <View style={styles.vsContainer}>
                    {match.isPlayed ? (
                        <Text style={styles.status}>FT</Text>
                    ) : (
                        <View style={styles.vsBadge}>
                            <Text style={styles.vsText}>VS</Text>
                        </View>
                    )}
                </View>

                <View style={styles.teamContainer}>
                    {match.isPlayed ? (
                        <Text style={styles.score}>{match.awayScore}</Text>
                    ) : null}
                    <Text style={[styles.teamName, styles.awayName]}>{away.name}</Text>
                </View>
            </TouchableOpacity>
        </Link>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
        padding: Layout.spacing.md,
        marginBottom: Layout.spacing.sm,
        borderRadius: Layout.borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    teamContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        justifyContent: 'space-between'
    },
    homeName: {
        flex: 1, // take available space
    },
    awayName: {
        flex: 1,
        textAlign: 'right'
    },
    teamName: {
        color: Colors.dark.text,
        fontSize: 16,
        fontWeight: '500',
    },
    score: {
        color: Colors.dark.text,
        fontSize: 20,
        fontWeight: 'bold',
        width: 30,
        textAlign: 'center'
    },
    vsContainer: {
        width: 50,
        alignItems: 'center',
    },
    vsBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    vsText: {
        color: Colors.dark.gray,
        fontSize: 12,
        fontWeight: 'bold',
    },
    status: {
        color: Colors.dark.accent,
        fontSize: 12,
        fontWeight: 'bold',
    },
});
