const test = require('node:test');
const assert = require('node:assert/strict');

const { createMasterDataService } = require('../src/services/masterData.serviceFactory');

const createMockRepository = () => {
  return {
    findById: async (id) => {
      if (Number(id) !== 1) return null;
      return {
        id: 1,
        ma_dvsc: 'SC000',
        ten_dvsc: 'Don vi hien tai',
        is_active: 1,
      };
    },
    existsByField: async (_field, value) => value === 'SC001',
    create: async () => 1,
    updateById: async () => true,
    findItems: async () => [],
    countItems: async () => 0,
    updateStatus: async () => true,
  };
};

const createServiceUnderTest = () => {
  return createMasterDataService({
    moduleName: 'DON_VI_SUA_CHUA',
    entityName: 'don_vi_sua_chua',
    idField: 'don_vi_sua_chua_id',
    displayField: 'ten_dvsc',
    uniqueFields: ['ma_dvsc'],
    repository: createMockRepository(),
  });
};

test('create reports duplicate ma_dvsc clearly', async () => {
  const service = createServiceUnderTest();

  await assert.rejects(
    () =>
      service.create(
        { nguoi_dung_id: 1 },
        {
          ma_dvsc: 'SC001',
          ten_dvsc: 'Trung tâm bảo hành ACE',
        },
      ),
    (error) => {
      assert.equal(error.statusCode, 409);
      assert.match(error.message, /ma_dvsc/i);
      return true;
    },
  );
});

test('update reports duplicate ma_dvsc clearly', async () => {
  const service = createServiceUnderTest();

  await assert.rejects(
    () =>
      service.update(
        { nguoi_dung_id: 1 },
        1,
        {
          ma_dvsc: 'SC001',
          ten_dvsc: 'Don vi cap nhat',
        },
      ),
    (error) => {
      assert.equal(error.statusCode, 409);
      assert.match(error.message, /ma_dvsc/i);
      return true;
    },
  );
});
