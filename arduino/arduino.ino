#include <Wire.h>               // Knižnica pre komunikáciu cez I2C
#include <Adafruit_Sensor.h>    // Knižnica pre senzor
#include <Adafruit_BMP085_U.h>  // Knižnica pre BMP180
#include <DHT.h>
#include <WiFi.h>//<WiFi.h>
#include <WiFiMulti.h>
#include <HTTPClient.h>
#include "Adafruit_VEML7700.h"
#include <NetworkClientSecure.h>


#define DHTPIN 5       // what pin we're connected to
#define DHTTYPE DHT11  // DHT 11  (AM2302)
DHT dht(DHTPIN, DHTTYPE);

Adafruit_VEML7700 veml = Adafruit_VEML7700();

// Vytvorenie objektu pre senzor
Adafruit_BMP085_Unified bmp;

#define SERVER_IP "https://pocasicko.pockethost.io"
#define UPLOAD_ENDPOINT "/api/upload"
#define DEVICE_TOKEN "secret_token"
const char *ssid = "Nothing phone (1)";
const char *password = "12345678";

const char *rootCACertificate = R"string_literal(
-----BEGIN CERTIFICATE-----
MIIDejCCAmKgAwIBAgIQf+UwvzMTQ77dghYQST2KGzANBgkqhkiG9w0BAQsFADBX
MQswCQYDVQQGEwJCRTEZMBcGA1UEChMQR2xvYmFsU2lnbiBudi1zYTEQMA4GA1UE
CxMHUm9vdCBDQTEbMBkGA1UEAxMSR2xvYmFsU2lnbiBSb290IENBMB4XDTIzMTEx
NTAzNDMyMVoXDTI4MDEyODAwMDA0MlowRzELMAkGA1UEBhMCVVMxIjAgBgNVBAoT
GUdvb2dsZSBUcnVzdCBTZXJ2aWNlcyBMTEMxFDASBgNVBAMTC0dUUyBSb290IFI0
MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAE83Rzp2iLYK5DuDXFgTB7S0md+8Fhzube
Rr1r1WEYNa5A3XP3iZEwWus87oV8okB2O6nGuEfYKueSkWpz6bFyOZ8pn6KY019e
WIZlD6GEZQbR3IvJx3PIjGov5cSr0R2Ko4H/MIH8MA4GA1UdDwEB/wQEAwIBhjAd
BgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwDwYDVR0TAQH/BAUwAwEB/zAd
BgNVHQ4EFgQUgEzW63T/STaj1dj8tT7FavCUHYwwHwYDVR0jBBgwFoAUYHtmGkUN
l8qJUC99BM00qP/8/UswNgYIKwYBBQUHAQEEKjAoMCYGCCsGAQUFBzAChhpodHRw
Oi8vaS5wa2kuZ29vZy9nc3IxLmNydDAtBgNVHR8EJjAkMCKgIKAehhxodHRwOi8v
Yy5wa2kuZ29vZy9yL2dzcjEuY3JsMBMGA1UdIAQMMAowCAYGZ4EMAQIBMA0GCSqG
SIb3DQEBCwUAA4IBAQAYQrsPBtYDh5bjP2OBDwmkoWhIDDkic574y04tfzHpn+cJ
odI2D4SseesQ6bDrarZ7C30ddLibZatoKiws3UL9xnELz4ct92vID24FfVbiI1hY
+SW6FoVHkNeWIP0GCbaM4C6uVdF5dTUsMVs/ZbzNnIdCp5Gxmx5ejvEau8otR/Cs
kGN+hr/W5GvT1tMBjgWKZ1i4//emhA1JG1BbPzoLJQvyEotc03lXjTaCzv8mEbep
8RqZ7a2CPsgRbuvTPBwcOMBBmuFeU88+FSBX6+7iP0il8b4Z0QFqIwwMHfs/L6K1
vepuoxtGzi4CZ68zJpiq1UvSqTbFJjtbD4seiMHl
-----END CERTIFICATE-----
)string_literal";

WiFiMulti WiFiMulti;
HTTPClient http;

int sendToServer(float temp, float pressure, float humidity, float light) {
  NetworkClientSecure *client = new NetworkClientSecure;

  client->setCACert(rootCACertificate);

  http.begin(*client, String(SERVER_IP) + String(UPLOAD_ENDPOINT));  // HTTP
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

  http.end();

  delete client;
  
  
  return httpCode;
}

void connectToWiFi() {
  Serial.println();
  Serial.println();
  Serial.println();


  WiFi.mode(WIFI_STA);
  WiFiMulti.addAP(ssid, password);

  // wait for WiFi connection
  Serial.print("Waiting for WiFi to connect...");
  while ((WiFiMulti.run() != WL_CONNECTED)) {
    Serial.print(".");
  }

  Serial.println("");
  Serial.print("Connected! IP address: ");
  Serial.println(WiFi.localIP());
}

void setup() {
  // Začneme sériovú komunikáciu
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

  if (!veml.begin()) {
    Serial.println("VEML Sensor not found");
    while (1)
      ;
  }
  Serial.println("Sensor found");

  veml.setPowerSaveMode(VEML7700_POWERSAVE_MODE4);
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

  float light = veml.readLux();
  Serial.println(String("Light: ") + String(light));

  Serial.println(sendToServer(temperature, event.pressure, h != h ? 0 : h, light));
  delay(10000);
}