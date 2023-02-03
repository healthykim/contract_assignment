//SPDX-License-Identifier: MIT 

pragma solidity ^0.8.0;

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
        // if verified....mag.sender..
        // transfer 0.1 ether
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