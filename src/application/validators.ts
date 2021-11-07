import { Market, TradeType } from "./types";

export function requireValidMarket(valid: Market, given: Market) {
  if (given.BaseAsset !== valid.BaseAsset)
  throw new Error('base asset must be ' + valid.BaseAsset);

  if (given.QuoteAsset !== valid.QuoteAsset)
  throw new Error('quote asset must be ' + valid.QuoteAsset);
}

export function requireEnoughBalance(
  market: Market, 
  tradeType: TradeType, 
  { 
    baseAmount, 
    quoteAmount
  }: {
    baseAmount: number, 
    quoteAmount: number
  }, 
  amount: number, 
  asset:string
) {
  if (tradeType === TradeType.BUY && asset === market.BaseAsset && amount > baseAmount) {
    throw new Error('not enough base asset balance for requested amount')
  }

  if (tradeType === TradeType.SELL && asset === market.QuoteAsset && amount > quoteAmount) {
    throw new Error('not enough quote asset balance for requested amount')
  }

  
}