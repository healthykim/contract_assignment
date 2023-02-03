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
    describe("pickWinner", async function() {
        it("20 players game", async function () {
            const signerAddress = await Promise.all(accounts.map(async (s) => {
                await lottery.connect(s).enter({value: entryFee});
                return await s.getAddress();
            }));
            
            // pick winner
            let tx = await lottery.connect(accounts[0]).pickWinner();
            let r = await tx.wait();

            // check event
            let event = r.events?.find((e)=> e.event === "WINNER");
            const index = parseInt(event?.args?.["index"].toString())
            assert.equal(event?.args?.["player1"], signerAddress[index]);
            assert.equal(event?.args?.["player2"], signerAddress[(index-2+signerAddress.length)%signerAddress.length]);
            assert.equal(event?.args?.["player3"], signerAddress[(index-1+signerAddress.length)%signerAddress.length]);            
        })
        it("One player game", async function () {
            await lottery.connect(accounts[1]).enter({value: entryFee});
            const addr = await accounts[1].getAddress();
            
            // pick winner
            let tx = await lottery.connect(accounts[0]).pickWinner();
            let r = await tx.wait();

            // check event
            let event = r.events?.find((e)=> e.event === "WINNER");
            const index = parseInt(event?.args?.["index"].toString())
            assert.equal(event?.args?.["player1"], addr);
            assert.equal(event?.args?.["player1"], addr);
            assert.equal(event?.args?.["player1"], addr);     
        })
        it("Play multiple game", async function () {
            for(let i=0; i<3; i++) {
                await lottery.connect(accounts[i]).lottery();
                const players = accounts.slice(0, 3);

                const signerAddress = await Promise.all(players.map(async (s) => {
                    await lottery.connect(s).enter({value: entryFee});
                    return await s.getAddress();
                }));
                
                // pick winner
                let tx = await lottery.connect(accounts[i]).pickWinner();
                let r = await tx.wait();

                // check event
                let event = r.events?.find((e)=> e.event === "WINNER");
                const index = parseInt(event?.args?.["index"].toString())
                assert.equal(event?.args?.["player1"], signerAddress[index]);
                assert.equal(event?.args?.["player2"], signerAddress[(index-2+signerAddress.length)%signerAddress.length]);
                assert.equal(event?.args?.["player3"], signerAddress[(index-1+signerAddress.length)%signerAddress.length]);    
            }
        })
    })
})