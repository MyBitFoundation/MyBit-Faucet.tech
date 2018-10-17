# TokenFaucet

## Contracts

### TokenFaucet.sol

##### Deploy Faucet:
To deploy the contruct you must provide it with the address of the database. The token to be used in the faucet, and a keccak256 hash of the password to access the faucet
```javascript
constructor(address _database, address _tokenAddress, bytes32 _accessPass)
public  {
  database = DB(_database);
  token = Token(_tokenAddress);
  accessPass = _accessPass;
}
```

##### DepositFunds:
To deposit tokens you must call `approveAndCall(tokenFaucet.address, amountToDeposit, 0x0)` on the ERC20 token, with the TokenFaucet as the spender. This will approve a transfer and then call the following function.
```javascript
  function receiveApproval(address _from, uint _amount, address _token, bytes _data)
  external {
    require(_token == msg.sender && _token == address(token));
    require(token.transferFrom(_from, this, _amount));
    tokenBalance = tokenBalance.add(_amount);
    emit LogTokenDeposited(_from, _amount, _data);
  }
```

##### Deposit WEI
To deposit WEI you can just call `depositWEI()` and send WEI along with the transaction.
```
  function depositWEI()
  external
  payable {
    weiBalance = weiBalance.add(msg.value);
    emit LogEthDeposited(msg.sender, msg.value);
  }
```

##### Withdraw from faucet:
To successfully withdraw from the faucet, the user must enter in the somewhat-secret password. The password is viewable on the blockchain, but it's a mild deterrent for those too lazy to look at previous transactions. If the user has less than `weiDripAmount` or `tokenDripAmount` then they will receive enough of each until they have the minimum balance of wei and tokens.

```
  function withdraw(string _pass)
  external {
    require (keccak256(abi.encodePacked(_pass)) == accessPass);
    if (token.balanceOf(msg.sender) < tokenDripAmount) {
      uint tokenAmount = tokenDripAmount.sub(token.balanceOf(msg.sender));
      tokenBalance = tokenBalance.sub(tokenAmount);
      require(token.transfer(msg.sender, tokenAmount));
    }
    if (msg.sender.balance < weiDripAmount) {
      uint amountWEI = weiDripAmount.sub(msg.sender.balance);
      weiBalance = weiBalance.sub(amountWEI);
      msg.sender.transfer(amountWEI);
    }
    emit LogWithdraw(msg.sender, tokenAmount, amountWEI);
  }
```

### ERC20.sol
This contract is used for testing transfers of the token in and out of the faucet

### ContractManager.sol
Contract Manager controls which contracts have access to the database. This prevents contracts and users without permission from overwriting or deleting data from the database.

### Database.sol
Contract stores data variables as uniques hashes in 7 mappings for each data type: uint, string, address, bytes, bytes32, bool, and int

### SafeMath.sol
This is a standard math library from Zeppelin that checks against overflows and underflows of uint types.
