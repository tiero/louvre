import { Server, ServerCredentials } from '@grpc/grpc-js';
import { IdentityType, PrivateKey } from 'ldk';
import * as grpcServices from 'tdex-protobuf/generated/js/trade_grpc_pb';
import { TradeService } from './application/trade';
import { TradeHandler } from './interface/handler';

const address = '0.0.0.0:9945';
const server = new Server();

const market = {
  BaseAsset: '5ac9f65c0efcc4775e0baec4ec03abdde22473cd3cf33c0419ca290e0751b225',
  QuoteAsset:
    '296f828e28d381c20a087a70cd4383b4df7879f95f4214416f6b5595d6665406',
};

async function main() {
  const singningWif = 'cUFtCy7Gw6XyPbYv1XYTGncvXLo2YgRigv6AMiyiFdewTdiFEZQs';
  const blindingWif = 'cVYgo6AgiooUJhQArxL61zCvchgBroYxfuezbHZkpqqiT3cRgFet';

  const privateKey = new PrivateKey({
    type: IdentityType.PrivateKey,
    chain: 'regtest',
    opts: {
      signingKeyWIF: singningWif,
      blindingKeyWIF: blindingWif,
    },
  });

  console.info((await privateKey.getNextAddress()).confidentialAddress);

  const tradeService = new TradeService(
    privateKey,
    market,
    'http://localhost:3001'
  );
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
