import {
  BalanceWithFee,
  MarketWithFee,
  Market,
  Fee,
  TradeType,
  SwapAcceptOrFail,
  Prices,
  PriceWithFee,
  TxHashOrError,
} from './types';
import {
  requireEnoughBalance,
  requireValidAsset,
  requireValidMarket,
  requireValidPrice,
  requireValidTradeType,
} from './validators';
import {
  blindSwapTransaction,
  completeSwapTransaction,
  getBalancesForMarket,
} from './wallet';
import {
  decodePset,
  address as ldkaddress,
  PrivateKey,
  RecipientInterface,
} from 'ldk';
import { Transaction } from 'liquidjs-lib';
import { pricePreview } from './price';
import { SwapTerms, SwapTransaction } from '../domain/swap';
import axios from 'axios';

const DEFAULT_FEE: Fee = {
  BasisPoint: 0,
  FixedBaseFee: 0,
  FixedQuoteFee: 0,
};

export type TradeServiceInterface = {
  getMarkets(): MarketWithFee[];
  getMarketBalance(market: Market): Promise<BalanceWithFee>;
  getMarketPrice(
    market: Market,
    _: TradeType,
    amount: number,
    asset: string
  ): Promise<PriceWithFee>;
  proposeTrade(
    market: Market,
    tradeType: TradeType,
    terms: SwapTerms,
    requestTx: SwapTransaction
  ): Promise<SwapAcceptOrFail>;
  completeTrade(hexOrBase64: string): Promise<TxHashOrError>;
};

export class TradeService implements TradeServiceInterface {
  constructor(
    private wallet: PrivateKey,
    private market: Market,
    private prices: Prices,
    private explorerUrl: string
  ) {}

  async getMarketPrice(
    market: Market,
    tradeType: TradeType,
    amount: number,
    asset: string
  ): Promise<PriceWithFee> {
    requireValidMarket(this.market, market);
    requireValidAsset(this.market, asset);

    const isBuy = tradeType === TradeType.BUY;
    const isBaseAsset = asset === market.BaseAsset;
    const previewAsset = isBaseAsset ? market.QuoteAsset : market.BaseAsset;

    const previewAmount = pricePreview(isBuy, isBaseAsset, amount, this.prices);

    const { baseAmount, quoteAmount } = await getBalancesForMarket(
      this.market,
      this.wallet,
      this.explorerUrl
    );

    return {
      Price: this.prices,
      Fee: DEFAULT_FEE,
      Amount: previewAmount,
      Asset: previewAsset,
      Balance: {
        BaseAmount: baseAmount,
        QuoteAmount: quoteAmount,
      },
    };
  }

  async proposeTrade(
    market: Market,
    tradeType: TradeType,
    terms: SwapTerms,
    transaction: SwapTransaction
  ): Promise<SwapAcceptOrFail> {
    requireValidMarket(this.market, market);
    requireValidTradeType(this.market, tradeType, terms);
    requireValidPrice(tradeType, terms, this.prices);

    const balances = await getBalancesForMarket(
      market,
      this.wallet,
      this.explorerUrl
    );
    requireEnoughBalance(this.market, tradeType, terms, balances);

    // TODO validate PSBT transaction contains the same input/output swap terms. ie. use tdex-sdk Swap class?
    const decoded = decodePset(transaction.Transaction);

    const address = await this.wallet.getNextAddress();
    const changeAddress = await this.wallet.getNextChangeAddress();

    const payout: RecipientInterface = {
      value: terms.InputAmount,
      asset: terms.InputAsset,
      address: address.confidentialAddress,
    };

    const traderPayout: RecipientInterface = {
      value: terms.OutputAmount,
      asset: terms.OutputAsset,
      address: '',
    };

    const completedPset = await completeSwapTransaction(
      decoded,
      payout,
      traderPayout,
      address,
      changeAddress,
      this.wallet.network.assetHash,
      this.explorerUrl
    );

    // add wallet blinding keys to the response
    const walletScript = ldkaddress.toOutputScript(address.confidentialAddress);
    transaction.InputBlindingKeyByScript[walletScript.toString('hex')] =
      Buffer.from(address.blindingPrivateKey, 'hex');
    transaction.OutputBlindingKeyByScript[walletScript.toString('hex')] =
      Buffer.from(address.blindingPrivateKey, 'hex');

    const blindedPset = await blindSwapTransaction(
      completedPset,
      transaction.InputBlindingKeyByScript,
      transaction.OutputBlindingKeyByScript
    );

    const signedBase64 = await this.wallet.signPset(blindedPset.toBase64());

    return {
      isRejected: false,
      acceptTx: {
        Transaction: signedBase64,
        ExpiryTime: Math.floor(Date.now() / 1000),
        InputBlindingKeyByScript: transaction.InputBlindingKeyByScript,
        OutputBlindingKeyByScript: transaction.OutputBlindingKeyByScript,
      },
    };
  }

  async completeTrade(hexOrBase64: string): Promise<TxHashOrError> {
    let hex: string;

    try {
      const decoded = decodePset(hexOrBase64);
      hex = decoded.finalizeAllInputs().extractTransaction().toHex();
    } catch (ignore) {
      hex = Transaction.fromHex(hexOrBase64).toHex();
    }

    try {
      const txid = (await axios.post(`${this.explorerUrl}/tx`, hex)).data;
      return { isInvalid: false, txid };
    } catch (err) {
      throw err;
    }
  }

  async getMarketBalance(market: Market): Promise<BalanceWithFee> {
    requireValidMarket(this.market, market);

    const { baseAmount, quoteAmount } = await getBalancesForMarket(
      this.market,
      this.wallet,
      this.explorerUrl
    );

    return {
      Balance: {
        BaseAmount: baseAmount,
        QuoteAmount: quoteAmount,
      },
      Fee: DEFAULT_FEE,
    };
  }

  getMarkets(): MarketWithFee[] {
    return [
      {
        Market: this.market,
        Fee: DEFAULT_FEE,
      },
    ];
  }
}
