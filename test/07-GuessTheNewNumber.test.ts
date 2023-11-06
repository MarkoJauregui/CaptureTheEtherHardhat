import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Contract, Signer } from 'ethers';

const { utils } = ethers;

describe('GuessTheNewNumberChallenge', function () {
  let challenge: Contract;
  let attack: Contract;
  let attacker: Signer;

  before(async function () {
    [attacker] = await ethers.getSigners();

    // We assume the type of the deployed contracts matches the type of the factory,
    // so we typecast it after deployment.
    const ChallengeFactory = await ethers.getContractFactory(
      'GuessTheNewNumberChallenge',
      attacker
    );
    challenge = (await ChallengeFactory.deploy({ value: utils.parseEther('1') })) as Contract;
    await challenge.deployed();

    const AttackFactory = await ethers.getContractFactory('GuessTheNewNumberAttack', attacker);
    attack = (await AttackFactory.deploy(challenge.address, {
      value: utils.parseEther('1'),
    })) as Contract;
    await attack.deployed();
  });

  it('exploits the GuessTheNewNumberChallenge', async function () {
    // The attack is expected to be called with 1 ether
    const tx = await attack.attack({ value: utils.parseEther('1') });
    await tx.wait();

    // The challenge contract should have a balance of 0 if the attack was successful
    const challengeBalance = await ethers.provider.getBalance(challenge.address);
    expect(challengeBalance.toString()).to.equal('0');

    // If there is an "isComplete" function, we check if the challenge was completed.
    // Here, we assume that "isComplete" exists and returns a boolean.
    if ('isComplete' in challenge) {
      const isComplete = await challenge.isComplete();
      expect(isComplete).to.be.true;
    } else {
      console.warn(
        "The challenge contract does not have an 'isComplete' function to check if it's solved."
      );
    }
  });
});
