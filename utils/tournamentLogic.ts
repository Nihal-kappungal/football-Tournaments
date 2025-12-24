import { Match, Participant, Tournament } from '../types/types';
import { v4 as uuidv4 } from 'uuid';


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

    // We need to pair this match with its neighbor to form the next game.
    // Assuming fixtures are ordered: 0 vs 1, 2 vs 3.
    // We need to find the index of completedMatch in the ROUND list (sorted/stable).
    const matchIndex = roundMatches.findIndex(m => m.id === completedMatch.id);
    if (matchIndex === -1) return;

    // Find neighbor
    const isEven = matchIndex % 2 === 0;
    const neighborIndex = isEven ? matchIndex + 1 : matchIndex - 1;

    if (neighborIndex < 0 || neighborIndex >= roundMatches.length) {
        // No neighbor? Maybe final or bye.
        // If it's the last match (Final), we are done.
        return;
    }

    const neighborMatch = roundMatches[neighborIndex];

    if (neighborMatch.isPlayed) {
        // Both played. Create next round match.
        // Determine winners
        const getWinnerId = (m: Match) => {
            if (m.homeScore! > m.awayScore!) return m.homeTeamId;
            if (m.awayScore! > m.homeScore!) return m.awayTeamId;
            // Penalties? For MVP, assume higher seed or random if draw? 
            // Or preventing draw in UI.
            return m.homeTeamId; // Fallback
        };

        const winnerA = getWinnerId(completedMatch);
        const winnerB = getWinnerId(neighborMatch);

        // Check if next match already exists (idempotency)
        // We can track by identifying "Winner of Round X Match Y".
        // But simpler: just see if we have a match in next round with these sources?
        // Or just append new match.

        // Better: Pre-calculation. 
        // But for dynamic:
        const nextRound = roundOrder + 1;

        // Need to check if we already generated a match for this pair?
        // This function might be called twice (once for each match finish).
        // We should check if *any* match in next round has one of these winners?
        // No, IDs change.

        // Let's search if a match exists in next round that *links* to these previous matches.
        // We don't have links.

        // Alternative: Use deterministic IDs for matches? 
        // Or rely on array position.
        // Let's just create it and assume we won't duplicate because we check if `neighborMatch.isPlayed` just became true? 
        // No, both are true now.

        // We need to verify if the next match exists.
        // Simplest way given data structure: 
        // We can't easily know. 
        // Let's assume we strictly generate it now.
        // To avoid duplicates, we could check if a match in Next Round has these Participants.

        const existing = tournament.fixtures.find(m =>
            m.roundOrder === nextRound &&
            ((m.homeTeamId === winnerA && m.awayTeamId === winnerB) ||
                (m.homeTeamId === winnerB && m.awayTeamId === winnerA))
        );

        if (!existing) {
            tournament.fixtures.push({
                id: uuidv4(),
                tournamentId: tournament.id,
                homeTeamId: winnerA, // Logic: winner of headers is home?
                awayTeamId: winnerB,
                homeScore: null,
                awayScore: null,
                isPlayed: false,
                roundOrder: nextRound,
                roundName: `Round ${nextRound}`, // Or "Semi-Final" etc logic
                scorers: []
            });
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
        // Completion is when the FINAL is played.
        // How to detect final? It's the match with no next round possible.
        // Or simply: It's the single match in the last round.
        // Find max round order.
        if (tournament.fixtures.length === 0) return;

        const maxRound = Math.max(...tournament.fixtures.map(m => m.roundOrder || 0));
        const finalMatches = tournament.fixtures.filter(m => m.roundOrder === maxRound);

        // If it is the final round, there should be 1 match (Final) or maybe 2 (3rd place?).
        // Usually 1 match.
        if (finalMatches.length === 1 && finalMatches[0].isPlayed) {
            tournament.status = 'COMPLETED';
        }
    }
};
