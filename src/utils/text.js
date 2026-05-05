const MOJIBAKE_PATTERN = /(?:Ã.|Â.|Ä.|áº|á»|â.|�)/;

function looksLikeMojibake(value) {
  if (typeof value !== 'string') return false;
  return MOJIBAKE_PATTERN.test(value);
}

function repairUtf8Mojibake(value) {
  if (typeof value !== 'string') {
    return value;
  }

  if (!looksLikeMojibake(value)) {
    return value;
  }

  try {
    const repaired = Buffer.from(value, 'latin1').toString('utf8');
    if (!repaired || repaired.includes('�')) {
      return value;
    }
    return repaired;
  } catch (_error) {
    return value;
  }
}

function deepRepairUtf8(value) {
  if (typeof value === 'string') {
    return repairUtf8Mojibake(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepRepairUtf8(item));
  }

  if (!value || typeof value !== 'object' || value instanceof Date) {
    return value;
  }

  const output = {};
  for (const [key, itemValue] of Object.entries(value)) {
    output[key] = deepRepairUtf8(itemValue);
  }

  return output;
}

module.exports = {
  repairUtf8Mojibake,
  deepRepairUtf8,
};
