const Token = artifacts.require("ThtToken");
const PreSale = artifacts.require("PreSale");
const truffleAssert = require("truffle-assertions")

const Web3 = require("web3")

contract("PreSale", accounts => {
    it("should succeffully transfer tokens to PreSale", async() => {
        let token = await Token.deployed();
        let presale = await PreSale.deployed();

        let accountTokenBalance = await token.balanceOf(accounts[0]);

        let presaleAmount = Web3.utils.toWei("100000000", "ether")
        await token.transfer(presale.address, presaleAmount);
        let presaleTokenBalance = await token.balanceOf(presale.address);

        let newAccountTokenBalance = await token.balanceOf(accounts[0]);
        let total = parseInt(newAccountTokenBalance.toString()) + parseInt(presaleAmount)

        assert.equal(presaleTokenBalance, presaleAmount)

        assert.equal(parseInt(accountTokenBalance.toString()), total)
    })
})