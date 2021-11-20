export type SwapTerms = {
  InputAmount: number;
  OutputAmount: number;
  InputAsset: string;
  OutputAsset: string;
};

export type SwapTransaction = {
  Transaction: string;
  InputBlindingKeyByScript: BlindKeysMap;
  OutputBlindingKeyByScript: BlindKeysMap;
  ExpiryTime?: number;
};

export type BlindKeysMap = Record<string, Buffer>;

export function blindKeysMap(
  jspbMap: Map<string, string | Uint8Array>
): BlindKeysMap {
  const map: BlindKeysMap = {};
  jspbMap.forEach((entry: string | Uint8Array, key: string) => {
    const value: Buffer =
      entry instanceof Uint8Array
        ? Buffer.from(entry)
        : Buffer.from(entry, 'hex');

    map[key] = value;
  });
  return map;
}
