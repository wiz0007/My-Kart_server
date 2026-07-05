const LOGIN_FAILURE_LIMIT = Number(process.env.LOGIN_FAILURE_LIMIT) || 5;
const ACCOUNT_LOCK_MINUTES = Number(process.env.ACCOUNT_LOCK_MINUTES) || 15;
const EMAIL_VERIFICATION_TTL_HOURS = Number(process.env.EMAIL_VERIFICATION_TTL_HOURS) || 24;
const PASSWORD_RESET_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TTL_MINUTES) || 15;

const getVerificationTokenExpiresAt = () => {
  return new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000);
};

const getPasswordResetTokenExpiresAt = () => {
  return new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
};

const getLockExpiresAt = () => {
  return new Date(Date.now() + ACCOUNT_LOCK_MINUTES * 60 * 1000);
};

const isAccountLocked = (user) => {
  return Boolean(user.lockUntil && user.lockUntil > new Date());
};

const recordFailedLogin = async (user) => {
  user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

  if (user.failedLoginAttempts >= LOGIN_FAILURE_LIMIT) {
    user.lockUntil = getLockExpiresAt();
  }

  await user.save();
  return isAccountLocked(user);
};

const resetFailedLogins = (user) => {
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
};

module.exports = {
  LOGIN_FAILURE_LIMIT,
  ACCOUNT_LOCK_MINUTES,
  EMAIL_VERIFICATION_TTL_HOURS,
  PASSWORD_RESET_TTL_MINUTES,
  getVerificationTokenExpiresAt,
  getPasswordResetTokenExpiresAt,
  isAccountLocked,
  recordFailedLogin,
  resetFailedLogins,
};
