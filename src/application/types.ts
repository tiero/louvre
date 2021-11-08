export type Market = {
	BaseAsset:  string;
	QuoteAsset: string;
}

export type Balance = {
  BaseAmount: number;
  QuoteAmount: number;
}

export type Fee = {
	BasisPoint: number;
  FixedBaseFee: number;
	FixedQuoteFee: number;
}


export type BalanceWithFee = {
  Balance: Balance;
  Fee: Fee;
}

export type MarketWithFee = {
  Market: Market;
  Fee: Fee;
}

export enum TradeType {
  BUY,
  SELL
}

export interface Prices {
  BasePrice: number;
  QuotePrice: number;
}

export interface SwapTerms {
  InputAmount: number;
  OutputAmount: number;
  InputAsset: string;
  OutputAsset: string;
}

export interface SwapTransaction {
  Transaction: string;
  InputBlindingKeyByScript: Record<string,Uint8Array>;
  OutputBlindingKeyByScript: Record<string,Uint8Array>;
  ExpiryTime?: number;
}

export interface SwapAcceptOrFail { 
  isRejected: boolean, 
  acceptTx?: SwapTransaction, 
  failure?: string
};