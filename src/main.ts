import { IdentityType, PrivateKey } from 'ldk';
import { Server, ServerCredentials } from '@grpc/grpc-js';
import * as grpcServices from 'tdex-protobuf/generated/js/trade_grpc_pb';


import log from './logger';
import options, { Config } from './config';
import { TradeHandler } from './interface/handler';
import { TradeService } from './application/trade';


const server = new Server();

export async function startApp(config: Config) {
  const privateKey = new PrivateKey({
    type: IdentityType.PrivateKey,
    chain: config.chain,
    opts: {
      signingKeyWIF: config.signingKey,
      blindingKeyWIF: config.blindingKey,
    },
  });

  log.info((await privateKey.getNextAddress()).confidentialAddress);

  const tradeService = new TradeService(
    privateKey,
    {
      BaseAsset: config.baseAsset,
      QuoteAsset: config.quoteAsset,
    },
    {
      BasePrice: config.basePrice,
      QuotePrice: config.quotePrice,
    },
    config.explorer
  );
  const tradeHandler = new TradeHandler(tradeService);

  server.addService(grpcServices.TradeService, tradeHandler as any);

  listen(config.rpcserver);
}

function listen(address: string) {
  server.bindAsync(address, ServerCredentials.createInsecure(), () => {
    server.start();
    log.info('Trader gRPC server is running on ' + address);
  });
}

async function stop(): Promise<void> {
  return new Promise((resolve) =>
    server.tryShutdown(() => {
      log.info('Trader gRPC server completed shutdown');
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

startApp(options);
