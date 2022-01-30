
let response;
const searchInput = document.querySelector("#input-area");
const searchBtn = document.querySelector(".search-button");
const resultsDiv = document.querySelector("#results-container");

const searchText = searchInput.textContent;

searchInput.addEventListener('change', (e) => {
    searchInput.value = e.target.value;
});

searchInput.addEventListener('keyup', async (e) => {
    if (e.key === "Enter" && !invalidInput()) {
        try {
            await getResults();
            await displayResults();
        } catch (error) {
            window.alert(`${searchInput.value} is not a valid country, or API source has conked out`);
        };
    };
});

searchBtn.addEventListener('click', async () => {
    if (!invalidInput()) {
        try {
            await getResults();
            await displayResults();
        } catch (error) {
            window.alert(`${searchInput.value} not a valid country, or API source has conked out`);
        };
    };
});

const BASE_URL = `https://restcountries.com/v3.1/name`;

async function getResults() {
    try {

        const res = await axios.get(`${BASE_URL}/${searchInput.value}`);
        response = res.data;
    } catch(error) {
        console.error(error);
    };
};

function invalidInput() {
    return searchInput.value === "" || searchInput.value === " " || !searchInput.value;
};

async function displayResults() {
    while (resultsDiv.firstChild && !resultsDiv.firstChild.remove());
    for (let i = 0; i < response.length; i++) {
        const resultDiv = document.createElement("div");
        resultDiv.className = "result-div"

        const countryName = document.createElement("h1");
        countryName.className = "country-name";
        countryName.textContent = response[i].name.common;

        const capitalName = document.createElement("p");
        capitalName.textContent = `Capital: ${response[i].capital[0]}`;
        capitalName.className = "capital-name";

        const popNo = document.createElement("p");
        popNo.textContent = `Population: ${response[i].population}`;
        popNo.className = "pop-no";
        
        const languages = document.createElement("h2");
        languages.textContent = "Languages";
        languages.className = "langs";

        const langUl = document.createElement("ul");
        langUl.className = "lang-ul"
        Object.values(response[i].languages).forEach(lang => {
            const newLi = document.createElement("li");
            newLi.textContent = lang;
            newLi.className = "lang-li";
            langUl.append(newLi);
        });

        const flagImg = document.createElement("img");
        flagImg.src = response[i].flags.svg;
        flagImg.alt = `${response[i].name.common} flag`;
        flagImg.className = "flag-img";

        const weatherHead = document.createElement("h2");
        weatherHead.textContent = `Weather in ${response[i].capital[0]}`;
        weatherHead.className = "weather-header";

        const temp = document.createElement("p");
        temp.className = "temp";

        let weatherData;
        let cFlag;
        let colors;
        try {
            weatherData = await getTemps(response[i].capital[0]);
            cFlag = await axios.get(response[i].flags.svg);
            colors = getPathColours(cFlag.data);
            if (colors.length % 2 == 0) {

                let finalColor = colors[colors.length / 2];
                if (finalColor[0] === "#") {
                    
                    if (finalColor.length - 1 == 3) {
                        resultDiv.style.backgroundColor = `${threeToSixHex(finalColor)}99`;
                        resultDiv.style.color = `${colorOnContrast(finalColor)}`;

                    } else {
                        resultDiv.style.backgroundColor = `${finalColor}99`;
                        resultDiv.style.color = `${colorOnContrast(finalColor)}`;
                    };

                } else {
                    finalColor = dummyElement(finalColor);
                    resultDiv.style.backgroundColor = `${finalColor}99`;
                    resultDiv.style.color = `${colorOnContrast(finalColor)}`;
                }

            } else if (colors.length % 2 !== 0) {
                const finalColor = colors[Math.floor(colors.length / 2)];

                if (finalColor[0] === "#") {
                    
                    if (finalColor.length - 1 == 3) {
                        resultDiv.style.backgroundColor = `${threeToSixHex(finalColor)}99`;
                        resultDiv.style.color = `${colorOnContrast(finalColor)}`;

                    } else {
                        resultDiv.style.backgroundColor = `${finalColor}99`;
                        resultDiv.style.color = `${colorOnContrast(finalColor)}`;
                    };

                } else {
                    finalColor = dummyElement(finalColor);
                    console.log(finalColor);
                    resultDiv.style.backgroundColor = `${finalColor}99`;
                    resultDiv.style.color = `${colorOnContrast(finalColor)}`;
                }
            }
        } catch (error) {
            console.error(i, error);
        }

        temp.textContent = `Temperature: ${weatherData[0]} Celsius`;

        const weatherImg = document.createElement("img");
        weatherImg.src = `http://openweathermap.org/img/wn/${weatherData[1]}@2x.png`;
        weatherImg.alt = `Weather and time representation in ${response[i].capital[0]}`;
        weatherImg.className = "weather-img";

        const windAndSpeed = document.createElement("p");
        windAndSpeed.textContent = `Wind: ${weatherData[2]} mph, direction: ${degToCompass(weatherData[3])}`;
        windAndSpeed.className = "wind-speed";

        resultDiv.append( countryName, flagImg, capitalName, popNo, languages, langUl,  weatherHead, temp, weatherImg, windAndSpeed );

        resultsDiv.append(resultDiv);
    };
};

