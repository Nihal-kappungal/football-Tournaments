import { View, Text, StyleSheet, ActivityIndicator, SectionList, TouchableOpacity, ScrollView, Image } from 'react-native';
import React, { useCallback, useState } from 'react';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { getTournaments } from '../../../utils/storage';
import { calculateStandings, getTopScorers } from '../../../utils/tournamentLogic';
import { Colors, Layout } from '../../../constants/Colors';
import { Tournament, Match, Participant } from '../../../types/types';
import { FixtureItem } from '../../../components/FixtureItem';
import { StandingsTable } from '../../../components/StandingsTable';
import { Leaderboard } from '../../../components/Leaderboard';
import { Ionicons } from '@expo/vector-icons';

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
        let sectionData: (Match | Match[])[] = matches;

        if (tournament.hasTwoLegs && tournament.type === 'KNOCKOUT') {
            // Group by Tie
            const processed = new Set<string>();
            const ties: Match[][] = [];

            matches.forEach(m => {
                if (processed.has(m.id)) return;
                // Find pair in this round
                const pair = matches.find(other =>
                    other.id !== m.id &&
                    !processed.has(other.id) &&
                    ((other.homeTeamId === m.homeTeamId && other.awayTeamId === m.awayTeamId) ||
                        (other.homeTeamId === m.awayTeamId && other.awayTeamId === m.homeTeamId))
                );

                if (pair) {

                    processed.add(m.id);
                    processed.add(pair.id);
                    // Add as array. Sort by something? Maybe round name 'Leg 1' 'Leg 2'?
                    // Or usually Leg 1 comes first if we trust order. 
                    // Let's sort so Leg 1 is first.
                    // Or sort by which team is home?
                    // User wants specific display.
                    // Usually we assume they are added in order.
                    // Let's just push [m, pair]
                    ties.push([m, pair].sort((a, b) => (a.roundName || '').localeCompare(b.roundName || '')));
                } else {
                    processed.add(m.id);
                    ties.push([m]);
                }
            });
            sectionData = ties;
        }

        // Adjust Title: If legs are mixed in same round order, we just use generic name.
        // My generator puts "Round 1 - Leg 1" and "Round 1 - Leg 2" BOTH in roundOrder=1.
        // So they end up here. The title might pick one.
        // We probably want just "Round 1" as title.
        const roundTitle = matches[0].roundName?.split(' - ')[0] || `Round ${key}`;

        return {
            title: roundTitle,
            data: sectionData
        };
    });


    const renderHeader = () => (
        <View>
            {tournament.status === 'COMPLETED' && (
                <View style={styles.winnerContainer}>
                    <Image
                        source={require('../../../assets/winner-badge.png')}
                        style={styles.winnerImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.winnerName}>
                        {tournament.type === 'LEAGUE'
                            ? standings[0]?.name
                            : (() => {
                                const maxRound = Math.max(...tournament.fixtures.map(m => m.roundOrder || 0));
                                const finalMatch = tournament.fixtures.find(m => m.roundOrder === maxRound);
                                if (!finalMatch || !finalMatch.isPlayed) return 'Unknown';

                                const winnerId = finalMatch.homeScore! > finalMatch.awayScore! ? finalMatch.homeTeamId : finalMatch.awayTeamId;
                                const winner = tournament.participants.find(p => p.id === winnerId);
                                return winner ? winner.name : 'Unknown';
                            })()
                        }
                    </Text>
                </View>
            )}

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
        </View>
    );

    return (
        <View style={styles.container}>
            {activeTab === 'FIXTURES' ? (
                <SectionList
                    ListHeaderComponent={renderHeader}
                    sections={sortedSections}
                    keyExtractor={(item) => Array.isArray(item) ? item[0].id : item.id}
                    renderItem={({ item }) => <FixtureItem data={item} participants={tournament.participants} />}
                    renderSectionHeader={({ section: { title } }) => (
                        <View style={{ paddingHorizontal: Layout.spacing.md }}>
                            <Text style={styles.sectionHeader}>{title}</Text>
                        </View>
                    )}
                    stickySectionHeadersEnabled={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            ) : (
                <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                    {renderHeader()}
                    <View style={styles.content}>
                        {activeTab === 'TABLE' && (
                            <StandingsTable participants={standings} />
                        )}

                        {activeTab === 'GROUPS' && (
                            <View>
                                {Array.from(groupStandings.keys()).sort().map(groupId => (
                                    <View key={groupId} style={{ marginBottom: 20 }}>
                                        <Text style={styles.sectionHeader}>Group {groupId}</Text>
                                        <StandingsTable participants={groupStandings.get(groupId)!} />
                                    </View>
                                ))}
                            </View>
                        )}

                        {activeTab === 'STATS' && (
                            <Leaderboard scorers={scorers} />
                        )}
                    </View>
                </ScrollView>
            )}
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
    winnerContainer: {
        alignItems: 'center',
        marginVertical: Layout.spacing.md,
        padding: Layout.spacing.md,
    },
    winnerImage: {
        width: '100%',
        height: 150,
    },
    winnerText: {
        // Unused now, but kept if needed
        color: Colors.dark.gray,
    },
    winnerName: {
        color: Colors.dark.accent, // Gold
        fontWeight: 'bold',
        fontSize: 32,
        marginTop: Layout.spacing.sm,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
});
