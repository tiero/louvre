import { BalanceWithFee, MarketWithFee, Market, Fee, TradeType, SwapTerms, SwapTransaction, SwapAcceptOrFail, Prices } from "./types";
import {fetchBalances, PrivateKey} from "ldk";
import { requireEnoughBalance, requireValidMarket, requireValidPrice, requireValidTradeType } from "./validators";

const DEFAULT_FEE: Fee = {
  BasisPoint: 0,
  FixedBaseFee: 0,
  FixedQuoteFee: 0,
}

const PRICES: Prices = {
  BasePrice: 100,
  QuotePrice: 0.01
}

export interface TradeServiceInterface {
  getMarketBalance(market: Market): Promise<BalanceWithFee>;
  getMarkets(): MarketWithFee[];
  proposeTrade(market: Market, tradeType: TradeType, terms: SwapTerms, requestTx: SwapTransaction): Promise<SwapAcceptOrFail>
}



export class TradeService implements TradeServiceInterface {

  constructor(private wallet: PrivateKey, private market: Market, private explorerUrl: string) {}

  async proposeTrade(market: Market, tradeType: TradeType, terms: SwapTerms, transaction: SwapTransaction): Promise<SwapAcceptOrFail> {
    
    requireValidMarket(this.market, market);
    requireValidTradeType(this.market, tradeType, terms);
    requireValidPrice(tradeType, terms, PRICES);
    // TODO validate PSBT transaction contains the same input/output swap terms. ie. use tdex-sdk Swap class?
    const balances = await this.getBalancesOfMarket();
    requireEnoughBalance(this.market, tradeType, terms, balances);
  
    // check if swap terms correspond to the price 
    const isBuy = tradeType === TradeType.BUY;
    
    

    return ({
      isRejected: false
    });
  }

  private async getBalancesOfMarket(): Promise<{ baseAmount: number, quoteAmount:number}> {
    const { confidentialAddress, blindingPrivateKey} = await this.wallet.getNextAddress();
    const balances = await fetchBalances(confidentialAddress, blindingPrivateKey, this.explorerUrl);
    
    const baseAmount = balances[this.market.BaseAsset] ?? 0;
    const quoteAmount = balances[this.market.QuoteAsset] ?? 0;

    return { baseAmount, quoteAmount };
  }

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
  
}