import { sendUnaryData, ServerUnaryCall, status } from '@grpc/grpc-js';
import * as swapMessages from 'tdex-protobuf/generated/js/swap_pb';
import * as tradeMessages from 'tdex-protobuf/generated/js/trade_pb';
import * as typesMessages from 'tdex-protobuf/generated/js/types_pb';
import { TradeServiceInterface } from '../application/trade';
import { MarketWithFee } from '../application/types';
import { blindKeysMap } from '../domain/swap';
import log from '../logger';

export class TradeHandler {
  public tradeService: TradeServiceInterface;

  constructor(tradeService: TradeServiceInterface) {
    this.tradeService = tradeService;
  }

  async markets(
    _: any,
    callback: sendUnaryData<tradeMessages.MarketsReply>
  ): Promise<void> {
    const mkts = this.tradeService.getMarkets().map((m: MarketWithFee) => {
      const fixed = new typesMessages.Fixed();
      fixed.setBaseFee(m.Fee.FixedBaseFee);
      fixed.setQuoteFee(m.Fee.FixedQuoteFee);

      const fee = new typesMessages.Fee();
      fee.setFixed(fixed);

      const mkt = new typesMessages.Market();
      mkt.setBaseAsset(m.Market.BaseAsset);
      mkt.setQuoteAsset(m.Market.QuoteAsset);

      const mktWfee = new typesMessages.MarketWithFee();
      mktWfee.setFee(fee);
      mktWfee.setMarket(mkt);

      return mktWfee;
    });

    const reply = new tradeMessages.MarketsReply();
    reply.setMarketsList(mkts);

    callback(null, reply);
  }

