const DAY_MS = 24 * 60 * 60 * 1000;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toDate = (value, fallback = new Date()) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};

const addDays = (date, days) => new Date(date.getTime() + (days * DAY_MS));

const toStartOfDay = (date) => {
  const value = toDate(date);
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
};

const toDayName = (date) => {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][toDate(date).getDay()];
};

const inferWateringFrequency = (product = {}) => {
  const waterRequirement = String(product.water_requirement || '').toLowerCase();
  if (waterRequirement.includes('low')) return 7;
  if (waterRequirement.includes('high') || waterRequirement.includes('daily')) return 2;

  const careLevel = String(product.care_level || '').toLowerCase();
  if (careLevel === 'difficult') return 3;
  if (careLevel === 'moderate' || careLevel === 'medium') return 5;
  return 6;
};

const getPlantProfile = (plant = {}, product = {}) => {
  const baseWateringFrequency = Number(plant.watering_frequency_days);
  const watering_frequency_days = Number.isFinite(baseWateringFrequency) && baseWateringFrequency > 0
    ? clamp(Math.round(baseWateringFrequency), 1, 21)
    : inferWateringFrequency(product);

  const indoorOutdoor = String(plant.environment || '').toUpperCase();
  const isOutdoor = typeof plant.is_outdoor === 'boolean'
    ? plant.is_outdoor
    : indoorOutdoor === 'OUTDOOR';

  return {
    plant_id: plant.plant_id,
    plant_type: plant.plant_type || product.plant_type || 'generic',
    watering_frequency_days,
    sunlight_requirement: plant.sunlight_requirement || product.light_requirement || 'moderate',
    is_outdoor: isOutdoor,
    soil_moisture: Number.isFinite(Number(plant.soil_moisture)) ? Number(plant.soil_moisture) : null
  };
};

const getBaseTaskInterval = (taskType, profile) => {
  const type = String(taskType || '').toUpperCase();
  if (type === 'WATER') return profile.watering_frequency_days;
  if (type === 'FERTILIZE') return clamp(profile.watering_frequency_days * 4, 14, 45);
  if (type === 'MONITOR') return clamp(Math.round(profile.watering_frequency_days / 2), 2, 7);
  if (type === 'REPOT') return 90;
  return 7;
};

const getWeatherIntervalShift = (taskType, weather = {}, profile = {}) => {
  if (String(taskType || '').toUpperCase() !== 'WATER') return { shiftDays: 0, reasons: [] };

  const reasons = [];
  let shiftDays = 0;
  const temperature = Number(weather.temperature ?? weather.temperature_2m ?? 0);
  const humidity = Number(weather.humidity ?? weather.relative_humidity_2m ?? 0);
  const condition = String(weather.condition || '').toLowerCase();

  if (temperature > 35) {
    shiftDays -= 1;
    reasons.push('Hot weather detected (>35C), watering interval reduced by 1 day.');
  } else if (temperature < 20) {
    shiftDays += 1;
    reasons.push('Cool weather detected (<20C), watering interval increased by 1 day.');
  }

  if (humidity < 35) {
    shiftDays -= 1;
    reasons.push('Dry air detected, watering interval reduced by 1 day.');
  } else if (humidity > 85) {
    shiftDays += 1;
    reasons.push('Very high humidity detected, watering interval increased by 1 day.');
  }

  if (profile.is_outdoor && (condition.includes('rain') || condition.includes('shower'))) {
    shiftDays += 1;
    reasons.push('Rain expected for outdoor plant, delaying watering by 1 day.');
  }

  return { shiftDays, reasons };
};

const getCompletionShift = (lastCompletedTask) => {
  if (!lastCompletedTask?.completed_at || !lastCompletedTask?.due_date) {
    return { shiftDays: 0, reasons: [], completedLate: false };
  }

  const completedAt = toDate(lastCompletedTask.completed_at);
  const dueAt = toDate(lastCompletedTask.due_date);
  const deltaDays = (completedAt.getTime() - dueAt.getTime()) / DAY_MS;

  if (deltaDays > 0.75) {
    return {
      shiftDays: -1,
      completedLate: true,
      reasons: ['Last task was completed late, accelerating the next cycle by 1 day.']
    };
  }

  if (deltaDays < -0.75) {
    return {
      shiftDays: 1,
      completedLate: false,
      reasons: ['Last task was completed early, extending the next cycle by 1 day.']
    };
  }

  return { shiftDays: 0, reasons: [], completedLate: false };
};

