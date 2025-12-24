import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Layout } from '../constants/Colors';
import { Match, Participant } from '../types/types';
import { Link } from 'expo-router';

interface Props {
    data: Match | Match[];
    participants: Participant[];
}

export const FixtureItem = ({ data, participants }: Props) => {
    // Normalize to array
    const matches = Array.isArray(data) ? data : [data];
    // Sort logic? Usually provided sorted.
    // Assuming sorted by roundOrder or implicit order.

    if (matches.length === 0) return null;

    // Use first match to identify teams (Tie A vs Tie B)
    // Leg 1: A vs B. Leg 2: B vs A.
    // We want to consistently display Team A (from first match Home) on left.
    const firstMatch = matches[0];
    const homeId = firstMatch.homeTeamId;
    const awayId = firstMatch.awayTeamId;

    const home = participants.find(p => p.id === homeId);
    const away = participants.find(p => p.id === awayId);

    if (!home || !away) return null;

    // Calculate details
    const isDoubleLeg = matches.length > 1;

    let homeAgg = 0;
    let awayAgg = 0;
    let isAllPlayed = true;

    // Leg Indicators relative to HOME TEAM (Left side team)
    const legIndicators = matches.map(m => {
        if (!m.isPlayed) {
            isAllPlayed = false;
            return { color: Colors.dark.surface, text: '-', matchId: m.id }; // Not played
        }

        // Check if m.homeTeamId is our 'home' (A)
        const isHomeA = m.homeTeamId === homeId;
        const scoreA = isHomeA ? m.homeScore! : m.awayScore!;
        const scoreB = isHomeA ? m.awayScore! : m.homeScore!;

        homeAgg += scoreA;
        awayAgg += scoreB;

        if (scoreA > scoreB) return { color: Colors.dark.primary, text: 'W', matchId: m.id };
        if (scoreA < scoreB) return { color: Colors.dark.danger, text: 'L', matchId: m.id };
        return { color: Colors.dark.gray, text: 'D', matchId: m.id };
    });

    // Target Link: The latest match or the unplayed one.
    const targetMatch = matches.find(m => !m.isPlayed) || matches[matches.length - 1];

    return (
        <Link href={`/tournament/${firstMatch.tournamentId}/match/${targetMatch.id}`} asChild>
            <TouchableOpacity style={styles.card}>
                <View style={styles.teamContainer}>
                    <Text style={[styles.teamName, styles.homeName]}>{home.name}</Text>
                    {isDoubleLeg && isAllPlayed ? (
                        <Text style={styles.aggScore}>{homeAgg}</Text>
                    ) : (
                        matches.length === 1 && matches[0].isPlayed ? <Text style={styles.score}>{matches[0].homeScore}</Text> : null
                    )}
                </View>

                <View style={styles.centerContainer}>
                    {isDoubleLeg ? (
                        <View style={styles.indicators}>
                            {legIndicators.map((ind, i) => (
                                <View key={i} style={[styles.indicator, { backgroundColor: ind.color }]}>
                                    {/* <Text style={styles.indicatorText}>{ind.text}</Text> */}
                                </View>
                            ))}
                        </View>
                    ) : (
                        matches[0].isPlayed ? (
                            <Text style={styles.status}>FT</Text>
                        ) : (
                            <View style={styles.vsBadge}>
                                <Text style={styles.vsText}>VS</Text>
                            </View>
                        )
                    )}
                    {isDoubleLeg && <Text style={styles.aggLabel}>AGG</Text>}
                </View>

                <View style={styles.teamContainer}>
                    {isDoubleLeg && isAllPlayed ? (
                        <Text style={styles.aggScore}>{awayAgg}</Text>
                    ) : (
                        matches.length === 1 && matches[0].isPlayed ? <Text style={styles.score}>{matches[0].awayScore}</Text> : null
                    )}
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
        flex: 1,
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
    aggScore: {
        color: Colors.dark.accent,
        fontSize: 22,
        fontWeight: 'bold',
        width: 30,
        textAlign: 'center'
    },
    centerContainer: {
        width: 60,
        alignItems: 'center',
        justifyContent: 'center',
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
    indicators: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 2,
    },
    indicator: {
        width: 12,
        height: 12,
        borderRadius: 2,
    },
    aggLabel: {
        fontSize: 10,
        color: Colors.dark.gray,
        marginTop: 2,
    }
});
