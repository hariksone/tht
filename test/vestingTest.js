const Token = artifacts.require("ThtToken");
const Sale = artifacts.require("ThtSale");
const truffleAssert = require("truffle-assertions")

const Web3 = require("web3")

contract("Sale", accounts => {
    it("should successfully transfer tokens", async() => {
        let token = await Token.deployed();
        let sale = await Sale.deployed();
        let accountTokenBalance = await token.balanceOf(accounts[0]);
    })
})