import { Match, Participant, Tournament } from '../types/types';
import { v4 as uuidv4 } from 'uuid';
import { getRoundName } from './fixtureGenerator';


export const calculateStandings = (participants: Participant[], matches: Match[]): Participant[] => {
    // Reset stats
    const statsMap = new Map<string, Participant>();
    participants.forEach(p => {
        statsMap.set(p.id, {
            ...p,
            stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }
        });
    });

    matches.filter(m => m.isPlayed).forEach(m => {
        const home = statsMap.get(m.homeTeamId);
        const away = statsMap.get(m.awayTeamId);

        if (home && away && m.homeScore !== null && m.awayScore !== null) {
            home.stats.played++;
            away.stats.played++;
            home.stats.gf += m.homeScore;
            home.stats.ga += m.awayScore;
            away.stats.gf += m.awayScore;
            away.stats.ga += m.homeScore;

            if (m.homeScore > m.awayScore) {
                home.stats.won++;
                home.stats.points += 3;
                away.stats.lost++;
            } else if (m.homeScore < m.awayScore) {
                away.stats.won++;
                away.stats.points += 3;
                home.stats.lost++;
            } else {
                home.stats.drawn++;
                home.stats.points += 1;
                away.stats.drawn++;
                away.stats.points += 1;
            }
        }
    });

    return Array.from(statsMap.values()).sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        const gdA = a.stats.gf - a.stats.ga;
        const gdB = b.stats.gf - b.stats.ga;
        if (gdB !== gdA) return gdB - gdA;
        return b.stats.gf - a.stats.gf;
    });
};

export const getTopScorers = (participants: Participant[], matches: Match[]) => {
    const scorerMap = new Map<string, number>();

    matches.filter(m => m.isPlayed).forEach(m => {
        m.scorers.forEach(s => {
            const current = scorerMap.get(s.playerId) || 0;
            scorerMap.set(s.playerId, current + s.count);
        });
    });

    const sortedIds = Array.from(scorerMap.keys()).sort((a, b) => (scorerMap.get(b) || 0) - (scorerMap.get(a) || 0));

    return sortedIds.map(id => {
        return {
            player: participants.find(p => p.id === id),
            goals: scorerMap.get(id) || 0
        };
    }).filter((item): item is { player: Participant; goals: number } => item.player !== undefined);
};

