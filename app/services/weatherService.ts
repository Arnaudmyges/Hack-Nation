const OWM_KEY = process.env.EXPO_PUBLIC_OWM_KEY;

export async function fetchWeather(lat: number, lng: number) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OWM_KEY}&units=metric&lang=fr`
  );
  const data = await res.json();
  
  return {
    temp: Math.round(data.main.temp),
    condition: classifyCondition(data.weather[0].id, data.main.temp),
    description: data.weather[0].description,
    icon: data.weather[0].icon
  };
}

function classifyCondition(weatherId: number, temp: number): string {
  if (weatherId >= 200 && weatherId < 600) return 'rain';
  if (weatherId >= 800 && weatherId === 800) return temp < 15 ? 'cold' : 'sunny';
  if (temp < 12) return 'cold';
  return 'overcast';
}