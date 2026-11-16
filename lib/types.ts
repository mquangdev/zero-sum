export type UnitLabel = "bi" | "lá";

export interface Player {
  id: string;
  name: string;
  /** Hidden from the picker for new rounds; balances from old rounds are kept. */
  archived: boolean;
}

export interface RoundLoss {
  playerId: string;
  /** Integer >= 0: balls or cards still left. */
  remaining: number;
}

export interface Round {
  id: string;
  winnerId: string;
  /** At least one entry, never contains winnerId. */
  losses: RoundLoss[];
  /** Snapshot of the session price (VND per unit) when the round was created. */
  unitPrice: number;
  createdAt: string;
}

export type SessionStatus = "active" | "finished";

export interface Session {
  id: string;
  name: string;
  unitLabel: UnitLabel;
  /** Current price, integer VND > 0. */
  unitPrice: number;
  players: Player[];
  rounds: Round[];
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
}

export const STORAGE_VERSION = 1 as const;

export interface StorageEnvelope {
  version: typeof STORAGE_VERSION;
  sessions: Session[];
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}
