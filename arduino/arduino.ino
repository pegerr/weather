#include <Wire.h>               // Knižnica pre komunikáciu cez I2C
#include <Adafruit_Sensor.h>    // Knižnica pre senzor
#include <Adafruit_BMP085_U.h>  // Knižnica pre BMP180
#include <DHT.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

#define DHTPIN 4       // what pin we're connected to
#define PHOTO_PIN A0
#define DHTTYPE DHT22  // DHT 22  (AM2302)
DHT dht(DHTPIN, DHTTYPE);

// Vytvorenie objektu pre senzor
Adafruit_BMP085_Unified bmp;

#define SERVER_IP "192.168.178.4:8090"
#define UPLOAD_ENDPOINT "/api/upload"
#define DEVICE_TOKEN "secret_token"
const char *ssid = "Nothing phone (1)";
const char *password = "12345678";

WiFiClient client;
HTTPClient http;

int sendToServer(float temp, float pressure, float humidity, float light) {
  http.begin(client, String("http://") + String(SERVER_IP) + String(UPLOAD_ENDPOINT));  // HTTP
  http.addHeader("Content-Type", "application/json");

  String str =    String("{\"token\":\"") + String(DEVICE_TOKEN) + String("\",") +
    String("\"sensor_data\":") + String("{") +
    String("\"temperature\":") + String(temp) + String(",") +
    String("\"pressure\":") + String(pressure) + String(",") +
    String("\"humidity\":") + String(humidity) + String(",") +
    String("\"light\":") + String(light) 
    + String("}}");

  int httpCode = http.POST(
    str
  );
  
  
  return httpCode;
}

void connectToWiFi() {
  Serial.println();
  Serial.println();
  Serial.println();

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected! IP address: ");
  Serial.println(WiFi.localIP());
}

void setup() {
  // Začneme sériovú komunikáciu
  pinMode(PHOTO_PIN, INPUT);
  Serial.begin(115200);  // Pre ESP8266 odporúčame vyšší baud rate

  connectToWiFi();

  // Nastavenie I2C pre ESP8266 (predvolené piny pre I2C sú GPIO4 a GPIO5)
  Wire.begin();  // Automaticky používa GPIO4 (SDA) a GPIO5 (SCL)
  dht.begin();

  // Inicializácia BMP180
  if (!bmp.begin()) {
    Serial.println("Nepodarilo sa inicializovať senzor BMP180");
    while (1)
      ;  // Ak sa senzor nepodarí inicializovať, zastavíme program
  }
}

void loop() {
  // Premenné pre hodnoty z BMP180
  sensors_event_t event;

  // Získanie hodnoty tlaku
  bmp.getEvent(&event);

  Serial.print("Tlak: ");
  Serial.print(event.pressure);
  Serial.println(" hPa");

  float temperature;
  bmp.getTemperature(&temperature);
  Serial.print("Teplota: ");
  Serial.print(temperature);
  Serial.println(" °C");

  float h = dht.readHumidity();
  float t = dht.readTemperature();

  Serial.print("Vlhkost: ");
  Serial.print(String(h) + String(", ") + String(t));
  Serial.println(" %");

  float light = map(analogRead(PHOTO_PIN), 98, 1024, 0, 100);

  Serial.println(String("Light: ") + String(light));

  sendToServer(temperature, event.pressure, h != h ? 0 : h, light);
  delay(10000);
}