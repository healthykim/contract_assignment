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

    describe("Withdraw", async function () { 
        it("withdraw with signature hash", async () => {
            // deposit
            const signature = await make_signature(accounts[1]);
            let messageHash = ethers.utils.solidityKeccak256(["string"], ["test"]);
            await verifier.connect(accounts[1]).deposit(messageHash, signature, {value: ethers.utils.parseEther("100")});
            
            // withdraw
            let tx = await verifier.connect(accounts[1]).withdraw(ethers.utils.solidityKeccak256(["bytes"], [signature]));
            let recipt = await tx.wait();

            // check event
            const event = recipt.events?.find((e)=>e.event === "WITHDRAW");
            assert(event?.args?.["signer"], await accounts[1].getAddress());
            assert(event?.args?.["amount"].toString(), ethers.utils.parseEther("100").toString());
        })
    })

    describe("Multiple deposit & withdraw", async function () { 
        it("deposit & withdraw", async () => {
            // 1 deposit & 1 withdraw
            const signature = await make_signature(accounts[1]);
            let messageHash = ethers.utils.solidityKeccak256(["string"], ["test"]);
            await verifier.connect(accounts[1]).deposit(messageHash, signature, {value: ethers.utils.parseEther("100")});
            let tx = await verifier.connect(accounts[1]).withdraw(ethers.utils.solidityKeccak256(["bytes"], [signature]));
            let recipt = await tx.wait();

            // check event
            let event = recipt.events?.find((e)=>e.event === "WITHDRAW");
            assert(event?.args?.["signer"], await accounts[1].getAddress());
            assert(event?.args?.["amount"].toString(), ethers.utils.parseEther("100").toString());

            // 2 deposit & 1 withdraw
            await verifier.connect(accounts[1]).deposit(messageHash, signature, {value: ethers.utils.parseEther("100")});
            await verifier.connect(accounts[1]).deposit(messageHash, signature, {value: ethers.utils.parseEther("100")});
            tx = await verifier.connect(accounts[1]).withdraw(ethers.utils.solidityKeccak256(["bytes"], [signature]));
            recipt = await tx.wait();
    
            // check event
            event = recipt.events?.find((e)=>e.event === "WITHDRAW");
            assert(event?.args?.["signer"], await accounts[1].getAddress());
            assert(event?.args?.["amount"].toString(), ethers.utils.parseEther("200").toString());
        })
    })
})