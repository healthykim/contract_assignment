//SPDX-License-Identifier: MIT 
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/*
문제 1과 3에서 "ETH 혹은 ERC20을 받는" 이라는 표현이 있습니다.
1) ETH를 받는 Contract 혹은 ERC20을 받는 Contract를 구현
2) ETH와 ERC20 모두 받을 수 있는 Contract를 구현
이렇게 두 가지로 해석된다고 생각해서, 1번은 2)로 구현하였고 3번은 1)(ETH의 경우)로 구현하였습니다.
만약 둘 중 하나를 의도한 것이라면 1번을 3번같이 혹은 3번을 1번같이 바꾸면 되고, 그렇게 하기 편하게 구현했기 때문에 변경은 간단할 것 같습니다.
*/

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
	
	
    // 출금 (원금 + 이자)
	function withdraw() external {
        require(accounts[msg.sender].balance != 0, "[Withdraw] Nothing to withdraw");
        if(accounts[msg.sender].tokenAddress == address(0)) {
            withdrawETH(msg.sender);
            return;
        }
        withdrawERC20(msg.sender);
    }

    function withdrawETH(address owner) internal {
        account memory ownerAccount = accounts[owner];
        uint256 amount = ownerAccount.balance + rewards(owner);
        
        accounts[owner] = account(0, 0, address(0));
        payable(owner).transfer(amount);

        emit WITHDRAW(owner, amount);
    }

    function withdrawERC20(address owner) internal {
        account memory ownerAccount = accounts[owner];
        uint256 amount = ownerAccount.balance + rewards(owner);
        address tokenAddress = ownerAccount.tokenAddress;
        
        accounts[owner] = account(0, 0, address(0));
        ERC20(tokenAddress).transfer(owner, amount);

        emit WITHDRAW(owner, amount);
    }
	
	// 현재 원금 확인
	function amountOf(address owner) public view returns(uint256) {
        return accounts[owner].balance;
    } 
	
    // 현재 rewards 확인 (원금 외의 이자로 받는 금액) 
	function rewards(address owner) public view returns(uint256) {
        require(accounts[owner].balance != 0, "[Rewards] Nothing to reward");

        uint256 day = (block.timestamp - accounts[owner].timeStamp)/(60 * 60 * 24);
        
        uint256 reward = accounts[owner].balance;
        for(uint i=0; i<day; i++) {
            reward = reward + reward * 2 / 100;
        }
        reward = reward - accounts[owner].balance;
        return reward;
    } 


    receive() external payable {}

}