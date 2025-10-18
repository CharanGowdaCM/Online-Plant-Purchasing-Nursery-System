const express = require('express');
const router = express.Router();
const InventoryController = require('../../controllers/admin/inventoryController');
const { validateInventoryUpdate } = require('../../utils/validators/inventoryValidator');

router.get('/status', InventoryController.getInventoryStatus);
router.get('/low-stock', InventoryController.getLowStockItems);
router.get('/movements', InventoryController.getInventoryMovements);
router.patch('/products/:productId/stock', validateInventoryUpdate, InventoryController.updateStock);
router.patch('/products/:productId/thresholds', InventoryController.updateThresholds);

module.exports = router;