const temp = document.getElementById("temp"),
  date = document.getElementById("date-time"),
  condition = document.getElementById("condition"),
  rain = document.getElementById("rain"),
  mainIcon = document.getElementById("icon"),
  currentLocation = document.getElementById("location"),
  clouds = document.querySelector(".clouds-percentage"),
  cloudsStatus = document.querySelector(".cp-status"),
  windSpeed = document.querySelector(".wind-speed"),
  sunRise = document.querySelector(".sun-rise"),
  sunSet = document.querySelector(".sun-set"),
  humidity = document.querySelector(".humidity"),
  visibilty = document.querySelector(".visibilty"),
  humidityStatus = document.querySelector(".humidity-status"),
  pressure = document.querySelector(".pressure"),
  pressureStatus = document.querySelector(".pressure-status"),
  visibilityStatus = document.querySelector(".visibilty-status"),
  searchForm = document.querySelector("#search"),
  search = document.querySelector("#query"),
  celciusBtn = document.querySelector(".celcius"),
  fahrenheitBtn = document.querySelector(".fahrenheit"),
  tempUnit = document.querySelectorAll(".temp-unit"),
  hourlyBtn = document.querySelector(".hourly"),
  weekBtn = document.querySelector(".week"),
  weatherCards = document.querySelector("#weather-cards"),
  hourlyCards = document.querySelector("#hourly-cards");

let currentCity = "Prešov";
let currentUnit = "c";
let hourlyorWeek = "week";

function getDateTime() {
  let now = new Date(),
    hour = now.getHours(),
    minute = now.getMinutes();

  let days = [
  "Nedeľa",
  "Pondelok",
  "Utorok",
  "Streda",
  "Štvrtok",
  "Piatok",
  "Sobota",
  ];
  if (hour < 10) {
    hour = "0" + hour;
  }
  if (minute < 10) {
    minute = "0" + minute;
  }
  let dayString = days[now.getDay()];
  return `${dayString}, ${hour}:${minute}`;
}

date.innerText = getDateTime();
setInterval(() => {
  date.innerText = getDateTime();
}, 1000);


