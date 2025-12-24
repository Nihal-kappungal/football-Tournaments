import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getTournaments, saveTournament } from '../../../../utils/storage';
import { handleKnockoutProgression, checkTournamentCompletion } from '../../../../utils/tournamentLogic';
import { advanceGroupToKnockout } from '../../../../utils/hybridUtils';
import { Tournament, Match, Participant } from '../../../../types/types';
import { Colors, Layout } from '../../../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function MatchDetailScreen() {
    const { id, matchId } = useLocalSearchParams<{ id: string; matchId: string }>();
    const router = useRouter();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [match, setMatch] = useState<Match | null>(null);
    const [homePlayers, setHomePlayers] = useState<Participant[]>([]);
    const [awayPlayers, setAwayPlayers] = useState<Participant[]>([]);

    // Track goals: playerId -> count
    const [goals, setGoals] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        loadData();
    }, [id, matchId]);

    const loadData = async () => {
        const list = await getTournaments();
        const t = list.find(x => x.id === id);
        if (t) {
            setTournament(t);
            const m = t.fixtures.find(fx => fx.id === matchId);
            if (m) {
                setMatch(m);
                // Setup participants
                // If participants are generic "teams", we might not have individual players?
                // The prompt says "number of user ... user number and name". 
                // So Participants ARE the players/teams.
                // So "List of players" for a TEAM is just the TEAM itself if 1v1? 
                // "create a knock out, leage... enter the user number and name... fixture is show".
                // This implies 1v1 tournament (e.g. FIFA/PES). 
                // So "Home Team" IS "Player A". "Away Team" IS "Player B".
                // So "Scorer" IS "Player A" (if they scored).
                // Wait. If it's FIFA, you play as a Team (e.g. Barcelona). But YOU are the User.
                // "the best player also shown according the goal scored" -> "Best User" or "Best In-Game Player"?
                // "enter the score ... also the best player also shown".
                // Usually in these apps, "Player" means the User participating in the tournament.
                // IF it's 1v1, then "Goal Scorer" stats usually refers to the User's goals.
                // BUT "best player also shown according the goal scored" MIGHT mean the User wants to track which *real footballer* scored? (e.g. Messi scored 2).
                // "enter the user number and name we choose is the league... enter the score... also the best player also shown according the goal scored".
                // If I am playing against you, and I score 2 goals. Do I get 2 goals in "Best Player" stats? Yes. 
                // So "Participants" = "Users".
                // So, for a match, Home Team is User A, Away Team is User B.
                // User A scored 2 goals. User B scored 1.
                // So User A gets +2 goals in stats. User B gets +1.
                // THIS SIMPLIFIES THINGS!
                // I don't need a list of 11 players per team. I just need to say "How many goals did Home User score?" and "How many did Away User score?".
                // The "Scorer" IS the Home User or Away User.
                // Exception: Own goals? If User A wins 2-1 but one was OG?
                // Usually we just count total goals for the user. 

                // Let's assume 1v1 Tournament where Participants are the entities scoring goals.

                // Pre-fill goals if match played
                if (m.isPlayed && m.scorers) {
                    const g: { [key: string]: number } = {};
                    m.scorers.forEach(s => g[s.playerId] = s.count);
                    setGoals(g);
                } else {
                    setGoals({
                        [m.homeTeamId]: 0,
                        [m.awayTeamId]: 0 // Initialize
                    });
                }
            }
        }
    };

    const updateGoal = (playerId: string, delta: number) => {
        const current = goals[playerId] || 0;
        const newVal = Math.max(0, current + delta);
        setGoals({ ...goals, [playerId]: newVal });
    };

    const handleSave = async () => {
        if (!tournament || !match) return;

        const homeGoalCount = goals[match.homeTeamId] || 0;
        const awayGoalCount = goals[match.awayTeamId] || 0;

        // Construct scorers array
        const scorersArray = [
            { playerId: match.homeTeamId, count: homeGoalCount },
            { playerId: match.awayTeamId, count: awayGoalCount }
        ].filter(s => s.count > 0);

        const updatedMatch: Match = {
            ...match,
            homeScore: homeGoalCount,
            awayScore: awayGoalCount,
            scorers: scorersArray,
            isPlayed: true,
        };

        // Update in tournament
        const updatedFixtures = tournament.fixtures.map(m => m.id === match.id ? updatedMatch : m);

        const updatedTournament = { ...tournament, fixtures: updatedFixtures };

        // Handle Knockout progression
        handleKnockoutProgression(updatedTournament, updatedMatch);

        // Handle Group Stage completion for Hybrid
        if (updatedTournament.type === 'GROUPS_KNOCKOUT' && updatedTournament.stage === 'GROUP_STAGE') {
            const nextStageTournament = advanceGroupToKnockout(updatedTournament);
            if (nextStageTournament) {
                // Transition!
                // Alert user?
                await saveTournament(nextStageTournament);
                router.back();
                return;
            }
        }

        // Final completion check
        checkTournamentCompletion(updatedTournament);

        await saveTournament(updatedTournament);
        router.back();
    };

    if (!tournament || !match) return <View style={styles.center}><Text>Loading...</Text></View>;

    const home = tournament.participants.find(p => p.id === match.homeTeamId);
    const away = tournament.participants.find(p => p.id === match.awayTeamId);

    if (!home || !away) return <View style={styles.center}><Text>Invalid Participants</Text></View>;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.card}>
                <Text style={styles.headerTitle}>{match.roundName || 'Match'}</Text>

                {/* Home Team */}
                <View style={styles.teamRow}>
                    <View style={styles.teamInfo}>
                        <Text style={styles.teamName}>{home.name}</Text>
                        <Text style={styles.label}>Home</Text>
                    </View>
                    <View style={styles.counter}>
                        <TouchableOpacity onPress={() => updateGoal(home.id, -1)} style={styles.btn}>
                            <Ionicons name="remove-circle-outline" size={32} color={Colors.dark.gray} />
                        </TouchableOpacity>
                        <Text style={styles.score}>{goals[home.id] || 0}</Text>
                        <TouchableOpacity onPress={() => updateGoal(home.id, 1)} style={styles.btn}>
                            <Ionicons name="add-circle" size={32} color={Colors.dark.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Away Team */}
                <View style={styles.teamRow}>
                    <View style={styles.teamInfo}>
                        <Text style={styles.teamName}>{away.name}</Text>
                        <Text style={styles.label}>Away</Text>
                    </View>
                    <View style={styles.counter}>
                        <TouchableOpacity onPress={() => updateGoal(away.id, -1)} style={styles.btn}>
                            <Ionicons name="remove-circle-outline" size={32} color={Colors.dark.gray} />
                        </TouchableOpacity>
                        <Text style={styles.score}>{goals[away.id] || 0}</Text>
                        <TouchableOpacity onPress={() => updateGoal(away.id, 1)} style={styles.btn}>
                            <Ionicons name="add-circle" size={32} color={Colors.dark.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>Finish Match</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    content: {
        padding: Layout.spacing.lg,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: Colors.dark.surface,
        borderRadius: Layout.borderRadius.xl,
        padding: Layout.spacing.lg,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        marginBottom: Layout.spacing.xl,
    },
    headerTitle: {
        color: Colors.dark.gray,
        textAlign: 'center',
        marginBottom: Layout.spacing.lg,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    teamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Layout.spacing.md,
    },
    teamInfo: {
        flex: 1,
    },
    teamName: {
        color: Colors.dark.text,
        fontSize: 22,
        fontWeight: 'bold',
    },
    label: {
        color: Colors.dark.gray,
        fontSize: 12,
        marginTop: 4,
    },
    counter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    score: {
        color: Colors.dark.text,
        fontSize: 32,
        fontWeight: 'bold',
        width: 40,
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
    },
    btn: {
        padding: 4,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.dark.border,
        marginVertical: Layout.spacing.md,
    },
    saveBtn: {
        backgroundColor: Colors.dark.accent,
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.md,
        alignItems: 'center',
    },
    saveText: {
        color: Colors.dark.background,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
