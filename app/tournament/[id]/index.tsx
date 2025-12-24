import { View, Text, StyleSheet, ActivityIndicator, SectionList, TouchableOpacity, ScrollView } from 'react-native';
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
    const [activeTab, setActiveTab] = useState<string>('FIXTURES'); // Changed to string for flexibility
    const [standings, setStandings] = useState<Participant[]>([]);

    // For Groups
    const [groupStandings, setGroupStandings] = useState<Map<string, Participant[]>>(new Map()); // Map groupId -> participants
    const [scorers, setScorers] = useState<{ player: Participant, goals: number }[]>([]);

    const loadData = async () => {
        const all = await getTournaments();
        const t = all.find(x => x.id === id);
        if (t) {
            setTournament(t);

            if (t.type === 'LEAGUE') {
                setStandings(calculateStandings(t.participants, t.fixtures));
            } else if (t.type === 'GROUPS_KNOCKOUT') {
                // Calculate standings per group
                const groups = new Map<string, Participant[]>();
                const uniqueGroups = Array.from(new Set(t.participants.map(p => p.groupId).filter(g => g)));

                uniqueGroups.forEach(gid => {
                    const groupPs = t.participants.filter(p => p.groupId === gid);
                    // Filter group matches: (RoundOrder 0 or check participants)
                    // We tagged group matches with roundOrder 0 earlier? 
                    // Or filtering by player ID is safer.
                    const groupMatches = t.fixtures.filter(m => {
                        const homeP = t.participants.find(p => p.id === m.homeTeamId);
                        return homeP?.groupId === gid && (t.stage === 'GROUP_STAGE' || m.roundOrder === 0);
                        // If stage is Knockout, we still want to show group tables? Yes.
                        // Matches in group stage usually have roundOrder 0.
                    });
                    groups.set(gid!, calculateStandings(groupPs, groupMatches));
                });
                setGroupStandings(groups);
            }

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

                {(tournament.type === 'LEAGUE') && (
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'TABLE' && styles.activeTab]}
                        onPress={() => setActiveTab('TABLE')}
                    >
                        <Text style={[styles.tabText, activeTab === 'TABLE' && styles.activeTabText]}>Table</Text>
                    </TouchableOpacity>
                )}

                {(tournament.type === 'GROUPS_KNOCKOUT') && (
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'GROUPS' && styles.activeTab]}
                        onPress={() => setActiveTab('GROUPS')}
                    >
                        <Text style={[styles.tabText, activeTab === 'GROUPS' && styles.activeTabText]}>Groups</Text>
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

                {activeTab === 'GROUPS' && (
                    <ScrollView>
                        {Array.from(groupStandings.keys()).sort().map(groupId => (
                            <View key={groupId} style={{ marginBottom: 20 }}>
                                <Text style={styles.sectionHeader}>Group {groupId}</Text>
                                <StandingsTable participants={groupStandings.get(groupId)!} />
                            </View>
                        ))}
                    </ScrollView>
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
