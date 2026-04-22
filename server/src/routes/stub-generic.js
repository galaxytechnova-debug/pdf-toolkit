const express = require('express');

module.exports = function makeStub(feature) {
  const router = express.Router();
  router.all('/', (_req, res) => {
    res.status(501).json({
      error: 'Not Implemented',
      feature,
      note:
        'This operation requires additional system dependencies (e.g., LibreOffice/Office or specialized libraries). The UI is wired; backend implementation can be added later without changing the client.',
    });
  });
  return router;
};
