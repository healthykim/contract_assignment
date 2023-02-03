//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SomeToken is ERC20 {
    constructor() ERC20("SomeToken", "STK") {
        _mint(msg.sender, 200 * 10 ** decimals());
    }
}