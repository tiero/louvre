import {
  fetchAndUnblindUtxos,
  greedyCoinSelector,
  createFeeOutput,
  RecipientInterface,
  fetchBalances,
  IdentityInterface,
  AddressInterface,
  UtxoInterface,
} from 'ldk';
import { ECPair, Transaction, Psbt, address as ldkaddress } from 'liquidjs-lib';
import { BlindKeysMap } from '../domain/swap';
import { Market } from './types';

export async function getBalancesForMarket(
  market: Market,
  wallet: IdentityInterface,
  explorerUrl: string
): Promise<{ baseAmount: number; quoteAmount: number }> {
  const { confidentialAddress, blindingPrivateKey } =
    await wallet.getNextAddress();
  const balances = await fetchBalances(
    confidentialAddress,
    blindingPrivateKey,
    explorerUrl
  );

  const baseAmount = balances[market.BaseAsset] ?? 0;
  const quoteAmount = balances[market.QuoteAsset] ?? 0;

  return { baseAmount, quoteAmount };
}

export async function completeSwapTransaction(
  decoded: Psbt,
  payout: RecipientInterface,
  traderPayout: RecipientInterface,
  address: AddressInterface,
  changeAddress: AddressInterface,
  nativeAssetHash: string,
  explorerUrl: string
): Promise<Psbt> {
  const nonce = Buffer.from('00', 'hex');

  const utxos = await fetchAndUnblindUtxos([address], explorerUrl);

  // adding payout
  decoded.addOutput({
    asset: payout.asset,
    value: payout.value,
    script: ldkaddress.toOutputScript(payout.address),
  });

  const coinSelector = greedyCoinSelector();
  const { changeOutputs, selectedUtxos } = coinSelector(
    utxos,
    [traderPayout],
    () => changeAddress.confidentialAddress
  );

  // provider funds
  const lbtcLocks: string[] = [];

  for (const utxo of selectedUtxos) {
    if (
      Object.prototype.hasOwnProperty.call(utxo, 'asset') &&
      utxo.asset === nativeAssetHash
    ) {
      lbtcLocks.push(`${utxo.txid}:${utxo.vout}`);
    }

    decoded.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: utxo.prevout,
    });
  }

  if (changeOutputs.length > 0) {
    // provider change
    const [change] = changeOutputs;
    decoded.addOutput({
      nonce,
      asset: change.asset,
      value: change.value,
      script: ldkaddress.toOutputScript(change.address),
    });
  }

  const unlockedUtxos = utxos.filter(
    (utxo: UtxoInterface) => !lbtcLocks.includes(`${utxo.txid}:${utxo.vout}`)
  );

  const fee = createFeeOutput(
    decoded.data.inputs.length + 1,
    decoded.data.outputs.length + 1,
    0.1,
    nativeAssetHash
  );
  const feeCoinSelection = coinSelector(
    unlockedUtxos,
    [fee],
    () => changeAddress.confidentialAddress
  );

  // provider funds for fees
  for (const utxo of feeCoinSelection.selectedUtxos) {
    decoded.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: utxo.prevout,
    });
  }

  const [feeChange] = feeCoinSelection.changeOutputs;
  decoded.addOutput({
    nonce,
    asset: feeChange.asset,
    value: feeChange.value,
    script: ldkaddress.toOutputScript(feeChange.address),
  });

  // fee output
  decoded.addOutput({
    nonce,
    asset: fee.asset,
    value: fee.value,
    script: Buffer.alloc(0),
  });

  return decoded;
}

export async function blindSwapTransaction(
  completedPset: Psbt,
  inputBlindingKeyByScript: BlindKeysMap,
  outputBlindingKeyByScript: BlindKeysMap
): Promise<Psbt> {
  const ptx = Transaction.fromHex(
    completedPset.data.globalMap.unsignedTx.toBuffer().toString('hex')
  );
  const inputsBlindingData = new Map();
  completedPset.data.inputs.forEach((v, index) => {
    let prevout = v.witnessUtxo;
    if (!v.witnessUtxo) {
      const prevoutIndex = ptx.ins[index].index;
      prevout = Transaction.fromBuffer(v.nonWitnessUtxo!).outs[prevoutIndex];
    }

    const hexScript = prevout!.script.toString('hex');

    if (
      !Object.prototype.hasOwnProperty.call(inputBlindingKeyByScript, hexScript)
    )
      throw new Error(
        `blinding key for input at index ${index} is missing in the swap request`
      );

    inputsBlindingData.set(index, inputBlindingKeyByScript[hexScript]);
  });

  const outputsBlindingPubKeys = new Map();
  ptx.outs.forEach((v, index) => {
    if (v.script.length === 0) return;

    const hexScript = v.script.toString('hex');

    if (
      !Object.prototype.hasOwnProperty.call(
        outputBlindingKeyByScript,
        hexScript
      )
    ) {
      throw new Error(
        `blinding key for output at index ${index} is missing in the swap request`
      );
    }

    const pubKey = ECPair.fromPrivateKey(
      outputBlindingKeyByScript[hexScript]
    ).publicKey;
    outputsBlindingPubKeys.set(index, pubKey);
  });

  await completedPset.blindOutputsByIndex(
    inputsBlindingData,
    outputsBlindingPubKeys
  );

  return completedPset;
}
