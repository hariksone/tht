const Sale = artifacts.require("ThtSale");
const Token = artifacts.require("ThtToken");

const tokenAddress = false;
const minInvestment = '10000000000000000'; // 0.1 ether
const tokenCap = 32000000;
const rate = 10000;
const gas = 3*10**6;
const gasPrice = 40*10**9;

const Web3 = require("web3")

module.exports = async function(deployer, network, accounts) {
    await deployer.deploy(Token);
    const token = await Token.deployed();
    await deployer.deploy(Sale, tokenAddress ? tokenAddress : token.address, accounts[0], minInvestment, tokenCap, rate, {gas: gas, gasPrice: gasPrice });
    const sale = await Sale.deployed();

    let saleAmount = Web3.utils.toWei("32000000", "ether")
    await token.transfer(sale.address, saleAmount);
};