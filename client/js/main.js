var user;
var tokenAddress = "0x4C6DD9a8f676828eDfBc06A470524671174666C8";
var contractAddress = "0xf79C5BD6278479234594b39e821028B76b44e0a1";
var accounts;
var walletDisconnect;
var tokenSymbol;

var web3;

const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const evmChains = window.evmChains;

let web3Modal;
let provider;

const tokenABIFile = "abi/token.json";
const contractABIFile = "abi/contract.json";

let contractABI = {};
let tokenABI = {};

function init() {
    walletDisconnect = true;

    const providerOptions = {
        walletconnect: {
            package: WalletConnectProvider,
            options: {
                rpc: {
                    97: "https://speedy-nodes-nyc.moralis.io/0c0000000000000000/bsc/testnet",
                }
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
    $('.alert').hide();
    $('#locked-tokens-container').find('tbody').html('');
    $('#locked-tokens-container').hide();
    web3 = new Web3(provider);
    accounts = await web3.eth.getAccounts();
    if (accounts.length > 0) {
        const chainId = await web3.eth.getChainId();
        const chainData = evmChains.getChain(chainId);
        if (chainId != 97) {
            $(".alert-danger").text("You're currently connected to the "+chainData.name+". Please connect to the Smartchain Testnet").show();
            onDisconnect()
        }
        try {
            const tokenJson = await fetch(tokenABIFile);
            const contractJson = await fetch(contractABIFile);
            tokenABI = await tokenJson.json();
            contractABI = await contractJson.json();
            tokenInstance = new web3.eth.Contract(tokenABI.abi, tokenAddress, { from: accounts[0] });
            contractInstance = new web3.eth.Contract(contractABI.abi, contractAddress, { from: accounts[0] })
            user = accounts[0]
            tokenSymbol = await tokenInstance.methods.symbol().call()
        } catch (e) {
            console.log("Could not get contracts instance", e);
            return;
        }

        $("#btn-connect").hide();
        $("#add-whitelist").hide();
        $(".alert-success").hide();
        $(".alert-danger").hide();
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

        $("#wallet_account").text('('+user+')');

        let isAvailable = await contractInstance.methods.isTokenAvailable(user).call();
        if(!isAvailable) {
            $("#buy-tokens").hide();
            $(".alert-danger").text('You are not in out white list. Contact us first.').show();
        }
        let contractOwner = await contractInstance.methods.owner().call()
        if (user === contractOwner) {
            $("#add-whitelist").show();
            $(".alert-danger").hide();
        }

        let locked_orders_count = await contractInstance.methods.getOrdersCount().call();
        if(parseInt(locked_orders_count)) {
            let locked_orders = await contractInstance.methods.getOrders().call();
            console.log(locked_orders);
            $.each( locked_orders, function( i, order ){
                var unlock_date = new Date(order.lockup*1000);
                $('#locked-tokens-container').find('tbody').append(
                    '<tr><td>'+parseInt(i+1)+'</td><td>'+web3.utils.fromWei(order.amount, "ether")+'</td><td>'+unlock_date.toLocaleString()+'</td><td>'+order.claimed+'</td></tr>'
                );

            });
            $('#locked-tokens-container').show();
        }

    } else {
        onDisconnect()
    }
}


async function fetchBalanceData() {
    web3 = new Web3(provider);
    accounts = await web3.eth.getAccounts();
    if (accounts.length > 0) {
        const chainId = await web3.eth.getChainId();
        const chainData = evmChains.getChain(chainId);
        if (chainId != 97) {
            $(".alert-danger").text("You're currently connected to the "+chainData.name+". Please connect to the Smartchain Testnet").show();
            onDisconnect()
        }
        try {
            const tokenJson = await fetch(tokenABIFile);
            const contractJson = await fetch(contractABIFile);
            tokenABI = await tokenJson.json();
            contractABI = await contractJson.json();
            tokenInstance = new web3.eth.Contract(tokenABI.abi, tokenAddress, { from: accounts[0] });
            contractInstance = new web3.eth.Contract(contractABI.abi, contractAddress, { from: accounts[0] })
            user = accounts[0]
            tokenSymbol = await tokenInstance.methods.symbol().call()
        } catch (e) {
            console.log("Could not get contracts instance", e);
            return;
        }

        let weiRaised = await contractInstance.methods.weiRaised().call();
        let ethRaised = web3.utils.fromWei(weiRaised.toString(), "ether");
        let rate = await contractInstance.methods.rate().call();

        let tokenBalanceWei = await tokenInstance.methods.balanceOf(user).call();
        let tokenBalance = web3.utils.fromWei(tokenBalanceWei.toString(), "ether");
        let lockedBalanceWei = await contractInstance.methods.getLockedTokensCount().call();
        let lockedBalance = web3.utils.fromWei(lockedBalanceWei.toString(), "ether");

        let amountSold = ethRaised * rate;

        $("#token-sold").text(amountSold +' '+ tokenSymbol);
        $("#token-balance").text(tokenBalance+' '+tokenSymbol);
        $("#locked-balance").text(lockedBalance+' '+tokenSymbol);

        let locked_orders_count = await contractInstance.methods.getOrdersCount().call();
        if(parseInt(locked_orders_count)) {
            let locked_orders = await contractInstance.methods.getOrders().call();
            console.log(locked_orders);
            $.each( locked_orders, function( i, order ){
                var unlock_date = new Date(order.lockup*1000);
                $('#locked-tokens-container').find('tbody').append(
                    '<tr><td>'+parseInt(i+1)+'</td><td>'+web3.utils.fromWei(order.amount, "ether")+'</td><td>'+unlock_date.toLocaleString()+'</td><td>'+order.claimed+'</td></tr>'
                );

            });
            $('#locked-tokens-container').show();
        }

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
    $('#locked-tokens-container').hide();
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

async function addAddress() {
    var token_to_add = $("#customerAddress").val();
    if(token_to_add) {
        contractInstance.methods.addWhiteListToken(token_to_add).send({}, function (err, txHash) {
            if (err) {
                console.log(err);
            } else {
                $('#confirmCustomerAdd').attr('disabled',true).find('span').show();
            }
        }).then((data) => {
            $('#customerAddress').val('');
            $('#confirmCustomerAdd').attr('disabled',false).find('span').hide();
            $('.alert-success').text(data.events.whiteListedTokenAdded.returnValues._token+' added to whitelist').show();
        });
    }
}

async function removeAddress() {
    var token_to_remove = $("#customerAddressRemove").val();
    if(token_to_remove) {
        contractInstance.methods.removeWhiteListToken(token_to_remove).send({}, function (err, txHash) {
            if (err) {
                console.log(err);
            } else {
                $('#confirmCustomerRemove').attr('disabled',true).find('span').show();
            }
        }).then((data) => {
            $('#customerAddressRemove').val('');
            $('#confirmCustomerRemove').attr('disabled',false).find('span').hide();
            $('.alert-success').text(data.events.whiteListedTokenRemoved.returnValues._token+' removed from whitelist').show();
        });
    }
}

async function buyToken() {
    $('.alert').hide();
    var tokens_input = $("#amountId").val();
    var amount = tokens_input*0.0001;
    if(tokens_input < 100) {
        $('.alert-danger').text('Tokens amount should be greater than 100').show();

    } else {
        var weiValue = web3.utils.toWei(amount.toString(), 'ether')
        contractInstance.methods.buyTokens(user).send({value: weiValue}, function (err, txHash) {
            if (err) {
                console.log(err);
            } else {
                $('#buyTokensButton').attr('disabled',true).find('span').show();
            }
        }).then((data) => {
            console.log(data);
            $('#amountId').val('');
            $('#buyTokensButton').attr('disabled',false).find('span').hide();
            let price = data.events.TokenPurchase.returnValues.value;
            let priceETH = web3.utils.fromWei(price.toString(), "ether");
            let amount = data.events.TokenPurchase.returnValues.amount;
            let amountToken = web3.utils.fromWei(amount.toString(), "ether");
            fetchBalanceData();
            $('.alert-success').text("You have successfully purchased " + amountToken + " " + tokenSymbol + " for " + priceETH + " BNB. 90% was locked. First unlock after 60 days.").show();
        });
    }
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