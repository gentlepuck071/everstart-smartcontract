const fs = require('fs');

const stringToBytesArray = (dataString) => {
  return Buffer.from(dataString).toString('hex')
};
class Migration {
  constructor(log_path = 'migration-log.json') {
    this.log_path = log_path;
    this.migration_log = {};
    this.balance_history = [];
    this._loadMigrationLog();
  }

  _loadMigrationLog() {
    if (fs.existsSync(this.log_path)) {
      const data = fs.readFileSync(this.log_path, 'utf8');
      if (data) this.migration_log = JSON.parse(data);
    }
  }

  reset() {
    this.migration_log = {};
    this.balance_history = [];
    this._saveMigrationLog();
  }

  _saveMigrationLog() {
    fs.writeFileSync(this.log_path, JSON.stringify(this.migration_log, null, 2));
  }

  exists(alias, network) {
    return this.migration_log[alias][network] !== undefined;
  }

  load(contract, alias, network) {
    if (this.migration_log[alias][network] !== undefined) {
      contract.setAddress(this.migration_log[alias][network].address);
    } else {
      throw new Error(`Contract ${alias} not found in the migration`);
    }
    return contract;
  }

  store(contract, alias, network) {
    const aliasObject = {
      ...this.migration_log[alias],
      [network] : {
        address: contract.address,
        name: contract.name
      }
    }
    this.migration_log = {
      ...this.migration_log,
      [alias]: aliasObject
    }
    this._saveMigrationLog();
  }

  saveCommand(network, program, output) {
    if (this.migration_log['commands'] === undefined) {
      this.migration_log['commands'] = {};
    } 
    if (this.migration_log['commands'][network] === undefined) {
      this.migration_log['commands'][network] = [];
    } 
    this.migration_log['commands'][network].push({
      command: program.rawArgs.join(' '),
      options: program.opts(),
      output,
      time: new Date(),
    });
    this._saveMigrationLog();
  }

  async balancesCheckpoint() {
    const b = {};
    for (let alias in this.migration_log) {
      await locklift.ton.getBalance(this.migration_log[alias].address)
          .then(e => b[alias] = e.toString())
          .catch(e => { /* ignored */ });
    }
    this.balance_history.push(b);
  }

  async balancesLastDiff() {
    const d = {};
    for (let alias in this.migration_log) {
      const start = this.balance_history[this.balance_history.length - 2][alias];
      const end = this.balance_history[this.balance_history.length - 1][alias];
      if (end !== start) {
        const change = new BigNumber(end).minus(start || 0).shiftedBy(-9);
        d[alias] = change;
      }
    }
    return d;
  }
}

// framework doesn't had deploy function without a giver runs...whatever...just copy-paste it and remove giver logic
async function deployContract({
    contract,
    constructorParams,
    initParams,
    keyPair,
    gramsAccount,
    gramsAmount
}) {
  const extendedInitParams = initParams === undefined ? {} : initParams;
  if (contract.autoRandomNonce) {
    if (contract.abi.data.find(e => e.name === '_randomNonce')) {
      extendedInitParams._randomNonce = extendedInitParams._randomNonce === undefined
        ? locklift.utils.getRandomNonce()
        : extendedInitParams._randomNonce;
    }
  }

  const {
    address,
  } = await locklift.ton.createDeployMessage({
    contract,
    constructorParams,
    initParams: extendedInitParams,
    keyPair,
  });

  if (gramsAccount && gramsAmount) {
    await gramsAccount.run({
      method: 'sendTransaction',
      params: {
        dest: address,
        value: gramsAmount,
        bounce: false,
        flags: 0,
        payload: '',
      },
      keyPair,
    });

    // Wait for receiving grams
    await locklift.ton.client.net.wait_for_collection({
      collection: 'accounts',
      filter: {
        id: { eq: address },
        balance: { gt: `0x0` }
      },
      result: 'balance'
    });
  } else {
    console.log(`Send EVERs to an address in the next 60 seconds::`, address);
    await new Promise((resolve)=>{setTimeout(resolve, 60000)});
  }
  
  // Send deploy transaction
  const message = await locklift.ton.createDeployMessage({
    contract,
    constructorParams,
    initParams: extendedInitParams,
    keyPair,
  });
  await locklift.ton.waitForRunTransaction({ message, abi: contract.abi });
  contract.setAddress(address);
  return contract;
}

module.exports = {
  Migration,
  deployContract,
  stringToBytesArray
}
