import { ethers } from "hardhat";
import { assert } from "chai";
import { Signer } from "ethers";
import { ECCVerifier } from "../typechain-types"

async function make_signature(signer: Signer) {
    let messageHash = ethers.utils.solidityKeccak256(["string"], ["test"]);
    let signature = await signer.signMessage(ethers.utils.arrayify(messageHash));
    return signature;
}

describe("ECDSABank", function() {
    let verifier: ECCVerifier;
    let accounts: Signer[];

    beforeEach(async () => {
        const Verifier = await ethers.getContractFactory("ECCVerifier");
        verifier = await Verifier.deploy();
        accounts = await ethers.getSigners();
    })

    describe("Deposit", async function () { 
        it("deposit with signature", async () => {
            // deposit
            const signature = await make_signature(accounts[1]);
            let messageHash = ethers.utils.solidityKeccak256(["string"], ["test"]);
            const tx = await verifier.connect(accounts[1]).deposit(messageHash, signature, {value: ethers.utils.parseEther("100")});

            //check event
            const recipt = await tx.wait()
            let event = recipt.events?.find((e)=> e.event === "DEPOSIT");
            assert.equal(event?.args?.["signer"], await accounts[1].getAddress());
            assert.equal(event?.args?.["amount"].toString(), ethers.utils.parseEther("100").toString());
        })
    })
})