const getSoilShift = (taskType, profile = {}) => {
  if (String(taskType || '').toUpperCase() !== 'WATER') return { shiftDays: 0, reasons: [] };
  if (profile.soil_moisture == null) return { shiftDays: 0, reasons: [] };

  const moisture = Number(profile.soil_moisture);
  if (moisture >= 70) {
    return { shiftDays: 2, reasons: ['Soil moisture is high, delaying watering by 2 days.'] };
  }
  if (moisture <= 25) {
    return { shiftDays: -1, reasons: ['Soil moisture is low, accelerating watering by 1 day.'] };
  }

  return { shiftDays: 0, reasons: [] };
};

const buildAdaptiveTask = ({ taskType, profile, weather, lastCompletedTask, referenceDate = new Date(), priorityHint }) => {
  const baseInterval = getBaseTaskInterval(taskType, profile);
  const weatherShift = getWeatherIntervalShift(taskType, weather, profile);
  const completionShift = getCompletionShift(lastCompletedTask);
  const soilShift = getSoilShift(taskType, profile);

  const adjustedInterval = clamp(
    baseInterval + weatherShift.shiftDays + completionShift.shiftDays + soilShift.shiftDays,
    1,
    45
  );

  const anchorBase = completionShift.completedLate
    ? toDate(referenceDate)
    : (lastCompletedTask?.completed_at ? toDate(lastCompletedTask.completed_at) : toDate(referenceDate));

  const dueDate = addDays(anchorBase, adjustedInterval);
  const allReasons = [
    `Base interval for ${taskType}: ${baseInterval} day(s).`,
    ...weatherShift.reasons,
    ...completionShift.reasons,
    ...soilShift.reasons
  ];

  const priority = priorityHint || (adjustedInterval <= 2 ? 'HIGH' : adjustedInterval <= 5 ? 'MEDIUM' : 'LOW');

  return {
    task_type: String(taskType || '').toUpperCase(),
    interval_days: adjustedInterval,
    due_date: dueDate.toISOString(),
    priority,
    reasons: allReasons
  };
};

const buildBehaviorInsights = (logs = []) => {
  const normalized = (Array.isArray(logs) ? logs : []).slice().sort((a, b) => {
    return toDate(b.timestamp || b.created_at).getTime() - toDate(a.timestamp || a.created_at).getTime();
  });

  const actionable = normalized.filter((log) => ['DONE', 'MISSED', 'SKIPPED'].includes(String(log.status || '').toUpperCase()));
  const completedCount = actionable.filter((log) => String(log.status || '').toUpperCase() === 'DONE').length;
  const missed = actionable.filter((log) => String(log.status || '').toUpperCase() === 'MISSED');

  const dayMap = new Map();
  missed.forEach((log) => {
    const day = toDayName(log.timestamp || log.created_at);
    dayMap.set(day, (dayMap.get(day) || 0) + 1);
  });

  let mostMissedDay = null;
  let mostMissedCount = 0;
  dayMap.forEach((count, day) => {
    if (count > mostMissedCount) {
      mostMissedDay = day;
      mostMissedCount = count;
    }
  });

  let streak = 0;
  for (const log of actionable) {
    if (String(log.status || '').toUpperCase() === 'DONE') streak += 1;
    else break;
  }

  const consistency_score = actionable.length ? Number((completedCount / actionable.length).toFixed(2)) : 0;
  const suggestions = [];

  if (mostMissedDay && mostMissedCount >= 2) {
    suggestions.push(`You often miss tasks on ${mostMissedDay}. Shift reminders away from that day?`);
  }

  if (missed.length >= 3) {
    suggestions.push('You missed tasks multiple times recently. Consider reducing care frequency slightly.');
  }

  return {
    total_logs: actionable.length,
    completed_tasks: completedCount,
    missed_tasks: missed.length,
    consistency_score,
    streak,
    most_frequently_missed_day: mostMissedDay,
    suggestions
  };
};

module.exports = {
  getPlantProfile,
  getBaseTaskInterval,
  buildAdaptiveTask,
  buildBehaviorInsights,
  toStartOfDay,
  addDays,
  toDayName
};
