import { jest } from '@jest/globals';
import weatherAgent from '../src/agents/weatherAgent.js';

describe('WeatherAgent', () => {
  test('should fetch weather data for a city', async () => {
    const weather = await weatherAgent.getWeather('London');
    
    expect(weather).toHaveProperty('city');
    expect(weather).toHaveProperty('temperature');
    expect(weather).toHaveProperty('description');
  });

  test('should format weather data correctly', () => {
    const mockData = {
      city: 'London',
      country: 'GB',
      temperature: 15,
      feelsLike: 13,
      humidity: 70,
      description: 'cloudy',
      windSpeed: 5,
      pressure: 1013,
    };

    const formatted = weatherAgent.formatWeatherData(mockData);
    
    expect(formatted).toContain('London');
    expect(formatted).toContain('15°C');
  });
});