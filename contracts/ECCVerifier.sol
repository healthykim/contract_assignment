//SPDX-License-Identifier: MIT 

pragma solidity ^0.8.0;

/*
문제 1과 3에서 "ETH 혹은 ERC20을 받는" 이라는 표현이 있습니다.
1) ETH를 받는 Contract 혹은 ERC20을 받는 Contract를 구현
2) ETH와 ERC20 모두 받을 수 있는 Contract를 구현
이렇게 두 가지로 해석된다고 생각해서, 1번은 2)로 구현하였고 3번은 1)(ETH의 경우)로 구현하였습니다.
만약 둘 중 하나를 의도한 것이라면 1번을 3번같이 혹은 3번을 1번같이 바꾸면 되고, 그렇게 하기 편하게 구현했기 때문에 변경은 간단할 것 같습니다.
*/

contract ECCVerifier {

    constructor() {
        // 
    }

    struct account {
        uint balance;
        address owner;
    }

    mapping (bytes32 => account) private accounts;

    event DEPOSIT(address signer, uint256 amount);
    event WITHDRAW(address signer, uint256 amount);


    // signature hash => signer address
    function withdraw(bytes32 signatureHash) public {
        require(accounts[signatureHash].owner == msg.sender);

        uint balance = accounts[signatureHash].balance;
        accounts[signatureHash] = account(0, address(0));
        payable(msg.sender).transfer(balance);
        
        emit WITHDRAW(msg.sender, balance);
    }

    function deposit(
        bytes32 message,
        bytes memory signature
    ) public payable {
        bytes32 r;
        bytes32 s;
        uint8 v;

        require(msg.value > 0);

        //Check the signature length
        require(signature.length == 65);

        // Divide the signature in r, s and v variables
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        if (v < 27) {
            v += 27;
        }
        // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
        require(v == 27 || v == 28);

        // If the version is correct return the signer address
        // solium-disable-next-line arg-overflow
        address signer = recoverAddress(message, v, r, s);
        accounts[keccak256(abi.encodePacked(signature))].balance += msg.value;
        accounts[keccak256(abi.encodePacked(signature))].owner = signer;
        
        emit DEPOSIT(signer, msg.value);
    }


    function recoverAddress(bytes32 msgHash, uint8 v, bytes32 r, bytes32 s) public pure returns(address) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHash = keccak256(abi.encodePacked(prefix, msgHash));
        return ecrecover(prefixedHash, v, r, s);
    }
}