/* Makes a req to another API provided by OpenWeatherMap for weather on city data gained from RestContries.com, returns temperature
   returns temperatures, weather icon url, wind speed and wind degree in an array*/
async function getTemps(capital) { // You have to provide your own api key from OpenWeatherMap
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${capital}&units=metric&appid=${weather_api_key}`;
    
    try {
        const res = await axios.get(weatherUrl);
        const response = res.data;
        return [ response.main.temp, response.weather[0].icon, response.wind.speed, response.wind.deg ];

    } catch(errors) {
        console.error(errors);
    }
};

// Gets all the colours contained in the path data of a country's flag svg, returns data as an array of colours
function getPathColours(svg) {
    let result = [];
    let tempFound = false;
    for (let i = 0; i < svg.length; i++) {
        if (svg[i] === "f" && (svg[i + 1] === "i" && svg[i + 2] === "l" && svg[i + 3] === "l")) {
            tempFound = true;
            i = i + 5;
        } else if (tempFound === true) {
            let j = i;
            let foundcolor = "";
            while (svg[j] !== `"`) {
                foundcolor = foundcolor + svg[j];
                j++;
            }
            result.push(foundcolor);
            tempFound = false;
        }
    }
    return result;
};

// Converts a 3 digit hexadecimal colour into a digit hex (#A12 - #AA1122);
function threeToSixHex(hexVal){
    return `${hexVal[0]}${hexVal[1]}${hexVal[1]}${hexVal[2]}${hexVal[2]}${hexVal[3]}${hexVal[3]}`;
};

// Calculates the contrast of a hex colour, and returns a light or dark colour
function colorOnContrast(hexVal) {
    if (hexVal === "#FFF" || hexVal === "fff"){
        return "#454545";
    }
    if (hexVal.length === 4) {
        let r = parseInt(hexVal[1], 16);
        let g = parseInt(hexVal[2], 16);
        let b = parseInt(hexVal[3], 16);

        return (((r * 0.299) + (g * 0.587) + (b * 0.114)) > 100) ? "#454545" : "#e0e0e0";
    }
    let r = parseInt(hexVal.substring(1, 3), 16);
    let g = parseInt(hexVal.substring(3, 5), 16);
    let b = parseInt(hexVal.substring(5, 7), 16);

    return (((r * 0.299) + (g * 0.587) + (b * 0.114)) > 100) ? "#454545" : "#e0e0e0";
};

/* Some colours gained from the path values of the flag svg contain actual words instead of hex (red instead of #ff0000).
rgbToHex and dummyElement deals with this problem. First we call dummyElement (in displayResults fn above), in which we 
create a dummy div element, assign visibility hidden and position absolute, since we do not want this showing up in the UI.
Assign the word colour to it, then use getComputedStyle which returns the value as a RGB value, which then is converted into
hex by rgbToHex and we return the value */

function rgbToHex(rgb) {
    rgb = rgb.match(/^rgb\((\d+), \s*(\d+), \s*(\d+)\)$/); 

    function hexCode(i) { 
        return ("0" + parseInt(i).toString(16)).slice(-2);
    } 

    return "#" + hexCode(rgb[1]) + hexCode(rgb[2]) 
                    + hexCode(rgb[3]); 
};

function dummyElement(colorParam) {
    let dummy = document.createElement("div");
    dummy.style.visibility = "hidden";
    dummy.style.position = "absolute";
    dummy.style.color = colorParam;
    resultsDiv.append(dummy);

    return rgbToHex(window.getComputedStyle(dummy).color);
};

/* Since we get wind directional info in degrees (0-360), we need to convert it into compass direction 
   for ease of use. Modulo the degrees by 360. If we divide the wind direction by 22.5 (degrees for each sector, 
   a sector is each compass direction - N, NNE...,) and round, we get numbers ranging from 0 to 16. Because the labels 
   stored in the array are indexed from 1 to 17, we must add 1 to fit the range */

function degToCompass(windDir) {
    const compass = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S",
    "SSW","SW","WSW","W","WNW","NW","NNW","N"];

    let index = windDir % 360;
    index = Math.round(index / 22.5) + 1;
    return compass[index];
} 
