import { expect } from "chai";
import hre from "hardhat";

describe("MultiSigWallet", function () {
    let wallet: any;
    let counter: any;
    let addr1: any, addr2: any, addr3: any, nonOwner: any;
    let owners: string[];
    const REQUIRED_APPROVALS = 2;
    let ethers: any;

    beforeEach(async function () {
        const network = await hre.network.getOrCreate();
        ethers = network.ethers;

        [addr1, addr2, addr3, nonOwner] = await ethers.getSigners();
        owners = [addr1.address, addr2.address, addr3.address];

        const WalletFactory = await ethers.getContractFactory("MultiSigWallet");
        wallet = await WalletFactory.deploy(owners, REQUIRED_APPROVALS);

        const CounterFactory = await ethers.getContractFactory("Counter");
        counter = await CounterFactory.deploy();
    });

    describe("Constructor", function () {
        it("Deploys with correct owners and threshold", async function () {
            expect(await wallet.owners(0)).to.equal(addr1.address);
            expect(await wallet.requiredApprovals()).to.equal(REQUIRED_APPROVALS);
        });

        it("Reverts with duplicate owners", async function () {
            const invalidOwners = [addr1.address, addr1.address];
            const WalletFactory = await ethers.getContractFactory("MultiSigWallet");
            await expect(WalletFactory.deploy(invalidOwners, 2)).to.be.revertedWith("owner not unique");
        });

        it("Reverts with zero address", async function () {
            const invalidOwners = [addr1.address, ethers.ZeroAddress];
            const WalletFactory = await ethers.getContractFactory("MultiSigWallet");
            await expect(WalletFactory.deploy(invalidOwners, 2)).to.be.revertedWith("invalid owner");
        });
    });

    describe("receive()", function () {
        it("Accepts incoming ETH", async function () {
            await addr1.sendTransaction({
                to: await wallet.getAddress(),
                value: ethers.parseEther("1.0")
            });
            const balance = await ethers.provider.getBalance(await wallet.getAddress());
            expect(balance).to.equal(ethers.parseEther("1.0"));
        });
    });

    describe("submitTransaction()", function () {
        it("Allows owner to submit transaction", async function () {
            await expect(wallet.connect(addr1).submitTransaction(addr2.address, 100, "0x"))
                .to.emit(wallet, "SubmitTransaction");

            const txCount = await wallet.getTransactionCount();
            expect(txCount).to.equal(1);
        });

        it("Reverts if non-owner submits", async function () {
            await expect(
                wallet.connect(nonOwner).submitTransaction(addr2.address, 100, "0x")
            ).to.be.revertedWith("not owner");
        });
    });

    describe("approveTransaction()", function () {
        beforeEach(async function () {
            await wallet.connect(addr1).submitTransaction(addr2.address, 100, "0x");
        });

        it("Allows owner to approve", async function () {
            await expect(wallet.connect(addr2).approveTransaction(0))
                .to.emit(wallet, "Approved")
                .withArgs(addr2.address, 0);

            const transaction = await wallet.getTransaction(0);
            expect(transaction.approvalCount).to.equal(1);
        });

        it("Reverts if non-owner approves", async function () {
            await expect(wallet.connect(nonOwner).approveTransaction(0)).to.be.revertedWith("not owner");
        });

        it("Reverts on double approval", async function () {
            await wallet.connect(addr1).approveTransaction(0);
            await expect(wallet.connect(addr1).approveTransaction(0)).to.be.revertedWith("tx already approved");
        });
    });

    describe("revokeApproval()", function () {
        beforeEach(async function () {
            await wallet.connect(addr1).submitTransaction(addr2.address, 100, "0x");
            await wallet.connect(addr1).approveTransaction(0);
        });

        it("Allows owner to revoke and decrements count", async function () {
            await expect(wallet.connect(addr1).revokeApproval(0))
                .to.emit(wallet, "Revoked")
                .withArgs(addr1.address, 0);

            const transaction = await wallet.getTransaction(0);
            expect(transaction.approvalCount).to.equal(0);
        });

        it("Reverts if revoking unapproved transaction", async function () {
            await expect(wallet.connect(addr2).revokeApproval(0)).to.be.revertedWith("tx not approved");
        });
    });

    describe("getApprovers()", function () {
        beforeEach(async function () {
            await wallet.connect(addr1).submitTransaction(addr2.address, 100, "0x");
        });

        it("Returns an empty array initially", async function () {
            const approvers = await wallet.getApprovers(0);
            expect(approvers.length).to.equal(0);
        });

        it("Returns correct addresses after approvals", async function () {
            await wallet.connect(addr1).approveTransaction(0);
            await wallet.connect(addr2).approveTransaction(0);
            
            const approvers = await wallet.getApprovers(0);
            expect(approvers.length).to.equal(2);
            expect(approvers).to.include(addr1.address);
            expect(approvers).to.include(addr2.address);
        });

        it("Removes address after revoking approval", async function () {
            await wallet.connect(addr1).approveTransaction(0);
            await wallet.connect(addr2).approveTransaction(0);
            await wallet.connect(addr1).revokeApproval(0); // addr1 changes their mind
            
            const approvers = await wallet.getApprovers(0);
            expect(approvers.length).to.equal(1);
            expect(approvers[0]).to.equal(addr2.address);
        });
    });
    
    describe("executeTransaction()", function () {
        beforeEach(async function () {
            await addr1.sendTransaction({
                to: await wallet.getAddress(),
                value: ethers.parseEther("5.0")
            });
        });

        it("Executes valid transaction and changes target state", async function () {
            const data = counter.interface.encodeFunctionData("inc");
            await wallet.connect(addr1).submitTransaction(await counter.getAddress(), 0, data);
            await wallet.connect(addr1).approveTransaction(0);
            await wallet.connect(addr2).approveTransaction(0);

            await expect(wallet.connect(addr3).executeTransaction(0))
                .to.emit(wallet, "Executed")
                .withArgs(addr3.address, 0);

            expect(await counter.x()).to.equal(1);
        });

        it("Reverts if fewer than M approvals", async function () {
            await wallet.connect(addr1).submitTransaction(addr2.address, ethers.parseEther("1.0"), "0x");
            await wallet.connect(addr1).approveTransaction(0);
            await expect(wallet.connect(addr2).executeTransaction(0)).to.be.revertedWith("cannot execute");
        });

        it("Reverts if already executed", async function () {
            await wallet.connect(addr1).submitTransaction(addr2.address, ethers.parseEther("1.0"), "0x");
            await wallet.connect(addr1).approveTransaction(0);
            await wallet.connect(addr2).approveTransaction(0);

            await wallet.connect(addr1).executeTransaction(0);

            await expect(wallet.connect(addr2).executeTransaction(0)).to.be.revertedWith("tx already executed");
        });
    });
    it("SECURITY: Defeats malicious reentrancy attacks", async function () {
            // Deploy Attacker
            const AttackerFactory = await ethers.getContractFactory("Attacker");
            const attacker = await AttackerFactory.deploy(await wallet.getAddress());
            const attackerAddress = await attacker.getAddress();
            
            // Submit TX to send 1 ETH to Attacker
            await wallet.connect(addr1).submitTransaction(attackerAddress, ethers.parseEther("1.0"), "0x");
            
            // Get the txId (it should be 1 since we submitted one in the beforeEach block)
            const txId = (await wallet.getTransactionCount()) - 1n;
            await attacker.setTxId(txId);
            
            // Approve
            await wallet.connect(addr1).approveTransaction(txId);
            await wallet.connect(addr2).approveTransaction(txId);

            // Execute - ReentrancyGuard should block the recursive call and revert safely
            await expect(
                wallet.connect(addr3).executeTransaction(txId)
            ).to.be.revertedWith("tx failed");
        });
});