function getWeatherData(city, unit, hourlyorWeek) {
  fetch(
    `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=2976071bd3e952aefe6d2d8daa77fd07`,
    {
      method: "GET",
    }
  )
    .then((response) => response.json())
    .then((geoData) => {
      if (geoData.length === 0) {
        alert("City not found in our database");
        return;
      }

      const { lat, lon } = geoData[0];

      const hourlyForecastPromise = fetch(
        `https://pro.openweathermap.org/data/2.5/forecast/hourly?lat=${lat}&lon=${lon}&units=${unit}&appid=2976071bd3e952aefe6d2d8daa77fd07`
      );

      const dailyForecastPromise = fetch(
        `https://api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&units=${unit}&appid=2976071bd3e952aefe6d2d8daa77fd07`
      );

      const currentWeatherPromise = fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&lang=sk&appid=2976071bd3e952aefe6d2d8daa77fd07`
      );

      return Promise.all([hourlyForecastPromise, dailyForecastPromise, currentWeatherPromise]);
    })
    .then(([hourlyResponse, dailyResponse, currentWeatherResponse]) =>
      Promise.all([hourlyResponse.json(), dailyResponse.json(), currentWeatherResponse.json()])
    )
    .then(([hourlyData, dailyData, currentWeatherData]) => {
      console.log("Hourly Data:", hourlyData);
      console.log("Daily Data:", dailyData);
      console.log("Current Weather Data:", currentWeatherData);

      const iconCode = currentWeatherData.weather[0].icon;
      const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
      mainIcon.src = iconUrl;

      changeBackground(currentWeatherData.weather[0].main);

      if (unit === "c") {
        temp.innerText = (currentWeatherData.main.temp - 273.15).toFixed(1);
      } else {
        temp.innerText = celciusToFahrenheit(currentWeatherData.main.temp - 273.15).toFixed(1);
      }

      currentLocation.innerText = currentWeatherData.name;
      clouds.innerText = currentWeatherData.clouds.all + "%";
      updateCloudsStatus(currentWeatherData.clouds.all);
      windSpeed.innerText = Math.round(currentWeatherData.wind.speed * 3.6);

      const timezoneOffset = currentWeatherData.timezone;
      const utcTime = new Date(currentWeatherData.sys.sunrise* 1000);
      const localTime = new Date(utcTime.getTime() + timezoneOffset * 1000);
      const date = new Date(localTime);
      const hours1 = date.getHours().toString().padStart(2, '0');
      const minutes1 = date.getMinutes().toString().padStart(2, '0');
      const formattedTime = `${hours1}:${minutes1}`;
      sunRise.innerText = formattedTime;

      const timezoneOffset2 = currentWeatherData.timezone;
      const utcTime2 = new Date(currentWeatherData.sys.sunset* 1000);
      const localTime2 = new Date(utcTime2.getTime() + timezoneOffset2 * 1000);
      const date2 = new Date(localTime2);
      const hours2 = date2.getHours().toString().padStart(2, '0');
      const minutes2 = date2.getMinutes().toString().padStart(2, '0');
      const formattedTime2 = `${hours2}:${minutes2}`;
      sunSet.innerText = formattedTime2;

      humidity.innerText = currentWeatherData.main.humidity + "%";
      updateHumidityStatus(currentWeatherData.main.humidity);

      visibilty.innerText = Math.round(currentWeatherData.visibility / 100) / 10;
      updateVisibiltyStatus(currentWeatherData.visibility);

      pressure.innerText = currentWeatherData.main.pressure;

      condition.innerText = currentWeatherData.weather[0].description;
      
      if (currentWeatherData.hasOwnProperty('rain')) {
        rain.innerText = "Zražky: " + currentWeatherData.rain["1h"] + " mm/h";
      }
    else{
      rain.innerText = "Zrážky: 0 mm/h";
    }
      updateForecast(currentWeatherData, dailyData, hourlyData, unit, "week");

      if (hourlyorWeek === "hourly") {
        console.log("Hourly forecast:", hourlyData);
      } else if (hourlyorWeek === "week") {
        console.log("Weekly forecast:", dailyData);
      }
    })
    .catch((err) => {
      console.error("Error fetching weather data:", err);
    });
}

function updateForecast(currentData, forecastData, hourlyData, unit, type) {
  weatherCards.innerHTML = "";
  hourlyCards.innerHTML = "";
  let numCards = 7;
 
  for (let i = 0; i < numCards; i++) {
      let card = document.createElement("div");
      card.classList.add("card");
      dayName = getDayName(forecastData.list[i].dt, i);
      var dayTemp = forecastData.list[i].temp.max-273.15;
      var nightTemp = forecastData.list[i].temp.min-273.15;
      if (unit === "f") {
        dayTemp = celciusToFahrenheit(forecastData.list[i].temp.max-273.15);
        nightTemp = celciusToFahrenheit(forecastData.list[i].temp.min-273.15);
      }
      dayTemp = Math.round(dayTemp);
      nightTemp = Math.round(nightTemp);
      const iconCode = forecastData.list[i].weather[0].icon;
      const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

      let tempUnit = "°C";
      if (unit === "f") {
        tempUnit = "°F";
      }
      card.innerHTML = `
                  <h2 class="day-name">${dayName}</h2>
              <div class="card-icon">
                <img src="${iconUrl}" class="day-icon" alt="" />
              </div>
              <div class="day-temp">
                <h2 class="temp">${dayTemp}</h2>
                <span class="temp-unit">${tempUnit}</span>
                &nbsp;
                &nbsp;
                <h2 class="temp night-temp">${nightTemp}</h2>
                <span class="temp-unit night-temp">${tempUnit}</span>
              </div>
      `;
      weatherCards.appendChild(card);
  }

  for (let x = 0; x < 24; x++) {
    let card = document.createElement("div");
    card.classList.add("card");
  
    const timezoneOffset = hourlyData.city.timezone;
  
    const utcTime = new Date(hourlyData.list[x].dt * 1000);
    const localTime = new Date(utcTime.getTime() + timezoneOffset * 1000);
  
    let localHour = localTime.getHours();
  
    let dayTemp = hourlyData.list[x].main.temp_max - 273.15;
    if (unit === "f") {
      dayTemp = celciusToFahrenheit(hourlyData.list[x].main.temp_max - 273.15);
    }
    dayTemp = Math.round(dayTemp);
  
    const iconCode = hourlyData.list[x].weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  
    let tempUnit = "°C";
    if (unit === "f") {
      tempUnit = "°F";
    }
  
    card.innerHTML = `
      <h2 class="day-name">${localHour}:00</h2>
      
      <div class="card-icon">
        <img src="${iconUrl}" class="day-icon" alt="" />
      </div>
  
      <div class="day-temp">
        <h2 class="temp">${dayTemp}</h2>
        <span class="temp-unit">${tempUnit}</span>
      </div>
    `;
  
    hourlyCards.appendChild(card);
  }
  
}

function changeBackground(condition) {
  const body = document.querySelector("body");
  console.log(condition);
  let bg = "";
  if (condition === "Clouds") {
    bg = "https://cdn.pixabay.com/photo/2022/03/06/05/30/clouds-7050884_1280.jpg";
  } else if (condition === "Clear") {
    bg = "https://cdn.pixabay.com/photo/2022/01/05/15/42/sky-6917375_1280.jpg";
  } else if (condition === "Atmosphere") {
    bg = "https://cdn.pixabay.com/photo/2023/11/29/17/51/clouds-8420083_1280.jpg";
  } else if (condition === "Snow") {
    bg = "https://cdn.pixabay.com/photo/2023/05/30/15/53/landscape-8029037_1280.jpg";
  } else if (condition === "Rain") {
    bg = "https://cdn.pixabay.com/photo/2020/07/04/06/41/clouds-5368444_1280.jpg";
  } else if (condition === "Drizzle") {
    bg = "https://cdn.pixabay.com/photo/2023/12/20/07/04/clouds-8459053_1280.jpg";   
  } else if (condition === "Thunderstorm") {
    bg = "https://cdn.pixabay.com/photo/2016/01/22/23/06/flash-1156822_1280.jpg"; 
  } else {
    bg = "https://cdn.pixabay.com/photo/2020/09/01/06/00/sky-5534319_1280.jpg";
  }
  body.style.backgroundImage = `linear-gradient( rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5) ),url(${bg})`;
}

function getDayName(date, i) {
  let day = new Date();
  index = day.getDay() + i;
  let days = [
    "Nedeľa",
    "Pondelok",
    "Utorok",
    "Streda",
    "Štvrtok",
    "Piatok",
    "Sobota",
    "Nedeľa",
    "Pondelok",
    "Utorok",
    "Streda",
    "Štvrtok",
    "Piatok",
    "Sobota",

  ];
  return days[index];
}

function updateCloudsStatus(clouds){
  if (clouds >= 0 && clouds <= 10) {
    cloudsStatus.innerText = "Jasno";
  } else if (clouds > 10 && clouds <= 25) {
    cloudsStatus.innerText = "Polojasno";
  } else if (clouds > 25 && clouds <= 50) {
    cloudsStatus.innerText = "Polooblačno";
  } else if (clouds > 50 && clouds <= 75) {
    cloudsStatus.innerText = "Oblačno";
  } else {
    cloudsStatus.innerText = "Zamračené";
  }
}

function updateHumidityStatus(humidity) {
  if (humidity <= 30) {
    humidityStatus.innerText = "Nízká";
  } else if (humidity <= 60) {
    humidityStatus.innerText = "Stredná";
  } else {
    humidityStatus.innerText = "Vysoká";
  }
}

function updateVisibiltyStatus(visibility) {
  visibility = visibility / 1000;
  if (visibility <= 0.03) {
    visibilityStatus.innerText = "Hustá hmla";
  } else if (visibility <= 0.16) {
    visibilityStatus.innerText = "Mierna hmla";
  } else if (visibility <= 0.35) {
    visibilityStatus.innerText = "Slabá hmla";
  } else if (visibility <= 1.13) {
    visibilityStatus.innerText = "Veľmi slabá hmla";
  } else if (visibility <= 2.16) {
    visibilityStatus.innerText = "Slabý opar";
  } else if (visibility <= 5.4) {
    visibilityStatus.innerText = "Veľmi slabý opar";
  } else if (visibility <= 10.8) {
    visibilityStatus.innerText = "Čistý vzduch";
  } else {
    visibilityStatus.innerText = "Veľmi čistý vzduch";
  }
}

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  let location = search.value;
  if (location) {
    currentCity = location;
    getWeatherData(location, currentUnit, hourlyorWeek);
  }
});

function celciusToFahrenheit(temp) {
  return ((temp * 9) / 5 + 32);
}

search.addEventListener("input", async function (e) {
  removeSuggestions();
  const val = this.value;
  if (!val) {
    return false;
  }

  let currentFocus = -1;
  const a = document.createElement("ul");
  a.setAttribute("id", "suggestions");
  this.parentNode.appendChild(a);

  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${val}&limit=5&appid=2976071bd3e952aefe6d2d8daa77fd07`
    );
    const data = await response.json();

    const seen = new Set();

    data.forEach((city) => {
      const cityKey = `${city.name}, ${city.state || ""}, ${city.country}`.trim();

      if (!seen.has(cityKey)) {
        seen.add(cityKey);

        const b = document.createElement("li");
        b.innerHTML = `<strong>${city.name.substr(0, val.length)}</strong>${city.name.substr(val.length)}`;
        if (city.state) b.innerHTML += `, ${city.state}`;
        b.innerHTML += `, ${city.country}`;
        b.innerHTML += `<input type='hidden' value='${city.name}, ${city.country}'>`;

        b.addEventListener("click", function (e) {
          search.value = this.getElementsByTagName("input")[0].value;
          removeSuggestions();
          let location = search.value;
          if (location) {
            currentCity = location;
            getWeatherData(location, currentUnit, hourlyorWeek);
          }
        });

        a.appendChild(b);
      }
    });
  } catch (error) {
    console.error("Chyba pri načítaní miest:", error);
  }
});

