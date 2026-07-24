const supabase = require('../config/supabase');

class PlantDashboardModel {
  static async createUserPlant(payload) {
    const { data, error } = await supabase
      .from('user_plants')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createUserPlants(payloads = []) {
    if (!payloads.length) return [];

    const { data, error } = await supabase
      .from('user_plants')
      .insert(payloads)
      .select();

    if (error) throw error;
    return data || [];
  }

  static async getUserPlants(userId) {
    const { data, error } = await supabase
      .from('user_plants')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getUserPlantIds(userId) {
    const { data, error } = await supabase
      .from('user_plants')
      .select('id')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map((item) => item.id);
  }

  static async getUserPlant(userId, plantId) {
    const { data, error } = await supabase
      .from('user_plants')
      .select('*')
      .eq('id', plantId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  static async updateUserPlant(plantId, userId, updates) {
    const { data, error } = await supabase
      .from('user_plants')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', plantId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createPlantTask(payload) {
    const { data, error } = await supabase
      .from('plant_tasks')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createPlantTasks(payloads = []) {
    if (!payloads.length) return [];

    const { data, error } = await supabase
      .from('plant_tasks')
      .insert(payloads)
      .select();

    if (error) throw error;
    return data || [];
  }

  static async getProductsByIds(productIds = []) {
    if (!productIds.length) return new Map();

    const { data, error } = await supabase
      .from('products')
      .select('id, care_level, name, plant_type, water_requirement')
      .in('id', productIds);

    if (error) throw error;

    const mapped = new Map();
    (data || []).forEach((product) => {
      mapped.set(product.id, product);
    });

    return mapped;
  }

  static async listTasksForPlant(userId, plantId) {
    const { data, error } = await supabase
      .from('plant_tasks')
      .select('*')
      .eq('user_plant_id', plantId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async listTasksByUser(userId, filters = {}) {
    const plantIds = await this.getUserPlantIds(userId);
    if (!plantIds.length) return [];

    let query = supabase
      .from('plant_tasks')
      .select('*')
      .in('user_plant_id', plantIds)
      .order('due_date', { ascending: true });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.taskType) {
      query = query.eq('task_type', filters.taskType);
    }

    if (filters.fromDate) {
      query = query.gte('due_date', filters.fromDate);
    }

    if (filters.toDate) {
      query = query.lte('due_date', filters.toDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getTaskById(taskId) {
    const { data, error } = await supabase
      .from('plant_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  static async updateTask(taskId, updates) {
    const { data, error } = await supabase
      .from('plant_tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getPendingFutureTasks(userPlantId, taskType = 'WATER') {
    const { data, error } = await supabase
      .from('plant_tasks')
      .select('*')
      .eq('user_plant_id', userPlantId)
      .eq('task_type', taskType)
      .eq('status', 'PENDING')
      .gte('due_date', new Date().toISOString())
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getPendingTaskByType(userPlantId, taskType) {
    const { data, error } = await supabase
      .from('plant_tasks')
      .select('*')
      .eq('user_plant_id', userPlantId)
      .eq('task_type', taskType)
      .eq('status', 'PENDING')
      .order('due_date', { ascending: true })
      .limit(1);

    if (error) throw error;
    return data?.[0] || null;
  }

  static async getLatestCompletedTask(userPlantId, taskType) {
    const { data, error } = await supabase
      .from('plant_tasks')
      .select('*')
      .eq('user_plant_id', userPlantId)
      .eq('task_type', taskType)
      .eq('status', 'DONE')
      .order('completed_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data?.[0] || null;
  }

  static async completeTask(taskId) {
    const { data, error } = await supabase
      .from('plant_tasks')
      .update({
        status: 'DONE',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async markTasksMissed(userPlantId) {
    const { data, error } = await supabase
      .from('plant_tasks')
      .update({
        status: 'MISSED',
        priority: 'HIGH',
        updated_at: new Date().toISOString()
      })
      .eq('user_plant_id', userPlantId)
      .eq('status', 'PENDING')
      .lt('due_date', new Date().toISOString())
      .select();

    if (error) throw error;
    return data || [];
  }

  static async markTaskMissed(taskId) {
    const { data, error } = await supabase
      .from('plant_tasks')
      .update({
        status: 'MISSED',
        priority: 'HIGH',
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async listPendingTasksBefore(userId, dateIso, plantId = null) {
    let plantIds = [];

    if (plantId) {
      const plant = await this.getUserPlant(userId, plantId);
      if (!plant) return [];
      plantIds = [plant.id];
    } else {
      plantIds = await this.getUserPlantIds(userId);
    }

    if (!plantIds.length) return [];

    const { data, error } = await supabase
      .from('plant_tasks')
      .select('*')
      .in('user_plant_id', plantIds)
      .eq('status', 'PENDING')
      .lt('due_date', dateIso)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async listDiagnoses(userPlantId) {
    const { data, error } = await supabase
      .from('plant_diagnosis')
      .select('*')
      .eq('user_plant_id', userPlantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getActiveDiagnosis(userPlantId) {
    const { data, error } = await supabase
      .from('plant_diagnosis')
      .select('*')
      .eq('user_plant_id', userPlantId)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data?.[0] || null;
  }

  static async createDiagnosis(payload) {
    const { data, error } = await supabase
      .from('plant_diagnosis')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async resolveDiagnosis(diagnosisId) {
    const { data, error } = await supabase
      .from('plant_diagnosis')
      .update({
        status: 'RESOLVED',
        resolved_at: new Date().toISOString()
      })
      .eq('id', diagnosisId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async resolveActiveDiagnoses(userPlantId) {
    const { data, error } = await supabase
      .from('plant_diagnosis')
      .update({
        status: 'RESOLVED',
        resolved_at: new Date().toISOString()
      })
      .eq('user_plant_id', userPlantId)
      .eq('status', 'ACTIVE')
      .select();

    if (error) throw error;
    return data || [];
  }

  static async getLatestWeather(userId) {
    const { data, error } = await supabase
      .from('weather_cache')
      .select('*')
      .eq('user_id', userId)
      .order('fetched_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data?.[0] || null;
  }

  static async upsertWeatherCache(payload) {
    const { data, error } = await supabase
      .from('weather_cache')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async listNotifications(userId, { limit = 30, unreadOnly = false } = {}) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async hasRecentNotification(userId, type, relatedEntityId, hours = 24) {
    const threshold = new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString();
    let query = supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .gte('created_at', threshold)
      .limit(1);

    if (relatedEntityId) {
      query = query.eq('related_entity_id', relatedEntityId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return Boolean(data?.length);
  }

  static async createCareLog(payload) {
    const { data, error } = await supabase
      .from('care_logs')
      .insert([payload])
      .select()
      .single();

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return null;
      }
      throw error;
    }

    return data;
  }

  static async listCareLogs(userId, filters = {}) {
    let query = supabase
      .from('care_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(filters.limit || 200);

    if (filters.userPlantId) {
      query = query.eq('user_plant_id', filters.userPlantId);
    }

    if (filters.taskType) {
      query = query.eq('task_type', filters.taskType);
    }

    if (filters.fromDate) {
      query = query.gte('timestamp', filters.fromDate);
    }

    if (filters.toDate) {
      query = query.lte('timestamp', filters.toDate);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return [];
      }
      throw error;
    }

    return data || [];
  }
}

module.exports = PlantDashboardModel;