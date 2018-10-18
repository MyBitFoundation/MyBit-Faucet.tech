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
const recovery = web3.eth.accounts[6];

contract('TokenFaucet', async() => {

let cm;
let db;
let erc20;
let faucet;

let WEI = 1000000000000000000;
let tokenSupply = 180000000 * WEI;
let gasToSave;
const dripAmountToken = 10000 * WEI;
const dripamountWEI = .5 * WEI;
const password = 'ripplesucks';

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
  faucet = await TokenFaucet.new(db.address, erc20.address, await erc20.getHash(password));
  await cm.addContract("TokenFaucet", faucet.address);
});

it('Give tokens to users', async() => {
  await erc20.transfer(tokenHolder, dripAmountToken);
  assert.equal(await erc20.balanceOf(tokenHolder), dripAmountToken);
  await erc20.transfer(tokenHolder2, (dripAmountToken / 2));
  assert.equal(await erc20.balanceOf(tokenHolder2), (dripAmountToken / 2));
});

it('Deposit tokens and WEI into faucet', async() => {
  gasToSave = 680000 + 21000;
  await erc20.approveAndCall(faucet.address, (dripAmountToken * 100), await erc20.nullBytes());
  assert.equal(await faucet.tokenBalance(), (dripAmountToken * 100));
  let userBalance = web3.eth.getBalance(userNoEth);
  await web3.eth.sendTransaction({from: userNoEth, to: owner, value: userBalance.minus(gasToSave), gasPrice: 1, gas: 21000});
  gasToSave -= 21000;
  await faucet.depositWEI({from: owner, value: 50*WEI});
  assert.equal(await faucet.weiBalance(), 50*WEI);
  assert.equal(web3.eth.getBalance(userNoEth), gasToSave);
});

it('Test a withdraw from userNoEth', async() => {
  assert.equal(web3.eth.getBalance(userNoEth), gasToSave);
  assert.equal(await erc20.balanceOf(userNoEth), 0);
  await faucet.withdraw(password, {from: userNoEth, gasPrice: 1, gas: gasToSave});
  assert.equal(await erc20.balanceOf(userNoEth), dripAmountToken);
  assert.equal(await web3.eth.getBalance(userNoEth).gt(gasToSave), true);
  assert.equal(await web3.eth.getBalance(userNoEth).lt(dripamountWEI * 1.5), true);
  await web3.eth.sendTransaction({from: owner, to: userNoEth, value: web3.eth.getBalance(owner) / 2, gasPrice: 1, gas: 21000});
});

it('Test withdraw from user who has the minimum number of tokens', async() => {
  let tokenBalance = await erc20.balanceOf(tokenHolder);
  let faucetBalanceTokens = await erc20.balanceOf(faucet.address);
  assert.equal(tokenBalance, dripAmountToken);
  let tx = await faucet.withdraw(password, {from: tokenHolder});
  let balanceDiff = bn(faucetBalanceTokens).minus(await erc20.balanceOf(faucet.address));
  assert.equal(balanceDiff, 0);
  assert.equal(bn(tokenBalance).eq(await erc20.balanceOf(tokenHolder)), true);
  assert.equal(tx.logs[0].args._amountToken, 0);
});

it('Test withdraw from user with half the minimum tokens ', async() => {
  let tokenBalance = await erc20.balanceOf(tokenHolder2);
  let faucetBalanceTokens = await erc20.balanceOf(faucet.address);
  let toReceive = bn(dripAmountToken).minus(tokenBalance);
  let tx = await faucet.withdraw(password, {from: tokenHolder2});
  let balanceDiff = bn(faucetBalanceTokens).minus(await erc20.balanceOf(faucet.address));
  assert.equal(balanceDiff.eq(tx.logs[0].args._amountToken), true);
  assert.equal(toReceive.eq(tx.logs[0].args._amountToken), true);
});

it('Fail to withdraw. Wrong password', async() => {
  let err;
  try { await faucet.withdraw("wrong password", {from: user1}); }
  catch(e){
    err = e;
  }
  assert.notEqual(err, undefined);
  let tx = await faucet.withdraw(password, {from: user1});
  assert.equal(tx.logs[0].args._amountToken, dripAmountToken);
});

it('Change password', async() => {
  await faucet.changePass(await erc20.getHash("newpass"));
  let err;
  try { await faucet.withdraw(password, {from: user1}); }
  catch(e){
    err = e;
  }
  assert.notEqual(err, undefined);
  await faucet.withdraw("newpass", {from: user1});
  await faucet.changePass(await erc20.getHash("ripplesucks"));
});

it('Try to change password from non-owner', async() => {
  let err;
  try { await faucet.changePass(await erc20.getHash("something"), {from: user1}); }
  catch(e){
    err = e;
  }
  assert.notEqual(err, undefined);
});

it('Change drip amounts ', async() => {
  await faucet.changeDripAmounts(1, 1);
  assert.equal(await faucet.tokenDripAmount(), 1);
  assert.equal(await faucet.weiDripAmount(), 1);
  await faucet.withdraw(password, {from: user2});
});

it('Try to change drip amount from non-owner', async() => {
  let err;
  try { await faucet.changeDripAmounts(1, 1, {from: user1}); }
  catch(e){
    err = e;
  }
  assert.notEqual(err, undefined);
});

it('Destroy contract', async() => {
  let faucetTokenBalance = await faucet.tokenBalance();
  let faucetWEIBalance = await faucet.weiBalance();
  let ethBalance = web3.eth.getBalance(recovery);
  let tokenBalance = await erc20.balanceOf(recovery);
  let tokenBalanceAfter = bn(tokenBalance).plus(faucetTokenBalance);
  let ethBalanceAfter = bn(ethBalance).plus(faucetWEIBalance);
  tx = await faucet.destroy(recovery);
  assert.equal(tokenBalanceAfter.eq(await erc20.balanceOf(recovery)), true);
  assert.equal(ethBalanceAfter.eq(await web3.eth.getBalance(recovery)), true);
});

});
