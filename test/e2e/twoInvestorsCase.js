const { expect } = require('chai');
const { deployAccount, deployTokenRoot, deployTokenWallet, mintTokens } = require(process.cwd() + '/test/utils');


let LaunchPoolFactory;
let LaunchPool;
let LaunchPoolParticipation;
let launchPoolFactory;
let launchPool;
let launchPoolStartTime;
let launchPoolEndTime;
let vestingPeriods;
let launchPoolParticipation1;
let launchPoolParticipation2;
let account1;
let account2;
let account3;
let account4;
let tokenRoot;
let wallet1;
let wallet2;
let wallet3;
let wallet4;
let launchPoolWallet;
const supplyAmount = 50;
const investment1_1 = locklift.utils.convertCrystal(5, 'nano');
const investment1_2 = locklift.utils.convertCrystal(2, 'nano');
const investment2_1 = locklift.utils.convertCrystal(10, 'nano');

describe('twoInvestorsCase', async function() {
  describe('twoInvestorsCase', async function() {
    before(async function() {
      this.timeout(20000);
      account1 = await deployAccount();
      account2 = await deployAccount();
      account3 = await deployAccount();
      account4 = await deployAccount();
      tokenRoot = await deployTokenRoot({ owner: account1.address });
      wallet1 = await deployTokenWallet({ rootOwner: account1, tokenRoot, walletOwner: account1.address });
      wallet2 = await deployTokenWallet({ rootOwner: account1, tokenRoot, walletOwner: account2.address });
      wallet3 = await deployTokenWallet({ rootOwner: account1, tokenRoot, walletOwner: account3.address });
      wallet4 = await deployTokenWallet({ rootOwner: account1, tokenRoot, walletOwner: account4.address });
      await mintTokens({
        rootOwner: account1,
        tokenRoot,
        recipient: account1.address,
        amount: locklift.utils.convertCrystal(10000, 'nano')
      });
      await mintTokens({
        rootOwner: account1,
        tokenRoot,
        recipient: account2.address,
        amount: locklift.utils.convertCrystal(10000, 'nano')
      });
      await mintTokens({
        rootOwner: account1,
        tokenRoot,
        recipient: account3.address,
        amount: locklift.utils.convertCrystal(10000, 'nano')
      });
      await mintTokens({
        rootOwner: account1,
        tokenRoot,
        recipient: account4.address,
        amount: locklift.utils.convertCrystal(10000, 'nano')
      });
    });

    after('info', async function () {
      console.log('account1: ', account1.address, (await locklift.ton.getBalance(account1.address)).toNumber() / 10**9 + " EVER");
      console.log('account2: ', account2.address, (await locklift.ton.getBalance(account2.address)).toNumber() / 10**9 + " EVER");
      console.log('account3: ', account3.address, (await locklift.ton.getBalance(account3.address)).toNumber() / 10**9 + " EVER");
      console.log('account4: ', account4.address, (await locklift.ton.getBalance(account4.address)).toNumber() / 10**9 + " EVER");
      console.log('wallet1: ',  wallet1.address,
                                (await locklift.ton.getBalance(wallet1.address)).toNumber() / 10**9 + " EVER,",
                                (await wallet1.call({ method: 'balance', params: {}})) + " FOO"
      );
      console.log('wallet2: ',  wallet2.address,
                                (await locklift.ton.getBalance(wallet2.address)).toNumber() / 10**9 + " EVER,",
                                (await wallet2.call({ method: 'balance', params: {}})) + " FOO"
      );
      console.log('wallet3: ',  wallet3.address,
                                (await locklift.ton.getBalance(wallet3.address)).toNumber() / 10**9 + " EVER,",
                                (await wallet3.call({ method: 'balance', params: {}})) + " FOO"
      );
      console.log('wallet4: ',  wallet4.address,
                                (await locklift.ton.getBalance(wallet4.address)).toNumber() / 10**9 + " EVER,",
                                (await wallet4.call({ method: 'balance', params: {}})) + " FOO"
      );
      console.log('launchPoolFactory: ', launchPoolFactory.address, (await locklift.ton.getBalance(launchPoolFactory.address)).toNumber() / 10**9 + " EVER");
      console.log('launchPool: ', launchPool.address, (await locklift.ton.getBalance(launchPool.address)).toNumber() / 10**9 + " EVER");
      console.log('launchPoolWallet: ', launchPoolWallet.address, 
                                        (await locklift.ton.getBalance(launchPoolWallet.address)).toNumber() / 10**9 + " EVER,",
                                        (await launchPoolWallet.call({ method: 'balance', params: {}})) + " FOO"
      );
      console.log('launchPoolParticipation1: ', launchPoolParticipation1.address, (await locklift.ton.getBalance(launchPoolParticipation1.address)).toNumber() / 10**9 + " EVER");
      console.log('launchPoolParticipation2: ', launchPoolParticipation2.address, (await locklift.ton.getBalance(launchPoolParticipation2.address)).toNumber() / 10**9 + " EVER");
    })

    it('Load LaunchPoolFactory', async function() {
      LaunchPoolFactory = await locklift.factory.getContract('LaunchPoolFactory');
      
      expect(LaunchPoolFactory.code).not.to.equal(undefined, 'Code should be available');
      expect(LaunchPoolFactory.abi).not.to.equal(undefined, 'ABI should be available');
    });
    it('Load LaunchPool', async function() {
      LaunchPool = await locklift.factory.getContract('LaunchPool');
      
      expect(LaunchPool.code).not.to.equal(undefined, 'Code should be available');
      expect(LaunchPool.abi).not.to.equal(undefined, 'ABI should be available');
    });
    it('Load LaunchPoolParticipation', async function() {
      LaunchPoolParticipation = await locklift.factory.getContract('LaunchPoolParticipation');
      
      expect(LaunchPoolParticipation.code).not.to.equal(undefined, 'Code should be available');
      expect(LaunchPoolParticipation.abi).not.to.equal(undefined, 'ABI should be available');
    });
    
    it('Deploy LaunchPoolFactory', async function() {
      this.timeout(20000);

      const [keyPair] = await locklift.keys.getKeyPairs();
      
      launchPoolFactory = await locklift.giver.deployContract({
        contract: LaunchPoolFactory,
        constructorParams: {
          _owner: account1.address,
          _sendGasTo: account1.address,
        },
        initParams: {
          deploySeed: locklift.utils.getRandomNonce(),
          launchPoolParticipationCode: LaunchPoolParticipation.code,
          launchPoolCode: LaunchPool.code,
        },
        keyPair,
      }, locklift.utils.convertCrystal(2, 'nano'));
  
      expect(launchPoolFactory.address).to.be.a('string')
        .and.satisfy(s => s.startsWith('0:'), 'Bad future address');
    });
    
    it('Deploy LaunchPool', async function() {
      this.timeout(20000);

      const [keyPair] = await locklift.keys.getKeyPairs();

      launchPoolStartTime = Math.floor(Date.now() / 1000);
      launchPoolEndTime = launchPoolStartTime + 20;
      vestingPeriods = [
        { unfreezeTime: launchPoolEndTime, percent: 3000 },
        { unfreezeTime: launchPoolEndTime + 5, percent: 2000 },
        { unfreezeTime: launchPoolEndTime + 10, percent: 1500 },
        { unfreezeTime: launchPoolEndTime + 15, percent: 3500 },
      ];
      
      await account1.runTarget({
        contract: launchPoolFactory,
        method: 'deployLaunchPool',
        params: {
          _poolOwner: account2.address,
          _launchTokenRoot: tokenRoot.address,
          _startTime: launchPoolStartTime,
          _endTime: launchPoolEndTime,
          _vestingPeriods: vestingPeriods,
          _softCap: locklift.utils.convertCrystal(3, 'nano'),
          _hardCap: locklift.utils.convertCrystal(10, 'nano'),
          _sendGasTo: account1.address,
          _additionalProjectInfo: { 
            projectName: 'projectName',
            projectDescription: 'projectDescription',
            projectImageUrl: 'projectImageUrl',
            projectLandingUrl: 'projectLandingUrl',
            projectSocialLinks: [{name: 'link1', link: 'projectSocialLinks'}],
          }
        },
        keyPair,
        value: locklift.utils.convertCrystal(10, 'nano'),
      });

      const launchPoolAddress = await launchPoolFactory.call({
        method: 'getLaunchPoolAddress',
        params: {
          poolNumber: 0,
        }
      });
      launchPool = await locklift.factory.getContract('LaunchPool');
      launchPool.setAddress(launchPoolAddress);
      expect(launchPool.address).to.be.a('string')
        .and.satisfy(s => s.startsWith('0:'), 'Bad future launchPool address');

      const launchPoolDetails = await launchPool.call({
        method: 'getDetails',
        params: {}
      });
      launchPoolWallet = await locklift.factory.getAccount('TokenWallet', 'scripts/builds');
      launchPoolWallet.setAddress(launchPoolDetails.tokenWallet);
      expect(launchPoolWallet.address).to.be.a('string')
        .and.satisfy(s => s.startsWith('0:'), 'Bad future launchPoolWallet address');
    });

    it('Transfer to launchPoll from owner', async function() {
      this.timeout(20000);
      const [keyPair] = await locklift.keys.getKeyPairs();

      let launchPoolDetails = await launchPool.call({
        method: 'getDetails',
        params: {}
      });
      const wallet2BalanceBefore = await wallet2.call({ method: 'balance', params: {}});
      const launchPoolWalletBalanceBefore = await launchPoolWallet.call({ method: 'balance', params: {}});
      expect(launchPoolWalletBalanceBefore.toNumber()).to.eq(0);
  
      await account2.runTarget({
        contract: wallet2,
        method: 'transfer',
        params: {
          amount: supplyAmount,
          recipient: launchPool.address,
          deployWalletValue: 0,
          remainingGasTo: account2.address,
          notify: true,
          payload: ''
        },
        keyPair,
        value: locklift.utils.convertCrystal(2, 'nano'),
      });

      launchPoolDetails = await launchPool.call({
        method: 'getDetails',
        params: {}
      });

      const launchPoolWalletBalanceAfter = await launchPoolWallet.call({ method: 'balance', params: {}});
      expect(launchPoolWalletBalanceAfter.toNumber()).to.eq(supplyAmount);
      const wallet2BalanceAfter = await wallet2.call({ method: 'balance', params: {}});
      expect(wallet2BalanceBefore - wallet2BalanceAfter).to.eq(supplyAmount);
    });

    it('Deploy LaunchPoolParticipation (first investment)', async function() {
      this.timeout(20000);

      const [keyPair] = await locklift.keys.getKeyPairs();

      // console.log(`launchPoolDetails::`, await launchPool.call({ method: 'getDetails', params: {}}));
      // console.log('launchPool: ', launchPool.address, (await locklift.ton.getBalance(launchPool.address)).toNumber() / 10**9 + " EVER");

      await account3.run({
        method: 'sendTransaction',
        params: {
          dest: launchPool.address,
          value: investment1_1,
          bounce: true,
          flags: 0,
          payload: '',
        },
        keyPair,
      });

      const launchPoolParticipationAddress = await launchPool.call({
        method: 'getLaunchPoolParticipationAddress',
        params: {
          _user: account3.address,
        }
      });
      launchPoolParticipation1 = await locklift.factory.getContract('LaunchPoolParticipation');
      launchPoolParticipation1.setAddress(launchPoolParticipationAddress);
      // console.log(`\nlaunchPoolParticipationAddress:1:`, launchPoolParticipationAddress);

      // console.log(`launchPoolDetails:2:`, await launchPool.call({ method: 'getDetails', params: {}}));
      // console.log('launchPool: ', launchPool.address, (await locklift.ton.getBalance(launchPool.address)).toNumber() / 10**9 + " EVER");

      await account3.run({
        method: 'sendTransaction',
        params: {
          dest: launchPool.address,
          value: investment1_2,
          bounce: true,
          flags: 0,
          payload: '',
        },
        keyPair,
      });

      // console.log(`launchPoolDetails:3:`, await launchPool.call({ method: 'getDetails', params: {}}));
      // console.log('launchPool: ', launchPool.address, (await locklift.ton.getBalance(launchPool.address)).toNumber() / 10**9 + " EVER");
    });

    it('Deploy LaunchPoolParticipation (second investment)', async function() {
      this.timeout(20000);

      const [keyPair] = await locklift.keys.getKeyPairs();

      await account4.run({
        method: 'sendTransaction',
        params: {
          dest: launchPool.address,
          value: investment2_1,
          bounce: true,
          flags: 0,
          payload: '',
        },
        keyPair,
      });

      const launchPoolParticipationAddress = await launchPool.call({
        method: 'getLaunchPoolParticipationAddress',
        params: {
          _user: account4.address,
        }
      });
      launchPoolParticipation2 = await locklift.factory.getContract('LaunchPoolParticipation');
      launchPoolParticipation2.setAddress(launchPoolParticipationAddress);
      // console.log(`\nlaunchPoolParticipationAddress:2:`, launchPoolParticipationAddress);
    });
    
    it('Get launchPoolParticipation details', async function() {
      this.timeout(20000);

      // console.log(`\nlaunchPoolDetails:4:`, await launchPool.call({ method: 'getDetails', params: {}}));
      // console.log('launchPool: ', launchPool.address, (await locklift.ton.getBalance(launchPool.address)).toNumber() / 10**9 + " EVER");

      // 1
      const launchPoolParticipationDetails1 = await launchPoolParticipation1.call({
        method: 'getDetails',
        params: {}
      });
      expect(launchPoolParticipationDetails1.launchPool).to.equal(launchPool.address);
      expect(launchPoolParticipationDetails1.user).to.equal(account3.address);
      expect(launchPoolParticipationDetails1.depositAmount.toNumber())
        .to.gt(Number(locklift.utils.convertCrystal(3, 'nano')))
        .and.lt(Number(locklift.utils.convertCrystal(4, 'nano')));
      // console.log(`launchPoolParticipationDetails1::`, launchPoolParticipationDetails1);

      // 2
      const launchPoolParticipationDetails2 = await launchPoolParticipation2.call({
        method: 'getDetails',
        params: {}
      });
      expect(launchPoolParticipationDetails2.launchPool).to.equal(launchPool.address);
      expect(launchPoolParticipationDetails2.user).to.equal(account4.address);
      expect(launchPoolParticipationDetails2.depositAmount.toNumber())
        .to.gt(Number(locklift.utils.convertCrystal(8, 'nano')))
        .and.lt(Number(locklift.utils.convertCrystal(9, 'nano')));
      // console.log(`launchPoolParticipationDetails2::`, launchPoolParticipationDetails2);

      // all
      const launchPoolDetails = await launchPool.call({
        method: 'getDetails',
        params: {}
      });
      expect(
        launchPoolParticipationDetails1.depositAmount.toNumber() +
        launchPoolParticipationDetails2.depositAmount.toNumber()
      ).to.eq(launchPoolDetails.totalRaised.toNumber());
    });

    it('Finish of fundraising', async function() {
      this.timeout(120000);

      const [keyPair] = await locklift.keys.getKeyPairs();

      while (Math.round(Date.now() / 1000) <= launchPoolEndTime) {
        // console.log(`awaiting::`, launchPoolEndTime - Math.round(Date.now() / 1000));
        await new Promise((resolve)=>{setTimeout(resolve, 1000)});
      }

      await account2.runTarget({
        contract: launchPool,
        method: 'finishFundraising',
        params: {},
        keyPair,
        value: locklift.utils.convertCrystal(0.3, 'nano'),
      });

      const launchPoolDetails = await launchPool.call({
        method: 'getDetails',
        params: {}
      });
      expect(launchPoolDetails.state.toNumber()).to.equal(4);
    });

    it('Claim reward', async function() {
      this.timeout(30000);

      const [keyPair] = await locklift.keys.getKeyPairs();

      const launchPoolWalletBalanceBefore = await launchPoolWallet.call({ method: 'balance', params: {}});
      const launchPoolDetailsBefore = await await launchPool.call({ method: 'getDetails', params: {}});
      const launchPoolParticipation1DetailsBefore = await await launchPoolParticipation1.call({ method: 'getDetails', params: {}});
      const launchPoolParticipation2DetailsBefore = await await launchPoolParticipation2.call({ method: 'getDetails', params: {}});
      const wallet3BalanceBefore = await wallet3.call({ method: 'balance', params: {}});
      const wallet4BalanceBefore = await wallet4.call({ method: 'balance', params: {}});

      const firstClaimAmounts = vestingPeriods.map(x => 
          x.percent *
          supplyAmount *
          1e-4 *
          launchPoolParticipation1DetailsBefore.depositAmount.toNumber() /
          launchPoolDetailsBefore.totalRaised.toNumber()
      );

      const secondClaimAmounts = vestingPeriods.map(x => 
          x.percent *
          supplyAmount *
          1e-4 *
          launchPoolParticipation2DetailsBefore.depositAmount.toNumber() /
          launchPoolDetailsBefore.totalRaised.toNumber()
      );

      // 1
      await account3.runTarget({
        contract: launchPoolParticipation1,
        method: 'claimReward',
        params: {
          callbackId: 3342
        },
        keyPair,
        value: locklift.utils.convertCrystal(7, 'nano'),
      });

      const launchPoolWalletBalanceAfter1 = await launchPoolWallet.call({ method: 'balance', params: {}});
      const wallet3BalanceAfter1 = await wallet3.call({ method: 'balance', params: {}});
      expect(launchPoolWalletBalanceBefore - launchPoolWalletBalanceAfter1).to.eq(Math.floor(firstClaimAmounts[0]));
      expect(wallet3BalanceAfter1 - wallet3BalanceBefore).to.eq(Math.floor(firstClaimAmounts[0]));

      await account4.runTarget({
        contract: launchPoolParticipation2,
        method: 'claimReward',
        params: {
          callbackId: 3342
        },
        keyPair,
        value: locklift.utils.convertCrystal(7, 'nano'),
      });

      const launchPoolWalletBalanceAfter2 = await launchPoolWallet.call({ method: 'balance', params: {}});
      const wallet4BalanceAfter1 = await wallet4.call({ method: 'balance', params: {}});
      expect(launchPoolWalletBalanceBefore - launchPoolWalletBalanceAfter2).to.eq(Math.floor(firstClaimAmounts[0]) + Math.floor(secondClaimAmounts[0]));
      expect(wallet4BalanceAfter1 - wallet4BalanceBefore).to.eq(Math.floor(secondClaimAmounts[0]));

      // 2
      while (Math.round(Date.now() / 1000) <= vestingPeriods[1].unfreezeTime) {
        await new Promise((resolve)=>{setTimeout(resolve, 1000)});
      }

      await account3.runTarget({
        contract: launchPoolParticipation1,
        method: 'claimReward',
        params: {
          callbackId: 3342
        },
        keyPair,
        value: locklift.utils.convertCrystal(7, 'nano'),
      });

      const launchPoolWalletBalanceAfter3 = await launchPoolWallet.call({ method: 'balance', params: {}});
      const wallet3BalanceAfter2 = await wallet3.call({ method: 'balance', params: {}});
      expect(launchPoolWalletBalanceBefore - launchPoolWalletBalanceAfter3).to.eq(
        Math.floor(firstClaimAmounts[0]) +
        Math.floor(firstClaimAmounts[1]) +
        Math.floor(secondClaimAmounts[0])
      );
      expect(wallet3BalanceAfter2 - wallet3BalanceBefore).to.eq(Math.floor(firstClaimAmounts[0]) + Math.floor(firstClaimAmounts[1]));

      await account4.runTarget({
        contract: launchPoolParticipation2,
        method: 'claimReward',
        params: {
          callbackId: 3342
        },
        keyPair,
        value: locklift.utils.convertCrystal(7, 'nano'),
      });

      const launchPoolWalletBalanceAfter4 = await launchPoolWallet.call({ method: 'balance', params: {}});
      const wallet4BalanceAfter2 = await wallet4.call({ method: 'balance', params: {}});
      expect(launchPoolWalletBalanceBefore - launchPoolWalletBalanceAfter4).to.eq(
        Math.floor(firstClaimAmounts[0]) +
        Math.floor(firstClaimAmounts[1]) +
        Math.floor(secondClaimAmounts[0]) +
        Math.floor(secondClaimAmounts[1])
      );
      expect(wallet4BalanceAfter2 - wallet4BalanceBefore).to.eq(Math.floor(secondClaimAmounts[0]) + Math.floor(secondClaimAmounts[1]));

      // 3
      while (Math.round(Date.now() / 1000) <= vestingPeriods[3].unfreezeTime) {
        await new Promise((resolve)=>{setTimeout(resolve, 1000)});
      }

      await account3.runTarget({
        contract: launchPoolParticipation1,
        method: 'claimReward',
        params: {
          callbackId: 3342
        },
        keyPair,
        value: locklift.utils.convertCrystal(7, 'nano'),
      });

      const launchPoolWalletBalanceAfter5 = await launchPoolWallet.call({ method: 'balance', params: {}});
      const wallet3BalanceAfter3 = await wallet3.call({ method: 'balance', params: {}});
      expect(launchPoolWalletBalanceBefore - launchPoolWalletBalanceAfter5).to.eq(
        Math.floor(firstClaimAmounts[0]) +
        Math.floor(firstClaimAmounts[1]) +
        Math.floor(firstClaimAmounts[2] + firstClaimAmounts[3]) +
        Math.floor(secondClaimAmounts[0]) +
        Math.floor(secondClaimAmounts[1])
      );
      expect(wallet3BalanceAfter3 - wallet3BalanceBefore).to.eq(
        Math.floor(firstClaimAmounts[0]) +
        Math.floor(firstClaimAmounts[1]) +
        Math.floor(firstClaimAmounts[2] + firstClaimAmounts[3])
      );

      await account4.runTarget({
        contract: launchPoolParticipation2,
        method: 'claimReward',
        params: {
          callbackId: 3342
        },
        keyPair,
        value: locklift.utils.convertCrystal(6, 'nano'),
      });

      const launchPoolWalletBalanceAfter6 = await launchPoolWallet.call({ method: 'balance', params: {}});
      const wallet4BalanceAfter3 = await wallet4.call({ method: 'balance', params: {}});
      expect(launchPoolWalletBalanceBefore - launchPoolWalletBalanceAfter6).to.eq(
        Math.floor(firstClaimAmounts[0]) +
        Math.floor(firstClaimAmounts[1]) +
        Math.floor(firstClaimAmounts[2] + firstClaimAmounts[3]) +
        Math.floor(secondClaimAmounts[0]) +
        Math.floor(secondClaimAmounts[1]) +
        Math.floor(secondClaimAmounts[2] + secondClaimAmounts[3])
      );
      expect(wallet4BalanceAfter3 - wallet4BalanceBefore).to.eq(
        Math.floor(secondClaimAmounts[0]) +
        Math.floor(secondClaimAmounts[1]) +
        Math.floor(secondClaimAmounts[2] + secondClaimAmounts[3])
      );

      // not a penny more
      await new Promise((resolve)=>{setTimeout(resolve, 1000)});
      await account3.runTarget({
        contract: launchPoolParticipation1,
        method: 'claimReward',
        params: {
          callbackId: 3342
        },
        keyPair,
        value: locklift.utils.convertCrystal(7, 'nano'),
      });
      await account4.runTarget({
        contract: launchPoolParticipation2,
        method: 'claimReward',
        params: {
          callbackId: 3342
        },
        keyPair,
        value: locklift.utils.convertCrystal(7, 'nano'),
      });

      const launchPoolWalletBalanceAfter7 = await launchPoolWallet.call({ method: 'balance', params: {}});
      const wallet3BalanceAfter4 = await wallet3.call({ method: 'balance', params: {}});
      const wallet4BalanceAfter4 = await wallet4.call({ method: 'balance', params: {}});
      expect(Number(launchPoolWalletBalanceAfter7)).to.eq(Number(launchPoolWalletBalanceAfter6));
      expect(Number(wallet3BalanceAfter4)).to.eq(Number(wallet3BalanceAfter3));
      expect(Number(wallet4BalanceAfter4)).to.eq(Number(wallet4BalanceAfter3));
    });

    it('Withdraw EVERs', async function() {
      this.timeout(20000);

      const [keyPair] = await locklift.keys.getKeyPairs();

      const launchPoolDetails = await launchPool.call({
        method: 'getDetails',
        params: {}
      });

      const amountOfWithdraw = launchPoolDetails.hardCap;

      const launchPoolBalanceBefore = (await locklift.ton.getBalance(launchPool.address)).toNumber();
      const wallet2BalanceBefore = (await locklift.ton.getBalance(wallet2.address)).toNumber();

      await account2.runTarget({
        contract: launchPool,
        method: 'withdrawEVERs',
        params: {
          amount: amountOfWithdraw,
          to: wallet2.address,
        },
        keyPair,
        value: locklift.utils.convertCrystal(0.1, 'nano'),
      });

      const launchPoolBalanceAfter = (await locklift.ton.getBalance(launchPool.address)).toNumber();
      const wallet2BalanceAfter = (await locklift.ton.getBalance(wallet2.address)).toNumber();
      expect(wallet2BalanceAfter - wallet2BalanceBefore).to.gt(Number(amountOfWithdraw));
      expect(launchPoolBalanceBefore - launchPoolBalanceAfter).to.equal(Number(amountOfWithdraw));
    });

    it('Return deposit sulpur', async function() {
      this.timeout(20000);

      const [keyPair] = await locklift.keys.getKeyPairs();

      const launchPoolDetailsBefore = await launchPool.call({ method: 'getDetails', params: {}});
      const launchPoolParticipation1DetailsBefore = await await launchPoolParticipation1.call({ method: 'getDetails', params: {}});
      const launchPoolParticipation2DetailsBefore = await await launchPoolParticipation2.call({ method: 'getDetails', params: {}});

      const firstAmountOfWithdraw = Math.floor(
        launchPoolParticipation1DetailsBefore.depositAmount.toNumber() *
        (launchPoolDetailsBefore.totalRaised.toNumber() - launchPoolDetailsBefore.hardCap.toNumber()) /
        launchPoolDetailsBefore.totalRaised.toNumber()
      );
      const secondAmountOfWithdraw = Math.floor(
        launchPoolParticipation2DetailsBefore.depositAmount.toNumber() *
        (launchPoolDetailsBefore.totalRaised.toNumber() - launchPoolDetailsBefore.hardCap.toNumber()) /
        launchPoolDetailsBefore.totalRaised.toNumber()
      );

      const launchPoolBalanceBefore = (await locklift.ton.getBalance(launchPool.address)).toNumber();
      const account3BalanceBefore = (await locklift.ton.getBalance(account3.address)).toNumber();
      const account4BalanceBefore = (await locklift.ton.getBalance(account4.address)).toNumber();

      await account3.runTarget({
        contract: launchPoolParticipation1,
        method: 'returnDepositSulpur',
        params: {
          callbackId: 3312
        },
        keyPair,
        value: locklift.utils.convertCrystal(1.2, 'nano'),
      });

      const launchPoolBalanceAfter1 = (await locklift.ton.getBalance(launchPool.address)).toNumber();
      const account3BalanceAfter = (await locklift.ton.getBalance(account3.address)).toNumber();

      const launchPoolDetailsAfter1 = await launchPool.call({
        method: 'getDetails',
        params: {}
      });

      expect(account3BalanceAfter - account3BalanceBefore).to.gt(Number(firstAmountOfWithdraw - locklift.utils.convertCrystal(0.5, 'nano'))).and.lt(Number(firstAmountOfWithdraw));
      expect(launchPoolBalanceBefore - launchPoolBalanceAfter1).to.equal(Number(firstAmountOfWithdraw));
      expect(launchPoolDetailsBefore.totalReturned.toNumber()).to.equal(0);
      expect(launchPoolDetailsAfter1.totalReturned.toNumber()).to.equal(Number(firstAmountOfWithdraw));

      await account4.runTarget({
        contract: launchPoolParticipation2,
        method: 'returnDepositSulpur',
        params: {
          callbackId: 3312
        },
        keyPair,
        value: locklift.utils.convertCrystal(1.2, 'nano'),
      });

      const launchPoolBalanceAfter2 = (await locklift.ton.getBalance(launchPool.address)).toNumber();
      const account4BalanceAfter = (await locklift.ton.getBalance(account4.address)).toNumber();

      const launchPoolDetailsAfter2 = await launchPool.call({
        method: 'getDetails',
        params: {}
      });

      expect(account4BalanceAfter - account4BalanceBefore).to.gt(Number(secondAmountOfWithdraw - locklift.utils.convertCrystal(0.5, 'nano'))).and.lt(Number(secondAmountOfWithdraw));
      expect(launchPoolBalanceBefore - launchPoolBalanceAfter2).to.equal(Number(firstAmountOfWithdraw) + Number(secondAmountOfWithdraw));
      expect(launchPoolDetailsBefore.totalReturned.toNumber()).to.equal(0);
      expect(launchPoolDetailsAfter2.totalReturned.toNumber()).to.equal(Number(firstAmountOfWithdraw) + Number(secondAmountOfWithdraw));
    });
  });
});
