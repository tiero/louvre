import { BalanceWithFee, MarketWithFee, Market, Fee } from "./types";
import {fetchBalances, PrivateKey} from "ldk";

const DEFAULT_FEE: Fee = {
  BasisPoint: 0,
  FixedBaseFee: 0,
  FixedQuoteFee: 0,
}

export interface TradeServiceInterface {
  getMarketBalance(market: Market): Promise<BalanceWithFee>;
  getMarkets(): MarketWithFee[];
}



export class TradeService implements TradeServiceInterface {

  constructor(private wallet: PrivateKey, private market: Market, private explorerUrl: string) {}

  async getMarketBalance(market: Market): Promise<BalanceWithFee> {
    if (market.BaseAsset !== this.market.BaseAsset)
      throw new Error('base asset must be ' + this.market.BaseAsset);

    if (market.QuoteAsset !== this.market.QuoteAsset)
      throw new Error('quote asset must be ' + this.market.QuoteAsset);
      
    const { confidentialAddress, blindingPrivateKey} = await this.wallet.getNextAddress();
    const balances = await fetchBalances(confidentialAddress, blindingPrivateKey, this.explorerUrl);
    
    const baseAmount = balances[this.market.BaseAsset] ?? 0;
    const quoteAmount = balances[this.market.QuoteAsset] ?? 0;

    return {
      Balance: {
        BaseAmount: baseAmount,
        QuoteAmount: quoteAmount,
      },
      Fee: DEFAULT_FEE
    }
  }
  
  getMarkets(): MarketWithFee[] {
    return [{
      Market: this.market,
      Fee: DEFAULT_FEE
    }];
  }
  
}