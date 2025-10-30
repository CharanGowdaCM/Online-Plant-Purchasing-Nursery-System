
const express = require('express');
const router = express.Router();

const { askPlantAssistant } = require('../controllers/aiController');

router.post('/plant-assistant', askPlantAssistant);

module.exports = router;
