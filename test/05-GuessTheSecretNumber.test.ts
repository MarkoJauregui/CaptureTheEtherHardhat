import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
const { utils } = ethers;

describe('GuessTheSecretNumberChallenge', () => {
  let target: Contract;
  let deployer: SignerWithAddress;
  let attacker: SignerWithAddress;

  before(async () => {
    [attacker, deployer] = await ethers.getSigners();

    target = await (
      await ethers.getContractFactory('GuessTheSecretNumberChallenge', deployer)
    ).deploy({
      value: utils.parseEther('1'),
    });

    await target.deployed();

    target = target.connect(attacker);
  });

  it('exploit', async () => {
    let secretNumber;
    const answerHash = '0xdb81b4d58595fbbbb592d3661a34cdca14d7ab379441400cbfa1b78bc447c365';

    for (let i = 0; i < 256; i++) {
      const hexNumber = ethers.utils.hexlify(i);

      const hash = ethers.utils.keccak256(hexNumber);

      if (hash == answerHash) {
        secretNumber = i;
        break;
      }
    }

    await target.guess(secretNumber, { value: utils.parseEther('1') });
    expect(await target.isComplete()).to.equal(true);
  });
});
