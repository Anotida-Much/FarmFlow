import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { getWeatherIcon } from "@/lib/weatherApi";

type WeatherData = {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: {
    id: number;
    main: string;
    description: string;
  }[];
  wind: {
    speed: number;
  };
  sys: {
    country: string;
  };
};

type ForecastData = {
  list: {
    dt: number;
    main: {
      temp_min: number;
      temp_max: number;
    };
    weather: {
      id: number;
      main: string;
      description: string;
    }[];
    dt_txt: string;
  }[];
};

export default function WeatherWidget() {
  // Fetch user's weather preferences
  const { data: preferences, isLoading: loadingPreferences } = useQuery({
    queryKey: ["/api/weather/preferences"],
  });
  
  // Fetch current weather
  const { data: weather, isLoading: loadingWeather } = useQuery<WeatherData>({
    queryKey: ["/api/weather/current"],
    refetchInterval: 1800000, // Refetch every 30 minutes
  });
  
  // Fetch forecast
  const { data: forecast, isLoading: loadingForecast } = useQuery<ForecastData>({
    queryKey: ["/api/weather/forecast"],
    refetchInterval: 3600000, // Refetch every hour
  });
  
  // Get daily forecast data - next 3 days
  const getDailyForecast = () => {
    if (!forecast?.list) return [];
    
    const dailyData: Record<string, any> = {};
    
    forecast.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      
      if (!dailyData[date]) {
        dailyData[date] = {
          day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          temp_min: item.main.temp_min,
          temp_max: item.main.temp_max,
          condition: item.weather[0].main,
          weatherId: item.weather[0].id
        };
      } else {
        dailyData[date].temp_min = Math.min(dailyData[date].temp_min, item.main.temp_min);
        dailyData[date].temp_max = Math.max(dailyData[date].temp_max, item.main.temp_max);
      }
    });
    
    return Object.values(dailyData).slice(0, 3); // Next 3 days
  };
  
  const dailyForecast = getDailyForecast();
  
  // Format temperature
  const formatTemp = (temp: number) => {
    const units = preferences?.units === 'imperial' ? 'F' : 'C';
    return `${Math.round(temp)}°${units}`;
  };
  
  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold dark:text-white">Weather</h3>
          <Link href="/weather">
            <a className="text-sm text-accent hover:underline dark:text-accent-light">Details</a>
          </Link>
        </div>
        
        {loadingWeather || loadingPreferences ? (
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <Skeleton className="h-16 w-16 rounded-full" />
            </div>
            <Skeleton className="h-6 w-24 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
            <div className="pt-4 mt-4 border-t space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : weather ? (
          <div className="text-center py-2">
            <p className="text-gray-500 mb-1 dark:text-gray-400">{weather.name}, {weather.sys.country}</p>
            <div className="flex items-center justify-center">
              <i className={`bi ${getWeatherIcon(weather.weather[0].id)} text-4xl text-secondary mr-2`}></i>
              <span className="text-3xl font-bold dark:text-white">{formatTemp(weather.main.temp)}</span>
            </div>
            <p className="text-gray-600 mt-1 dark:text-gray-300">{weather.weather[0].description}</p>
            
            <div className="flex justify-around mt-4 text-xs text-gray-600 dark:text-gray-400">
              <div>
                <p className="font-medium">Humidity</p>
                <p className="mt-1">{weather.main.humidity}%</p>
              </div>
              <div>
                <p className="font-medium">Wind</p>
                <p className="mt-1">
                  {preferences?.units === 'imperial' 
                    ? `${weather.wind.speed} mph` 
                    : `${weather.wind.speed} m/s`}
                </p>
              </div>
            </div>
            
            {loadingForecast ? (
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <div className="grid grid-cols-3 gap-2">
                  {dailyForecast.map((day, index) => (
                    <div key={index} className="text-center">
                      <p className="text-xs font-medium mb-1 dark:text-gray-300">{index === 0 ? 'Today' : day.day}</p>
                      <i className={`bi ${getWeatherIcon(day.weatherId)} text-lg text-secondary`}></i>
                      <p className="text-xs mt-1 dark:text-white">
                        <span className="font-medium">{formatTemp(day.temp_max)}</span> / <span className="text-gray-500 dark:text-gray-400">{formatTemp(day.temp_min)}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <i className="bi bi-cloud-slash text-3xl mb-2"></i>
            <p>Unable to load weather data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
