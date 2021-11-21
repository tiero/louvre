#!/usr/bin/env node

import { Server, ServerCredentials } from '@grpc/grpc-js';
import { IdentityType, PrivateKey } from 'ldk';
import * as grpcServices from 'tdex-protobuf/generated/js/trade_grpc_pb';
import { TradeService } from './application/trade';
import { TradeHandler } from './interface/handler';

const server = new Server();

const singningWif = 'cUFtCy7Gw6XyPbYv1XYTGncvXLo2YgRigv6AMiyiFdewTdiFEZQs';
const blindingWif = 'cVYgo6AgiooUJhQArxL61zCvchgBroYxfuezbHZkpqqiT3cRgFet';

async function main(options: any) {
  const privateKey = new PrivateKey({
    type: IdentityType.PrivateKey,
    chain: options.chain,
    opts: {
      signingKeyWIF: singningWif,
      blindingKeyWIF: blindingWif,
    },
  });

  console.info((await privateKey.getNextAddress()).confidentialAddress);
  console.info(options);

  const tradeService = new TradeService(
    privateKey,
    {
      BaseAsset: options.base_asset,
      QuoteAsset: options.quote_asset,
    },
    {
      BasePrice: options.base_price,
      QuotePrice: options.quote_price,
    },
    options.explorer
  );
  const tradeHandler = new TradeHandler(tradeService);

  server.addService(grpcServices.TradeService, tradeHandler as any);

  start(options.rpcserver);
}

function start(address: string) {
  server.bindAsync(address, ServerCredentials.createInsecure(), () => {
    server.start();
    console.info('Trader gRPC server is running on ' + address);
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

const chains = ['liquid', 'testnet', 'regtest'] as const;

const options = require('yargs') // eslint-disable-line
  .option('rpcserver', {
    type: 'string',
    default: '0.0.0.0:9945',
    description: 'server address',
  })
  .option('chain', {
    choices: chains,
    demandOption: true,
    default: 'regtest',
    description: 'elements network',
  })
  .option('base_asset', {
    type: 'string',
    default: '5ac9f65c0efcc4775e0baec4ec03abdde22473cd3cf33c0419ca290e0751b225',
    description: 'base asset to be traded',
  })
  .option('quote_asset', {
    type: 'string',
    default: '296f828e28d381c20a087a70cd4383b4df7879f95f4214416f6b5595d6665406',
    description: 'quote asset to be traded',
  })
  .option('base_price', {
    type: 'number',
    default: 100,
    description: 'how much quote asset to buy 1 unit of base asset',
  })
  .option('quote_price', {
    type: 'number',
    default: 0.01,
    description: 'how much base asset to buy 1 unit of quote asset',
  })
  .option('explorer', {
    type: 'string',
    description: 'esplora HTTP endpoint',
    default: 'http://localhost:3001',
  }).argv;

main(options);
