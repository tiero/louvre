import { SwapTerms } from "../domain/swap";
import { Price } from "./types";

export const outGivenIn = (isBuy: boolean, terms: SwapTerms, prices: Price): number => isBuy ? terms.InputAmount / prices.BasePrice : terms.InputAmount / prices.QuotePrice;
export const inGivenOut = (isBuy: boolean, terms: SwapTerms, prices: Price): number => isBuy ? terms.OutputAmount * prices.BasePrice : terms.OutputAmount * prices.QuotePrice;

export function pricePreview(isBuy: boolean, isBaseAsset: boolean, amount: number, prices: Price): number {
  if (isBuy) {
    if (isBaseAsset) {
      return amount * prices.BasePrice;
    }
    return amount / prices.BasePrice;
  }
  
  if (isBaseAsset) {
    return amount / prices.QuotePrice
  }

  return amount * prices.QuotePrice;
}