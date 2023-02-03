//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Lottery {
    address public manager;
    address[] public players;

    mapping(address => uint8) public entryCount;
    event WINNER(
        uint index,
        address player1,
        address player2,
        address player3,
        uint amount
    );

    function lottery() public {
        manager = msg.sender;
    }

    function enter() public payable {
        require(msg.value > .01 ether);
        require(entryCount[msg.sender] < 2, "Cannot enter more than 3 times");

        players.push(msg.sender);
        entryCount[msg.sender] += 1;
    }

    function random() private view returns (uint) {
        return uint(keccak256(abi.encode(block.timestamp, players)));
    }

    function pickWinner() public restricted {
        require(players.length > 0);
        uint rand = random();
        while (rand < 2) {
            rand += players.length;
        }

        //distribute
        uint balance = address(this).balance;
        payable(players[rand % players.length]).transfer(balance / 3);
        payable(players[(rand - 2) % players.length]).transfer(balance / 3);
        payable(players[(rand - 1) % players.length]).transfer(balance / 3);

        emit WINNER(
            rand % players.length,
            players[rand % players.length],
            players[(rand - 2) % players.length],
            players[(rand - 1) % players.length],
            balance / 3
        );

        //clear
        for (uint i = 0; i < players.length; i++) {
            entryCount[players[i]] = 0;
        }
        players = new address[](0);
    }

    modifier restricted() {
        require(msg.sender == manager);
        _;
    }
}
