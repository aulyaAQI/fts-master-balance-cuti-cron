require('dotenv').config({path:'/home/kuya/fts-master-balance-cuti-cron/.env'});

const log = require('./log');

const {generateRecordsBatch} = require('./calculation');
const calculation = require('./calculation');

(async () => {
  console.log('hai');
  const records = await calculation.fetchAll();

  try {
    const cutiBersama = await calculation.getCutiBersama();
    const updateBatch = generateRecordsBatch(records, cutiBersama);

    if (updateBatch.length) {
      for (let i = 0; i < updateBatch.length; i++) {
        try {
          const updResp = await calculation.update(updateBatch[i]);
          console.log({updResp});
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
