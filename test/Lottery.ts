import { ethers } from "hardhat"
import { assert } from "chai"
import { Signer } from "ethers"
import { Lottery } from "../typechain-types"

async function assertFailwithMessage(promise: Promise<any>, expectedMessage: String) {
    try {
        await promise;
        assert.fail("This function should fail, but got success")
    } catch(error) {
        if(error instanceof Error) {
            const isReverted = error.message.search('revert') >= 0 && error.message.search(`${expectedMessage}`) >= 0;
            assert(isReverted, `Unexpected error: ${error}`);
        }
    }
}

describe("Lottery", function() {
    let lottery: Lottery;
    let accounts: Signer[];
    let entryFee = ethers.utils.parseEther("0.02")

    beforeEach(async () => {
        accounts = await ethers.getSigners();

        // deploy
        const Lottery = await ethers.getContractFactory("Lottery");
        lottery = await Lottery.deploy();
        
        // set manager
        await lottery.connect(accounts[0]).lottery();

    })
    describe("Enter", async function() {
        it("Cannot enter more than 3 times", async function() {
            await lottery.connect(accounts[1]).enter({value: entryFee});
            await lottery.connect(accounts[1]).enter({value: entryFee});
            await assertFailwithMessage(lottery.connect(accounts[1]).enter({value: entryFee}), "Cannot enter more than 3 times");
        })
    })
})