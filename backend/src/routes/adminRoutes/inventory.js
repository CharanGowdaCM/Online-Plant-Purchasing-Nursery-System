const express = require('express');
const router = express.Router();
const InventoryController = require('../../controllers/admin/inventoryController');
const { validateInventoryData } = require('../../utils/validators/inventoryValidator');
const { verifyToken, inventoryAdmin } = require('../../middleware/auth');


router.use(verifyToken, inventoryAdmin);

router.get('/status', InventoryController.getInventoryStatus);
router.get('/low-stock', InventoryController.getLowStockItems);
router.get('/movements', InventoryController.getInventoryMovements);

router.post('/addproduct', validateInventoryData('add'), InventoryController.addProduct);

router.patch('/products/:productId/stock', validateInventoryData('update'), InventoryController.updateStock);
router.patch('/products/:productId/thresholds', InventoryController.updateThresholds);


router.post('/categories', verifyToken, inventoryAdmin, InventoryController.addCategory);
router.get('/categories', verifyToken, inventoryAdmin, InventoryController.listCategories);
router.patch('/categories/:id', verifyToken, inventoryAdmin, InventoryController.updateCategory);
router.delete('/categories/:id', verifyToken, inventoryAdmin, InventoryController.deleteCategory);

module.exports = router;