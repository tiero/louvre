# Zion
## 🏃‍♀💨 🚓🚓🚓 

![markus-spiske-iar-afB0QQw-unsplash](https://user-images.githubusercontent.com/3596602/113153447-65943380-9237-11eb-8a3a-c6767b030d4f.jpg)

Photo by <a href="https://unsplash.com/@markusspiske?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Markus Spiske</a> on <a href="https://unsplash.com/s/photos/matrix?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>

## Overview

Zion is a lightweight server for providing liquidity on [TDEX](https://github.com/TDex-network/whitepaper/blob/main/TDEXWP_V1.md#32-tdex-for-market-makers), a decentralized exchange protocol for the [Liquid Network](https://liquid.net) based on atomic swaps. 

This is **EXPERIMENTAL** and should only be used with small amounts, professionals should prefer to the enterprise-grade reference Go implementation [tdex-daemon](https://github.com/TDex-network/tdex-daemon).


* [x] [Swap protocol](https://github.com/TDex-network/tdex-specs/blob/master/03-swap-protocol.md)
* [x] [Trade protocol](https://github.com/TDex-network/tdex-specs/blob/master/04-trade-protocol.md)
* [x] Confidential transactions


## Design 

This implementation has been designed to be **stateless** and easy to be deployed as **cloud function** exploiting free tiers of cloud providers, with an easy "one click deployment" experience and (almost) zero maintenance effort.

## One click deploy

### Google Cloud Run

[![Run on Google Cloud](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run)

### Ocelot

Coming soon

### Heroku 

Coming soon






