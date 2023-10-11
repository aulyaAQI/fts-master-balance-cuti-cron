require('dotenv').config({path:'/home/kuya/fts-master-balance-cuti-cron/.env'}); //prod
// require('dotenv').config(); //local
const util = require('util');

const log = require('./log');

const {generateRecordsBatch} = require('./calculation');
const calculation = require('./calculation');

(async () => {
  const records = await calculation.fetchAll();

  try {
    const cutiBersama = await calculation.getCutiBersama();
    const updateBatch = generateRecordsBatch(records, cutiBersama);

    if (updateBatch.length) {
      for (let i = 0; i < updateBatch.length; i++) {
        try {
          const updResp = await calculation.update(updateBatch[i]);
          log.store(updResp);
        } catch (error) {
          console.log({error});
          log.store(error);
        }
      }
    } else {
      console.log('no data updated');
      log.store('no data updated');
    }

  } catch (error) {
    console.log({error});
    log.store(error);
  }
})();
