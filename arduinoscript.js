const pb = new PocketBase("https://pocasicko.pockethost.io");
pb.autoCancellation(false)

const days = ["Nedeľa", "Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok"]
const cloudiness = ["Jasno", "Polojasno", "Polooblacno", "Oblacno"]


const elements = {
    tempUnit: document.getElementById("temp-unit"),
    tempField: document.getElementById("field-temp"),
    pressureField: document.getElementById("field-pressure"),
    humidityField: document.getElementById("field-humidity"),
    lightField: document.getElementById("field-light"),
    date: document.getElementById("date-time"),
    lightStatus: document.getElementById("light-status"),
}


async function pull() {
    const now = new Date(Date.now())
    elements.date.innerHTML = `${days[now.getDay()]}, ${now.getHours()}:${(now.getMinutes()).toString().padStart(2, '0')}`

    const items = (await pb.collection("measurements").getList(1, 1, {
        sort:'-created'
    })).items

    if(!items || items.length == 0) return

    const first = items[0]

    elements.tempUnit.innerHTML = currentUnit
    elements.tempField.innerHTML = `${currentUnit.includes("C") ? first.temperature.toFixed(1) : (first.temperature * 1.8 +32).toFixed(1)}`
    elements.pressureField.innerHTML = `${first.pressure.toFixed(1)}`
    elements.humidityField.innerHTML = `${first.humidity.toFixed(1)}%`
    elements.lightField.innerHTML = `${Math.max(Math.min((100 - first.light.toFixed(2)), 100), 0)}%`
    elements.lightStatus.innerHTML = cloudiness[Math.min(Math.floor((100 - first.light) / (100 / cloudiness.length)), cloudiness.length-1)]
}

$('#units').children().on("click", function() {
    currentUnit = this.innerHTML

    $('#units').children().removeClass("active")
    $(this).addClass("active")

    pull()
})
$('#units').children().first().click()

pull()
setInterval(() => pull(), 1000)