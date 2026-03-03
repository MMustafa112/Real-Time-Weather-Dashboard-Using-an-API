const apiKey = "26b314194feee6e53b621e4f80aca855";

// Elements
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const cityInput = document.getElementById('city-input');
const historyDiv = document.getElementById('recent-searches');

window.onload = updateHistoryUI;

// --- ICON MAPPING (ANIMATED SVGS) ---
function getAnimatedIcon(iconCode) {
    const baseUrl = "https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/";
    const mapping = {
        "01d": "day.svg", "01n": "night.svg",
        "02d": "cloudy-day-1.svg", "02n": "cloudy-night-1.svg",
        "03d": "cloudy.svg", "03n": "cloudy.svg", "04d": "cloudy.svg", "04n": "cloudy.svg",
        "09d": "rainy-6.svg", "09n": "rainy-6.svg", "10d": "rainy-5.svg", "10n": "rainy-5.svg",
        "11d": "thunder.svg", "11n": "thunder.svg", "13d": "snowy-6.svg", "13n": "snowy-6.svg",
        "50d": "cloudy.svg", "50n": "cloudy.svg"
    };
    return baseUrl + (mapping[iconCode] || "day.svg");
}

// --- SEARCH LOGIC ---
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) { saveCity(city); fetchAllWeatherData(`q=${city}`); }
});

locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        document.getElementById('loading').style.display = "block";
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchAllWeatherData(`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`),
            () => { alert("Location denied. Please search manually."); document.getElementById('loading').style.display = "none"; }
        );
    }
});

// --- API FETCH ---
async function fetchAllWeatherData(query) {
    document.getElementById('loading').style.display = "block";
    try {
        const [currRes, foreRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?${query}&appid=${apiKey}&units=metric`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?${query}&appid=${apiKey}&units=metric`)
        ]);
        const currData = await currRes.json();
        const foreData = await foreRes.json();

        if (currData.cod !== 200) throw new Error(currData.message);

        updateBackground(currData.weather[0].main, currData.timezone);
        displayCurrent(currData);
        displayForecast(foreData);
    } catch (err) {
        alert("Location error: " + err.message);
    } finally {
        document.getElementById('loading').style.display = "none";
    }
}

// --- UI UPDATES ---
function updateBackground(weather, offset) {
    const body = document.body;
    const now = new Date();
    const cityTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (offset * 1000));
    const hour = cityTime.getHours();
    
    // Logic: 6 AM to 6 PM is Day
    const isDay = hour >= 6 && hour < 18;
    
    // Reset any manual style we set previously to let classes work
    body.style.background = ""; 

    if (!isDay) {
        // NIGHT VIBE
        body.className = "night-bg"; 
    } else if (weather === "Snow") {
        // SNOWING VIBE (Daytime)
        body.className = "snowy-bg";
    } else if (["Rain", "Drizzle", "Thunderstorm"].includes(weather)) {
        // RAINY VIBE (Daytime)
        body.className = "rainy-day-bg";
    } else {
        // MORNING/CLEAR VIBE
        body.className = "morning-bg";
    }
}

function displayCurrent(data) {
    document.getElementById('weather-result').style.display = "block";
    document.getElementById('city-name').innerText = data.name;
    document.getElementById('temperature').innerText = `${Math.round(data.main.temp)}°C`;
    document.getElementById('description').innerText = data.weather[0].description;
    document.getElementById('humidity').innerText = `${data.main.humidity}%`;
    document.getElementById('wind-speed').innerText = `${Math.round(data.wind.speed)} km/h`;
    document.getElementById('weather-icon').src = getAnimatedIcon(data.weather[0].icon);

    const now = new Date();
    const cityTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (data.timezone * 1000));
    document.getElementById('local-time').innerText = cityTime.toLocaleTimeString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
}

function displayForecast(data) {
    const list = document.getElementById('forecast-list');
    list.innerHTML = ""; 
    [8, 16, 24].forEach(i => {
        const d = data.list[i];
        const date = new Date(d.dt_txt).toLocaleDateString('en', { weekday: 'short' });
        list.innerHTML += `
            <div class="forecast-item">
                <p><b>${date}</b></p>
                <img src="${getAnimatedIcon(d.weather[0].icon)}" class="forecast-icon">
                <p>${Math.round(d.main.temp)}°C</p>
            </div>`;
    });
}

// --- HISTORY ---
function saveCity(c) {
    let list = JSON.parse(localStorage.getItem('weatherHistory')) || [];
    list = list.filter(x => x.toLowerCase() !== c.toLowerCase());
    list.unshift(c);
    if (list.length > 4) list.pop();
    localStorage.setItem('weatherHistory', JSON.stringify(list));
    updateHistoryUI();
}

function updateHistoryUI() {
    let list = JSON.parse(localStorage.getItem('weatherHistory')) || [];
    historyDiv.innerHTML = list.map(c => `<span class="history-item" onclick="quickSearch('${c}')">${c}</span>`).join('');
}

window.quickSearch = (c) => { cityInput.value = c; fetchAllWeatherData(`q=${c}`); };
