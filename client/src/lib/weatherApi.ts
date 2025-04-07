// Weather icon mapping function
export function getWeatherIcon(weatherId: number): string {
  // Based on OpenWeatherMap API weather condition codes
  // https://openweathermap.org/weather-conditions
  
  // Thunderstorm
  if (weatherId >= 200 && weatherId < 300) {
    return "bi-cloud-lightning";
  }
  
  // Drizzle
  if (weatherId >= 300 && weatherId < 400) {
    return "bi-cloud-drizzle";
  }
  
  // Rain
  if (weatherId >= 500 && weatherId < 600) {
    return "bi-cloud-rain";
  }
  
  // Snow
  if (weatherId >= 600 && weatherId < 700) {
    return "bi-cloud-snow";
  }
  
  // Atmosphere (fog, mist, etc.)
  if (weatherId >= 700 && weatherId < 800) {
    return "bi-cloud-haze";
  }
  
  // Clear
  if (weatherId === 800) {
    return "bi-sun";
  }
  
  // Clouds
  if (weatherId > 800 && weatherId < 900) {
    if (weatherId === 801) {
      return "bi-cloud-sun"; // Few clouds
    } else {
      return "bi-clouds"; // More clouds
    }
  }
  
  // Default
  return "bi-cloud";
}

// Format temperature based on units
export function formatTemperature(temp: number, units: string = "metric"): string {
  return `${Math.round(temp)}°${units === "metric" ? "C" : "F"}`;
}

// Format wind speed based on units
export function formatWindSpeed(speed: number, units: string = "metric"): string {
  return units === "metric" ? `${speed} m/s` : `${speed} mph`;
}

// Get day name from timestamp
export function getDayName(timestamp: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date(timestamp * 1000).getDay()];
}

// Format date
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
