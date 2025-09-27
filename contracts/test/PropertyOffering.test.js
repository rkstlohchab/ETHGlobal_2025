const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("PropertyOffering", function () {
  let PropertyOffering, propertyOffering, MockERC20, token, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy MockERC20
    MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("Test Token", "TST", 18);
    await token.waitForDeployment();

    // Deploy PropertyOffering
    PropertyOffering = await ethers.getContractFactory("PropertyOffering");
    const pricePerToken = ethers.parseEther("0.1");
    const goal = ethers.parseEther("10");
    const deadline = (await ethers.provider.getBlock('latest')).timestamp + 86400; // 1 day from now

    propertyOffering = await PropertyOffering.deploy(
      token.target,
      owner.address,
      pricePerToken,
      goal,
      deadline
    );
    await propertyOffering.waitForDeployment();

    // Mint some tokens to the offering contract for inventory
    await token.mint(propertyOffering.target, ethers.parseEther("1000"));
  });

  describe("Deployment", function () {
    it("Should set the right owner, token, price, goal, and deadline", async function () {
      const pricePerToken = ethers.parseEther("0.1");
      const goal = ethers.parseEther("10");
      const deadline = (await ethers.provider.getBlock('latest')).timestamp + 86400;

      const newOffering = await PropertyOffering.deploy(
        token.target,
        owner.address,
        pricePerToken,
        goal,
        deadline
      );
      await newOffering.waitForDeployment();

      expect(await newOffering.seller()).to.equal(owner.address);
      expect(await newOffering.token()).to.equal(token.target);
      expect(await newOffering.pricePerToken()).to.equal(pricePerToken);
      expect(await newOffering.goal()).to.equal(goal);
      expect(await newOffering.deadline()).to.equal(deadline);
    });

    it("Should fail if the deadline is in the past", async function () {
      const pricePerToken = ethers.parseEther("0.1");
      const goal = ethers.parseEther("10");
      const pastDeadline = (await ethers.provider.getBlock('latest')).timestamp - 3600;

      await expect(PropertyOffering.deploy(
        token.target,
        owner.address,
        pricePerToken,
        goal,
        pastDeadline
      )).to.be.revertedWith("Deadline must be in the future");
    });
  });

  describe("buy", function () {
    it("Should allow users to buy tokens", async function () {
      const amountToBuy = ethers.parseEther("10");
      const cost = await propertyOffering.pricePerToken() * amountToBuy / ethers.parseEther("1");

      await expect(addr1.sendTransaction({ to: propertyOffering.target, value: cost, data: propertyOffering.interface.encodeFunctionData("buy", [amountToBuy]) }))
        .to.emit(propertyOffering, "TokensPurchased")
        .withArgs(addr1.address, amountToBuy, cost);

      expect(await token.balanceOf(addr1.address)).to.equal(amountToBuy);
      expect(await propertyOffering.contributions(addr1.address)).to.equal(cost);
      expect(await propertyOffering.totalRaised()).to.equal(cost);
    });

    it("Should revert if deadline has passed", async function () {
      await network.provider.send("evm_increaseTime", [86401]);
      await network.provider.send("evm_mine");

      const amountToBuy = ethers.parseEther("10");
      const cost = await propertyOffering.pricePerToken() * amountToBuy / ethers.parseEther("1");

      await expect(addr1.sendTransaction({ to: propertyOffering.target, value: cost, data: propertyOffering.interface.encodeFunctionData("buy", [amountToBuy]) }))
        .to.be.revertedWithCustomError(propertyOffering, "OfferingFinished");
    });
  });

  describe("withdrawProceeds", function () {
    it("Should allow seller to withdraw if goal is reached", async function () {
        const amountToBuy = ethers.parseEther("100");
        const cost = await propertyOffering.pricePerToken() * amountToBuy / ethers.parseEther("1");
        await addr1.sendTransaction({ to: propertyOffering.target, value: cost, data: propertyOffering.interface.encodeFunctionData("buy", [amountToBuy]) });

        await network.provider.send("evm_increaseTime", [86401]);
        await network.provider.send("evm_mine");

        await expect(propertyOffering.connect(owner).withdrawProceeds())
            .to.emit(propertyOffering, "ProceedsWithdrawn");
    });

    it("Should revert if goal is not reached", async function () {
        const amountToBuy = ethers.parseEther("10");
        const cost = await propertyOffering.pricePerToken() * amountToBuy / ethers.parseEther("1");
        await addr1.sendTransaction({ to: propertyOffering.target, value: cost, data: propertyOffering.interface.encodeFunctionData("buy", [amountToBuy]) });

        await network.provider.send("evm_increaseTime", [86401]);
        await network.provider.send("evm_mine");

        await expect(propertyOffering.connect(owner).withdrawProceeds())
            .to.be.revertedWithCustomError(propertyOffering, "GoalNotReached");
    });
  });

  describe("claimRefund", function () {
    it("Should allow investors to claim refund if goal is not reached", async function () {
        const amountToBuy = ethers.parseEther("10");
        const cost = await propertyOffering.pricePerToken() * amountToBuy / ethers.parseEther("1");
        await addr1.sendTransaction({ to: propertyOffering.target, value: cost, data: propertyOffering.interface.encodeFunctionData("buy", [amountToBuy]) });

        await network.provider.send("evm_increaseTime", [86401]);
        await network.provider.send("evm_mine");

        await expect(propertyOffering.connect(addr1).claimRefund())
            .to.changeEtherBalance(addr1, cost);
    });

     it("Should revert if goal is reached", async function () {
        const amountToBuy = ethers.parseEther("100");
        const cost = await propertyOffering.pricePerToken() * amountToBuy / ethers.parseEther("1");
        await addr1.sendTransaction({ to: propertyOffering.target, value: cost, data: propertyOffering.interface.encodeFunctionData("buy", [amountToBuy]) });

        await network.provider.send("evm_increaseTime", [86401]);
        await network.provider.send("evm_mine");

        await expect(propertyOffering.connect(addr1).claimRefund())
            .to.be.revertedWithCustomError(propertyOffering, "GoalReached");
    });
  });
});
