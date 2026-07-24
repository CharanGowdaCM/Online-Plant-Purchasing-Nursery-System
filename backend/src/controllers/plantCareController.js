const PlantDashboardModel = require('../models/plantDashboardModel');
const ProductModel = require('../models/productModel');
const UserModel = require('../models/userModel');
const { buildInitialTaskPlan, buildNextRecurringTask, getWeatherWateringAdjustment, adjustTaskDate, buildDiagnosisPlan } = require('../utils/plantCareEngine');
const { getWeatherForLocation } = require('../utils/weatherService');
const { analyzePlantImage } = require('../utils/geminiPlantDiagnosis');
const { notifyPlantEvent } = require('../utils/plantCareNotifications');
const { getPlantProfile, buildAdaptiveTask, buildBehaviorInsights } = require('../utils/smartPlantScheduler');

const DAY_MS = 24 * 60 * 60 * 1000;

const toDateTime = (value) => {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
};

const parseImagePayload = (body = {}) => {
  const imageBase64 = String(body.image_base64 || body.imageBase64 || '').replace(/^data:[^;]+;base64,/, '');
  const mimeType = body.mime_type || body.mimeType || 'image/jpeg';
  const imageUrl = body.image_url || body.imageUrl || null;

  if (!imageBase64 && !imageUrl) {
    return null;
  }

  return { imageBase64, mimeType, imageUrl };
};

const normalizePlantPayload = (body = {}) => ({
  plant_id: body.plant_id || body.product_id,
  nickname: body.nickname || null,
  purchase_date: body.purchase_date || null,
  location: body.location || null,
  last_watered: body.last_watered ? toDateTime(body.last_watered) : null,
  health_status: body.health_status || 'HEALTHY',
  plant_type: body.plant_type || null,
  watering_frequency_days: body.watering_frequency_days ? Number(body.watering_frequency_days) : null,
  sunlight_requirement: body.sunlight_requirement || null,
  is_outdoor: typeof body.is_outdoor === 'boolean' ? body.is_outdoor : null,
  environment: body.environment || null,
  soil_moisture: body.soil_moisture != null ? Number(body.soil_moisture) : null
});

const formatProduct = (productResponse) => {
  if (!productResponse?.success) return null;
  return productResponse.data || null;
};

const getReferenceDate = (req) => {
  const simulateDays = Number(req.query?.simulate_days || 0);
  const safeSimulateDays = Number.isFinite(simulateDays) ? Math.max(-30, Math.min(30, simulateDays)) : 0;
  return new Date(Date.now() + (safeSimulateDays * 24 * 60 * 60 * 1000));
};

const getUserEmail = async (userId) => {
  const user = await UserModel.getUserDetailsById(userId);
  return user?.email || null;
};

const buildSmartTaskPayload = ({ plant, product, weather, taskType, lastCompletedTask, referenceDate }) => {
  const profile = getPlantProfile(plant, product);
  const adaptiveTask = buildAdaptiveTask({
    taskType,
    profile,
    weather,
    lastCompletedTask,
    referenceDate
  });

  return {
    user_plant_id: plant.id,
    task_type: adaptiveTask.task_type,
    due_date: adaptiveTask.due_date,
    status: 'PENDING',
    priority: adaptiveTask.priority,
    reasons: adaptiveTask.reasons,
    interval_days: adaptiveTask.interval_days,
    profile
  };
};

const sanitizePlantInsertPayload = (payload) => ({
  user_id: payload.user_id,
  plant_id: payload.plant_id,
  nickname: payload.nickname,
  purchase_date: payload.purchase_date,
  location: payload.location,
  last_watered: payload.last_watered,
  health_status: payload.health_status,
  plant_type: payload.plant_type,
  watering_frequency_days: payload.watering_frequency_days,
  sunlight_requirement: payload.sunlight_requirement,
  is_outdoor: payload.is_outdoor,
  environment: payload.environment,
  soil_moisture: payload.soil_moisture
});

const sanitizePlantUpdatePayload = (body = {}) => {
  const allowedUpdates = {};
  ['nickname', 'location', 'purchase_date', 'last_watered', 'health_status', 'plant_type', 'watering_frequency_days', 'sunlight_requirement', 'is_outdoor', 'environment', 'soil_moisture'].forEach((field) => {
    if (body[field] !== undefined) {
      allowedUpdates[field] = body[field];
    }
  });

  if (allowedUpdates.last_watered) {
    allowedUpdates.last_watered = toDateTime(allowedUpdates.last_watered);
  }

  if (allowedUpdates.watering_frequency_days != null) {
    allowedUpdates.watering_frequency_days = Number(allowedUpdates.watering_frequency_days);
  }

  if (allowedUpdates.soil_moisture != null) {
    allowedUpdates.soil_moisture = Number(allowedUpdates.soil_moisture);
  }

  return allowedUpdates;
};

