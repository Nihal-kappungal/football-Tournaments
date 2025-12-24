import { Match, Participant, Tournament, TournamentType } from '../types/types';
import { v4 as uuidv4 } from 'uuid';
import { generateLeagueFixtures, generateKnockoutFixtures } from './fixtureGenerator';
import { calculateStandings } from './tournamentLogic';

// Generate initial groups and fixtures
export const generateGroupKnockoutFixtures = (participants: Participant[], tournamentId: string): { fixtures: Match[], participantsWithGroups: Participant[] } => {
    const ps = [...participants];
    // Shuffle
    ps.sort(() => 0.5 - Math.random());

    // Determine number of groups.
    // Ideal group size 4.
    // If 8 -> 2 groups of 4.
    // If 16 -> 4 groups of 4.
    // If 12 -> ? 
    // Logic: Try to get closest to 4 per group.

    let numGroups = 1;
    if (ps.length >= 8) numGroups = 2;
    if (ps.length >= 12) numGroups = 4; // 12/4 = 3 per group. 
    if (ps.length >= 24) numGroups = 6;
    if (ps.length >= 32) numGroups = 8;

    // Or manual override? For MVP, let's stick to powers of 2 for groups if possible to make Knockout easy.
    // 2 Groups -> Top 2 -> Semi Finals (4 teams).
    // 4 Groups -> Top 2 -> Quarter Finals (8 teams).
    // 8 Groups -> Top 2 -> Round of 16.

    // Fallback logic for weird numbers:
    if (ps.length < 6) {
        // Too small for groups, really. But let's force 2 groups.
        numGroups = 2;
    }

    // Assign groups
    const groups: Participant[][] = Array.from({ length: numGroups }, () => []);
    const groupNames = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

    ps.forEach((p, i) => {
        const groupIndex = i % numGroups;
        groups[groupIndex].push(p);
    });

    // Update participants with Group ID
    const updatedParticipants: Participant[] = [];
    let allFixtures: Match[] = [];

    groups.forEach((groupPs, index) => {
        const groupId = groupNames[index];
        groupPs.forEach(p => {
            p.groupId = groupId;
            updatedParticipants.push(p);
        });

        // Generate Fixtures for this group (League style)
        const groupFixtures = generateLeagueFixtures(groupPs, tournamentId);
        // Tag fixtures with Round Name prefix? e.g. "Group A - Matchday 1"
        groupFixtures.forEach(m => {
            m.roundName = `Group ${groupId} - ${m.roundName}`;
            m.roundOrder = 0; // Group stage is 'Round 0' order-wise? Or negative? Or just keep sequential but handle in UI logic.
            // Let's use 0 for Group stage.
        });
        allFixtures = allFixtures.concat(groupFixtures);
    });

    return { fixtures: allFixtures, participantsWithGroups: updatedParticipants };
};

// Check if group stage is finished and generate knockout bracket
export const advanceGroupToKnockout = (tournament: Tournament): Tournament | null => {
    if (tournament.type !== 'GROUPS_KNOCKOUT' || tournament.stage !== 'GROUP_STAGE') return null;

    // Check completion
    const allPlayed = tournament.fixtures.every(m => m.isPlayed);
    if (!allPlayed) return null;

    // Calculate standings per group
    const uniqueGroups = Array.from(new Set(tournament.participants.map(p => p.groupId).filter(g => g)));
    const qualifiers: Participant[] = [];

    uniqueGroups.sort().forEach(groupId => {
        // Get group participants and matches
        const groupPs = tournament.participants.filter(p => p.groupId === groupId);
        // We filter matches by checking if Home team is in this group
        const groupMatches = tournament.fixtures.filter(m => {
            const homeP = tournament.participants.find(p => p.id === m.homeTeamId);
            return homeP?.groupId === groupId;
        });

        const table = calculateStandings(groupPs, groupMatches);

        // Take Top 2
        // IF we have 2 groups, Top 2 = 4 teams = Semi Final.
        // IF we have 4 groups, Top 2 = 8 teams = Quarter Final.
        // What if we have odd participants and groups are uneven? 
        // We generally define Fixed Top N. Default Top 2 per group is standard.
        if (table.length >= 2) {
            qualifiers.push(table[0]);
            qualifiers.push(table[1]);
        } else {
            // Fallback if group has like 1 person? Should not happen.
            qualifiers.push(...table);
        }
    });

    // Now we have qualifiers.
    // Sort qualifiers? 
    // Standard logic: Group A 1st vs Group B 2nd, Group B 1st vs Group A 2nd.
    // For MVP, randomly pair them or just sequential?
    // Let's rely on `generateKnockoutFixtures` but with just these participants.
    // But `generateKnockoutFixtures` shuffles.
    // We ideally want seeding (A1 vs B2).

    // Let's just use generateKnockoutFixtures for simplicity of implementation now.
    const koFixtures = generateKnockoutFixtures(qualifiers, tournament.id);

    // Update round orders of koFixtures to start after Group Phase?
    // Group phase we treated as 0. 
    // KO rounds start at 1? 
    // `generateKnockoutFixtures` starts at 1. That's fine.
    // Distinct them by Stage.

    const newTournament = { ...tournament };
    newTournament.stage = 'KNOCKOUT_STAGE';
    // Append fixtures? Or replace? 
    // We should APPEND so we keep history.

    // We need to make sure RoundOrders don't clash if we use them for sorting.
    // Group stage could use Round 0.
    // Knockout starts Round 1.
    // This looks okay.

    newTournament.fixtures = [...tournament.fixtures, ...koFixtures];

    return newTournament;
};
