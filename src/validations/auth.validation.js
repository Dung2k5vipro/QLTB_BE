const AppError = require('../utils/appError');

const MIN_PASSWORD_LENGTH = 8;

const requireObject = (value, message = 'Dữ liệu không hợp lệ') => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError(message, 400);
  }
};

const requireString = (value, fieldName, minLength = 1, maxLength = 255) => {
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} pháº£i lÃ  chuá»—i`, 400);
  }

  const trimmed = value.trim();

  if (trimmed.length < minLength) {
    throw new AppError(`${fieldName} khÃ´ng ???c Ä‘á»ƒ trá»‘ng`, 400);
  }

  if (trimmed.length > maxLength) {
    throw new AppError(`${fieldName} vÆ°á»£t quÃ¡ Ä‘á»™ dÃ i tá»‘i Ä‘a ${maxLength}`, 400);
  }

  return trimmed;
};

const assertOnlyAllowedKeys = (payload, allowedFields) => {
  const invalidFields = Object.keys(payload).filter((key) => !allowedFields.includes(key));

  if (invalidFields.length) {
    throw new AppError(`Không hỗ trợ trường: ${invalidFields.join(', ')}`, 400);
  }
};

const login = {
  body: (body) => {
    requireObject(body, 'Body khÃ´ng há»£p lá»‡');
    assertOnlyAllowedKeys(body, ['ten_dang_nhap', 'mat_khau']);

    return {
      ten_dang_nhap: requireString(body.ten_dang_nhap, 'ten_dang_nhap', 1, 100),
      mat_khau: requireString(body.mat_khau, 'mat_khau', 1, 255),
    };
  },
};

const changePassword = {
  body: (body) => {
    requireObject(body, 'Body khÃ´ng há»£p lá»‡');
    assertOnlyAllowedKeys(body, ['mat_khau_hien_tai', 'mat_khau_moi', 'xac_nhan_mat_khau_moi']);

    const mat_khau_hien_tai = requireString(body.mat_khau_hien_tai, 'mat_khau_hien_tai');
    const mat_khau_moi = requireString(body.mat_khau_moi, 'mat_khau_moi', MIN_PASSWORD_LENGTH);
    const xac_nhan_mat_khau_moi = requireString(body.xac_nhan_mat_khau_moi, 'xac_nhan_mat_khau_moi');

    if (mat_khau_hien_tai === mat_khau_moi) {
      throw new AppError('mat_khau_moi không được trùng với mat_khau_hien_tai', 400);
    }

    if (mat_khau_moi !== xac_nhan_mat_khau_moi) {
      throw new AppError('xac_nhan_mat_khau_moi khÃ´ng khớp', 400);
    }

    return {
      mat_khau_hien_tai,
      mat_khau_moi,
      xac_nhan_mat_khau_moi,
    };
  },
};

const bootstrapAdmin = {
  body: (body) => {
    requireObject(body, 'Body khÃ´ng há»£p lá»‡');
    assertOnlyAllowedKeys(body, ['ten_dang_nhap', 'mat_khau', 'ho_ten', 'email', 'so_dien_thoai', 'don_vi_id', 'ghi_chu', 'bootstrap_key']);

    const mat_khau = requireString(body.mat_khau, 'mat_khau', MIN_PASSWORD_LENGTH, 255);

    let email = null;
    if (Object.prototype.hasOwnProperty.call(body, 'email')) {
      if (body.email !== null && typeof body.email !== 'string') {
        throw new AppError('email pháº£i lÃ  chuá»—i hoáº·c null', 400);
      }
      email = body.email === null ? null : body.email.trim().toLowerCase();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError('email khÃ´ng Ä‘Ãºng Ä‘á»‹nh dáº¡ng', 400);
      }
      if (email === '') email = null;
    }

    let so_dien_thoai = null;
    if (Object.prototype.hasOwnProperty.call(body, 'so_dien_thoai')) {
      if (body.so_dien_thoai !== null && typeof body.so_dien_thoai !== 'string') {
        throw new AppError('so_dien_thoai pháº£i lÃ  chuá»—i hoáº·c null', 400);
      }
      so_dien_thoai = body.so_dien_thoai === null ? null : body.so_dien_thoai.trim();
      if (so_dien_thoai && !/^(0|\+84)\d{9,10}$/.test(so_dien_thoai)) {
        throw new AppError('so_dien_thoai khÃ´ng Ä‘Ãºng Ä‘á»‹nh dáº¡ng', 400);
      }
      if (so_dien_thoai === '') so_dien_thoai = null;
    }

    let don_vi_id = null;
    if (Object.prototype.hasOwnProperty.call(body, 'don_vi_id')) {
      if (body.don_vi_id !== null) {
        const parsedDonViId = Number(body.don_vi_id);
        if (!Number.isInteger(parsedDonViId) || parsedDonViId <= 0) {
          throw new AppError('don_vi_id pháº£i lÃ  sá»‘ nguyÃªn dÆ°Æ¡ng hoáº·c null', 400);
        }
        don_vi_id = parsedDonViId;
      }
    }

    let ghi_chu = null;
    if (Object.prototype.hasOwnProperty.call(body, 'ghi_chu')) {
      if (body.ghi_chu !== null && typeof body.ghi_chu !== 'string') {
        throw new AppError('ghi_chu pháº£i lÃ  chuá»—i hoáº·c null', 400);
      }
      ghi_chu = body.ghi_chu === null ? null : body.ghi_chu.trim();
      if (ghi_chu && ghi_chu.length > 255) {
        throw new AppError('ghi_chu vÆ°á»£t quÃ¡ Ä‘á»™ dÃ i tá»‘i Ä‘a 255', 400);
      }
      if (ghi_chu === '') ghi_chu = null;
    }

    return {
      ten_dang_nhap: requireString(body.ten_dang_nhap, 'ten_dang_nhap', 1, 100),
      mat_khau,
      ho_ten: requireString(body.ho_ten, 'ho_ten', 1, 150),
      email,
      so_dien_thoai,
      don_vi_id,
      ghi_chu,
      bootstrap_key: requireString(body.bootstrap_key, 'bootstrap_key', 1, 255),
    };
  },
};

module.exports = {
  login,
  changePassword,
  bootstrapAdmin,
};