function removeSuggestions() {
  const suggestions = document.getElementById("suggestions");
  if (suggestions) {
    suggestions.parentNode.removeChild(suggestions);
  }
}

var currentFocus;

function addActive(x) {
  if (!x) return false;
  removeActive(x);
  if (currentFocus >= x.length) currentFocus = 0;
  if (currentFocus < 0) currentFocus = x.length - 1;
  x[currentFocus].classList.add("active");
}
function removeActive(x) {
  for (var i = 0; i < x.length; i++) {
    x[i].classList.remove("active");
  }
}

function removeSuggestions() {
  var x = document.getElementById("suggestions");
  if (x) x.parentNode.removeChild(x);
}

fahrenheitBtn.addEventListener("click", () => {
  changeUnit("f");
});
celciusBtn.addEventListener("click", () => {
  changeUnit("c");
});

function changeUnit(unit) {
  if (currentUnit !== unit) {
    currentUnit = unit;
    tempUnit.forEach((elem) => {
      elem.innerText = `°${unit.toUpperCase()}`;
    });
    if (unit === "c") {
      celciusBtn.classList.add("active");
      fahrenheitBtn.classList.remove("active");
    } else {
      celciusBtn.classList.remove("active");
      fahrenheitBtn.classList.add("active");
    }
    getWeatherData(currentCity, currentUnit, hourlyorWeek);
  }
}

hourlyBtn.addEventListener("click", () => {
  document.getElementById("hourly-cards").style.display = "grid";
  document.getElementById("weather-cards").style.display = "none";
  changeTimeSpan("hourly");
});

weekBtn.addEventListener("click", () => {
  document.getElementById("hourly-cards").style.display = "none";
  document.getElementById("weather-cards").style.display = "grid";
  changeTimeSpan("week");
});

function changeTimeSpan(unit) {
  if (hourlyorWeek !== unit) {
    hourlyorWeek = unit;
    if (unit === "hourly") {
      hourlyBtn.classList.add("active");
      weekBtn.classList.remove("active");
    } else {
      hourlyBtn.classList.remove("active");
      weekBtn.classList.add("active");
    }
    getWeatherData(currentCity, currentUnit, hourlyorWeek);
  }
}

getWeatherData(currentCity, currentUnit, hourlyorWeek);