import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

class WeatherAgent {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = "https://api.openweathermap.org/data/2.5";
  }

  async getWeather(city) {
    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          q: city,
          appid: this.apiKey,
          units: "metric",
        },
      });

      const data = response.data;

      return {
        city: data.name,
        country: data.sys.country,
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        description: data.weather[0].description,
        windSpeed: data.wind.speed,
        pressure: data.main.pressure,
      };
    } catch (error) {
      console.error(
        "Weather API Error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to fetch weather data");
    }
  }

  formatWeatherData(weatherData) {
    return `Weather in ${weatherData.city}, ${weatherData.country}:
- Temperature: ${weatherData.temperature}°C (Feels like: ${weatherData.feelsLike}°C)
- Conditions: ${weatherData.description}
- Humidity: ${weatherData.humidity}%
- Wind Speed: ${weatherData.windSpeed} m/s
- Pressure: ${weatherData.pressure} hPa`;
  }
}

export default new WeatherAgent();
