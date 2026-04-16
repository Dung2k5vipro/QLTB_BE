const roleRepository = require('../repositories/role.repository');

const getRoles = async () => {
  return roleRepository.findAll();
};

module.exports = {
  getRoles,
};
