const Token = artifacts.require("ThtToken");

module.exports = function(deployer) {
    deployer.deploy(Token);
};