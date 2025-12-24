import { Match, Participant, TournamentType } from '../types/types';
import { v4 as uuidv4 } from 'uuid';

export const getRoundName = (numMatches: number, legSuffix: string = ''): string => {
    let name = '';
    if (numMatches === 1) name = 'Final';
    else if (numMatches === 2) name = 'Semi-Final';
    else if (numMatches === 4) name = 'Quarter-Final';
    else name = `Round of ${numMatches * 2}`;

    return legSuffix ? `${name} - ${legSuffix}` : name;
};

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
export const generateKnockoutFixtures = (participants: Participant[], tournamentId: string, hasTwoLegs: boolean = false): Match[] => {
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

    // 4. Generate Round 1
    const numMatchesInRound1 = padded.length / 2;
    for (let i = 0; i < padded.length; i += 2) {
        const home1 = padded[i];
        const away1 = padded[i + 1];

        // Match 1 (Leg 1 or Only Match)
        createKnockoutMatch(fixtures, tournamentId, home1, away1, 1, getRoundName(numMatchesInRound1, hasTwoLegs ? 'Leg 1' : ''));

        if (hasTwoLegs) {
            // Match 2 (Leg 2) - Swap Home/Away
            createKnockoutMatch(fixtures, tournamentId, away1, home1, 1, getRoundName(numMatchesInRound1, 'Leg 2'));
        }
    }

    return fixtures;
};

const createKnockoutMatch = (fixtures: Match[], tournamentId: string, home: Participant, away: Participant, roundOrder: number, roundName: string) => {
    const isByeMatch = home.id.startsWith('BYE') || away.id.startsWith('BYE');
    let homeScore = null;
    let awayScore = null;
    let isPlayed = false;
    let scorers: any[] = [];

    if (isByeMatch) {
        isPlayed = true;
        if (home.id.startsWith('BYE') && !away.id.startsWith('BYE')) {
            // Away wins (Bye loses)
            homeScore = 0; awayScore = 1;
        } else if (!home.id.startsWith('BYE') && away.id.startsWith('BYE')) {
            // Home wins (Bye loses)
            homeScore = 1; awayScore = 0;
        } else {
            // Bye vs Bye
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
        roundOrder,
        roundName,
        scorers,
    });
};
