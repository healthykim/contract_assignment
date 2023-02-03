//SPDX-License-Identifier: MIT 
pragma solidity ^0.8.0;

contract Lottery{
    address public manager;
    address[] public players;

    mapping (address => uint8) public entryCount;
    event WINNER(uint index, address player1, address player2, address player3, uint amount);

    function lottery() public {
        manager = msg.sender;
    }
    function enter() public payable{
        require(msg.value > .01 ether);
        require(entryCount[msg.sender] < 2, "Cannot enter more than 3 times");

        players.push(msg.sender);
        entryCount[msg.sender] += 1;
    }
    function random() private view returns(uint){
        return uint(keccak256(abi.encode(block.timestamp,  players)));
    }
    function pickWinner() public restricted{
        uint index = random() % players.length;
        payable (players[index]).transfer(address(this).balance);
        players = new address[](0);
    }
    modifier restricted(){
        require(msg.sender == manager);
        _;

    }
}