#include <ESP8266WiFi.h>

#ifndef STASSID
#define STASSID "The Kamoro's"
#define STAPSK "#Digital1421"
#endif

const char* ssid = STASSID;
const char* password = STAPSK;
int RELAY=0; //pin with relay


// Create an instance of the server
// specify the port to listen on as an argument
WiFiServer server(80);

void setup() {
  Serial.begin(115200);

  // prepare LED
  pinMode(RELAY, OUTPUT);
  digitalWrite(RELAY, 0);

  // Connect to WiFi network
  Serial.println();
  Serial.println();
  Serial.print(F("Connecting to "));
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(F("."));
  }
  Serial.println();
  Serial.println(F("WiFi connected"));

  // Start the server
  server.begin();
  Serial.println(F("Server started"));

  // Print the IP address
  Serial.println(WiFi.localIP());
}

void loop() {
  // Check if a client has connected
  WiFiClient client = server.accept();
  if (!client) { return; }
  Serial.println(F("new client"));

  client.setTimeout(5000);  // default is 1000

  // Read the first line of the request
  String req = client.readStringUntil('\r');
  Serial.println(F("request: "));
  Serial.println(req);

  // Match the request
  int val;
  if (req.indexOf(F("/gpio/0")) != -1) {
    val = 0;
  } else if (req.indexOf(F("/gpio/1")) != -1) {
    val = 1;
  } else {
    Serial.println(F("invalid request"));
    val = digitalRead(RELAY);
  }

  digitalWrite(RELAY, val);

  // read/ignore the rest of the request
  // do not client.flush(): it is for output only, see below
  while (client.available()) {
    // byte by byte is not very efficient
    client.read();
  }

  // Send the response to the client
  // it is OK for multiple small client.print/write,
  // because nagle algorithm will group them into one single packet
  client.print(F("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"bulbstate\": \""));
  client.print((val) ? F("high") : F("low"));
  client.print(F("\"}"));

  // The client will actually be *flushed* then disconnected
  // when the function returns and 'client' object is destroyed (out-of-scope)
  // flush = ensure written data are received by the other side
  Serial.println(F("Disconnecting from client"));
}
