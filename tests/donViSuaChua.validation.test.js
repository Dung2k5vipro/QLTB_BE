const test = require('node:test');
const assert = require('node:assert/strict');

const donViSuaChuaValidation = require('../src/validations/donViSuaChua.validation');

const samplePayload = {
  ma_dvsc: 'SC001',
  ten_dvsc: 'Trung tâm bảo hành ACE',
  nguoi_lien_he: 'Dũng Việt',
  so_dien_thoai: '0848252286',
  email: 'trinhvietdung@gmail.com',
  dia_chi: 'Khóa nhu-Việt Yên-Hưng Yên',
  ghi_chu: 'đơn vị đã liên kết với trường chuyên phụ trách bảo trì sửa chữa máy tính',
  is_active: 1,
};

test('POST payload accepts string ma_dvsc and required fields', () => {
  const result = donViSuaChuaValidation.createDonViSuaChua.body(samplePayload);

  assert.equal(result.ma_dvsc, 'SC001');
  assert.equal(result.ten_dvsc, samplePayload.ten_dvsc);
  assert.equal(result.is_active, 1);
});

test('PATCH payload accepts string ma_dvsc update', () => {
  const result = donViSuaChuaValidation.updateDonViSuaChua.body({
    ma_dvsc: 'SC002',
    ten_dvsc: 'Trung tâm bảo hành ACE - CN2',
  });

  assert.deepEqual(result, {
    ma_dvsc: 'SC002',
    ten_dvsc: 'Trung tâm bảo hành ACE - CN2',
  });
});

test('POST payload rejects when ten_dvsc is missing', () => {
  assert.throws(
    () => {
      const { ten_dvsc, ...payloadWithoutName } = samplePayload;
      donViSuaChuaValidation.createDonViSuaChua.body(payloadWithoutName);
    },
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /ten_dvsc/i);
      return true;
    },
  );
});