const isSchemaColumnError = (error) => {
  return String(error?.message || '').toLowerCase().includes('column');
};

class PlantCareController {
  static async getDashboard(req, res) {
    try {
      const userId = req.user.id;
      const plants = await PlantDashboardModel.getUserPlants(userId);

      const enrichedPlants = await Promise.all(plants.map(async (plant) => {
        const productResponse = await ProductModel.getProductById(plant.plant_id);
        const product = formatProduct(productResponse);
        const tasks = await PlantDashboardModel.listTasksForPlant(userId, plant.id);
        const activeDiagnosis = await PlantDashboardModel.getActiveDiagnosis(plant.id);
        const nextTask = tasks.find((task) => task.status === 'PENDING') || null;

        return {
          ...plant,
          product,
          tasks,
          activeDiagnosis,
          nextTask
        };
      }));

      const latestWeather = await PlantDashboardModel.getLatestWeather(userId);
      const allTasks = enrichedPlants.flatMap((plant) => plant.tasks || []);
      const overdueTasks = allTasks.filter((task) => task.status === 'PENDING' && new Date(task.due_date) < new Date());
      const atRiskPlants = enrichedPlants.filter((plant) => plant.health_status === 'AT_RISK').length;
      const recoveringPlants = enrichedPlants.filter((plant) => plant.health_status === 'RECOVERING').length;
      const totalPlants = enrichedPlants.length;
      const healthyPlants = enrichedPlants.filter((plant) => plant.health_status === 'HEALTHY').length;
      const healthScore = Math.max(0, Math.min(100, Math.round(100 - (atRiskPlants * 18) - (overdueTasks.length * 8) - (recoveringPlants * 10))));

      const alerts = [];
      overdueTasks.slice(0, 5).forEach((task) => {
        alerts.push({
          type: 'task',
          priority: task.priority,
          message: `${task.task_type} task is overdue for plant ${task.user_plant_id}`
        });
      });

      enrichedPlants.forEach((plant) => {
        if (plant.activeDiagnosis) {
          alerts.push({
            type: 'diagnosis',
            priority: plant.activeDiagnosis.severity,
            message: `${plant.nickname || 'Plant'} has an active diagnosis: ${plant.activeDiagnosis.disease}`
          });
        }
      });

      res.json({
        success: true,
        data: {
          plants: enrichedPlants,
          latestWeather,
          alerts,
          summary: {
            totalPlants,
            healthyPlants,
            atRiskPlants,
            recoveringPlants,
            overdueTasks: overdueTasks.length,
            healthScore
          }
        }
      });
    } catch (error) {
      console.error('Error loading plant dashboard:', error);
      res.status(500).json({ success: false, message: 'Failed to load plant dashboard' });
    }
  }

