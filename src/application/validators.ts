import { SwapTerms } from '../domain/swap';
import { inGivenOut, outGivenIn } from './price';
import { Market, Price, TradeType } from './types';

export function requireValidMarket(valid: Market, given: Market) {
  if (given.BaseAsset !== valid.BaseAsset)
    throw new Error('base asset must be ' + valid.BaseAsset);

  if (given.QuoteAsset !== valid.QuoteAsset)
    throw new Error('quote asset must be ' + valid.QuoteAsset);
}

export function requireValidAsset(market: Market, asset: string) {
  if (market.BaseAsset !== asset && market.QuoteAsset !== asset)
    throw new Error('asset is not included in given market');
}

export function requireEnoughBalance(
  market: Market,
  tradeType: TradeType,
  terms: SwapTerms,
  {
    baseAmount,
    quoteAmount,
  }: {
    baseAmount: number;
    quoteAmount: number;
  }
) {
  if (
    tradeType === TradeType.BUY &&
    terms.OutputAsset === market.BaseAsset &&
    terms.OutputAmount > baseAmount
  ) {
    throw new Error('not enough base asset balance for requested amount');
  }

  if (
    tradeType === TradeType.SELL &&
    terms.OutputAsset === market.QuoteAsset &&
    terms.OutputAmount > quoteAmount
  ) {
    throw new Error('not enough quote asset balance for requested amount');
  }
}

export function requireValidTradeType(
  market: Market,
  type: TradeType,
  terms: SwapTerms
) {
  if (
    type === TradeType.BUY &&
    (terms.OutputAsset !== market.BaseAsset ||
      terms.InputAsset !== market.QuoteAsset)
  )
    throw new Error('trade type BUY must match the swap terms');

  if (
    type === TradeType.SELL &&
    (terms.OutputAsset !== market.QuoteAsset ||
      terms.InputAsset !== market.BaseAsset)
  )
    throw new Error('trade type SELL must match the swap terms');
}

export function requireValidPrice(
  type: TradeType,
  terms: SwapTerms,
  prices: Price
) {
  const isBuy = type === TradeType.BUY;
  if (
    terms.OutputAmount !== outGivenIn(isBuy, terms, prices) ||
    terms.InputAmount !== inGivenOut(isBuy, terms, prices)
  ) {
    throw new Error('bad pricing');
  }
}
