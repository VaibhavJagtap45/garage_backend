exports.isEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

exports.isPhone = (phone) => {
  return /^[6-9]\d{9}$/.test(phone);
};

exports.isPositiveNumber = (num) => {
  return typeof num === "number" && num > 0;
};