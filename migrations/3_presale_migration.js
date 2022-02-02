const PreSale = artifacts.require("PreSale");
const Token = artifacts.require("ThtToken");

module.exports = function(deployer, network, accounts) {
    deployer.deploy(PreSale, Token.address, accounts[0], 4, 320000000, 25);
};