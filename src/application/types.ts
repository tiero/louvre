import { SwapTransaction } from '../domain/swap';

export type Market = {
  BaseAsset: string;
  QuoteAsset: string;
};

export type Balance = {
  BaseAmount: number;
  QuoteAmount: number;
};

export type Fee = {
  BasisPoint: number;
  FixedBaseFee: number;
  FixedQuoteFee: number;
};

export type BalanceWithFee = {
  Balance: Balance;
  Fee: Fee;
};

export type MarketWithFee = {
  Market: Market;
  Fee: Fee;
};

export enum TradeType {
  BUY,
  SELL,
}

export type Price = {
  BasePrice: number;
  QuotePrice: number;
};

export type PriceWithFee = {
  Price: Price;
  Fee: Fee;
  Amount: number;
  Asset: string;
  Balance: Balance;
};

export type Prices = {
  BasePrice: number;
  QuotePrice: number;
};

export type SwapAcceptOrFail = {
  isRejected: boolean;
  acceptTx?: SwapTransaction;
  failure?: string;
};

export type TxHashOrError = {
  isInvalid: boolean;
  txid?: string;
  error?: string;
};
