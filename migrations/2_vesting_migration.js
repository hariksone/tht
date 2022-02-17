const Vesting = artifacts.require("ThtVesting");
const Token = artifacts.require("ThtToken");

const tokenAddress = false;
const wallet = '0xD7bD06171036f59a8E021c6DFf39c571309f2356';
const minInvestment = '10000000000000000'; // 0.1 ether
const tokenCap = 32000000;
const rate = 10000;
const gas = 3*10**6;
const gasPrice = 40*10**9;

const Web3 = require("web3")

module.exports = async function(deployer) {
    await deployer.deploy(Token);
    const token = await Token.deployed();
    await deployer.deploy(Vesting, tokenAddress ? tokenAddress : token.address, wallet, minInvestment, tokenCap, rate, {gas: gas, gasPrice: gasPrice });
    const vesting = await Vesting.deployed();

    let vestingAmount = Web3.utils.toWei("32000000", "ether")
    await token.transfer(vesting.address, vestingAmount);
};