  async balances(
    call: ServerUnaryCall<
      tradeMessages.BalancesRequest,
      tradeMessages.BalancesReply
    >,
    callback: sendUnaryData<tradeMessages.BalancesReply>
  ): Promise<void> {
    if (!call.request || !call.request.getMarket())
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'Malformed request',
      });

    const market = call.request.getMarket();

    if (!market)
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'Missing market',
      });

    try {
      const { Balance, Fee } = await this.tradeService.getMarketBalance({
        BaseAsset: market.getBaseAsset(),
        QuoteAsset: market.getQuoteAsset(),
      });

      const balance = new typesMessages.Balance();
      balance.setBaseAmount(Balance.BaseAmount);
      balance.setQuoteAmount(Balance.QuoteAmount);

      const fixed = new typesMessages.Fixed();
      fixed.setBaseFee(Fee.FixedBaseFee);
      fixed.setQuoteFee(Fee.FixedQuoteFee);

      const fee = new typesMessages.Fee();
      fee.setFixed(fixed);

      const balanceWFee = new typesMessages.BalanceWithFee();
      balanceWFee.setFee(fee);
      balanceWFee.setBalance(balance);

      const reply = new tradeMessages.BalancesReply();
      reply.setBalancesList([balanceWFee]);

      callback(null, reply);
    } catch (e: any) {
      return callback(e as Error, null);
    }
  }

  async marketPrice(call: any, callback: any) {
    if (!call.request)
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'Malformed request',
      });

    if (!call.request.hasMarket())
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'Missing market',
      });
    const market = call.request.getMarket()!;

    try {
      const { Price, Balance, Fee, Amount, Asset } =
        await this.tradeService.getMarketPrice(
          {
            BaseAsset: market.getBaseAsset(),
            QuoteAsset: market.getQuoteAsset(),
          },
          call.request.getType(),
          call.request.getAmount(),
          call.request.getAsset()
        );

      const price = new typesMessages.Price();
      price.setBasePrice(Price.BasePrice);
      price.setQuotePrice(Price.QuotePrice);

      const balance = new typesMessages.Balance();
      balance.setBaseAmount(Balance.BaseAmount);
      balance.setQuoteAmount(Balance.QuoteAmount);

      const fixed = new typesMessages.Fixed();
      fixed.setBaseFee(Fee.FixedBaseFee);
      fixed.setQuoteFee(Fee.FixedQuoteFee);

      const fee = new typesMessages.Fee();
      fee.setFixed(fixed);

      const priceWFee = new typesMessages.PriceWithFee();
      priceWFee.setPrice(price);
      priceWFee.setFee(fee);
      priceWFee.setAmount(Amount);
      priceWFee.setAsset(Asset);
      priceWFee.setBalance(balance);

      const reply = new tradeMessages.MarketPriceReply();
      reply.setPricesList([priceWFee]);

      callback(null, reply);
    } catch (e: any) {
      return callback(e as Error, null);
    }
  }

  async proposeTrade(
    call: ServerUnaryCall<
      tradeMessages.ProposeTradeRequest,
      tradeMessages.ProposeTradeReply
    >,
    callback: sendUnaryData<tradeMessages.ProposeTradeReply>
  ): Promise<void> {
    if (!call.request)
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'Malformed request',
      });

    if (!call.request.hasMarket())
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'Missing market',
      });
    const market = call.request.getMarket()!;

    const swapRequest = call.request.getSwapRequest();

    if (!swapRequest)
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'Missing swap request',
      });

    try {
      const result = await this.tradeService.proposeTrade(
        {
          BaseAsset: market.getBaseAsset(),
          QuoteAsset: market.getQuoteAsset(),
        },
        call.request.getType(),
        {
          InputAmount: swapRequest.getAmountP(),
          OutputAmount: swapRequest.getAmountR(),
          InputAsset: swapRequest.getAssetP(),
          OutputAsset: swapRequest.getAssetR(),
        },
        {
          Transaction: swapRequest.getTransaction(),
          InputBlindingKeyByScript: blindKeysMap(
            swapRequest.getInputBlindingKeyMap()
          ),
          OutputBlindingKeyByScript: blindKeysMap(
            swapRequest.getOutputBlindingKeyMap()
          ),
        }
      );

      const reply = new tradeMessages.ProposeTradeReply();

      if (result.isRejected) {
        const swapFail = new swapMessages.SwapFail();
        swapFail.setFailureMessage(result.failure!);

        reply.setSwapFail(swapFail);
        return callback(null, reply);
      }

      const swapAccept = new swapMessages.SwapAccept();
      swapAccept.setId('hello');
      swapAccept.setRequestId(swapRequest.getId());
      swapAccept.setTransaction(result.acceptTx!.Transaction);

      Object.entries(result.acceptTx!.InputBlindingKeyByScript).forEach(
        ([key, value]) => {
          swapAccept.getInputBlindingKeyMap().set(key, Uint8Array.from(value));
        }
      );

      // set the output blinding keys
      Object.entries(result.acceptTx!.OutputBlindingKeyByScript).forEach(
        ([key, value]) => {
          swapAccept.getOutputBlindingKeyMap().set(key, Uint8Array.from(value));
        }
      );

      reply.setSwapAccept(swapAccept);
      reply.setExpiryTimeUnix(result.acceptTx!.ExpiryTime!);
      callback(null, reply);
    } catch (e: any) {
      log.error(e);
      return callback(e as Error, null);
    }
  }

  async completeTrade(
    call: ServerUnaryCall<
      tradeMessages.CompleteTradeRequest,
      tradeMessages.CompleteTradeReply
    >,
    callback: sendUnaryData<tradeMessages.CompleteTradeReply>
  ): Promise<void> {
    if (!call.request)
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'Malformed request',
      });

    const reply = new tradeMessages.CompleteTradeReply();
    if (call.request.hasSwapFail()) return callback(null, reply);

    if (!call.request.hasSwapComplete())
      return callback({
        code: status.INVALID_ARGUMENT,
        message: 'Missing SwapComplete message',
      });
    const swapComplete = call.request.getSwapComplete()!;

    try {
      const result = await this.tradeService.completeTrade(
        swapComplete.getTransaction()
      );

      const reply = new tradeMessages.CompleteTradeReply();

      if (result.isInvalid) {
        const swapFail = new swapMessages.SwapFail();
        swapFail.setFailureMessage(result.error!);

        reply.setSwapFail(swapFail);
        return callback(null, reply);
      }

      reply.setTxid(result.txid!);
      callback(null, reply);
    } catch (e: any) {
      log.error(e);
      return callback(e as Error, null);
    }
  }
}
