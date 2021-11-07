
import  * as tradeMessages from "tdex-protobuf/generated/js/trade_pb";
import  * as typesMessages from "tdex-protobuf/generated/js/types_pb";
import { TradeServiceInterface } from "../application/trade";
import { MarketWithFee } from "../application/types";


export class TradeHandler {

	public tradeService: TradeServiceInterface;

	constructor(tradeService: TradeServiceInterface) {
		this.tradeService = tradeService;
	}

	markets(_: any, callback:any) {
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
	
	balances(_: any, callback:any) {
		const reply = new tradeMessages.BalancesReply();
		callback(null, reply);
	}
	
	marketPrice(_: any, callback:any) {
		const reply = new tradeMessages.MarketPriceReply();
		callback(null, reply);
	}
	
	proposeTrade(_: any, callback:any) {
		const reply = new tradeMessages.ProposeTradeReply();
		callback(null, reply);
	}
	
	completeTrade(_: any, callback:any) {
		const reply = new tradeMessages.CompleteTradeReply();
		callback(null, reply);
	}

}




