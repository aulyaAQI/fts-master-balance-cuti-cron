const axios = require('axios');

const logCronJobApp = {
  id: process.env.LOG_CRON_JOB_APP_ID,
  token: process.env.LOG_CRON_JOB_TOKEN,
};

const headers = {
  'X-Cybozu-API-Token': logCronJobApp.token,
  'Content-Type': 'application/json'
};

const url = process.env.LOG_CRON_JOB_URL;

const log = {
  store: async (message) => {
    console.log({message});

    let toBeStored;
    if (typeof message === 'string') {
      toBeStored = message;
      // eslint-disable-next-line no-prototype-builtins
    } else if (message.hasOwnProperty('status')) {
      if (message.status === 200) {
        toBeStored = JSON.stringify(message.data);
      }
      // eslint-disable-next-line no-prototype-builtins
    } else if (message.hasOwnProperty('response')) {
      toBeStored = JSON.stringify(message.response.data);
    } else {
      toBeStored = JSON.stringify(message);
    }

    console.log({toBeStored});

    axios({
      method: 'post',
      url,
      data: {
        app: logCronJobApp.id,
        record: {
          result: {
            value: toBeStored
          }
        },
      },
      headers
    });
  }
};


module.exports = log;

