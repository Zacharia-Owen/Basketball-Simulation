import { Player } from "./Players";

export interface Team {
  id: number;
  name: string;
  players: Player[];
}