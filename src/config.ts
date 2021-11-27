#!/usr/bin/env node

const chains = ['liquid', 'testnet', 'regtest'] as const;

const options = require('yargs') // eslint-disable-line
  .env('ZION')
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
  .option('base-asset', {
    type: 'string',
    default: '5ac9f65c0efcc4775e0baec4ec03abdde22473cd3cf33c0419ca290e0751b225',
    description: 'base asset to be traded',
  })
  .option('quote-asset', {
    type: 'string',
    default: '296f828e28d381c20a087a70cd4383b4df7879f95f4214416f6b5595d6665406',
    description: 'quote asset to be traded',
  })
  .option('base-price', {
    type: 'number',
    default: 100,
    description: 'how much quote asset to buy 1 unit of base asset',
  })
  .option('quote-price', {
    type: 'number',
    default: 0.01,
    description: 'how much base asset to buy 1 unit of quote asset',
  })
  .option('explorer', {
    type: 'string',
    description: 'esplora HTTP endpoint',
    default: 'http://localhost:3001',
  }).argv;

export type Config = {
  rpcserver: string;
  chain: 'liquid' | 'testnet' | 'regtest';
  baseAsset: string;
  quoteAsset: string;
  basePrice: number;
  quotePrice: number;
  explorer: string;
  signingKey: string;
  blindingKey: string;
};

export default options;
