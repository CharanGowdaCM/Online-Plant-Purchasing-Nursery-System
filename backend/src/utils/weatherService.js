const WEATHER_CODE_MAP = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Freezing drizzle',
  57: 'Freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Violent rain showers',
  85: 'Snow showers',
  86: 'Snow showers',
  95: 'Thunderstorm'
};

const MOCK_WEATHER_PRESETS = [
  { temperature: 36, humidity: 28, condition: 'Clear sky' },
  { temperature: 31, humidity: 48, condition: 'Partly cloudy' },
  { temperature: 24, humidity: 86, condition: 'Rain showers' },
  { temperature: 19, humidity: 72, condition: 'Overcast' }
];

const LOCATION_ALIAS_MAP = {
  manglore: 'mangalore',
  banglore: 'bangalore',
  bengaluru: 'bangalore',
  bombay: 'mumbai',
  calcutta: 'kolkata',
  madras: 'chennai',
  trivandrum: 'thiruvananthapuram',
  pondicherry: 'puducherry',
  vizag: 'visakhapatnam'
};

const fetchJson = async (url) => {
  if (typeof fetch !== 'function') {
    throw new Error('Fetch API is unavailable in this runtime');
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather request failed with status ${response.status}`);
  }

  return response.json();
};

const normalizeLocation = (location) => {
  const raw = String(location || '').trim().replace(/\s+/g, ' ');
  if (!raw) return raw;

  const lowered = raw.toLowerCase();
  const corrected = LOCATION_ALIAS_MAP[lowered] || lowered;
  return corrected;
};

const buildLocationCandidates = (location) => {
  const original = String(location || '').trim();
  const normalized = normalizeLocation(original);
  const withoutExtraPunctuation = normalized.replace(/[.]/g, '').trim();

  const candidates = new Set();
  if (original) candidates.add(original);
  if (normalized) candidates.add(normalized);
  if (withoutExtraPunctuation) candidates.add(withoutExtraPunctuation);

  // Try first segment when users pass "city, area" or "city, state".
  const firstToken = withoutExtraPunctuation.split(',')[0]?.trim();
  if (firstToken) candidates.add(firstToken);

  return [...candidates].filter(Boolean);
};

const resolveLocation = async (location) => {
  const candidates = buildLocationCandidates(location);

  for (const candidate of candidates) {
    const query = encodeURIComponent(candidate);
    const geoData = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=en&format=json`);
    const place = geoData?.results?.[0];
    if (place) {
      return place;
    }
  }

  const suggestion = LOCATION_ALIAS_MAP[String(location || '').trim().toLowerCase()];
  if (suggestion) {
    throw new Error(`Unable to resolve weather location: ${location}. Try '${suggestion}'`);
  }

  throw new Error(`Unable to resolve weather location: ${location}. Try a full city name like 'Mangalore, Karnataka'`);
};

const getMockWeatherForLocation = (location) => {
  const normalized = normalizeLocation(location) || 'demo-location';
  const hash = normalized.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const preset = MOCK_WEATHER_PRESETS[hash % MOCK_WEATHER_PRESETS.length];

  return {
    location: String(location || 'Demo Garden'),
    latitude: null,
    longitude: null,
    temperature: preset.temperature,
    humidity: preset.humidity,
    condition: preset.condition,
    fetchedAt: new Date().toISOString(),
    rawResponse: { mock: true, preset }
  };
};

const getWeatherForLocation = async (location, options = {}) => {
  if (!location || !String(location).trim()) {
    throw new Error('Location is required for weather lookup');
  }

  if (options.forceMock) {
    return getMockWeatherForLocation(location);
  }

  try {
    const place = await resolveLocation(location);

    const weatherData = await fetchJson(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`
    );

    const current = weatherData?.current || {};

    return {
      location: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      temperature: Number(current.temperature_2m ?? 0),
      humidity: Number(current.relative_humidity_2m ?? 0),
      condition: WEATHER_CODE_MAP[current.weather_code] || 'Unknown',
      fetchedAt: new Date().toISOString(),
      rawResponse: weatherData
    };
  } catch (error) {
    if (options.allowMockFallback === false) {
      throw error;
    }
    return getMockWeatherForLocation(location);
  }
};

module.exports = {
  getWeatherForLocation,
  getMockWeatherForLocation
};