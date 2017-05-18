const express = require('express')
const router = express.Router()

// Do work here
router.get('/', (req, res) => {
  res.json({message: 'It Works'})
})

module.exports = router
