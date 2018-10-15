var bn = require('bignumber.js');

const Database = artifacts.require('./Database.sol');
const ContractManager = artifacts.require('./ContractManager.sol');
const TokenFaucet = artifacts.require('./TokenFaucet.sol');
const ERC20 = artifacts.require('./ERC20.sol');

const owner = web3.eth.accounts[0];
const user1 = web3.eth.accounts[1];
const user2 = web3.eth.accounts[2];
const tokenHolder = web3.eth.accounts[3];
const tokenHolder2 = web3.eth.accounts[4];
const userNoEth = web3.eth.accounts[5];


contract('TokenFaucet', async() => {

let cm;
let db;
let erc20;
let faucet;

let WEI = 1000000000000000000;
let tokenSupply = 180000000 * WEI;
const dripAmountToken = 10000 * WEI;
const dripamountWEI = .5 * WEI;

it('Deploys Database', async() => {
  db = await Database.new([owner], true);
});

it('Deploys ContractManager', async() => {
  cm = await ContractManager.new(db.address);
  await db.enableContractManagement(cm.address);
});

it("Deploy ERC20 token", async() => {
  erc20 = await ERC20.new(tokenSupply, "MyBit", 18, "MYB");
});

it('Deploys TokenFaucet', async() => {
  faucet = await TokenFaucet.new(db.address, erc20.address, 'ripplesucks');
  await cm.addContract("TokenFaucet", faucet.address);
});

it('Give tokens to users', async() => {
  await erc20.transfer(tokenHolder, dripAmountToken);
  assert.equal(await erc20.balanceOf(tokenHolder), dripAmountToken);
  await erc20.transfer(tokenHolder2, (dripAmountToken / 2));
  assert.equal(await erc20.balanceOf(tokenHolder2), (dripAmountToken / 2));
});

it('Deposit tokens and WEI into faucet', async() => {
  await erc20.approveAndCall(faucet.address, (dripAmountToken * 100), await erc20.nullBytes());
  assert.equal(await faucet.tokenBalance(), (dripAmountToken * 100));
  let userBalance = web3.eth.getBalance(userNoEth);
  await web3.eth.sendTransaction({from: userNoEth, to: owner, value: userBalance.minus(21000), gasPrice: 1, gas: 21000});
  await faucet.depositWEI({from: owner, value: 50*WEI});
  assert.equal(await faucet.weiBalance(), 50*WEI);
  assert.equal(web3.eth.getBalance(userNoEth), 0);
});



});
