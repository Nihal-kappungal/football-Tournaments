import { Match, Participant, TournamentType } from '../types/types';
import { v4 as uuidv4 } from 'uuid';

export const generateLeagueFixtures = (participants: Participant[], tournamentId: string, rounds: number = 1): Match[] => {
    const fixtures: Match[] = [];
    const n = participants.length;
    // Berger table algorithm for round robin
    // Need to add "ghost" player if odd number
    const ps = [...participants];
    if (n % 2 !== 0) {
        ps.push({ id: 'GHOST', name: 'Bye', stats: {} as any });
    }

    const numRounds = ps.length - 1;
    const numMatchesPerRound = ps.length / 2;

    for (let r = 0; r < numRounds; r++) {
        for (let i = 0; i < numMatchesPerRound; i++) {
            const home = ps[i];
            const away = ps[ps.length - 1 - i];

            if (home.id !== 'GHOST' && away.id !== 'GHOST') {
                // Swap home/away based on round to balance
                const isHome = (r % 2 === 0) ? (i === 0) : (i !== 0);

                fixtures.push({
                    id: uuidv4(),
                    tournamentId,
                    homeTeamId: isHome ? home.id : away.id,
                    awayTeamId: isHome ? away.id : home.id,
                    homeScore: null,
                    awayScore: null,
                    isPlayed: false,
                    roundOrder: r + 1,
                    roundName: `Matchday ${r + 1}`,
                    scorers: [],
                });
            }
        }
        // Rotate array
        ps.splice(1, 0, ps.pop()!);
    }

    // If user wants double round robin (Home & Away), repeat with swapped teams
    // For now assuming single round robin unless specified.

    return fixtures;
};

// Simple Knockout generator (Single Elimination)
export const generateKnockoutFixtures = (participants: Participant[], tournamentId: string): Match[] => {
    const fixtures: Match[] = [];

    // 1. Determine next power of 2
    const n = participants.length;
    let p2 = 1;
    while (p2 < n) p2 *= 2;

    // 2. Pad with Bye participants
    const padded = [...participants];
    const byesNeeded = p2 - n;
    for (let i = 0; i < byesNeeded; i++) {
        padded.push({
            id: `BYE-${i}`,
            name: 'Bye',
            stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }
        });
    }

    // 3. Shuffle (optional, but good for seeds if not provided)
    // For MVP, keep order so user can seed by entry? Or just shuffle?
    // Standard: If seeded, 1 plays 8, 2 plays 7.
    // Here we just pair adjacent. 
    // Let's just use the padded array as is (User input order).
    // But Byes should ideally be distributed or at bottom?
    // Current logic: Appends Byes at end.
    // So last matches will be X vs Bye.

    // 4. Generate Round 1
    for (let i = 0; i < padded.length; i += 2) {
        const home = padded[i];
        const away = padded[i + 1];

        const isByeMatch = home.id.startsWith('BYE') || away.id.startsWith('BYE');

        // Determine auto-result for Bye
        let homeScore = null;
        let awayScore = null;
        let isPlayed = false;
        let scorers: any[] = [];

        if (isByeMatch) {
            isPlayed = true;
            if (home.id.startsWith('BYE') && !away.id.startsWith('BYE')) {
                // Away wins
                homeScore = 0; awayScore = 1; // 1-0 walkover
            } else if (!home.id.startsWith('BYE') && away.id.startsWith('BYE')) {
                // Home wins
                homeScore = 1; awayScore = 0;
            } else {
                // Bye vs Bye? Should not happen if sorted well, but if so, Home wins
                homeScore = 1; awayScore = 0;
            }
        }

        fixtures.push({
            id: uuidv4(),
            tournamentId,
            homeTeamId: home.id,
            awayTeamId: away.id,
            homeScore,
            awayScore,
            isPlayed,
            roundOrder: 1,
            roundName: 'Round 1',
            scorers,
        });
    }

    return fixtures;
};
