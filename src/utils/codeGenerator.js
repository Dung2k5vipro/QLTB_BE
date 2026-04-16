const normalizeAbbreviation = (value) => {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  return normalized || 'UNK';
};

const buildAssetPrefix = (maVietTat) => `TB-${normalizeAbbreviation(maVietTat)}-`;

const formatSequence = (seq) => {
  const sequence = Number(seq) || 1;
  return String(sequence).padStart(4, '0');
};

const buildAssetCode = (maVietTat, seq) => `${buildAssetPrefix(maVietTat)}${formatSequence(seq)}`;

const generateNextAssetCode = async ({ connection, maVietTat }) => {
  if (!connection || typeof connection.query !== 'function') {
    throw new Error('connection is required for generateNextAssetCode');
  }

  const prefix = buildAssetPrefix(maVietTat);
  const startPos = prefix.length + 1;

  const sql = `
    SELECT MAX(CAST(SUBSTRING(ma_tai_san, ?) AS UNSIGNED)) AS max_seq
    FROM thiet_bi
    WHERE ma_tai_san LIKE ?
    FOR UPDATE
  `;

  const [rows] = await connection.query(sql, [startPos, `${prefix}%`]);
  const currentMax = Number(rows[0]?.max_seq || 0);
  const nextSeq = currentMax + 1;

  return buildAssetCode(maVietTat, nextSeq);
};

module.exports = {
  normalizeAbbreviation,
  buildAssetPrefix,
  buildAssetCode,
  generateNextAssetCode,
};
