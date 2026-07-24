const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_SCHEDULE_HORIZON_DAYS = 56;

const CARE_INTERVALS = {
  easy: { water: 7, fertilize: 30, monitor: 7, repot: 90 },
  moderate: { water: 5, fertilize: 21, monitor: 5, repot: 75 },
  difficult: { water: 3, fertilize: 14, monitor: 3, repot: 60 }
};

const normalizeLevel = (level) => {
  const value = String(level || '').toLowerCase();
  if (value === 'moderate' || value === 'medium') return 'moderate';
  if (value === 'difficult' || value === 'hard') return 'difficult';
  return 'easy';
};

const normalizeActions = (actions = []) => {
  return [...new Set(
    actions
      .filter(Boolean)
      .map((action) => String(action).trim().toLowerCase())
      .filter(Boolean)
  )];
};

const addDays = (date, days) => new Date(date.getTime() + (days * DAY_MS));

const buildRecurringTaskSeries = ({ userPlantId, taskType, intervalDays, priority = 'MEDIUM', referenceDate = new Date(), horizonDays = DEFAULT_SCHEDULE_HORIZON_DAYS }) => {
  const safeInterval = Math.max(1, Number(intervalDays) || 1);
  const safeHorizon = Math.max(safeInterval, Number(horizonDays) || DEFAULT_SCHEDULE_HORIZON_DAYS);
  const series = [];

  for (let days = safeInterval; days <= safeHorizon; days += safeInterval) {
    series.push({
      user_plant_id: userPlantId,
      task_type: taskType,
      due_date: addDays(referenceDate, days).toISOString(),
      status: 'PENDING',
      priority
    });
  }

  if (!series.length) {
    series.push({
      user_plant_id: userPlantId,
      task_type: taskType,
      due_date: addDays(referenceDate, safeInterval).toISOString(),
      status: 'PENDING',
      priority
    });
  }

  return series;
};

const getBaseIntervals = (product = {}) => {
  const careLevel = normalizeLevel(product.care_level);
  return CARE_INTERVALS[careLevel] || CARE_INTERVALS.easy;
};

const buildInitialTaskPlan = (userPlant, product, referenceDate = new Date(), options = {}) => {
  const horizonDays = Number(options.horizonDays) || DEFAULT_SCHEDULE_HORIZON_DAYS;
  const intervals = getBaseIntervals(product);

  return [
    ...buildRecurringTaskSeries({
      userPlantId: userPlant.id,
      taskType: 'WATER',
      intervalDays: intervals.water,
      priority: 'MEDIUM',
      referenceDate,
      horizonDays
    }),
    ...buildRecurringTaskSeries({
      userPlantId: userPlant.id,
      taskType: 'FERTILIZE',
      intervalDays: intervals.fertilize,
      priority: 'LOW',
      referenceDate,
      horizonDays
    }),
    ...buildRecurringTaskSeries({
      userPlantId: userPlant.id,
      taskType: 'MONITOR',
      intervalDays: intervals.monitor,
      priority: 'MEDIUM',
      referenceDate,
      horizonDays
    })
  ];
};

const buildNextRecurringTask = (task, product, referenceDate = new Date()) => {
  const intervals = getBaseIntervals(product);
  const baseDueDate = task.completed_at ? new Date(task.completed_at) : referenceDate;

  switch (String(task.task_type || '').toUpperCase()) {
    case 'WATER':
      return {
        user_plant_id: task.user_plant_id,
        task_type: 'WATER',
        due_date: addDays(baseDueDate, intervals.water).toISOString(),
        status: 'PENDING',
        priority: 'MEDIUM'
      };
    case 'FERTILIZE':
      return {
        user_plant_id: task.user_plant_id,
        task_type: 'FERTILIZE',
        due_date: addDays(baseDueDate, intervals.fertilize).toISOString(),
        status: 'PENDING',
        priority: 'LOW'
      };
    case 'MONITOR':
      return {
        user_plant_id: task.user_plant_id,
        task_type: 'MONITOR',
        due_date: addDays(baseDueDate, intervals.monitor).toISOString(),
        status: 'PENDING',
        priority: 'MEDIUM'
      };
    case 'REPOT':
      return {
        user_plant_id: task.user_plant_id,
        task_type: 'REPOT',
        due_date: addDays(baseDueDate, intervals.repot).toISOString(),
        status: 'PENDING',
        priority: 'HIGH'
      };
    default:
      return null;
  }
};

