import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { WeatherPreference } from "@shared/schema";
import { getWeatherIcon } from "@/lib/weatherApi";

type CurrentWeather = {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  wind: {
    speed: number;
  };
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
  dt: number;
};

type ForecastData = {
  list: {
    dt: number;
    main: {
      temp: number;
      temp_min: number;
      temp_max: number;
      humidity: number;
    };
    weather: {
      id: number;
      main: string;
      description: string;
      icon: string;
    }[];
    wind: {
      speed: number;
    };
    dt_txt: string;
  }[];
  city: {
    name: string;
    country: string;
  };
};

export default function Weather() {
  const { toast } = useToast();
  const [location, setLocation] = useState("");
  const [units, setUnits] = useState("metric");
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch weather preferences
  const { data: preferences, isLoading: loadingPreferences } = useQuery<WeatherPreference>({
    queryKey: ["/api/weather/preferences"],
  });
  
  // Fetch current weather
  const { data: currentWeather, isLoading: loadingCurrent } = useQuery<CurrentWeather>({
    queryKey: ["/api/weather/current"],
    refetchInterval: 1800000, // Refetch every 30 minutes
  });
  
  // Fetch forecast
  const { data: forecast, isLoading: loadingForecast } = useQuery<ForecastData>({
    queryKey: ["/api/weather/forecast"],
    refetchInterval: 3600000, // Refetch every hour
  });
  
  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: Partial<WeatherPreference>) => {
      const response = await apiRequest("PATCH", "/api/weather/preferences", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weather/preferences"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weather/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weather/forecast"] });
      setIsEditing(false);
      toast({
        title: "Weather preferences updated",
        description: "Your weather preferences have been saved",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update preferences",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Set form values when preferences load
  useEffect(() => {
    if (preferences) {
      setLocation(preferences.location);
      setUnits(preferences.units);
    }
  }, [preferences]);
  
  const handleSavePreferences = () => {
    updatePreferencesMutation.mutate({
      location,
      units
    });
  };
  
  // Format temperature based on units
  const formatTemp = (temp: number) => {
    return `${Math.round(temp)}°${units === 'metric' ? 'C' : 'F'}`;
  };
  
  // Format wind speed based on units
  const formatWindSpeed = (speed: number) => {
    return units === 'metric' ? `${speed} m/s` : `${speed} mph`;
  };
  
  // Get day of week from timestamp
  const getDayOfWeek = (timestamp: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date(timestamp * 1000).getDay()];
  };
  
  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Create daily forecast from hourly data
  const getDailyForecast = () => {
    if (!forecast?.list) return [];
    
    const dailyData: Record<string, any> = {};
    
    forecast.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      
      if (!dailyData[date]) {
        dailyData[date] = {
          date: item.dt,
          temp_min: item.main.temp_min,
          temp_max: item.main.temp_max,
          weather: item.weather[0]
        };
      } else {
        dailyData[date].temp_min = Math.min(dailyData[date].temp_min, item.main.temp_min);
        dailyData[date].temp_max = Math.max(dailyData[date].temp_max, item.main.temp_max);
      }
    });
    
    return Object.values(dailyData).slice(0, 5); // Next 5 days
  };
  
  const dailyForecast = getDailyForecast();
  
  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold dark:text-white">Weather Forecast</h2>
        {!isEditing ? (
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={() => setIsEditing(true)}
          >
            <i className="bi bi-gear-fill mr-2"></i>
            Change Location
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-primary text-white hover:bg-primary-dark"
              onClick={handleSavePreferences}
              disabled={updatePreferencesMutation.isPending}
            >
              {updatePreferencesMutation.isPending ? (
                <div className="flex items-center">
                  <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                  Saving...
                </div>
              ) : "Save"}
            </Button>
          </div>
        )}
      </div>
      
      {isEditing ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Weather Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter city name"
                />
                <p className="text-xs text-gray-500">Enter city name (e.g., "Harare", "London")</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Units</label>
                <Select value={units} onValueChange={setUnits}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric (°C, m/s)</SelectItem>
                    <SelectItem value="imperial">Imperial (°F, mph)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
      
      {/* Current Weather */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardContent className="p-6">
              {loadingCurrent || loadingPreferences ? (
                <div className="flex flex-col items-center space-y-4">
                  <Skeleton className="w-48 h-48 rounded-full" />
                  <Skeleton className="w-40 h-8" />
                  <Skeleton className="w-32 h-6" />
                </div>
              ) : currentWeather ? (
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="flex flex-col items-center md:items-start text-center md:text-left mb-4 md:mb-0">
                    <h3 className="text-xl font-medium text-gray-600 dark:text-gray-300">
                      {currentWeather.name}, {currentWeather.sys.country}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {new Date(currentWeather.dt * 1000).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <div className="flex items-center">
                      <i className={`bi ${getWeatherIcon(currentWeather.weather[0].id)} text-5xl text-secondary mr-4`}></i>
                      <div>
                        <p className="text-4xl font-bold">{formatTemp(currentWeather.main.temp)}</p>
                        <p className="text-lg">{currentWeather.weather[0].description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Feels Like</p>
                      <p className="text-lg font-medium">{formatTemp(currentWeather.main.feels_like)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Humidity</p>
                      <p className="text-lg font-medium">{currentWeather.main.humidity}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Wind</p>
                      <p className="text-lg font-medium">{formatWindSpeed(currentWeather.wind.speed)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Pressure</p>
                      <p className="text-lg font-medium">{currentWeather.main.pressure} hPa</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="bi bi-cloud-slash text-5xl text-gray-400 mb-2"></i>
                  <p>Unable to load weather data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Weather Impact</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCurrent ? (
                <div className="space-y-3">
                  <Skeleton className="w-full h-6" />
                  <Skeleton className="w-full h-6" />
                  <Skeleton className="w-full h-6" />
                </div>
              ) : currentWeather ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-900 dark:bg-opacity-20 dark:border-blue-800">
                    <h4 className="font-medium mb-1 flex items-center">
                      <i className="bi bi-droplet-fill text-blue-500 mr-2"></i>
                      Watering Needs
                    </h4>
                    <p className="text-sm">
                      {currentWeather.main.humidity < 50 
                        ? "Low humidity. Consider increasing irrigation today."
                        : "Adequate humidity. Maintain regular watering schedule."}
                    </p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-900 dark:bg-opacity-20 dark:border-yellow-800">
                    <h4 className="font-medium mb-1 flex items-center">
                      <i className="bi bi-thermometer-sun text-yellow-500 mr-2"></i>
                      Temperature Alert
                    </h4>
                    <p className="text-sm">
                      {currentWeather.main.temp > 30 
                        ? "High temperature may stress plants. Provide shade if possible."
                        : currentWeather.main.temp < 5
                        ? "Low temperature warning. Protect sensitive crops."
                        : "Temperature is within optimal growing range."}
                    </p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-900 dark:bg-opacity-20 dark:border-green-800">
                    <h4 className="font-medium mb-1 flex items-center">
                      <i className="bi bi-wind text-green-500 mr-2"></i>
                      Field Work
                    </h4>
                    <p className="text-sm">
                      {currentWeather.wind.speed > 10 
                        ? "Strong winds. Consider postponing spraying activities."
                        : currentWeather.weather[0].main === "Rain"
                        ? "Rainy conditions. Indoor tasks recommended."
                        : "Good conditions for field work."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No weather data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>5-Day Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingForecast ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="w-full h-[150px]" />
              ))}
            </div>
          ) : dailyForecast.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {dailyForecast.map((day, index) => (
                <div 
                  key={index} 
                  className="p-4 border rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <p className="font-medium">{index === 0 ? 'Today' : getDayOfWeek(day.date)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(day.date)}</p>
                  <i className={`bi ${getWeatherIcon(day.weather.id)} text-3xl my-2 text-secondary`}></i>
                  <p className="text-sm">{day.weather.description}</p>
                  <div className="flex justify-center items-center mt-2 text-sm">
                    <span className="font-medium">{formatTemp(day.temp_max)}</span>
                    <span className="mx-1 text-gray-400">/</span>
                    <span className="text-gray-500 dark:text-gray-400">{formatTemp(day.temp_min)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="bi bi-calendar-x text-4xl mb-2"></i>
              <p>Forecast data not available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
