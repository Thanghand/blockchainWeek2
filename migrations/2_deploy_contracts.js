var Store = artifacts.require("./Store.sol");
var EscrowManager = artifacts.require("./EscrowManager");

var Web3 = require('../node_modules/web3/')
web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));

module.exports = function(deployer) {
  deployer.deploy(Store);
  deployer.deploy(EscrowManager);
};
