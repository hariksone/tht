const Token = artifacts.require("ThtToken");
const Vesting = artifacts.require("ThtVesting");
const truffleAssert = require("truffle-assertions")

const Web3 = require("web3")

contract("Vesting", accounts => {
    it("should succeffully transfer tokens to PreSale", async() => {
        let token = await Token.deployed();
        let presale = await Vesting.deployed();

        let accountTokenBalance = await token.balanceOf(accounts[0]);

        let presaleAmount = Web3.utils.toWei("32000000", "ether")
        await token.transfer(presale.address, presaleAmount);

        let presaleTokenBalance = await token.balanceOf(presale.address);

        assert.equal(presaleTokenBalance, presaleAmount)

    })
})