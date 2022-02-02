//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract ThtToken is ERC20 {
  constructor() ERC20('THT Token', 'THT') {
    _mint(msg.sender, 800000000 * 10 ** 18);
  }
}