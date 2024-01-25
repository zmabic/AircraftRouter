const net = require('net');
const readline = require('readline');
const { Airplane, AirplaneList } = require('./airplanes');
const path = require('path');
const fs = require('fs');

const configPath = path.resolve(__dirname, 'config.json');
const rawConfig = fs.readFileSync(configPath);
const config = JSON.parse(rawConfig);

const options = {
  timeZone: config.timeZone,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false, // 24-satni format
};

const airplanes = new AirplaneList(config.recordTime, 
                    config.observerLatitude, 
                    config.observerLongitude, 
                    config.observerAltitude, 
                    config.recordsFile, 
                    options);


async function processAdsBData(data) {
    const newEntry = data.split(',');
    if (newEntry.length === 22) {
        airplanes.updateOrAddAirplane(newEntry);

        readline.cursorTo(process.stdout, 0, 0);
        readline.clearScreenDown(process.stdout);

        console.log(data);
        console.log((new Date()).toLocaleString('en-GB', options));
        console.log("Observer latitude: " + config.observerLatitude
            + ", longitude: " + config.observerLongitude
            + ", altitude: " + config.observerAltitude + ".");
        console.log("---------------------------------");
        airplanes.activeAirplanes.forEach((airplane, id) => {
            console.log("Airplane ID: " + id);
            console.log("Latitude: " + (airplane.latitude === 9999 ? "Not yet received" : airplane.latitude));
            console.log("Longitude: " + (airplane.longitude === 9999 ? "Not yet received" : airplane.longitude));
            console.log("Altitude (m): " + (airplane.altitude*0.3048 === -9999*0.3048 ? "Not yet received": airplane.altitude));
            console.log("Azimuth: " + ( airplane.azimuth < 0 ? "Not enough data" :  airplane.azimuth));
            console.log("Elevation angle: " + (airplane.elevationAngle < 0 ? "Not enough data" : airplane.elevationAngle));
            console.log('---');
        });
        airplanes.removeInactiveAirplanes(config.maxInactiveTime);
    } else {
        // console.error(`Error parsing ADS-B data: ${data}`);
    }
}

function receiveAdsBData(host, port) {
    const client = net.createConnection({ host, port }, () => {
        console.log('Connected to dump1090');
    });

    client.on('data', (data) => {
        const message = data.toString();
        processAdsBData(message);
    });

    client.on('end', () => {
        console.log('Connection closed by server');
    });

    client.on('error', (err) => {
        console.error('Error:', err.message);
    });
}

const dump1090Host = '127.0.0.1';
const dump1090Port = 30003;        

receiveAdsBData(dump1090Host, dump1090Port);
