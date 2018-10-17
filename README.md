# MyBit-Faucet.tech
:fountain: A universal basic income for MyBit test-net tokens :tm:

## Overview
Using the MyBit faucet, any Ethereum account is able to withdraw a minimum amount of Ropsten WEI and MYB tokens if they have the provided password. The password is a minor deterrence for those using the faucet on a simple front-end. If the sending address has less than the minimum amount of WEI or MYB they will be sent enough to cover basic functionality costs.

## [Contracts](contracts)
The contract has a single owner who may deposit as much WEI or MYB tokens as they like. The owner can change the password and the minimum amounts that users are to receive.

✏️ All contracts are written in [Solidity](https://solidity.readthedocs.io/en/v0.4.24/) version 0.4.24.

## Testing
To test you will need [Truffle](https://www.truffleframework.com/truffle),  [Ganache-Cli](https://www.truffleframework.com/ganache) and [BigNumber.js](https://github.com/MikeMcl/bignumber.js/)

`npm install -g truffle`

`npm install -g ganache-cli`

`npm install --save bignumber.js`

`ganache-cli`

In another terminal at the project root run `truffle compile` and then `truffle test`

## Live Contract
[TokenFaucet](https://ropsten.etherscan.io/address/0x564a7464b6ea98259aae1ad4aa8a11ca9b502cf8#code)

:warning:  This is a very bad contract to use on the main-net, unless you are an exceptionally generous person.

<p align="center">
MyBit Platform™ CHE-177.186.963<br/>
</p>
