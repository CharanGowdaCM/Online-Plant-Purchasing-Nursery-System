const express = require('express');
const router = express.Router();

const PlantCareController = require('../controllers/plantCareController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/dashboard', PlantCareController.getDashboard);
router.get('/plants', PlantCareController.listPlants);
router.post('/plants', PlantCareController.createPlant);
router.get('/plants/:plantId', PlantCareController.getPlantDetails);
router.patch('/plants/:plantId', PlantCareController.updatePlant);
router.post('/plants/:plantId/tasks/:taskId/complete', PlantCareController.completeTask);
router.post('/plants/:plantId/tasks/:taskId/skip', PlantCareController.skipTask);
router.post('/plants/:plantId/weather/refresh', PlantCareController.refreshWeather);
router.post('/plants/:plantId/schedule/generate', PlantCareController.generateSmartSchedule);
router.post('/plants/:plantId/missed/detect', PlantCareController.detectMissedTasks);
router.post('/missed/detect', PlantCareController.detectMissedTasks);
router.get('/notifications', PlantCareController.getNotifications);
router.get('/history', PlantCareController.getCareHistory);
router.post('/plants/:plantId/diagnose', PlantCareController.diagnosePlant);
router.post('/plants/:plantId/recover', PlantCareController.markRecovered);

module.exports = router;