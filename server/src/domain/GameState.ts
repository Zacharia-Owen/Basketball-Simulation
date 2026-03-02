import { Player } from "./Player";
import { Team } from "./Team";

export type TeamSide = "home" | "away";

export interface Score {
  home: number;
  away: number;
}

export interface BoxScoreEntry {
  points: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  turnovers: number;
}

export interface TeamGameState {
  team: Team;
  players: Player[];
  activePlayers: string[];
  fouls: number;
}

export interface GameState {
  clock: number;
  quarter: number;
  score: Score;
  possession: TeamSide;
  home: TeamGameState;
  away: TeamGameState;
  boxScore: Record<string, BoxScoreEntry>;
}