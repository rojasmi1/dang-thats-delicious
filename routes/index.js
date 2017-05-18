const express = require('express');
const router = express.Router();

// Do work here
router.get('/', (req, res) => {
  res.send({message: 'It Works'});
});

module.exports = router;
