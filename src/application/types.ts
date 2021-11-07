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