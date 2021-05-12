const chalk = require('chalk');
const BbPromise = require('bluebird');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const os = require('os');
const dotenv = require("dotenv");

'use strict';

class OutputToEnv {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.commands = {
      'output-to-env': {
        usage: 'Exports stack outputs to an .env file',
        lifecycleEvents: [
          'export',
        ],
      },
    };
    this.hooks = {
      'after:deploy:deploy': this.hookWrapper.bind(this, this.onExport),
      'output-to-env:export': this.hookWrapper.bind(this, this.onExport),
    };
  }

  initialise() {
    const custom = this.serverless.service.custom;
    this.config = {
      ...custom.outputToEnv
    };
    this.validateInput();
  }

  async hookWrapper(lifecycleFunc) {
    console.log(chalk.blueBright('outputToEnv initialising...'));
    this.initialise();
    return await lifecycleFunc.call(this);
  }

  validateInput() {
    const outputToEnv = this.serverless.service.custom.outputToEnv;
    if(
      !outputToEnv ||
      !outputToEnv.fileName ||
      !outputToEnv.map
    ) {
      throw `custom.outputToEnv is missing required fields, please check documentation.`;
    }
  }
  async onExport() {
    console.log(chalk.blueBright('outputToEnv fetching outputs...'));
    const AWS = this.serverless.providers.aws;
    BbPromise.resolve(
      AWS.request('CloudFormation', 'describeStacks', {
        StackName: AWS.naming.getStackName(),
      })
    ).then((response) => {
      const stack = response.Stacks[0];
      if (!stack) {
        throw 'Could not find stack';
      }
      const outputs = stack.Outputs.map((output) => {
        return {
          key: output.OutputKey,
          value: output.OutputValue
        };
      });
      console.log(chalk.green('outputToEnv found outputs:'));
      console.log(outputs);
      const map = this.config.map;
      console.log(chalk.blueBright('outputToEnv using custom.outputToEnv.map:'));
      console.log(map);
      let envVars = {};
      Object.keys(map).forEach((key, value) => {
        const outputKey = map[key];
        const output = outputs.find(output => output.key === outputKey);
        if(output) {
          envVars[key] = output.value;
        } else {
          console.log(chalk.red('outputToEnv could not find '+outputKey+' in stack outputs.'));
        }
      });
      const filePath = path.resolve(this.serverless.config.servicePath, this.config.fileName);
      if (this.config.overwrite === false) {
        console.log(chalk.blueBright('outputToEnv detected overwrite=false, preserving existing keys in file...'));

        let existingFile;
        try { existingFile = fs.readFileSync(filePath); } catch(e) {}
        if (existingFile) {
          const existingVariables = dotenv.parse(Buffer.from(existingFile), { debug: true });
          envVars = _.assign(
            existingVariables,
            envVars, // Takes precedence
          );
        }
      }

      console.log(chalk.blueBright('outputToEnv attempting to write values to '+filePath));
      const getEnvDocument = (envVars) => {
        const output = _.map(envVars, (value, key) => {
          return `${key}=${value}`;
        });
        return output.join(os.EOL);
      };
      const document = getEnvDocument(envVars);
      fs.writeFileSync(filePath, document);
      console.log(chalk.greenBright('outputToEnv succesfully wrote file with contents: '));
      console.log(document);
    });
  }
}

module.exports = OutputToEnv;

