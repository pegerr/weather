const pb = new PocketBase("https://pocasicko.pockethost.io");
pb.autoCancellation(false);

const days = ["Nedeľa", "Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok"];

const outDevice = "hmlz37j3qt4j2et";
const inDevice = "d39pf9b4l235921";

const elements = {
    tempUnit: document.getElementById("temp-unit"),
    tempUnitOut: document.getElementById("temp-unit-out"),

    tempOut: document.getElementById("Out-temp"),
    pressureOut: document.getElementById("Out-pressure"),
    humidityOut: document.getElementById("Out-humidity"),
    
    lightOut: document.getElementById("Out-light"),

    tempIn: document.getElementById("In-temp"),
    pressureIn: document.getElementById("In-pressure"),
    humidityIn: document.getElementById("In-humidity"),
    lightIn: document.getElementById("In-light"),

    date: document.getElementById("date-time"),
    lightStatus: document.getElementById("light-status"),
};

async function fetchDeviceData(deviceId) {
    const list = await pb.collection("measurements").getList(1, 1, {
        sort: '-created',
        filter: `device = "${deviceId}"`
    });

    return list.items[0];
}

async function pull() {
    const now = new Date(Date.now());
    elements.date.innerHTML = `${days[now.getDay()]}, ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    const Out = await fetchDeviceData(outDevice);
    const In = await fetchDeviceData(inDevice);

    if (!Out || !In) return;

    elements.tempUnit.innerHTML = currentUnit;
    elements.tempUnitOut.innerHTML = currentUnit;

    elements.tempOut.innerHTML = `${currentUnit.includes("C") ? Out.temperature.toFixed(1) : (Out.temperature * 1.8 + 32).toFixed(1)}`;
    elements.pressureOut.innerHTML = `${Out.pressure.toFixed(1)}`;
    elements.humidityOut.innerHTML = `${Out.humidity.toFixed(0)}%`;
    
    elements.lightOut.innerHTML = `${Out.light.toFixed(1)}`;
    elements.lightStatus.innerHTML = `lm`;

    elements.tempIn.innerHTML = `${currentUnit.includes("C") ? In.temperature.toFixed(1) : (In.temperature * 1.8 + 32).toFixed(1)}`;
    elements.pressureIn.innerHTML = `${In.pressure.toFixed(1)}`;
    elements.humidityIn.innerHTML = `${In.humidity.toFixed(0)}%`;
    elements.lightIn.innerHTML = `${In.light.toFixed(1)}`;
}

$('#units').children().on("click", function() {
    currentUnit = this.innerHTML;

    $('#units').children().removeClass("active");
    $(this).addClass("active");

    pull();
});
$('#units').children().first().click();

pull();
setInterval(() => pull(), 1000);

function updateHumidityStatus(humidity) {
  if (humidity <= 30) {
    humidityStatus.innerText = "Nízká";
  } else if (humidity <= 60) {
    humidityStatus.innerText = "Stredná";
  } else {
    humidityStatus.innerText = "Vysoká";
  }
}


