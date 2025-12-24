import { View, Text, StyleSheet, ActivityIndicator, SectionList, TouchableOpacity } from 'react-native';
import React, { useCallback, useState } from 'react';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { getTournaments } from '../../../utils/storage';
import { calculateStandings, getTopScorers } from '../../../utils/tournamentLogic';
import { Colors, Layout } from '../../../constants/Colors';
import { Tournament, Match, Participant } from '../../../types/types';
import { FixtureItem } from '../../../components/FixtureItem';
import { StandingsTable } from '../../../components/StandingsTable';
import { Leaderboard } from '../../../components/Leaderboard';

type Tab = 'FIXTURES' | 'TABLE' | 'STATS';

export default function TournamentDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('FIXTURES');
    const [standings, setStandings] = useState<Participant[]>([]);
    const [scorers, setScorers] = useState<{ player: Participant, goals: number }[]>([]);

    const loadData = async () => {
        // setLoading(true); // Don't show full loader on refresh, maybe refreshing state
        const all = await getTournaments();
        const t = all.find(x => x.id === id);
        if (t) {
            setTournament(t);
            const updatedStandings = calculateStandings(t.participants, t.fixtures);
            setStandings(updatedStandings);

            // For stats, we need to pass the participants from the tournament (t.participants might be outdated in stats if not updated? 
            // No, calculateStandings returns NEW participant objects with updated stats.
            // But getTopScorers depends on matches and maps to participants.
            setScorers(getTopScorers(t.participants, t.fixtures));
        }
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [id])
    );

    if (loading) {
        return <View style={styles.center}><ActivityIndicator color={Colors.dark.accent} /></View>;
    }

    if (!tournament) {
        return <View style={styles.center}><Text style={{ color: 'white' }}>Tournament not found</Text></View>;
    }

    // Group matches by round for SectionList
    const sections = Array.from(new Set(tournament.fixtures.map(m => m.roundName || 'Round ' + m.roundOrder)))
        .sort() // You might want custom sort based on roundOrder
        .map(roundName => ({
            title: roundName,
            data: tournament.fixtures.filter(m => (m.roundName || 'Round ' + m.roundOrder) === roundName)
        }));

    // Custom sort: "Matchday 1", "Matchday 2"... or "Round 1"...
    // Simple alphanumeric sort might fail on "Round 10" vs "Round 2". 
    // Let's rely on roundOrder if possible.
    const groupedMatches = new Map<number, Match[]>();
    tournament.fixtures.forEach(m => {
        const r = m.roundOrder || 0;
        if (!groupedMatches.has(r)) groupedMatches.set(r, []);
        groupedMatches.get(r)?.push(m);
    });

    const sortedSections = Array.from(groupedMatches.keys()).sort((a, b) => a - b).map(key => {
        const matches = groupedMatches.get(key)!;
        return {
            title: matches[0].roundName || `Round ${key}`,
            data: matches
        };
    });


    return (
        <View style={styles.container}>
            {/* Tab Header */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'FIXTURES' && styles.activeTab]}
                    onPress={() => setActiveTab('FIXTURES')}
                >
                    <Text style={[styles.tabText, activeTab === 'FIXTURES' && styles.activeTabText]}>Fixtures</Text>
                </TouchableOpacity>

                {tournament.type === 'LEAGUE' && (
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'TABLE' && styles.activeTab]}
                        onPress={() => setActiveTab('TABLE')}
                    >
                        <Text style={[styles.tabText, activeTab === 'TABLE' && styles.activeTabText]}>Table</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'STATS' && styles.activeTab]}
                    onPress={() => setActiveTab('STATS')}
                >
                    <Text style={[styles.tabText, activeTab === 'STATS' && styles.activeTabText]}>Stats</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {activeTab === 'FIXTURES' && (
                    <SectionList
                        sections={sortedSections}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => <FixtureItem match={item} participants={tournament.participants} />}
                        renderSectionHeader={({ section: { title } }) => (
                            <Text style={styles.sectionHeader}>{title}</Text>
                        )}
                        stickySectionHeadersEnabled={false} // Clean look
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}

                {activeTab === 'TABLE' && (
                    <StandingsTable participants={standings} />
                )}

                {activeTab === 'STATS' && (
                    <Leaderboard scorers={scorers} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.dark.background,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: Colors.dark.surface,
        padding: 4,
        margin: Layout.spacing.md,
        borderRadius: Layout.borderRadius.md,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: Layout.borderRadius.sm - 2,
    },
    activeTab: {
        backgroundColor: Colors.dark.accent,
    },
    tabText: {
        color: Colors.dark.gray,
        fontWeight: 'bold',
    },
    activeTabText: {
        color: Colors.dark.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: Layout.spacing.md,
    },
    sectionHeader: {
        color: Colors.dark.primary,
        fontWeight: 'bold',
        fontSize: 18,
        marginTop: Layout.spacing.md,
        marginBottom: Layout.spacing.sm,
    },
});
