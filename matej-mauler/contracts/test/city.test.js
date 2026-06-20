const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const RAGU = (n) => ethers.parseEther(n.toString());

describe("Spaghetti City", function () {
  let owner, relayer, alice, bob;
  let citizen, pasta, city;
  let cityAddr;

  beforeEach(async () => {
    [owner, relayer, alice, bob] = await ethers.getSigners();

    citizen = await (await ethers.getContractFactory("CitizenID")).deploy(owner.address);
    pasta = await (await ethers.getContractFactory("PastaToken")).deploy(owner.address);
    city = await (await ethers.getContractFactory("City")).deploy(
      owner.address,
      await citizen.getAddress(),
      await pasta.getAddress()
    );
    cityAddr = await city.getAddress();

    // Wiring: relayer mints IDs + airdrops RAGU (sponsored onboarding); City mints harvest yield.
    await citizen.setMinter(relayer.address);
    await pasta.setMinter(relayer.address, true);
    await pasta.setMinter(cityAddr, true);
  });

  async function onboard(user, handle) {
    await citizen.connect(relayer).mint(user.address, handle);
    await pasta.connect(relayer).mint(user.address, RAGU(1000));
    await pasta.connect(user).approve(cityAddr, ethers.MaxUint256);
  }

  describe("CitizenID (soulbound)", () => {
    it("mints one citizenship per address via the minter", async () => {
      await citizen.connect(relayer).mint(alice.address, "alice");
      expect(await citizen.idOf(alice.address)).to.equal(1n);
      expect(await citizen.isCitizen(alice.address)).to.equal(true);
      expect(await citizen.handleOf(1)).to.equal("alice");
    });

    it("rejects a second citizenship for the same address", async () => {
      await citizen.connect(relayer).mint(alice.address, "alice");
      await expect(citizen.connect(relayer).mint(alice.address, "again")).to.be.revertedWithCustomError(
        citizen,
        "AlreadyCitizen"
      );
    });

    it("rejects minting from a non-minter", async () => {
      await expect(citizen.connect(bob).mint(bob.address, "bob")).to.be.revertedWithCustomError(
        citizen,
        "NotMinter"
      );
    });

    it("is non-transferable (soulbound)", async () => {
      await citizen.connect(relayer).mint(alice.address, "alice");
      await expect(
        citizen.connect(alice).transferFrom(alice.address, bob.address, 1)
      ).to.be.revertedWithCustomError(citizen, "Soulbound");
    });
  });

  describe("PastaToken ($RAGU)", () => {
    it("only minters can mint", async () => {
      await expect(pasta.connect(alice).mint(alice.address, RAGU(1))).to.be.revertedWithCustomError(
        pasta,
        "NotMinter"
      );
      await pasta.connect(relayer).mint(alice.address, RAGU(5));
      expect(await pasta.balanceOf(alice.address)).to.equal(RAGU(5));
    });

    it("is burnable", async () => {
      await pasta.connect(relayer).mint(alice.address, RAGU(5));
      await pasta.connect(alice).burn(RAGU(2));
      expect(await pasta.balanceOf(alice.address)).to.equal(RAGU(3));
    });
  });

  describe("City economy", () => {
    it("gates the economy behind citizenship", async () => {
      await pasta.connect(relayer).mint(alice.address, RAGU(1000));
      await pasta.connect(alice).approve(cityAddr, ethers.MaxUint256);
      await expect(city.connect(alice).claim(5)).to.be.revertedWithCustomError(city, "NotCitizen");
    });

    it("claims a parcel by burning RAGU", async () => {
      await onboard(alice, "alice");
      await city.connect(alice).claim(5);
      expect(await city.ownerOf(5)).to.equal(alice.address);
      expect(await pasta.balanceOf(alice.address)).to.equal(RAGU(900)); // 1000 - 100 claim
    });

    it("rejects out-of-bounds parcels", async () => {
      await onboard(alice, "alice");
      await expect(city.connect(alice).claim(256)).to.be.revertedWithCustomError(city, "OutOfBounds");
    });

    it("builds and accrues harvestable yield over time", async () => {
      await onboard(alice, "alice");
      await city.connect(alice).claim(5);
      await city.connect(alice).build(5, 1); // -50 RAGU -> 850
      expect(await pasta.balanceOf(alice.address)).to.equal(RAGU(850));

      await time.increase(1000); // 1000s * 0.001 RAGU/s * level 1 = ~1 RAGU
      expect(await city.pending(5)).to.be.greaterThan(0n);

      const before = await pasta.balanceOf(alice.address);
      await city.connect(alice).harvest(5);
      expect(await pasta.balanceOf(alice.address)).to.be.greaterThan(before);
    });

    it("upgrades a building up to the max level", async () => {
      await onboard(alice, "alice");
      await city.connect(alice).claim(5);
      for (let i = 0; i < 5; i++) await city.connect(alice).build(5, 1);
      const p = await city.parcels(5);
      expect(p.level).to.equal(5);
      await expect(city.connect(alice).build(5, 1)).to.be.revertedWithCustomError(city, "MaxLevelReached");
    });

    it("rejects building you do not own", async () => {
      await onboard(alice, "alice");
      await onboard(bob, "bob");
      await city.connect(alice).claim(5);
      await expect(city.connect(bob).build(5, 1)).to.be.revertedWithCustomError(city, "NotParcelOwner");
    });
  });

  describe("Parcel market", () => {
    it("lists and sells a parcel in RAGU", async () => {
      await onboard(alice, "alice");
      await onboard(bob, "bob");
      await city.connect(alice).claim(7);
      await city.connect(alice).list(7, RAGU(200));

      await city.connect(bob).buy(7);
      expect(await city.ownerOf(7)).to.equal(bob.address);
      expect(await city.salePrice(7)).to.equal(0n); // listing cleared on transfer
    });

    it("rejects buying an unlisted parcel", async () => {
      await onboard(alice, "alice");
      await onboard(bob, "bob");
      await city.connect(alice).claim(7);
      await expect(city.connect(bob).buy(7)).to.be.revertedWithCustomError(city, "NotForSale");
    });
  });
});
