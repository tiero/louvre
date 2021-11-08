
import {
	sendUnaryData,
	ServerUnaryCall,
	status,
} from '@grpc/grpc-js';
import * as tradeMessages from "tdex-protobuf/generated/js/trade_pb";
import * as typesMessages from "tdex-protobuf/generated/js/types_pb";
import { TradeServiceInterface } from "../application/trade";
import { MarketWithFee } from "../application/types";


export class TradeHandler {

	public tradeService: TradeServiceInterface;

	constructor(tradeService: TradeServiceInterface) {
		this.tradeService = tradeService;
	}

	async markets(
		_: any,
		callback: sendUnaryData<tradeMessages.MarketsReply>
	): Promise<void> {
		const mkts = this.tradeService.getMarkets()
			.map((m: MarketWithFee) => {

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
		call: ServerUnaryCall<tradeMessages.BalancesRequest, tradeMessages.BalancesReply>,
		callback: sendUnaryData<tradeMessages.BalancesReply>
	): Promise<void> {

		if (!call.request || !call.request.getMarket()) return callback({
			code: status.INVALID_ARGUMENT,
			message: 'Malformed request',
		});

		const market = call.request.getMarket();

		if (!market) return callback({
			code: status.INVALID_ARGUMENT,
			message: 'Missing market',
		});

		try {
			const {Balance, Fee} = await this.tradeService.getMarketBalance({
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
			return callback((e as Error), null);
		}

	
	}

	marketPrice(_: any, callback: any) {
		const reply = new tradeMessages.MarketPriceReply();
		callback(null, reply);
	}

	async proposeTrade(	
		call: ServerUnaryCall<tradeMessages.ProposeTradeRequest, tradeMessages.ProposeTradeReply>,
		callback: sendUnaryData<tradeMessages.ProposeTradeReply>
	): Promise<void> {

		if (!call.request || !call.request.getMarket()) return callback({
			code: status.INVALID_ARGUMENT,
			message: 'Malformed request',
		});

		const market = call.request.getMarket();

		if (!market) return callback({
			code: status.INVALID_ARGUMENT,
			message: 'Missing market',
		});

		const swapRequest = call.request.getSwapRequest();

		if (!swapRequest) return callback({
			code: status.INVALID_ARGUMENT,
			message: 'Missing swap request',
		});

		try {
			await this.tradeService.proposeTrade(
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
					InputBlindingKeyByScript: swapRequest.getInputBlindingKeyMap(),
					OutputBlindingKeyByScript:swapRequest.getOutputBlindingKeyMap(),
				}
			);
		} catch(e: any) {
			return callback((e as Error), null);
		}


		const reply = new tradeMessages.ProposeTradeReply();
		callback(null, reply);
	}

	completeTrade(_: any, callback: any) {
		const reply = new tradeMessages.CompleteTradeReply();
		callback(null, reply);
	}

}




