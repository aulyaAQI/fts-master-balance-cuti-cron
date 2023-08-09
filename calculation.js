const axios = require('axios');
const luxon = require('luxon');

const dt = luxon.DateTime;
const currentDt = dt.now();
const currentYear = currentDt.toFormat('yyyy');

const headers = {
  'X-Cybozu-API-Token': process.env.CUTI_BERSAMA_TOKEN,
  'Content-Type': 'application/json'
};

const url = process.env.CUTI_BERSAMA_API_URL;
// const masterBalanceCutiAppId = 85;
const masterBalanceCutiAppId = process.env.MASTER_BALANCE_CUTI_APP_ID;
const masterCutiBersama = process.env.MASTER_CUTI_BERSAMA_APP_ID;

const calculation = {
  getCutiBersama: async () => {
    const query = `tahun = "${currentYear}"`;

    const resp = await axios.get(
      `${url}?app=${masterCutiBersama}&query=${query}`,
      {
        'headers': {
          'X-Cybozu-API-Token': headers['X-Cybozu-API-Token']
        }
      }
    );

    const records = resp.data.records;
    const record = records[0];

    const cutiBersama = record.cuti_bersama.value;

    return cutiBersama;
  },
  chunkHundreds: (array) => {
    const batch = [];
    for (let i = 0; i < array.length; i += 100) {
      const chunk = array.slice(i, i + 100);
      batch.push(chunk);
    }

    return batch;
  },
  fetchAll: (opt_last_record_id, opt_records) => {
    let records = opt_records || [];
    let query = opt_last_record_id ? '$id > ' + opt_last_record_id : '';
    query += ' order by $id asc limit 500';
    query = encodeURIComponent(query);

    console.log('here');

    return axios.get(
      `${url}?app=${masterBalanceCutiAppId}&query=${query}`,
      {
        'headers': {
          'X-Cybozu-API-Token': headers['X-Cybozu-API-Token']
        }
      }
    ).then((resp) => {
      records = records.concat(resp.data.records);
      if (resp.data.records.length === 500) {
        return calculation.fetchAll(
          resp.data.records[resp.data.records.length - 1].$id.value,
          records
        );
      }

      return records;
    }).catch(err => {
      console.log({err});
    });
  },
  // eslint-disable-next-line max-statements
  generateRecordsBatch: (records, cutiBersama) => {
    const dateNow = new Date(Date.now());
    const monthNow = dateNow.getMonth();
    // const currentYear = dateNow.getFullYear();

    let i, j, temparray;
    const chunk = 100;

    const array = [];

    for (i = 0, j = records.length; i < j; i += chunk) {
      let data;
      temparray = records.slice(i, i + chunk);
      for (let y = 0; y < temparray.length; y++) {
        let cutiBesar = parseFloat(temparray[y].Cuti_Besar.value);
        let cutiTahun = parseFloat(temparray[y].Cuti_Tahunan.value);
        // const cutiBersama = parseFloat(temparray[y].Cuti_Bersama.value);
        let cutiTahunLalu = temparray[y].Sisa_Cuti_Tahun_Lalu.value;
        let kompensasi = temparray[y].Kompensasi.value;
        const statusKaryawan = temparray[y].Status_Karyawan.value;

        const joinDate = new Date(temparray[y].Join_Date.value);
        const joinMonth = joinDate.getMonth();
        const joinYear = joinDate.getFullYear();
        const lamaMengabdi = parseInt(dateNow.getFullYear(), 10) - parseInt(joinYear, 10);

        const updateFlag = temparray[y].updateFlag.value;

        if (updateFlag !== currentYear && `${joinYear}` !== currentYear && monthNow >= joinMonth) {
          // eslint-disable-next-line max-depth
          if (
            ((lamaMengabdi % 6 === 0 && statusKaryawan === 'Tetap') || (lamaMengabdi % 6 === 1 && statusKaryawan === 'Tetap')) &&
            (lamaMengabdi % 6 !== lamaMengabdi)
          ) {
            cutiBesar = parseFloat(cutiBesar + (22 - cutiBersama));
            cutiTahunLalu = cutiTahun;
            cutiTahun = 0;

            // eslint-disable-next-line max-depth
            // if (lamaMengabdi % 6 === 1) {
            //   kompensasi = 'Ya';
            // }

          } else {
            cutiTahunLalu = cutiTahun;
            cutiTahun = parseFloat(12 - cutiBersama);
            kompensasi = null;
          }

          if (parseFloat(cutiTahunLalu) > 0) {
            kompensasi = 'Ya';
          }

          data = {};
          data.record = {};
          data.id = temparray[y].$id.value;
          data.record.Cuti_Besar = {};
          data.record.Cuti_Tahunan = {};
          data.record.Sisa_Cuti_Tahun_Lalu = {};
          data.record.Kompensasi = {};
          data.record.updateFlag = {};
          data.record.Cuti_Bersama = {};

          data.record.Cuti_Besar.value = cutiBesar;
          data.record.Cuti_Tahunan.value = cutiTahun;
          data.record.Sisa_Cuti_Tahun_Lalu.value = cutiTahunLalu;
          data.record.Kompensasi.value = kompensasi;
          data.record.updateFlag.value = currentYear;
          data.record.Cuti_Bersama.value = cutiBersama;

          array.push(data);
        }

      }
    }

    const updateBatch = calculation.chunkHundreds(array);

    return updateBatch;
  },
  update: (updateBatch) => {
    return axios({
      method: 'put',
      url,
      data: {
        app: masterBalanceCutiAppId,
        records: updateBatch,
      },
      headers
    });
  }
};


module.exports = calculation;
