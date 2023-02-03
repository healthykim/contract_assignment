//SPDX-License-Identifier: MIT 

pragma solidity ^0.8.0;

contract ECCVerifier {

    constructor() {
        // 
    }

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
				bool valid;

        //Check the signature length
        if (signature.length != 65) {
            valid = false;
        }

        // Divide the signature in r, s and v variables
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
        if (v < 27) {
            v += 27;
        }

        // If the version is correct return the signer address
        if (v != 27 && v != 28) {
					valid = false;
        } else {
            // solium-disable-next-line arg-overflow
            address signer = ecrecover(message, v, r, s);
            // ... something
        }
    }
}