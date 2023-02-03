//SPDX-License-Identifier: MIT 
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Bank {
    struct account {
        uint256 balance;
        uint256 timeStamp;
        address tokenAddress;
    }

    mapping (string => address) private tokens; // ERC20 Token의 Symbol -> Token Address
    mapping (address => account) private accounts; // address -> account

    event DEPOSIT(address addr, uint256 amount);
    event WITHDRAW(address addr, uint256 amount);

    // 입금 가능한 ERC20 Token 등록
    function registerToken(string memory symbol, address tokenAddress) external {
        require(tokenAddress != address(0));
        require(ERC20(tokenAddress) != ERC20(address(0)));

        tokens[symbol] = tokenAddress;
    }

    // 입금
	function deposit(uint256 amount, string memory symbol) external payable {
        require(accounts[msg.sender].balance == 0);

        if(keccak256(abi.encodePacked(symbol)) == keccak256(abi.encodePacked("ETH"))) {
            depositETH(msg.value, msg.sender);
            return;
        }
        depositToken(amount, msg.sender, tokens[symbol]);
    }

    // ETH 입금
    function depositETH(uint256 amount, address owner) internal {
        require(amount > 0);
        
        accounts[owner] = account(amount, block.timestamp, address(0));

        emit DEPOSIT(owner, amount);
    }

    // ERC20 입금 : amount는 10**decimal() 적용해서 받음
    function depositToken(uint256 amount, address owner, address tokenAddress) internal {
        require(tokenAddress != address(0));
        require(amount > 0);

        ERC20 token = ERC20(tokenAddress);
        require(token.balanceOf(msg.sender) >= amount);
        require(token.allowance(msg.sender, address(this)) >= amount);

        token.transferFrom(owner, address(this), amount);
        accounts[owner] = account(amount, block.timestamp, tokenAddress);

        emit DEPOSIT(owner, amount);
    }
	
	
	function withdraw() public {

    } // 출금 (원금 + 이자)
	
	// 현재 원금 확인
	function amountOf(address owner) public view returns(uint256) {
        return accounts[owner].balance;
    } 
	
	function rewards(address) public view {

    } // 현재 rewards 확인 (원금 외의 이자로 받는 금액)
}