const getWeatherWateringAdjustment = (weather = {}) => {
  const temperature = Number(weather.temperature ?? weather.temperature_2m ?? 0);
  const humidity = Number(weather.humidity ?? weather.relative_humidity_2m ?? 0);
  const condition = String(weather.condition || '').toLowerCase();

  if (condition.includes('rain') || condition.includes('shower') || humidity >= 80) {
    return { shiftDays: 2, priority: 'HIGH', note: 'Watering delayed because of humid or rainy conditions.' };
  }

  if (temperature >= 32 || (temperature >= 28 && humidity <= 40)) {
    return { shiftDays: -1, priority: 'HIGH', note: 'Watering accelerated because of hot and dry weather.' };
  }

  return { shiftDays: 0, priority: 'MEDIUM', note: 'Weather does not require a watering schedule change.' };
};

const adjustTaskDate = (task, shiftDays) => {
  const dueDate = new Date(task.due_date);
  return {
    ...task,
    due_date: addDays(dueDate, shiftDays).toISOString(),
    priority: shiftDays !== 0 ? 'HIGH' : task.priority
  };
};

const buildDiagnosisPlan = (insight = {}, userPlant = {}, product = {}) => {
  const disease = String(insight.disease || 'unknown').trim() || 'unknown';
  const confidence = Number.isFinite(Number(insight.confidence)) ? Math.max(0, Math.min(100, Number(insight.confidence))) : 0;
  const severity = ['low', 'medium', 'high'].includes(String(insight.severity || '').toLowerCase())
    ? String(insight.severity).toLowerCase()
    : 'medium';
  const careActions = normalizeActions(insight.care_actions || []);

  const isHealthy = ['healthy', 'no disease', 'no issues', 'normal'].includes(disease.toLowerCase());
  const actions = [];
  let healthStatus = isHealthy ? 'HEALTHY' : 'AT_RISK';

  if (!isHealthy) {
    actions.push({ type: 'health_status', value: 'AT_RISK' });

    if (severity === 'high') {
      actions.push({ type: 'create_task', task_type: 'MONITOR', priority: 'HIGH', due_days: 1 });
      actions.push({ type: 'create_task', task_type: 'MONITOR', priority: 'HIGH', due_days: 3 });
    } else if (severity === 'medium') {
      actions.push({ type: 'create_task', task_type: 'MONITOR', priority: 'HIGH', due_days: 2 });
    } else {
      actions.push({ type: 'create_task', task_type: 'MONITOR', priority: 'MEDIUM', due_days: 3 });
    }
  }

  careActions.forEach((action) => {
    switch (action) {
      case 'reduce_watering':
        actions.push({ type: 'adjust_tasks', task_type: 'WATER', shift_days: 2, note: 'Reduce watering frequency.' });
        break;
      case 'increase_watering':
        actions.push({ type: 'adjust_tasks', task_type: 'WATER', shift_days: -1, note: 'Increase watering frequency.' });
        break;
      case 'increase_sunlight':
        actions.push({ type: 'notify', title: 'Move plant to sunlight', message: 'Move the plant to a brighter location for better recovery.' });
        break;
      case 'increase_monitoring':
        actions.push({ type: 'create_task', task_type: 'MONITOR', priority: 'HIGH', due_days: 1 });
        break;
      case 'isolate_plant':
        actions.push({ type: 'notify', title: 'Isolate the plant', message: 'Keep the affected plant separate from healthy plants.' });
        break;
      case 'improve_airflow':
        actions.push({ type: 'notify', title: 'Improve airflow', message: 'Open the area up for better airflow around the plant.' });
        break;
      case 'apply_fungicide':
        actions.push({ type: 'create_task', task_type: 'MONITOR', priority: 'HIGH', due_days: 1 });
        break;
      case 'fertilize_soil':
        actions.push({ type: 'create_task', task_type: 'FERTILIZE', priority: 'MEDIUM', due_days: 7 });
        break;
      case 'repot':
        actions.push({ type: 'create_task', task_type: 'REPOT', priority: 'HIGH', due_days: 4 });
        break;
      default:
        break;
    }
  });

  if (isHealthy) {
    healthStatus = 'HEALTHY';
  }

  return {
    disease,
    confidence,
    severity,
    careActions,
    healthStatus,
    actions,
    product,
    userPlant
  };
};

module.exports = {
  buildInitialTaskPlan,
  buildNextRecurringTask,
  getWeatherWateringAdjustment,
  adjustTaskDate,
  buildDiagnosisPlan,
  normalizeActions,
  getBaseIntervals,
  addDays
};