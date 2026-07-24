const PlantDashboardModel = require('../models/plantDashboardModel');
const { buildInitialTaskPlan } = require('./plantCareEngine');

const getLocationFromOrder = (order = {}) => {
  const shipping = order.shipping_address || {};
  const city = shipping.city || '';
  const state = shipping.state || '';
  const addressLine = shipping.address_line || shipping.line1 || '';

  const location = [addressLine, city, state].filter(Boolean).join(', ').trim();
  return location || null;
};

const normalizeQuantity = (value) => {
  const quantity = Number(value);
  if (!Number.isFinite(quantity) || quantity <= 0) return 0;
  return Math.floor(quantity);
};

const syncDeliveredOrderToUserPlants = async (order) => {
  if (!order || order.status !== 'delivered') {
    return { createdPlants: [], createdTasks: [] };
  }

  const userId = order.user_id;
  const orderItems = Array.isArray(order.order_items) ? order.order_items : [];
  if (!userId || !orderItems.length) {
    return { createdPlants: [], createdTasks: [] };
  }

  const plantRows = [];
  const purchaseDate = order.delivered_at || order.placed_at || new Date().toISOString();
  const location = getLocationFromOrder(order);

  orderItems.forEach((item) => {
    const quantity = normalizeQuantity(item.quantity);
    if (!item.product_id || quantity <= 0) return;

    for (let index = 0; index < quantity; index += 1) {
      plantRows.push({
        user_id: userId,
        plant_id: item.product_id,
        nickname: null,
        purchase_date: purchaseDate,
        location,
        last_watered: null,
        health_status: 'HEALTHY'
      });
    }
  });

  if (!plantRows.length) {
    return { createdPlants: [], createdTasks: [] };
  }

  const createdPlants = await PlantDashboardModel.createUserPlants(plantRows);
  const uniqueProductIds = [...new Set(createdPlants.map((plant) => plant.plant_id))];
  const productsById = await PlantDashboardModel.getProductsByIds(uniqueProductIds);

  const taskRows = [];
  createdPlants.forEach((plant) => {
    const product = productsById.get(plant.plant_id) || {};
    taskRows.push(...buildInitialTaskPlan(plant, product));
  });

  const createdTasks = await PlantDashboardModel.createPlantTasks(taskRows);
  return { createdPlants, createdTasks };
};

module.exports = {
  syncDeliveredOrderToUserPlants
};