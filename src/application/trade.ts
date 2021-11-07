import { BalanceWithFee, MarketWithFee, Market, Fee, TradeType } from "./types";
import {fetchBalances, PrivateKey} from "ldk";
import { requireEnoughBalance, requireValidMarket } from "./validators";

const DEFAULT_FEE: Fee = {
  BasisPoint: 0,
  FixedBaseFee: 0,
  FixedQuoteFee: 0,
}

const Prices = {
  basePrice: 100,
  quotePrice: 0.01
}

export interface TradeServiceInterface {
  getMarketBalance(market: Market): Promise<BalanceWithFee>;
  getMarkets(): MarketWithFee[];
  proposeTrade(market: Market, tradeType: TradeType, amount: number, asset: string): Promise<any>
}



export class TradeService implements TradeServiceInterface {

  constructor(private wallet: PrivateKey, private market: Market, private explorerUrl: string) {}

  async getMarketBalance(market: Market): Promise<BalanceWithFee> {
  
    requireValidMarket(this.market, market);
    
    const { baseAmount, quoteAmount } = await this.getBalancesOfMarket();

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

  async proposeTrade(market: Market, tradeType: TradeType, amount: number, asset: string) {
    
    requireValidMarket(this.market, market);

    const { baseAmount, quoteAmount } = await this.getBalancesOfMarket();

    requireEnoughBalance(this.market, tradeType, {baseAmount, quoteAmount}, amount, asset);




  }

  private async getBalancesOfMarket(): Promise<{ baseAmount: number, quoteAmount:number}> {
    const { confidentialAddress, blindingPrivateKey} = await this.wallet.getNextAddress();
    const balances = await fetchBalances(confidentialAddress, blindingPrivateKey, this.explorerUrl);
    
    const baseAmount = balances[this.market.BaseAsset] ?? 0;
    const quoteAmount = balances[this.market.QuoteAsset] ?? 0;

    return { baseAmount, quoteAmount };
  }
  
}