export const handleKnockoutProgression = (tournament: Tournament, completedMatch: Match) => {
    // Only for Knockout
    if (tournament.type !== 'KNOCKOUT') return;

    // Check if this match was part of a round that needs to advance winners
    const roundOrder = completedMatch.roundOrder || 1;
    const roundMatches = tournament.fixtures.filter(m => m.roundOrder === roundOrder);

    // Group matches into Ties (Pairs of participants)
    // We assume the roundMatches array preserves the bracket order: [Pair1, Pair2, Pair3, Pair4]
    // A Pair might consist of 1 match (Single Leg) or 2 matches (Two Legs)
    // We can identify unique pairs by sorting their IDs.
    const ties: { id: string, matches: Match[], p1: string, p2: string }[] = [];
    const processedMatchIds = new Set<string>();

    roundMatches.forEach(m => {
        if (processedMatchIds.has(m.id)) return;

        // Find part of same tie (same participants)
        const sameTieMatches = roundMatches.filter(rm =>
            !processedMatchIds.has(rm.id) &&
            ((rm.homeTeamId === m.homeTeamId && rm.awayTeamId === m.awayTeamId) ||
                (rm.homeTeamId === m.awayTeamId && rm.awayTeamId === m.homeTeamId))
        );

        sameTieMatches.forEach(stm => processedMatchIds.add(stm.id));

        ties.push({
            id: [m.homeTeamId, m.awayTeamId].sort().join('-'),
            matches: sameTieMatches,
            p1: m.homeTeamId,
            p2: m.awayTeamId
        });
    });

    // Find the current tie
    const currentTieIndex = ties.findIndex(t => t.matches.some(m => m.id === completedMatch.id));
    if (currentTieIndex === -1) return;
    const currentTie = ties[currentTieIndex];

    // Check if Current Tie is complete (all legs played)
    if (!currentTie.matches.every(m => m.isPlayed)) return;

    // Find Neighbor Tie (0 vs 1, 2 vs 3, etc.)
    const isEven = currentTieIndex % 2 === 0;
    const neighborTieIndex = isEven ? currentTieIndex + 1 : currentTieIndex - 1;

    if (neighborTieIndex < 0 || neighborTieIndex >= ties.length) {
        // Final or Bye scenario (no neighbor to play against)
        return;
    }

    const neighborTie = ties[neighborTieIndex];
    if (!neighborTie.matches.every(m => m.isPlayed)) {
        // Neighbor not ready yet
        return;
    }

    // Both ties complete. Determine winners.
    const getTieWinner = (tie: typeof currentTie): string => {
        let p1Score = 0;
        let p2Score = 0;
        // Identify participants from the tie structure (p1, p2 are just from the first match found)
        // We need to be careful about which ID is which score
        const { p1, p2 } = tie;

        tie.matches.forEach(m => {
            if (m.homeTeamId === p1) {
                p1Score += m.homeScore || 0;
                p2Score += m.awayScore || 0;
            } else {
                p2Score += m.homeScore || 0;
                p1Score += m.awayScore || 0;
            }
        });

        if (p1Score > p2Score) return p1;
        if (p2Score > p1Score) return p2;

        // Tie-breaker: For now, default to p1 (Random/Seed) or implement away goals?
        // User said "tiebreaker such as extra time...". We assume the score includes that if needed.
        // Simplest fallback:
        return p1;
    };

    const winnerA = getTieWinner(currentTie);
    const winnerB = getTieWinner(neighborTie);

    // Create Next Round Matches
    const nextRound = roundOrder + 1;

    // Check if next round match exists for these two winners
    const existing = tournament.fixtures.find(m =>
        m.roundOrder === nextRound &&
        ((m.homeTeamId === winnerA && m.awayTeamId === winnerB) ||
            (m.homeTeamId === winnerB && m.awayTeamId === winnerA))
    );

    if (!existing) {
        // Calculate number of matches (ties) in the NEXT round
        const numNextRoundTies = ties.length / 2;

        // Create 1 or 2 matches based on tournament setting
        const createMatch = (h: string, a: string, suffix: string) => {
            const name = getRoundName(numNextRoundTies, suffix);
            tournament.fixtures.push({
                id: uuidv4(),
                tournamentId: tournament.id,
                homeTeamId: h,
                awayTeamId: a,
                homeScore: null,
                awayScore: null,
                isPlayed: false,
                roundOrder: nextRound,
                roundName: name,
                scorers: []
            });
        };

        if (tournament.hasTwoLegs) {
            createMatch(winnerA, winnerB, 'Leg 1');
            createMatch(winnerB, winnerA, 'Leg 2');
        } else {
            createMatch(winnerA, winnerB, '');
        }
    }
}


export const checkTournamentCompletion = (tournament: Tournament) => {
    // If status is already completed, ignore
    if (tournament.status === 'COMPLETED') return;

    // Logic depends on type
    if (tournament.type === 'LEAGUE') {
        const allPlayed = tournament.fixtures.every(m => m.isPlayed);
        if (allPlayed && tournament.fixtures.length > 0) {
            tournament.status = 'COMPLETED';
        }
    } else if (tournament.type === 'KNOCKOUT' || (tournament.type === 'GROUPS_KNOCKOUT' && tournament.stage === 'KNOCKOUT_STAGE')) {
        if (tournament.fixtures.length === 0) return;

        const maxRound = Math.max(...tournament.fixtures.map(m => m.roundOrder || 0));
        const finalMatches = tournament.fixtures.filter(m => m.roundOrder === maxRound);

        // All matches in final round must be played
        if (finalMatches.length > 0 && finalMatches.every(m => m.isPlayed)) {
            tournament.status = 'COMPLETED';
        }
    }
};
