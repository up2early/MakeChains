const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MakeChains", function () {
  it("Both players should be in game.", async function () {
    const MakeChains = await ethers.getContractFactory("MakeChains");
    const makeChains = await MakeChains.deploy();
    await makeChains.deployed();

    const startGameTx = await makeChains.startGame("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "Test Game");
    await startGameTx.wait();

    expect(await makeChains.getPlayer1("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")).to.equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    expect(await makeChains.getPlayer1("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")).to.equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  });
  it("The game description should be saved and both players hsould reference the same description.", async function () {
    const MakeChains = await ethers.getContractFactory("MakeChains");
    const makeChains = await MakeChains.deploy();
    await makeChains.deployed();

    const startGameTx = await makeChains.startGame("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "Test Game");
    await startGameTx.wait();
    // Check that the description right and check that that each player references the same description
    expect(await makeChains.getGameDescription("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")).to.equal("Test Game");
    expect(await makeChains.getGameDescription("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")).to.equal(await makeChains.getGameDescription("0x70997970C51812dc3A010C7d01b50e0d17dc79C8"));

  });
  it("Players should be able to call takeTurn to change board state", async function () {
    // Setup 2 player accounts
    const signer1 = await ethers.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    const signer2 = await ethers.getSigner("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");

    // Deploy MakeChains
    const MakeChains = await ethers.getContractFactory("MakeChains");
    const makeChains = await MakeChains.deploy();
    await makeChains.deployed();

    // Start the game
    const startGameTx = await makeChains.connect(signer1).startGame(signer1.address, signer2.address, "Test game");
    await startGameTx.wait();

    // Record the board state before any turns to compare later
    const boardTurn0 = await makeChains.hashboard(signer1.address);

    // Player 1 takes a turn and the board state is recorded
    const turn1Tx = await makeChains.connect(signer1).takeTurn(1, 1);
    await turn1Tx.wait();
    const boardTurn1 = await makeChains.hashboard(signer1.address);

    // Check that the board state changed
    expect(boardTurn1).to.not.equal(boardTurn0);

    // Player 2 takes a turn and the board state is recorded
    const turn2Tx = await makeChains.connect(signer2).takeTurn(2, 2);
    await turn2Tx.wait();
    const boardTurn2 = await makeChains.hashboard(signer2.address);

    // Check that the board state changed
    expect(boardTurn2).to.not.equal(boardTurn1);
  });
  it("Players should not be able to play twice in a row", async function () {
    // Setup 2 player accounts
    const signer1 = await ethers.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    const signer2 = await ethers.getSigner("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");

    // Deploy MakeChains
    const MakeChains = await ethers.getContractFactory("MakeChains");
    const makeChains = await MakeChains.deploy();
    await makeChains.deployed();

    // Start the game
    const startGameTx = await makeChains.connect(signer1).startGame(signer1.address, signer2.address, "Test game");
    await startGameTx.wait();

    // Player 1 takes a turn
    const turn1Tx = await makeChains.connect(signer1).takeTurn(1, 1);
    await turn1Tx.wait();

    // Player 1 tries to go twice in a row
    await expect(makeChains.connect(signer1).takeTurn(2, 2)).to.be.revertedWith("Not your turn!");
  });
  it("Players should not be able to play in the same spot", async function () {
    // Setup 2 player accounts
    const signer1 = await ethers.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    const signer2 = await ethers.getSigner("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");

    // Deploy MakeChains
    const MakeChains = await ethers.getContractFactory("MakeChains");
    const makeChains = await MakeChains.deploy();
    await makeChains.deployed();

    // Start the game
    const startGameTx = await makeChains.connect(signer1).startGame(signer1.address, signer2.address, "Test game");
    await startGameTx.wait();

    // Player 1 takes a turn
    const turn1Tx = await makeChains.connect(signer1).takeTurn(1, 1);
    await turn1Tx.wait();

    // Player 2 tries to play in the same spot
    await expect(makeChains.connect(signer2).takeTurn(1, 1)).to.be.revertedWith("Spot already taken");
  });
  it("Playing 3 in a row should win the game", async function () {
    // Setup 2 player accounts
    const signer1 = await ethers.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    const signer2 = await ethers.getSigner("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");

    // Deploy MakeChains
    const MakeChains = await ethers.getContractFactory("MakeChains");
    const makeChains = await MakeChains.deploy();
    await makeChains.deployed();

    // Start the game
    const startGameTx = await makeChains.connect(signer1).startGame(signer1.address, signer2.address, "Test game");
    await startGameTx.wait();

    // Players take turns playing
    const turn1Tx = await makeChains.connect(signer1).takeTurn(2, 2);
    await turn1Tx.wait();

    const turn2Tx = await makeChains.connect(signer2).takeTurn(1, 1);
    await turn2Tx.wait();

    const turn3Tx = await makeChains.connect(signer1).takeTurn(0, 2);
    await turn3Tx.wait();

    const turn4Tx = await makeChains.connect(signer2).takeTurn(0, 0);
    await turn4Tx.wait();

    const turn5Tx = await makeChains.connect(signer1).takeTurn(1, 2);
    await turn5Tx.wait();

    await expect(makeChains.connect(signer2).takeTurn(2, 1)).to.be.revertedWith("Not your turn!");
  });
  it("Playing 3 in a column should win the game", async function () {
    // Setup 2 player accounts
    const signer1 = await ethers.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    const signer2 = await ethers.getSigner("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");

    // Deploy MakeChains
    const MakeChains = await ethers.getContractFactory("MakeChains");
    const makeChains = await MakeChains.deploy();
    await makeChains.deployed();

    // Start the game
    const startGameTx = await makeChains.connect(signer1).startGame(signer1.address, signer2.address, "Test game");
    await startGameTx.wait();

    // Players take turns playing
    const turn1Tx = await makeChains.connect(signer1).takeTurn(2, 2);
    await turn1Tx.wait();

    const turn2Tx = await makeChains.connect(signer2).takeTurn(1, 1);
    await turn2Tx.wait();

    const turn3Tx = await makeChains.connect(signer1).takeTurn(2, 0);
    await turn3Tx.wait();

    const turn4Tx = await makeChains.connect(signer2).takeTurn(0, 0);
    await turn4Tx.wait();

    const turn5Tx = await makeChains.connect(signer1).takeTurn(2, 1);
    await turn5Tx.wait();

    await expect(makeChains.connect(signer2).takeTurn(1, 2)).to.be.revertedWith("Not your turn!");
  });
  it("Playing 3 in a diagonal down should end the game", async function () {
    // Setup 2 player accounts
    const signer1 = await ethers.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    const signer2 = await ethers.getSigner("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");

    // Deploy MakeChains
    const MakeChains = await ethers.getContractFactory("MakeChains");
    const makeChains = await MakeChains.deploy();
    await makeChains.deployed();

    // Start the game
    const startGameTx = await makeChains.connect(signer1).startGame(signer1.address, signer2.address, "Test game");
    await startGameTx.wait();

    // Players take turns playing
    const turn1Tx = await makeChains.connect(signer1).takeTurn(2, 2);
    await turn1Tx.wait();

    const turn2Tx = await makeChains.connect(signer2).takeTurn(0, 2);
    await turn2Tx.wait();

    const turn3Tx = await makeChains.connect(signer1).takeTurn(1, 1);
    await turn3Tx.wait();

    const turn4Tx = await makeChains.connect(signer2).takeTurn(0, 1);
    await turn4Tx.wait();

    const turn5Tx = await makeChains.connect(signer1).takeTurn(0, 0);
    await turn5Tx.wait();

    await expect(makeChains.connect(signer2).takeTurn(2, 1)).to.be.revertedWith("Not your turn!");
  });
  it("Playing 3 in a diagonal up should end the game", async function () {
    // Setup 2 player accounts
    const signer1 = await ethers.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    const signer2 = await ethers.getSigner("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");

    // Deploy MakeChains
    const MakeChains = await ethers.getContractFactory("MakeChains");
    const makeChains = await MakeChains.deploy();
    await makeChains.deployed();

    // Start the game
    const startGameTx = await makeChains.connect(signer1).startGame(signer1.address, signer2.address, "Test game");
    await startGameTx.wait();

    // Players take turns playing
    const turn1Tx = await makeChains.connect(signer1).takeTurn(0, 2);
    await turn1Tx.wait();

    const turn2Tx = await makeChains.connect(signer2).takeTurn(0, 0);
    await turn2Tx.wait();

    const turn3Tx = await makeChains.connect(signer1).takeTurn(1, 1);
    await turn3Tx.wait();

    const turn4Tx = await makeChains.connect(signer2).takeTurn(0, 1);
    await turn4Tx.wait();

    const turn5Tx = await makeChains.connect(signer1).takeTurn(2, 0);
    await turn5Tx.wait();

    await expect(makeChains.connect(signer2).takeTurn(2, 1)).to.be.revertedWith("Not your turn!");
  });
});
