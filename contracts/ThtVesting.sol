//SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './ThtToken.sol';

/**
 * @title ThtVesting
 */

contract ThtVesting is Pausable, Ownable {
    using SafeMath for uint256;

    // The token being sold
    address TokenAddress;

    // address where funds are collected
    address public wallet;

    // amount of raised money in wei
    uint256 public weiRaised;

    // cap above which the vesting is ended
    uint256 public cap;

    uint256 public minInvestment;

    uint256 public rate;

    struct Order {
        uint256 amount;
        uint256 lockup;
        bool    claimed;
    }
    uint256 private latestOrderId = 0;
    mapping(address => Order[]) public orders;

    /**
     * constructor
     * @param _tokenAddress token address
     * @param _wallet who receives invested ether
     * @param _minInvestment is the minimum amount of ether that can be sent to the contract
     * @param _cap above which the vesting is closed
     * @param _rate is the amounts of tokens given for 1 ether
     */
    constructor(
        address _tokenAddress,
        address payable _wallet,
        uint256 _minInvestment,
        uint256 _cap,
        uint256 _rate
    ) {
        require(_wallet != address(0x0));
        require(_minInvestment >= 0);
        require(_cap > 0);

        TokenAddress = _tokenAddress;
        wallet = _wallet;
        rate = _rate;
        minInvestment = _minInvestment;
        cap = _cap * (10**18);
    }

    /**
     * event for token purchase logging
     * @param purchaser who paid for the tokens
     * @param beneficiary who got the tokens
     * @param value weis paid for purchase
     * @param amount amount of tokens purchased
     */
    event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

    /**
     * event for signaling finished vesting
     */
    event Finalized();

    /**
     * Low level token purchase function
     * @param beneficiary will receive the tokens.
     */
    function buyTokens(address beneficiary) public payable whenNotPaused {
        require(beneficiary != address(0x0));
        require(validPurchase());
        ++latestOrderId;
        uint256 weiAmount = msg.value;
        // update weiRaised
        weiRaised = weiRaised.add(weiAmount);
        // compute amount of tokens created
        uint256 tokens = weiAmount.mul(rate);

        uint256 tokensToSend = tokens.div(10); // Send 10 percent;
        uint256 tokensToLock = tokens.sub(tokens.div(10)).div(16); // Lock 90 percent;
        uint lockTime = block.timestamp + 60 days;
        // Create first lock for 60 days
        Order memory firstOrder;
        firstOrder.amount = tokensToLock;
        firstOrder.lockup = lockTime;
        firstOrder.claimed = false;
        orders[msg.sender].push(firstOrder);
        for(uint i=0; i<15; i++) {
            lockTime = lockTime + 30 days;
            Order memory newOrder;
            newOrder.amount = tokensToLock;
            newOrder.lockup = lockTime;
            newOrder.claimed = false;
            orders[msg.sender].push(newOrder);
        }
        IERC20(TokenAddress).transfer(msg.sender, tokensToSend);
        emit TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);
        forwardFunds();
    }

    // send ether to the fund collection wallet
    function forwardFunds() internal {
        payable(wallet).transfer(msg.value);
    }

    // return true if the transaction can buy tokens
    function validPurchase() internal view returns (bool) {
        uint256 weiAmount = weiRaised.add(msg.value);
        bool notSmallAmount = msg.value >= minInvestment;
        bool withinCap = weiAmount.mul(rate) <= cap;

        return (notSmallAmount && withinCap);
    }

    function getOrdersCount() public view returns(uint256) {
        return orders[msg.sender].length;
    }

    function getLockedTokensCount() public view returns(uint256) {
        uint256 tokensCount = 0;
        for (uint i=0; i<orders[msg.sender].length; i++) {
            if(!orders[msg.sender][i].claimed)
                tokensCount+=orders[msg.sender][i].amount;
        }
        return tokensCount;
    }

    function getClaimableTokensCount() public view returns(uint256) {
        uint256 tokensCount = 0;
        for (uint i=0; i<orders[msg.sender].length; i++) {
            if(!orders[msg.sender][i].claimed && orders[msg.sender][i].lockup <= block.timestamp)
                tokensCount+=orders[msg.sender][i].amount;
        }
        return tokensCount;
    }

    function claimTokens() public {
        uint256 tokensCount = 0;
        for (uint i=0; i<orders[msg.sender].length; i++) {
            if(!orders[msg.sender][i].claimed && orders[msg.sender][i].lockup <= block.timestamp) {
                tokensCount+=orders[msg.sender][i].amount;
                orders[msg.sender][i].claimed = true;
            }
        }
        if(tokensCount > 0)
            IERC20(TokenAddress).transfer(msg.sender, tokensCount);
    }

    //return true if vesting has ended
    function hasEnded() public view returns (bool) {
        bool capReached = (weiRaised * rate >= cap);
        return capReached;
    }
}