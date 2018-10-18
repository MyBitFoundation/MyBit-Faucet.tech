pragma solidity 0.4.24;

import "./SafeMath.sol";

interface DB { function boolStorage(bytes32 _key) external view returns (bool); }
interface Token {
   function balanceOf(address _tokenHolder) external view returns (uint);
   function transfer(address _to, uint _amount) external returns (bool);
   function transferFrom(address _from, address _to, uint _amount) external returns (bool);
 }

// @notice Registers users and provides them with a minimum amount of MYB and Ether
// Note: Not secure. Use for test-net only.
contract TokenFaucet {
  using SafeMath for uint;

  Token public token;
  DB public database;

  uint public tokenBalance;
  uint public weiBalance;

  uint public tokenDripAmount = uint256(10e21);     // User should have at least 10,000 MYB
  uint public weiDripAmount = 500 finney;    // User should have at least .5 Ether

  bytes32 private accessPass;


  constructor(address _database, address _tokenAddress, bytes32 _accessPass)
  public  {
    database = DB(_database);
    token = Token(_tokenAddress);
    accessPass = _accessPass;
  }

  // For owner to deposit tokens easier
  // @dev call Token.receiveAndCall(_spender=mybFaucet.address, _amount * 10^18, StandardToken.address, 0x0)
  function receiveApproval(address _from, uint _amount, address _token, bytes _data)
  external {
    require(_token == msg.sender && _token == address(token));
    require(token.transferFrom(_from, this, _amount));
    tokenBalance = tokenBalance.add(_amount);
    emit LogTokenDeposited(_from, _amount, _data);
  }

  // Can deposit more WEI in here
  function depositWEI()
  external
  payable {
    weiBalance = weiBalance.add(msg.value);
    emit LogEthDeposited(msg.sender, msg.value);
  }

    // Lazy defence. accessPass is mild deterent, not secure.
  function withdraw(string _pass)
  external
  returns (bool){
    require (keccak256(abi.encodePacked(_pass)) == accessPass);
    if (msg.sender.balance < weiDripAmount) {
      uint amountWEI = weiDripAmount.sub(msg.sender.balance);
      weiBalance = weiBalance.sub(amountWEI);
      msg.sender.transfer(amountWEI);
    }
    if (token.balanceOf(msg.sender) < tokenDripAmount) {
      uint tokenAmount = tokenDripAmount.sub(token.balanceOf(msg.sender));
      tokenBalance = tokenBalance.sub(tokenAmount);
      require(token.transfer(msg.sender, tokenAmount));
    }
    emit LogWithdraw(msg.sender, tokenAmount, amountWEI);
    return true;
  }

  function changePass(bytes32 _newPass)
  external
  anyOwner
  returns (bool) {
    accessPass = _newPass;
    return true;
  }

  function changeDripAmounts(uint _newAmountWEI, uint _newAmountMYB)
  external
  anyOwner
  returns (bool) {
    weiDripAmount = _newAmountWEI;
    tokenDripAmount = _newAmountMYB;
    return true;
  }

  function destroy(address _receiver)
  external
  anyOwner
  returns (bool) {
    require(token.transfer(_receiver, tokenBalance));
    selfdestruct(_receiver);
    return true;
  }
  //------------------------------------------------------------------------------------------------------------------
  //                               Modifiers
  //------------------------------------------------------------------------------------------------------------------
  modifier anyOwner {
    require(database.boolStorage(keccak256(abi.encodePacked("owner", msg.sender))));
    _;
  }



  event LogWithdraw(address _sender, uint _amountToken, uint _amountWEI);
  event LogTokenDeposited(address _depositer, uint _amount, bytes _data);
  event LogEthDeposited(address _depositer, uint _amountWEI);
}
