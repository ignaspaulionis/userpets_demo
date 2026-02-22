const isDatabaseError = (error) => {
  if (!error) {
    return false;
  }

  const dbErrorNames = [
    'SequelizeDatabaseError',
    'SequelizeConnectionError',
    'SequelizeConnectionRefusedError',
    'SequelizeConnectionTimedOutError',
    'SequelizeConnectionAcquireTimeoutError',
    'SequelizeHostNotFoundError',
    'SequelizeHostNotReachableError',
    'SequelizeInvalidConnectionError',
    'SequelizeTimeoutError',
  ];

  const sqliteErrorCodes = [
    'SQLITE_BUSY',
    'SQLITE_LOCKED',
    'SQLITE_CANTOPEN',
    'SQLITE_IOERR',
    'SQLITE_CORRUPT',
    'SQLITE_NOTADB',
    'SQLITE_FULL',
    'SQLITE_READONLY',
  ];

  return dbErrorNames.includes(error.name) || sqliteErrorCodes.includes(error.parent?.code);
};

const handleDbError = (res, err) => {
  if (isDatabaseError(err)) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }

  return null;
};

module.exports = {
  isDatabaseError,
  handleDbError,
};
