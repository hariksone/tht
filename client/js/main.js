async function buyToken() {
    $('#empty-amount').hide();
    var tokens_input = $("#amountId").val();
    var amount = tokens_input*0.0001;
    if(tokens_input < 100) {
        $('#empty-amount').show();
    } else {
        var weiValue = web3.utils.toWei(amount.toString(), 'ether')
        contractInstance.methods.buyTokens(user).send({value: weiValue}, function (err, txHash) {
            if (err) {
                console.log(err);
            } else {
                console.log(txHash);
            }
        })
    }
}

var user;
var tokenAddress = "0xBb596D48288C33c7A7466dCFdeB267e80B1C9842";
var contractAddress = "0xB57B9E81e1fBE982c3e323689065eE9D8eA2daf7";
var accounts;
var walletDisconnect;
var tokenSymbol;

var web3;

const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const evmChains = window.evmChains;

let web3Modal;
let provider;

function init() {
    walletDisconnect = true;

    const providerOptions = {
        walletconnect: {
            package: WalletConnectProvider,
            options: {
                infuraId: "5c75d3225dd347178447c1e222246172s",
            }
        }
    };
    web3Modal = new Web3Modal({
        cacheProvider: true, // optional
        providerOptions, // required
        disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
    });
}

async function fetchAccountData() {
    web3 = new Web3(provider);
    accounts = await web3.eth.getAccounts();
    if (accounts.length > 0) {
        const chainId = await web3.eth.getChainId();
        const chainData = evmChains.getChain(chainId);
        if (chainId != 97) {
            $("#chain-error").text("You're currently connected to the "+chainData.name+". Please connect to the Smartchain Testnet").show();
            onDisconnect()
        }
        try {
            function getTokenAbi() {
                return $.getJSON("abi/token.json").then(function (data) {
                    return data.abi;
                });
            }
            function getContractAbi() {
                return $.getJSON("abi/contract.json").then(function (data) {
                    return data.abi;
                });
            }
            await getTokenAbi().then(function(data){
                tokenInstance = new web3.eth.Contract(data, tokenAddress, { from: accounts[0] });
            });
            await getContractAbi().then(function(data){
                contractInstance = new web3.eth.Contract(data, contractAddress, { from: accounts[0] })
            });
            user = accounts[0]
            tokenSymbol = await tokenInstance.methods.symbol().call()
        } catch (e) {
            console.log("Could not get contracts instance", e);
            return;
        }
        if (tokenInstance && contractInstance) {
            tokenInstance.events.Approval().on("data", function(event) {
                let owner = event.returnValues.tokenOwner;
                let spender = event.returnValues.spender;
                let amount = event.returnValues.tokens;
                $("#approvalEventEmitted").show();
                $("#approvalEventEmitted").text(owner + " has approved " + spender + " to spend a maximum of " + amount +
                    " from balance.");
            }).on("error", console.error)

            tokenInstance.events.Transfer().on("data", function(event) {
                let owner = event.returnValues.tokenOwner;
                let receipient = event.returnValues.to;
                let amount = event.returnValues.tokens;
                $("#TransferEventEmitted").show();
                $("#TransferEventEmitted").text(owner + " has transferred " + amount + " to " + receipient);
            }).on("error", console.error)

            contractInstance.events.TokenPurchase().on("data", function(event) {
                alert(event);
                let owner = event.returnValues.purchaser;
                let price = event.returnValues.value;
                let priceETH = web3.utils.fromWei(price.toString(), "ether");
                let amount = event.returnValues.amount;
                let amountToken = web3.utils.fromWei(amount.toString(), "ether");
                $("#purchaceEventEmitted").show();
                $("#purchaceEventEmitted").text("You (" + owner + ") have successfully purchased " + amountToken + " " + tokenSymbol + " for " + priceETH + " BNB. 10% was locked. First unlock after 60 days.");
            })
                .on("error", console.error)
        }
        $("#btn-connect").hide();
        $("#btn-disconnect").show();
        $("#buy-tokens").show();

        let weiRaised = await contractInstance.methods.weiRaised().call();
        let ethRaised = web3.utils.fromWei(weiRaised.toString(), "ether");
        let rate = await contractInstance.methods.rate().call();
        let presaleSupply = await contractInstance.methods.cap().call();

        let tokenBalanceWei = await tokenInstance.methods.balanceOf(user).call();
        let tokenBalance = web3.utils.fromWei(tokenBalanceWei.toString(), "ether");
        let lockedBalanceWei = await contractInstance.methods.getLockedTokensCount().call();
        let lockedBalance = web3.utils.fromWei(lockedBalanceWei.toString(), "ether");
        let claimableBalanceWei = await contractInstance.methods.getClaimableTokensCount().call();
        let claimableBalance = web3.utils.fromWei(claimableBalanceWei.toString(), "ether");

        let amountSold = ethRaised * rate;
        let percentage = (amountSold / presaleSupply) * 100;

        $("#token-sold").text(amountSold +' '+ tokenSymbol);
        $("#token-balance").text(tokenBalance+' '+tokenSymbol);
        $("#locked-balance").text(lockedBalance+' '+tokenSymbol);
        $("#claimable-balance").text(claimableBalance+' '+tokenSymbol);
        $("#token-balance-container").show();
        $("#token-sold-container").show();

        if(claimableBalance > 0)
            $("#claim-tokens").show();

    } else {
        onDisconnect()
    }
}

async function refreshAccountData() {
    $("#btn-connect").show();
    $("#btn-disconnect").hide();
    $("#buy-tokens").hide();
    $("#btn-connect").prop('disabled', true);
    await fetchAccountData(provider);
    $("#btn-connect").prop('disabled', false);
}

async function onConnect() {
    walletDisconnect = false
    try {
        provider = await web3Modal.connect();
    } catch (e) {
        console.log("Could not get a wallet connection", e);
        return;
    }

    provider.on("accountsChanged", async(accounts) => {
        await fetchAccountData();
    });

    provider.on("chainChanged", async(chainId) => {
        await fetchAccountData();
    });

    provider.on("chainChanged", async(networkId) => {
        await fetchAccountData();
    });

    provider.on("disconnect", async(accounts) => {
        if (provider.disconnect) {
            onDisconnect()
        } else {
            await fetchAccountData();
        }
    });

    if (!walletDisconnect) {
        await refreshAccountData();
    }
}

async function onDisconnect() {
    walletDisconnect = true;
    if (provider.disconnect) {
        await provider.disconnect();
        await web3Modal.clearCachedProvider();
        provider = null;
        web3 = null;
    } else {
        await web3Modal.clearCachedProvider();
        provider = null;
        web3 = null;
    }
    selectedAccount = null;
    user = null;
    $("#btn-connect").show();
    $("#btn-disconnect").hide();
    $("#buy-tokens").hide();
    $("#token-balance-container").hide();
    $("#token-sold-container").hide();
}

async function claimTokens() {
    contractInstance.methods.claimTokens().send({}, function(err, txHash) {
        if (err) {
            console.log(err);
        } else {
            console.log(txHash);
        }
    })
}

window.addEventListener('load', async() => {
    init();
    if (web3Modal.cachedProvider) {
        onConnect()
    } else {
        $("#btn-connect").show();

        $("#btn-disconnect").hide();
        $("#buy-tokens").hide();
    }
    $("#btn-connect").click(function () {
        onConnect()
    })
    $("#btn-disconnect").click(function () {
        onDisconnect()
    })
});