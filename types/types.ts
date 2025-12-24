export type TournamentType = 'LEAGUE' | 'KNOCKOUT';

export interface Participant {
  id: string;
  name: string;
  stats: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    gf: number;
    ga: number;
    points: number;
  };
}

export interface Match {
  id: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  isPlayed: boolean;
  roundName?: string; // e.g., "Round 1" or "Semi-Final"
  roundOrder?: number;
  scorers: {
    playerId: string; // Wait, actually we track goals per team usually if simpler. The user said "best player also shown according the goal scored". So we need player tracking. 
    // If "participants" are teams, then we need players IN teams. 
    // If "participants" are individual players, then playerId is the participantId.
    // "enter the user number and name we choose is the league" -> likely simple friend tournament, so participants = players/users.
    count: number;
  }[];
}

export interface Round {
  id: string;
  name: string;
  matches: Match[]; // Or just IDs
}

export interface Tournament {
  id: string;
  name: string;
  type: TournamentType;
  participants: Participant[];
  fixtures: Match[]; // Flat list of matches is easier for storage, can group by roundName
  status: 'ACTIVE' | 'COMPLETED';
  createdAt: number;
}
