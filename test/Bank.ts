import { ethers } from "hardhat";
import { assert } from "chai";
import { Signer } from "ethers";
import { Bank, SomeToken } from "../typechain-types"

describe("Bank", function() {
    let bank: Bank;
    let someToken: SomeToken;
    let accounts: Signer[];

    beforeEach(async () => {
        // deploy
        const Bank = await ethers.getContractFactory("Bank");
        const SomeToken = await ethers.getContractFactory("SomeToken");
        bank = await Bank.deploy();
        someToken = await SomeToken.deploy();

        // set balance of bank contract
        accounts = await ethers.getSigners();
        await accounts[0].sendTransaction({to: bank.address, value: ethers.utils.parseEther("100")});
        await someToken.connect(accounts[0]).transfer(bank.address, ethers.utils.parseUnits("100", await someToken.decimals()));

        // set balance of test account(accounts[1])
        await someToken.connect(accounts[0]).transfer(accounts[1].getAddress(), ethers.utils.parseUnits("100", await someToken.decimals()));
        await someToken.connect(accounts[1]).approve(bank.address, ethers.utils.parseUnits("100", await someToken.decimals()));

        // register STK token to bank
        await bank.registerToken("STK", someToken.address);
    })

    describe("Deposit", async function() {
        it("Deposit ERC20 token", async function () {
            const depositAmount = ethers.utils.parseUnits("100", await someToken.decimals());

            const tx = await bank.connect(accounts[1]).deposit(depositAmount, "STK");

            // check account state
            const balance = await bank.amountOf(accounts[1].getAddress());
            assert.equal(balance.toString(), depositAmount.toString(), "Wrong");

            // check event
            const recipt = await tx.wait();
            assert.exists(recipt.events?.find((e) =>  e.event === "DEPOSIT" && e.args?.["amount"].toString() === depositAmount.toString()), "Wrong event");
        })
        it("Deposit ETH", async function() {
            const depositAmount = ethers.utils.parseEther("100");
            const tx = await bank.connect(accounts[1]).deposit(0, "ETH", {value: depositAmount});

            // check account state
            const balance = await bank.amountOf(accounts[1].getAddress());
            assert.equal(balance.toString(), depositAmount.toString());

            // check event
            const recipt = await tx.wait();
            assert.exists(recipt.events?.find((e) =>  e.event === "DEPOSIT" && e.args?.["amount"].toString() === depositAmount.toString()), "Wrong event");
        })
    })

    describe("AmountOf", async function() {
        it("Return correct balance of address(ERC20)", async function () {
            // deposit
            const depositAmount = ethers.utils.parseUnits("100", await someToken.decimals());
            await bank.connect(accounts[1]).deposit(depositAmount, "STK");

            // check amoutOf
            const STKbalance = await bank.amountOf(accounts[1].getAddress());
            assert.equal(STKbalance.toString(), depositAmount.toString());
        })
        it("Return correct balance of address(ETH)", async function () {
            // deposit
            const depositAmount = ethers.utils.parseEther("100");
            await bank.connect(accounts[1]).deposit(0, "ETH", {value: depositAmount});

            // check amoutOf
            const ETHbalance = await bank.amountOf(accounts[1].getAddress());
            assert.equal(ETHbalance.toString(), depositAmount.toString());
        })
    })

    describe("Withdraw", async function () {
        it("Withdraw ERC20 token", async function () {
            // deposit & increase time
            const depositAmount = ethers.utils.parseUnits("100", await someToken.decimals());
            await bank.connect(accounts[1]).deposit(depositAmount, "STK");
            const twoDay = 2 * 60 * 60 * 24
            await ethers.provider.send('evm_increaseTime', [twoDay]);
            await ethers.provider.send('evm_mine', []);
            
            // withdraw
            const tx = await bank.connect(accounts[1]).withdraw();

            // check event
            const rewardAmount = ethers.utils.parseUnits("104.04", await someToken.decimals());
            const recipt = await tx.wait();
            assert.exists(recipt.events?.find((e) => e.event === "WITHDRAW" && e.args?.["amount"].toString() === rewardAmount.toString()), "Wrong event");
            
        })
        it("Withdraw ETH", async function () {
            // deposit & increase time
            const depositAmount = ethers.utils.parseEther("100");
            await bank.connect(accounts[1]).deposit(0, "ETH", {value: depositAmount});
            const twoDay = 2 * 60 * 60 * 24;
            await ethers.provider.send('evm_increaseTime', [twoDay]);
            await ethers.provider.send('evm_mine', []);
            
            // withdraw
            const tx = await bank.connect(accounts[1]).withdraw();

            // check event
            const rewardAmount = ethers.utils.parseEther("104.04");
            const recipt = await tx.wait();
            assert.exists(recipt.events?.find((e) => e.event === "WITHDRAW" && e.args?.["amount"].toString() === rewardAmount.toString()), "Wrong event");
            
        })
    })
    
    describe("Reward", async function () {
        it("Calculate correct reward of ERC20", async function () {
            // deposit & increase time
            await bank.connect(accounts[1]).deposit(ethers.utils.parseUnits("100", await someToken.decimals()), "STK");
            const twoDay = 2 * 60 * 60 * 24;
            await ethers.provider.send('evm_increaseTime', [twoDay]);
            await ethers.provider.send('evm_mine', []);

            // check reward
            const reward = await bank.rewards(accounts[1].getAddress());
            assert.equal(reward.toString(), ethers.utils.parseUnits("4.04", await someToken.decimals()).toString(), "");
        })
        it("Calculate correct reward of ETH", async function () {
            // deposit & increase time
            await bank.connect(accounts[1]).deposit(0, "ETH", {value: ethers.utils.parseUnits("100", "ether")});
            const twoDay = 2 * 60 * 60 * 24;
            await ethers.provider.send('evm_increaseTime', [twoDay]);
            await ethers.provider.send('evm_mine', []);

            // check reward
            const reward = await bank.rewards(accounts[1].getAddress());
            assert.equal(reward.toString(), ethers.utils.parseEther("4.04").toString(), "");
        })
    })
})