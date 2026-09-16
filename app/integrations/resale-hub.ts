import type { ResalePlatformBalance } from "../domain/cash-flow";

export interface ExternalConnectionState {
  status: "Disconnected" | "Connecting" | "Connected" | "Unavailable";
  label: string;
  lastSyncedAt?: string;
  error?: string;
}

export interface ResaleBalanceSnapshot {
  updatedAt: string;
  platforms: Array<Omit<ResalePlatformBalance,"source"|"updatedAt"> & {currency:"USD"}>;
}

export interface ExternalSummaryProvider<T> {
  load(): Promise<T>;
  state(): ExternalConnectionState;
}

export interface ResaleHubProvider extends ExternalSummaryProvider<ResaleBalanceSnapshot> {
  getBalances(): Promise<ResaleBalanceSnapshot>;
  getConnectionState(): ExternalConnectionState;
}

export class PlaceholderResaleHubProvider implements ResaleHubProvider {
  private connection: ExternalConnectionState = {status:"Disconnected", label:"Not connected yet"};
  async load(){ return this.getBalances(); }
  state(){ return this.connection; }
  getConnectionState(){ return this.connection; }
  async getBalances():Promise<ResaleBalanceSnapshot>{ return {updatedAt:"", platforms:[]}; }
}

export const resaleHubProvider:ResaleHubProvider = new PlaceholderResaleHubProvider();
