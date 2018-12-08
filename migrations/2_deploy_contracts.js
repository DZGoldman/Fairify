var SimpleStorage = artifacts.require("./SimpleStorage.sol");
var GuessNumber = artifacts.require("./FairPlay.sol");
module.exports = function(deployer, network, accounts){
  console.log(accounts)
  deployer.deploy(SimpleStorage);
  var secret = web3.sha3 ( "394857" )
  deployer.deploy(GuessNumber, secret, 8, {from:accounts[0], value: 50000});
};