  static async listPlants(req, res) {
    try {
      const plants = await PlantDashboardModel.getUserPlants(req.user.id);
      res.json({ success: true, data: plants });
    } catch (error) {
      console.error('Error listing plants:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch plants' });
    }
  }

  static async createPlant(req, res) {
    try {
      const payload = normalizePlantPayload(req.body || {});
      if (!payload.plant_id) {
        return res.status(400).json({ success: false, message: 'plant_id is required' });
      }

      const productResponse = await ProductModel.getProductById(payload.plant_id);
      if (!productResponse?.success) {
        return res.status(404).json({ success: false, message: 'Plant product not found' });
      }

      let plant;
      const createPayload = sanitizePlantInsertPayload({
        user_id: req.user.id,
        plant_id: payload.plant_id,
        nickname: payload.nickname,
        purchase_date: payload.purchase_date,
        location: payload.location,
        last_watered: payload.last_watered,
        health_status: 'HEALTHY',
        plant_type: payload.plant_type,
        watering_frequency_days: payload.watering_frequency_days,
        sunlight_requirement: payload.sunlight_requirement,
        is_outdoor: payload.is_outdoor,
        environment: payload.environment,
        soil_moisture: payload.soil_moisture
      });

      try {
        plant = await PlantDashboardModel.createUserPlant(createPayload);
      } catch (error) {
        if (!isSchemaColumnError(error)) throw error;

        plant = await PlantDashboardModel.createUserPlant({
          user_id: req.user.id,
          plant_id: payload.plant_id,
          nickname: payload.nickname,
          purchase_date: payload.purchase_date,
          location: payload.location,
          last_watered: payload.last_watered,
          health_status: 'HEALTHY'
        });
      }

      const product = productResponse.data;
      const tasks = await PlantDashboardModel.createPlantTasks(buildInitialTaskPlan(plant, product));

      for (const task of tasks) {
        await PlantDashboardModel.createCareLog({
          user_id: req.user.id,
          user_plant_id: plant.id,
          task_id: task.id,
          task_type: task.task_type,
          status: 'GENERATED',
          timestamp: new Date().toISOString(),
          notes: 'Initial smart care tasks generated on plant onboarding.',
          metadata: { source: 'createPlant' }
        });
      }

      res.status(201).json({
        success: true,
        message: 'Plant added successfully',
        data: {
          plant,
          product,
          tasks
        }
      });
    } catch (error) {
      console.error('Error creating plant:', error);
      res.status(500).json({ success: false, message: 'Failed to add plant' });
    }
  }

  static async getPlantDetails(req, res) {
    try {
      const plant = await PlantDashboardModel.getUserPlant(req.user.id, req.params.plantId);
      if (!plant) {
        return res.status(404).json({ success: false, message: 'Plant not found' });
      }

      const productResponse = await ProductModel.getProductById(plant.plant_id);
      const product = formatProduct(productResponse);
      const tasks = await PlantDashboardModel.listTasksForPlant(req.user.id, plant.id);
      const diagnoses = await PlantDashboardModel.listDiagnoses(plant.id);
      const latestWeather = await PlantDashboardModel.getLatestWeather(req.user.id);

      res.json({
        success: true,
        data: {
          ...plant,
          product,
          tasks,
          diagnoses,
          latestWeather
        }
      });
    } catch (error) {
      console.error('Error fetching plant details:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch plant details' });
    }
  }

  static async updatePlant(req, res) {
    try {
      const plant = await PlantDashboardModel.getUserPlant(req.user.id, req.params.plantId);
      if (!plant) {
        return res.status(404).json({ success: false, message: 'Plant not found' });
      }

      const allowedUpdates = sanitizePlantUpdatePayload(req.body || {});

      let updatedPlant;
      try {
        updatedPlant = await PlantDashboardModel.updateUserPlant(plant.id, req.user.id, allowedUpdates);
      } catch (error) {
        if (!isSchemaColumnError(error)) throw error;

        const fallbackUpdates = {};
        ['nickname', 'location', 'purchase_date', 'last_watered', 'health_status'].forEach((field) => {
          if (allowedUpdates[field] !== undefined) fallbackUpdates[field] = allowedUpdates[field];
        });
        updatedPlant = await PlantDashboardModel.updateUserPlant(plant.id, req.user.id, fallbackUpdates);
      }

      res.json({ success: true, message: 'Plant updated successfully', data: updatedPlant });
    } catch (error) {
      console.error('Error updating plant:', error);
      res.status(500).json({ success: false, message: 'Failed to update plant' });
    }
  }

  static async completeTask(req, res) {
    try {
      const plant = await PlantDashboardModel.getUserPlant(req.user.id, req.params.plantId);
      if (!plant) {
        return res.status(404).json({ success: false, message: 'Plant not found' });
      }

      const task = await PlantDashboardModel.getTaskById(req.params.taskId);
      if (!task || task.user_plant_id !== plant.id) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      const completedTask = await PlantDashboardModel.completeTask(task.id);
      const productResponse = await ProductModel.getProductById(plant.plant_id);
      const product = formatProduct(productResponse) || {};

      if (String(completedTask.task_type).toUpperCase() === 'WATER') {
        await PlantDashboardModel.updateUserPlant(plant.id, req.user.id, {
          last_watered: completedTask.completed_at
        });
      }

      const weather = plant.location ? await PlantDashboardModel.getLatestWeather(req.user.id) : null;
      const latestDoneTask = await PlantDashboardModel.getLatestCompletedTask(plant.id, completedTask.task_type);
      const smartTaskPayload = buildSmartTaskPayload({
        plant,
        product,
        weather,
        taskType: completedTask.task_type,
        lastCompletedTask: latestDoneTask || completedTask,
        referenceDate: new Date(completedTask.completed_at)
      });

      let nextTask = await PlantDashboardModel.getPendingTaskByType(plant.id, smartTaskPayload.task_type);
      if (nextTask) {
        nextTask = await PlantDashboardModel.updateTask(nextTask.id, {
          due_date: smartTaskPayload.due_date,
          priority: smartTaskPayload.priority
        });
      } else {
        nextTask = await PlantDashboardModel.createPlantTask({
          user_plant_id: smartTaskPayload.user_plant_id,
          task_type: smartTaskPayload.task_type,
          due_date: smartTaskPayload.due_date,
          status: smartTaskPayload.status,
          priority: smartTaskPayload.priority
        });
      }

      await PlantDashboardModel.createCareLog({
        user_id: req.user.id,
        user_plant_id: plant.id,
        task_id: completedTask.id,
        task_type: completedTask.task_type,
        status: 'DONE',
        timestamp: completedTask.completed_at,
        notes: `Task completed. Next ${completedTask.task_type} scheduled adaptively.`,
        metadata: {
          interval_days: smartTaskPayload.interval_days,
          reasons: smartTaskPayload.reasons
        }
      });

      if (String(completedTask.task_type).toUpperCase() === 'WATER') {
        const email = await getUserEmail(req.user.id);
        if (email) {
          await notifyPlantEvent({
            userId: req.user.id,
            email,
            type: 'watering_completed',
            title: `Watering completed for ${plant.nickname || product.name || 'your plant'}`,
            message: `Great job. Next watering is now planned for ${new Date(nextTask.due_date).toLocaleDateString('en-IN')}.`,
            relatedEntityId: plant.id,
            headline: 'Task completed',
            actions: ['Track moisture daily', 'Follow upcoming reminders'],
            plantName: plant.nickname || product.name || 'Plant'
          });
        }
      }

      res.json({
        success: true,
        message: 'Task completed',
        data: {
          completedTask,
          nextTask
        }
      });
    } catch (error) {
      console.error('Error completing task:', error);
      res.status(500).json({ success: false, message: 'Failed to complete task' });
    }
  }

  static async refreshWeather(req, res) {
    try {
      const plant = await PlantDashboardModel.getUserPlant(req.user.id, req.params.plantId);
      if (!plant) {
        return res.status(404).json({ success: false, message: 'Plant not found' });
      }

      const location = req.body.location || plant.location;
      if (!location) {
        return res.status(400).json({ success: false, message: 'Plant location is required for weather adaptation' });
      }

      const weather = await getWeatherForLocation(location);
      const cachedWeather = await PlantDashboardModel.upsertWeatherCache({
        user_id: req.user.id,
        location: weather.location,
        temperature: weather.temperature,
        humidity: weather.humidity,
        condition: weather.condition,
        fetched_at: weather.fetchedAt,
        raw_response: weather.rawResponse
      });

      const adjustment = getWeatherWateringAdjustment(weather);
      const futureWaterTasks = await PlantDashboardModel.getPendingFutureTasks(plant.id, 'WATER');
      const updatedTasks = [];

      for (const task of futureWaterTasks) {
        const shiftedTask = adjustTaskDate(task, adjustment.shiftDays);
        shiftedTask.priority = adjustment.priority;
        const updatedTask = await PlantDashboardModel.updateTask(task.id, {
          due_date: shiftedTask.due_date,
          priority: shiftedTask.priority
        });
        updatedTasks.push(updatedTask);
      }

      res.json({
        success: true,
        message: 'Weather rules applied to future watering tasks',
        data: {
          weather: cachedWeather,
          adjustment,
          updatedTasks
        }
      });
    } catch (error) {
      console.error('Error refreshing weather:', error);
      if (error?.message && error.message.includes('Unable to resolve weather location')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({ success: false, message: 'Failed to refresh weather' });
    }
  }

  static async generateSmartSchedule(req, res) {
    try {
      const referenceDate = getReferenceDate(req);
      const requestedHorizon = Number(req.query?.horizon_days || 56);
      const scheduleHorizonDays = Number.isFinite(requestedHorizon)
        ? Math.max(14, Math.min(120, Math.round(requestedHorizon)))
        : 56;
      const plant = await PlantDashboardModel.getUserPlant(req.user.id, req.params.plantId);
      if (!plant) {
        return res.status(404).json({ success: false, message: 'Plant not found' });
      }

      const productResponse = await ProductModel.getProductById(plant.plant_id);
      const product = formatProduct(productResponse) || {};

      let weather = await PlantDashboardModel.getLatestWeather(req.user.id);
      if (plant.location && (!weather || req.query.refresh_weather === 'true')) {
        weather = await getWeatherForLocation(plant.location);
        await PlantDashboardModel.upsertWeatherCache({
          user_id: req.user.id,
          location: weather.location,
          temperature: weather.temperature,
          humidity: weather.humidity,
          condition: weather.condition,
          fetched_at: weather.fetchedAt,
          raw_response: weather.rawResponse
        });
      }

      const taskTypes = ['WATER', 'FERTILIZE', 'MONITOR'];
      const generatedTasks = [];
      const notifications = [];
      const email = await getUserEmail(req.user.id);
      const allPlantTasks = await PlantDashboardModel.listTasksForPlant(req.user.id, plant.id);

      for (const taskType of taskTypes) {
        const latestCompletedTask = await PlantDashboardModel.getLatestCompletedTask(plant.id, taskType);
        const smartTask = buildSmartTaskPayload({
          plant,
          product,
          weather,
          taskType,
          lastCompletedTask: latestCompletedTask,
          referenceDate
        });

        const pendingTasksByType = allPlantTasks
          .filter((task) => String(task.task_type || '').toUpperCase() === taskType && String(task.status || '').toUpperCase() === 'PENDING')
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

        let pendingTask = pendingTasksByType[0] || null;
        if (pendingTask) {
          pendingTask = await PlantDashboardModel.updateTask(pendingTask.id, {
            due_date: smartTask.due_date,
            priority: smartTask.priority
          });
          pendingTasksByType[0] = pendingTask;
        } else {
          pendingTask = await PlantDashboardModel.createPlantTask({
            user_plant_id: smartTask.user_plant_id,
            task_type: smartTask.task_type,
            due_date: smartTask.due_date,
            status: smartTask.status,
            priority: smartTask.priority
          });
          pendingTasksByType.push(pendingTask);
          allPlantTasks.push(pendingTask);
        }

        generatedTasks.push({
          ...pendingTask,
          computed_interval_days: smartTask.interval_days,
          reasons: smartTask.reasons
        });

        const safeInterval = Math.max(1, Number(smartTask.interval_days) || 1);
        const desiredCount = Math.max(1, Math.min(12, Math.ceil(scheduleHorizonDays / safeInterval)));
        const firstDueTime = new Date(smartTask.due_date).getTime();

        for (let slot = 1; slot < desiredCount; slot += 1) {
          const slotDueDate = new Date(firstDueTime + (slot * safeInterval * DAY_MS)).toISOString();
          const slotTask = pendingTasksByType[slot] || null;

          let upsertedTask;
          if (slotTask) {
            upsertedTask = await PlantDashboardModel.updateTask(slotTask.id, {
              due_date: slotDueDate,
              priority: 'LOW'
            });
            pendingTasksByType[slot] = upsertedTask;
          } else {
            upsertedTask = await PlantDashboardModel.createPlantTask({
              user_plant_id: smartTask.user_plant_id,
              task_type: smartTask.task_type,
              due_date: slotDueDate,
              status: smartTask.status,
              priority: 'LOW'
            });
            pendingTasksByType.push(upsertedTask);
            allPlantTasks.push(upsertedTask);
          }

          generatedTasks.push({
            ...upsertedTask,
            computed_interval_days: safeInterval,
            reasons: [`Recurring ${taskType.toLowerCase()} slot ${slot + 1} based on ${safeInterval}-day interval.`]
          });
        }

        await PlantDashboardModel.createCareLog({
          user_id: req.user.id,
          user_plant_id: plant.id,
          task_id: pendingTask.id,
          task_type: taskType,
          status: 'GENERATED',
          timestamp: referenceDate.toISOString(),
          notes: 'Smart schedule generated with adaptive rules.',
          metadata: {
            reasons: smartTask.reasons,
            interval_days: smartTask.interval_days
          }
        });

        if (!email) continue;

        const hoursToDue = (new Date(pendingTask.due_date).getTime() - referenceDate.getTime()) / (1000 * 60 * 60);
        const profile = getPlantProfile(plant, product);
        const weatherCondition = String(weather?.condition || '').toLowerCase();
        const isRainDelay = taskType === 'WATER' && profile.is_outdoor && (weatherCondition.includes('rain') || weatherCondition.includes('shower'));
        const highSoilMoisture = taskType === 'WATER' && profile.soil_moisture != null && profile.soil_moisture >= 70;
        if (highSoilMoisture) continue;

        if (isRainDelay && hoursToDue <= 24) {
          const delayedDueDate = new Date(new Date(pendingTask.due_date).getTime() + (24 * 60 * 60 * 1000)).toISOString();
          await PlantDashboardModel.updateTask(pendingTask.id, { due_date: delayedDueDate, priority: 'LOW' });
        }

        let notificationType = null;
        let title = '';
        let message = '';
        let priority = 'LOW';

        if (hoursToDue > 24 && hoursToDue <= 48) {
          notificationType = 'task_reminder';
          title = `${taskType} reminder for ${plant.nickname || product.name || 'your plant'}`;
          message = `Upcoming ${taskType.toLowerCase()} task due in about 1 day.`;
          priority = 'LOW';
        } else if (hoursToDue <= 24 && hoursToDue >= 0) {
          notificationType = 'task_due_now';
          title = `${taskType} task due now for ${plant.nickname || product.name || 'your plant'}`;
          message = `Your ${taskType.toLowerCase()} task is due today.`;
          priority = 'MEDIUM';
        }

        if (!notificationType) continue;

        const alreadyNotified = await PlantDashboardModel.hasRecentNotification(req.user.id, notificationType, pendingTask.id, 20);
        if (alreadyNotified) continue;

        const notification = await notifyPlantEvent({
          userId: req.user.id,
          email,
          type: notificationType,
          title,
          message,
          relatedEntityId: pendingTask.id,
          headline: 'Plant care reminder',
          actions: [`Priority: ${priority}`, 'Open dashboard', 'Mark task when done'],
          plantName: plant.nickname || product.name || 'Plant'
        });
        notifications.push(notification);

        await PlantDashboardModel.createCareLog({
          user_id: req.user.id,
          user_plant_id: plant.id,
          task_id: pendingTask.id,
          task_type: taskType,
          status: 'NOTIFIED',
          timestamp: new Date().toISOString(),
          notes: `Notification sent (${notificationType}) with ${priority} priority.`,
          metadata: { notification_type: notificationType, priority }
        });
      }

      res.json({
        success: true,
        message: 'Smart schedule generated',
        data: {
          reference_date: referenceDate.toISOString(),
          horizon_days: scheduleHorizonDays,
          weather,
          tasks: generatedTasks,
          notifications
        }
      });
    } catch (error) {
      console.error('Error generating smart schedule:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to generate smart schedule' });
    }
  }

  static async detectMissedTasks(req, res) {
    try {
      const referenceDate = getReferenceDate(req);
      const plantId = req.params.plantId || null;
      const missedTasks = await PlantDashboardModel.listPendingTasksBefore(req.user.id, referenceDate.toISOString(), plantId);
      const rescheduled = [];
      const escalations = [];
      const userEmail = await getUserEmail(req.user.id);

      for (const task of missedTasks) {
        const marked = await PlantDashboardModel.markTaskMissed(task.id);

        const plant = await PlantDashboardModel.getUserPlant(req.user.id, task.user_plant_id);
        if (!plant) continue;

        const productResponse = await ProductModel.getProductById(plant.plant_id);
        const product = formatProduct(productResponse) || {};
        const weather = await PlantDashboardModel.getLatestWeather(req.user.id);
        const latestCompletedTask = await PlantDashboardModel.getLatestCompletedTask(plant.id, task.task_type);

        const smartTask = buildSmartTaskPayload({
          plant,
          product,
          weather,
          taskType: task.task_type,
          lastCompletedTask: latestCompletedTask,
          referenceDate
        });

        const newTask = await PlantDashboardModel.createPlantTask({
          user_plant_id: plant.id,
          task_type: smartTask.task_type,
          due_date: smartTask.due_date,
          status: 'PENDING',
          priority: 'HIGH'
        });
        rescheduled.push({ missed: marked, next: newTask, reasons: smartTask.reasons });

        await PlantDashboardModel.createCareLog({
          user_id: req.user.id,
          user_plant_id: plant.id,
          task_id: task.id,
          task_type: task.task_type,
          status: 'MISSED',
          timestamp: referenceDate.toISOString(),
          notes: 'Task was automatically marked missed and rescheduled.',
          metadata: { rescheduled_task_id: newTask.id }
        });

        const logs = await PlantDashboardModel.listCareLogs(req.user.id, { userPlantId: plant.id, limit: 120 });
        const insights = buildBehaviorInsights(logs);

        if (insights.missed_tasks >= 2) {
          escalations.push({
            plant_id: plant.id,
            missed_tasks: insights.missed_tasks,
            suggestion: insights.suggestions[0] || 'Consider adjusting your schedule for better consistency.'
          });

          if (userEmail) {
            const alreadyNotified = await PlantDashboardModel.hasRecentNotification(req.user.id, 'task_overdue', task.id, 12);
            if (!alreadyNotified) {
              await notifyPlantEvent({
                userId: req.user.id,
                email: userEmail,
                type: 'task_overdue',
                title: `Overdue ${task.task_type} task for ${plant.nickname || product.name || 'your plant'}`,
                message: `${task.task_type} was missed. A new smart schedule has been created automatically.`,
                relatedEntityId: task.id,
                headline: 'Overdue care task',
                actions: insights.suggestions.length ? insights.suggestions : ['Open care dashboard now'],
                plantName: plant.nickname || product.name || 'Plant'
              });
            }
          }
        }
      }

      res.json({
        success: true,
        message: 'Missed tasks processed',
        data: {
          reference_date: referenceDate.toISOString(),
          missed_count: missedTasks.length,
          rescheduled,
          escalations
        }
      });
    } catch (error) {
      console.error('Error detecting missed tasks:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to detect missed tasks' });
    }
  }

  static async skipTask(req, res) {
    try {
      const plant = await PlantDashboardModel.getUserPlant(req.user.id, req.params.plantId);
      if (!plant) {
        return res.status(404).json({ success: false, message: 'Plant not found' });
      }

      const task = await PlantDashboardModel.getTaskById(req.params.taskId);
      if (!task || task.user_plant_id !== plant.id) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      const skippedTask = await PlantDashboardModel.updateTask(task.id, {
        status: 'MISSED',
        priority: 'MEDIUM'
      });

      await PlantDashboardModel.createCareLog({
        user_id: req.user.id,
        user_plant_id: plant.id,
        task_id: task.id,
        task_type: task.task_type,
        status: 'SKIPPED',
        timestamp: new Date().toISOString(),
        notes: 'Task skipped by user.',
        metadata: { source: 'skipTask' }
      });

      res.json({ success: true, message: 'Task skipped', data: skippedTask });
    } catch (error) {
      console.error('Error skipping task:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to skip task' });
    }
  }

  static async getNotifications(req, res) {
    try {
      const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 30));
      const unreadOnly = req.query.unread_only === 'true';
      const notifications = await PlantDashboardModel.listNotifications(req.user.id, { limit, unreadOnly });

      res.json({
        success: true,
        data: {
          notifications,
          unread_count: notifications.filter((item) => !item.is_read).length
        }
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch notifications' });
    }
  }

  static async getCareHistory(req, res) {
    try {
      const filters = {
        userPlantId: req.query.plant_id || null,
        taskType: req.query.task_type || null,
        fromDate: req.query.from || null,
        toDate: req.query.to || null,
        limit: Math.max(1, Math.min(500, Number(req.query.limit) || 200))
      };

      const logs = await PlantDashboardModel.listCareLogs(req.user.id, filters);
      const analytics = buildBehaviorInsights(logs);

      res.json({
        success: true,
        data: {
          timeline: logs,
          analytics,
          indicators: {
            streak_label: analytics.streak > 0 ? `${analytics.streak}-task streak` : 'No active streak',
            missed_label: analytics.missed_tasks > 0 ? `${analytics.missed_tasks} missed tasks` : 'No missed tasks'
          }
        }
      });
    } catch (error) {
      console.error('Error fetching care history:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch care history' });
    }
  }

  static async diagnosePlant(req, res) {
    try {
      const plant = await PlantDashboardModel.getUserPlant(req.user.id, req.params.plantId);
      if (!plant) {
        return res.status(404).json({ success: false, message: 'Plant not found' });
      }

      const productResponse = await ProductModel.getProductById(plant.plant_id);
      const product = formatProduct(productResponse) || {};
      const imagePayload = parseImagePayload(req.body || {});

      if (!imagePayload?.imageBase64) {
        return res.status(400).json({ success: false, message: 'A base64 encoded plant image is required' });
      }

      const diagnosis = await analyzePlantImage({
        imageBase64: imagePayload.imageBase64,
        mimeType: imagePayload.mimeType,
        plantName: plant.nickname || product.name || 'Plant',
        location: plant.location || ''
      });

      const confidenceState = diagnosis.confidence < 60 ? 'LOW_CONFIDENCE' : 'CONFIRMED';
      const diagnosisRecord = await PlantDashboardModel.createDiagnosis({
        user_plant_id: plant.id,
        image_url: imagePayload.imageUrl,
        disease: diagnosis.disease,
        confidence: diagnosis.confidence,
        severity: diagnosis.severity,
        raw_response: diagnosis.raw_response,
        status: 'ACTIVE'
      });

      if (diagnosis.confidence < 60) {
        await notifyPlantEvent({
          userId: req.user.id,
          email: (await UserModel.getUserDetailsById(req.user.id)).email,
          type: 'plant_diagnosis_low_confidence',
          title: `Low confidence diagnosis for ${plant.nickname || product.name || 'your plant'}`,
          message: 'Gemini returned a low-confidence result. Please upload a clearer image and retry.',
          relatedEntityId: diagnosisRecord.id,
          headline: 'Diagnosis needs another scan',
          actions: ['Retry with a clearer image', 'Use brighter lighting'],
          plantName: plant.nickname || product.name || 'Plant'
        });

        return res.json({
          success: true,
          data: {
            diagnosis: diagnosisRecord,
            confidence_state: confidenceState,
            message: 'Diagnosis confidence is too low. Please retry with a clearer image.'
          }
        });
      }

      const plan = buildDiagnosisPlan(diagnosis, plant, product);
      const email = (await UserModel.getUserDetailsById(req.user.id)).email;
      const taskUpdates = [];
      const createdTasks = [];
      const notifications = [];

      if (plan.healthStatus) {
        await PlantDashboardModel.updateUserPlant(plant.id, req.user.id, {
          health_status: plan.healthStatus
        });
      }

      for (const action of plan.actions) {
        if (action.type === 'adjust_tasks' && action.task_type === 'WATER') {
          const futureWaterTasks = await PlantDashboardModel.getPendingFutureTasks(plant.id, 'WATER');
          for (const task of futureWaterTasks) {
            const updatedTask = await PlantDashboardModel.updateTask(task.id, {
              due_date: adjustTaskDate(task, action.shift_days).due_date,
              priority: 'HIGH'
            });
            taskUpdates.push(updatedTask);
          }
        }

        if (action.type === 'create_task') {
          const dueDate = new Date(Date.now() + (action.due_days * 24 * 60 * 60 * 1000)).toISOString();
          const createdTask = await PlantDashboardModel.createPlantTask({
            user_plant_id: plant.id,
            task_type: action.task_type,
            due_date: dueDate,
            status: 'PENDING',
            priority: action.priority || 'MEDIUM'
          });
          createdTasks.push(createdTask);
        }

        if (action.type === 'notify') {
          const notification = await notifyPlantEvent({
            userId: req.user.id,
            email,
            type: 'plant_disease_action',
            title: action.title,
            message: action.message,
            relatedEntityId: diagnosisRecord.id,
            headline: 'Plant action required',
            actions: [action.title],
            plantName: plant.nickname || product.name || 'Plant'
          });
          notifications.push(notification);
        }
      }

      await notifyPlantEvent({
        userId: req.user.id,
        email,
        type: 'plant_diagnosis',
        title: `Plant diagnosis detected: ${diagnosis.disease}`,
        message: `Gemini identified ${diagnosis.disease} with ${diagnosis.confidence}% confidence and ${diagnosis.severity} severity.`,
        relatedEntityId: diagnosisRecord.id,
        headline: 'Diagnosis detected',
        actions: plan.careActions,
        plantName: plant.nickname || product.name || 'Plant'
      });

      res.json({
        success: true,
        data: {
          diagnosis: diagnosisRecord,
          confidence_state: confidenceState,
          plan: {
            disease: plan.disease,
            severity: plan.severity,
            care_actions: plan.careActions,
            health_status: plan.healthStatus,
            actions: plan.actions
          },
          createdTasks,
          updatedTasks: taskUpdates,
          notifications
        }
      });
    } catch (error) {
      console.error('Error diagnosing plant:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to diagnose plant' });
    }
  }

  static async markRecovered(req, res) {
    try {
      const plant = await PlantDashboardModel.getUserPlant(req.user.id, req.params.plantId);
      if (!plant) {
        return res.status(404).json({ success: false, message: 'Plant not found' });
      }

      const productResponse = await ProductModel.getProductById(plant.plant_id);
      const product = formatProduct(productResponse) || {};
      const diagnoses = await PlantDashboardModel.resolveActiveDiagnoses(plant.id);
      const updatedPlant = await PlantDashboardModel.updateUserPlant(plant.id, req.user.id, {
        health_status: 'HEALTHY'
      });

      const futureTasks = await PlantDashboardModel.listTasksForPlant(req.user.id, plant.id);
      const normalizedTasks = [];
      for (const task of futureTasks) {
        if (task.status !== 'PENDING') continue;

        const nextTask = buildNextRecurringTask({ ...task, completed_at: new Date().toISOString() }, product, new Date());
        if (!nextTask) continue;

        const updatedTask = await PlantDashboardModel.updateTask(task.id, {
          due_date: nextTask.due_date,
          priority: nextTask.priority
        });
        normalizedTasks.push(updatedTask);
      }

      const email = (await UserModel.getUserDetailsById(req.user.id)).email;
      await notifyPlantEvent({
        userId: req.user.id,
        email,
        type: 'plant_recovered',
        title: `Recovery recorded for ${plant.nickname || product.name || 'your plant'}`,
        message: 'The active diagnosis has been resolved and the care schedule has been normalized.',
        relatedEntityId: plant.id,
        headline: 'Plant recovered',
        actions: ['Continue regular care', 'Keep monitoring the plant'],
        plantName: plant.nickname || product.name || 'Plant'
      });

      res.json({
        success: true,
        message: 'Plant recovery recorded',
        data: {
          plant: updatedPlant,
          resolvedDiagnoses: diagnoses,
          normalizedTasks
        }
      });
    } catch (error) {
      console.error('Error marking plant recovered:', error);
      res.status(500).json({ success: false, message: 'Failed to normalize plant recovery' });
    }
  }
}

module.exports = PlantCareController;