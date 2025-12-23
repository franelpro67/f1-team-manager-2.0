
export type RaceStrategy = '1-STOP' | '2-STOP';

export interface Driver {
  id: string;
  name: string;
  age: number;
  nationality: string;
  pace: number;
  consistency: number;
  marketability: number;
  experience: number;
  salary: number;
  cost: number;
  image: string;
}

export interface Engineer {
  id: string;
  name: string;
  specialty: 'Aero' | 'Engine' | 'Reliability';
  rating: number;
  salary: number;
  cost: number;
}

export interface Sponsor {
  id: string;
  name: string;
  payoutPerRace: number;
  signingBonus: number;
  logoColor: string;
  category: string;
  targetPosition: number;
  expiresInRaces?: number;
}

export interface CarStats {
  aerodynamics: number;
  powerUnit: number;
  chassis: number;
  reliability: number;
}

export interface TeamResult {
  driverName: string;
  teamName: string;
  position: number;
  points: number;
}

export interface TeamState {
  id: number;
  name: string;
  funds: number;
  reputation: number;
  drivers: Driver[];
  activeDriverIds: string[];
  activeSponsorIds: string[];
  sponsorOffers: Sponsor[];
  engineers: Engineer[];
  car: CarStats;
  color: string;
  currentStrategy?: RaceStrategy;
}

export interface GameState {
  mode: 'single' | 'versus' | 'online';
  teams: TeamState[];
  currentPlayerIndex: number;
  currentRaceIndex: number;
  seasonHistory: RaceResult[];
  roomCode?: string;
  isHost?: boolean;
  onlineOpponentReady?: boolean;
}

export interface RaceResult {
  raceName: string;
  teamResults: {
    teamId: number;
    driver1Position: number;
    driver2Position: number;
    points: number;
  }[];
  commentary: string;
  events: string[];
  fullClassification: TeamResult[];
}
