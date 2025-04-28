routerAdd("POST", "/api/upload", (e) => {
  const data = new DynamicModel({
    token: "",
    sensor_data: {},
  })

  try {
    e.bindBody(data)
  } catch (e) {
    return e.json(400, {
      ok: false,
      error: "Invalid request body",
    })
  }

  if (!data.token) {
    return e.json(400, {
      ok: false,
      error: "Missing token",
    })
  }
  if (!data.sensor_data) {
    return e.json(400, {
      ok: false,
      error: "Missing sensor data",
    })
  }

  let device = null
  try {
    device = $app.findFirstRecordByData(
      "devices",
      "token",
      data.token,
    )
  } catch (e) {}

  if (!device) {
    return e.json(400, {
      ok: false,
      error: "Device not found",
    })
  }

  const measurements_table = $app.findCollectionByNameOrId("measurements")

  if (!measurements_table) {
    return e.json(500, {
      ok: false,
      error: "Measurements table not found",
    })
  }

  let measurement = null
  try {
    measurement = new Record(measurements_table)
  } catch (e) { }

  if (!measurement) {
    return e.json(500, {
      ok: false,
      error: "Measurements table error",
    })
  }

  
  measurement.set("device", device.get("id"))
  measurement.set("temperature", data.sensor_data.get("temperature"))
  measurement.set("humidity", data.sensor_data.get("humidity"))
  measurement.set("pressure", data.sensor_data.get("pressure"))
  measurement.set("light", data.sensor_data.get("light"))

  try {
    $app.save(measurement)
  } catch (e) {
    return e.json(500, {
      ok: false,
      error: "Error saving measurement",
    })
  }

  return e.json(200, { ok: true })
})

// curl -X POST -H "Content-Type: application/json" https://pocasicko.pockethost.io/api/upload -d 
//   '{"token":"secret_token",
//   "sensor_data":{"temperature":"10","humidity":"50","pressure":"100","light":"50"}}'