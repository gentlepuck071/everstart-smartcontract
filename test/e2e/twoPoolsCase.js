const { expect } = require('chai');
const { deployAccount, deployTokenRoot, deployTokenWallet, mintTokens } = require(process.cwd() + '/test/utils');


let LaunchPoolFactory;
let LaunchPool;
let LaunchPoolParticipation;
let launchPoolFactory;
let launchPool_1;
let launchPool_1_StartTime;
let launchPool_1_EndTime;
let launchPool_1_Wallet;
let launchPool_2;
let launchPool_2_StartTime;
let launchPool_2_EndTime;
let launchPool_2_Wallet;
let launchPool_1_Participation;
let account1;
let account2;
let account3;
let tokenRoot;
let wallet1;
let wallet2;
let wallet3;
const supplyAmount_1 = 50;
const supplyAmount_2 = 30;

describe('twoPoolsCase', async function() {
  describe('twoPoolsCase', async function() {
    before(async function() {
      this.timeout(20000);
      account1 = await deployAccount();
      account2 = await deployAccount();
      account3 = await deployAccount();
      tokenRoot = await deployTokenRoot({ owner: account1.address });
      wallet1 = await deployTokenWallet({ rootOwner: account1, tokenRoot, walletOwner: account1.address });
      wallet2 = await deployTokenWallet({ rootOwner: account1, tokenRoot, walletOwner: account2.address });
      wallet3 = await deployTokenWallet({ rootOwner: account1, tokenRoot, walletOwner: account3.address });
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
    });

    after('info', async function () {
      console.log('account1: ', account1.address, (await locklift.ton.getBalance(account1.address)).toNumber() / 10**9 + " EVER");
      console.log('account2: ', account2.address, (await locklift.ton.getBalance(account2.address)).toNumber() / 10**9 + " EVER");
      console.log('account3: ', account3.address, (await locklift.ton.getBalance(account3.address)).toNumber() / 10**9 + " EVER");
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
      console.log('launchPoolFactory: ', launchPoolFactory.address, (await locklift.ton.getBalance(launchPoolFactory.address)).toNumber() / 10**9 + " EVER");
      console.log('launchPool_1: ', launchPool_1.address, (await locklift.ton.getBalance(launchPool_1.address)).toNumber() / 10**9 + " EVER");
      console.log('launchPool_1_Wallet: ', launchPool_1_Wallet.address, 
                                        (await locklift.ton.getBalance(launchPool_1_Wallet.address)).toNumber() / 10**9 + " EVER,",
                                        (await launchPool_1_Wallet.call({ method: 'balance', params: {}})) + " FOO"
      );
      console.log('launchPool_1_Participation: ', launchPool_1_Participation.address, (await locklift.ton.getBalance(launchPool_1_Participation.address)).toNumber() / 10**9 + " EVER");
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
    
    it('Deploy first LaunchPool', async function() {
      this.timeout(20000);

      const [keyPair] = await locklift.keys.getKeyPairs();

      launchPool_1_StartTime = Math.floor(Date.now() / 1000);
      launchPool_1_EndTime = launchPool_1_StartTime + 20;
      
      await account1.runTarget({
        contract: launchPoolFactory,
        method: 'deployLaunchPool',
        params: {
          _poolOwner: account2.address,
          _launchTokenRoot: tokenRoot.address,
          _startTime: launchPool_1_StartTime,
          _endTime: launchPool_1_EndTime,
          _vestingPeriods: [{ unfreezeTime: launchPool_1_EndTime, percent: 10000 }],
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
      launchPool_1 = await locklift.factory.getContract('LaunchPool');
      launchPool_1.setAddress(launchPoolAddress);
      expect(launchPool_1.address).to.be.a('string')
        .and.satisfy(s => s.startsWith('0:'), 'Bad future launchPool_1 address');

      const launchPoolDetails = await launchPool_1.call({
        method: 'getDetails',
        params: {}
      });
      launchPool_1_Wallet = await locklift.factory.getAccount('TokenWallet', 'scripts/builds');
      launchPool_1_Wallet.setAddress(launchPoolDetails.tokenWallet);
      expect(launchPool_1_Wallet.address).to.be.a('string')
        .and.satisfy(s => s.startsWith('0:'), 'Bad future launchPool_1_Wallet address');
    });
    
    it('Deploy second LaunchPool', async function() {
      this.timeout(20000);

      const [keyPair] = await locklift.keys.getKeyPairs();

      launchPool_2_StartTime = Math.floor(Date.now() / 1000);
      launchPool_2_EndTime = launchPool_2_StartTime + 20;
      
      await account1.runTarget({
        contract: launchPoolFactory,
        method: 'deployLaunchPool',
        params: {
          _poolOwner: account2.address,
          _launchTokenRoot: tokenRoot.address,
          _startTime: launchPool_2_StartTime,
          _endTime: launchPool_2_EndTime,
          _vestingPeriods: [{ unfreezeTime: launchPool_2_EndTime, percent: 10000 }],
          _softCap: locklift.utils.convertCrystal(3, 'nano'),
          _hardCap: locklift.utils.convertCrystal(10, 'nano'),
          _sendGasTo: account1.address,
          _additionalProjectInfo: { 
            projectName: 'projectName',
            projectDescription: 'projectDescription',
            projectImageUrl: 'projectImageUrl',
            projectLandingUrl: 'projectLandingUrl',
            projectSocialLinks: [{name: 'link2', link: 'projectSocialLinks'}],
          }
        },
        keyPair,
        value: locklift.utils.convertCrystal(10, 'nano'),
      });

      const launchPoolAddress = await launchPoolFactory.call({
        method: 'getLaunchPoolAddress',
        params: {
          poolNumber: 1,
        }
      });
      launchPool_2 = await locklift.factory.getContract('LaunchPool');
      launchPool_2.setAddress(launchPoolAddress);
      expect(launchPool_2.address).to.be.a('string')
        .and.satisfy(s => s.startsWith('0:'), 'Bad future launchPool_2 address');

      const launchPoolDetails = await launchPool_2.call({
        method: 'getDetails',
        params: {}
      });
      launchPool_2_Wallet = await locklift.factory.getAccount('TokenWallet', 'scripts/builds');
      launchPool_2_Wallet.setAddress(launchPoolDetails.tokenWallet);
      expect(launchPool_2_Wallet.address).to.be.a('string')
        .and.satisfy(s => s.startsWith('0:'), 'Bad future launchPool_2_Wallet address');
    });

    it('Transfer to first launchPoll from owner', async function() {
      this.timeout(20000);
      const [keyPair] = await locklift.keys.getKeyPairs();

      let launchPoolDetails = await launchPool_1.call({
        method: 'getDetails',
        params: {}
      });
      const wallet2BalanceBefore = await wallet2.call({ method: 'balance', params: {}});
      const launchPoolWalletBalanceBefore = await launchPool_1_Wallet.call({ method: 'balance', params: {}});
      expect(launchPoolWalletBalanceBefore.toNumber()).to.eq(0);
  
      await account2.runTarget({
        contract: wallet2,
        method: 'transfer',
        params: {
          amount: supplyAmount_1,
          recipient: launchPool_1.address,
          deployWalletValue: 0,
          remainingGasTo: account2.address,
          notify: true,
          payload: ''
        },
        keyPair,
        value: locklift.utils.convertCrystal(2, 'nano'),
      });

      launchPoolDetails = await launchPool_1.call({
        method: 'getDetails',
        params: {}
      });

      const launchPoolWalletBalanceAfter = await launchPool_1_Wallet.call({ method: 'balance', params: {}});
      expect(launchPoolWalletBalanceAfter.toNumber()).to.eq(supplyAmount_1);
      const wallet2BalanceAfter = await wallet2.call({ method: 'balance', params: {}});
      expect(wallet2BalanceBefore - wallet2BalanceAfter).to.eq(supplyAmount_1);
    });

    it('Transfer to second launchPoll from owner', async function() {
      this.timeout(20000);
      const [keyPair] = await locklift.keys.getKeyPairs();

      let launchPoolDetails = await launchPool_2.call({
        method: 'getDetails',
        params: {}
      });
      const wallet2BalanceBefore = await wallet2.call({ method: 'balance', params: {}});
      const launchPoolWalletBalanceBefore = await launchPool_2_Wallet.call({ method: 'balance', params: {}});
      expect(launchPoolWalletBalanceBefore.toNumber()).to.eq(0);
  
      await account2.runTarget({
        contract: wallet2,
        method: 'transfer',
        params: {
          amount: supplyAmount_2,
          recipient: launchPool_2.address,
          deployWalletValue: 0,
          remainingGasTo: account2.address,
          notify: true,
          payload: ''
        },
        keyPair,
        value: locklift.utils.convertCrystal(2, 'nano'),
      });

      launchPoolDetails = await launchPool_2.call({
        method: 'getDetails',
        params: {}
      });

      const launchPoolWalletBalanceAfter = await launchPool_2_Wallet.call({ method: 'balance', params: {}});
      expect(launchPoolWalletBalanceAfter.toNumber()).to.eq(supplyAmount_2);
      const wallet2BalanceAfter = await wallet2.call({ method: 'balance', params: {}});
      expect(wallet2BalanceBefore - wallet2BalanceAfter).to.eq(supplyAmount_2);
    });

    it('Deploy LaunchPoolParticipation (investment)', async function() {
      this.timeout(20000);

      const [keyPair] = await locklift.keys.getKeyPairs();

      await account3.run({
        method: 'sendTransaction',
        params: {
          dest: launchPool_1.address,
          value: locklift.utils.convertCrystal(5, 'nano'),
          bounce: true,
          flags: 0,
          payload: '',
        },
        keyPair,
      });
    });
    
    it('Get LaunchPoolParticipation address and details', async function() {
      this.timeout(20000);

      const launchPool_1_ParticipationAddress = await launchPool_1.call({
        method: 'getLaunchPoolParticipationAddress',
        params: {
          _user: account3.address,
        }
      });
      launchPool_1_Participation = await locklift.factory.getContract('LaunchPoolParticipation');
      launchPool_1_Participation.setAddress(launchPool_1_ParticipationAddress);

      const launchPoolDetails = await launchPool_1.call({
        method: 'getDetails',
        params: {}
      });
      const launchPool_1_ParticipationDetails = await launchPool_1_Participation.call({
        method: 'getDetails',
        params: {}
      });
      expect(launchPool_1_ParticipationDetails.launchPool).to.equal(launchPool_1.address);
      expect(launchPool_1_ParticipationDetails.user).to.equal(account3.address);
      expect(launchPool_1_ParticipationDetails.depositAmount.toNumber()).to.gt(Number(locklift.utils.convertCrystal(1.5, 'nano')));
      expect(launchPool_1_ParticipationDetails.depositAmount.toNumber()).to.eq(launchPoolDetails.totalRaised.toNumber());
    });

    it('Finish of fundraising', async function() {
      this.timeout(120000);

      const [keyPair] = await locklift.keys.getKeyPairs();

      while (Math.round(Date.now() / 1000) <= launchPool_1_EndTime) {
        // console.log(`awaiting::`, launchPool_1_EndTime - Math.round(Date.now() / 1000));
        await new Promise((resolve)=>{setTimeout(resolve, 1000)});
      }

      await account2.runTarget({
        contract: launchPool_1,
        method: 'finishFundraising',
        params: {},
        keyPair,
        value: locklift.utils.convertCrystal(0.3, 'nano'),
      });

      const launchPoolDetails = await launchPool_1.call({
        method: 'getDetails',
        params: {}
      });
      expect(launchPoolDetails.state.toNumber()).to.equal(4);
    });

    it('Claim reward', async function() {
      this.timeout(20000);

      const [keyPair] = await locklift.keys.getKeyPairs();

      const launchPoolWalletBalanceBefore = await launchPool_1_Wallet.call({ method: 'balance', params: {}});
      const wallet3BalanceBefore = await wallet3.call({ method: 'balance', params: {}});

      await account3.runTarget({
        contract: launchPool_1_Participation,
        method: 'claimReward',
        params: {
          callbackId: 3342
        },
        keyPair,
        value: locklift.utils.convertCrystal(6, 'nano'),
      });

      const launchPoolWalletBalanceAfter = await launchPool_1_Wallet.call({ method: 'balance', params: {}});
      const wallet3BalanceAfter = await wallet3.call({ method: 'balance', params: {}});
      expect(launchPoolWalletBalanceBefore - launchPoolWalletBalanceAfter).to.eq(supplyAmount_1);
      expect(wallet3BalanceAfter - wallet3BalanceBefore).to.eq(supplyAmount_1);
    });

    it('Withdraw EVERs', async function() {
      this.timeout(20000);

      const [keyPair] = await locklift.keys.getKeyPairs();

      const launchPoolDetails = await launchPool_1.call({
        method: 'getDetails',
        params: {}
      });

      const amountOfWithdraw = launchPoolDetails.totalRaised;

      const launchPoolBalanceBefore = (await locklift.ton.getBalance(launchPool_1.address)).toNumber();
      const wallet2BalanceBefore = (await locklift.ton.getBalance(wallet2.address)).toNumber();

      await account2.runTarget({
        contract: launchPool_1,
        method: 'withdrawEVERs',
        params: {
          amount: amountOfWithdraw,
          to: wallet2.address,
        },
        keyPair,
        value: locklift.utils.convertCrystal(0.1, 'nano'),
      });

      const launchPoolBalanceAfter = (await locklift.ton.getBalance(launchPool_1.address)).toNumber();
      const wallet2BalanceAfter = (await locklift.ton.getBalance(wallet2.address)).toNumber();
      expect(wallet2BalanceAfter - wallet2BalanceBefore).to.gt(Number(amountOfWithdraw));
      expect(launchPoolBalanceBefore - launchPoolBalanceAfter).to.equal(Number(amountOfWithdraw));
    });
  });
});
