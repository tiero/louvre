import {
	Server,
  ServerCredentials,
} from '@grpc/grpc-js';
import { IdentityType, PrivateKey, ECPair, networks } from 'ldk';
import * as grpcServices from "tdex-protobuf/generated/js/trade_grpc_pb";
import { TradeService } from './application/trade';
import { TradeHandler } from "./interface/handler";

const address = '0.0.0.0:9945';
const server = new Server();

const market = {
  BaseAsset: "9b6e06f2a685e58ac6162e2389b74920d8ca43765dc3199a6d8ea74680d1cc39",
  QuoteAsset: "2dcf5a8834645654911964ec3602426fd3b9b4017554d3f9c19403e7fc1411d3"
};


async function main() {

  
  const singningWif = "cUFtCy7Gw6XyPbYv1XYTGncvXLo2YgRigv6AMiyiFdewTdiFEZQs";
  const blindingWif = "cVYgo6AgiooUJhQArxL61zCvchgBroYxfuezbHZkpqqiT3cRgFet";

  const privateKey = new PrivateKey({
    type: IdentityType.PrivateKey,
    chain: "regtest",
    opts: {
      signingKeyWIF: singningWif,
      blindingKeyWIF:blindingWif,
    }
  });

  console.info((await privateKey.getNextAddress()).confidentialAddress);


  const tradeService = new TradeService(privateKey, market, "http://localhost:3001");
  const tradeHandler = new TradeHandler(tradeService); 

  server.addService(grpcServices.TradeService, tradeHandler as any);

  start();
}



function start() {
	server.bindAsync(address, ServerCredentials.createInsecure(), () => {
		server.start();
		console.info('Trader interface is running on ' + address);
	});

}

async function stop(): Promise<void> {
  return new Promise((resolve) =>
    server.tryShutdown(() => {
      console.info('Trader gRPC server completed shutdown');
      resolve();
    })
  );
}

process.on('SIGINT', async () => {
  await stop();
});

process.on('SIGTERM', async () => {
  await stop();
});

main();