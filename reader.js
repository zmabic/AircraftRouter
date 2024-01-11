const net = require('net');
const readline = require('readline');
const { Airplane, AirplaneList } = require('./airplanes')

const observerLatitude = 45.8007017;
const observerLongitude = 15.9712165;
const observerAltitude = 130;
const maxInactiveTime = 3000;

const airplanes = new AirplaneList(3000, observerLatitude, observerLongitude, observerAltitude);

async function processAdsBData(data) {
    const newEntry = data.split(',');
    if (newEntry.length === 22) {
        airplanes.updateOrAddAirplane(newEntry);

        // Osvježavanje terminala
        readline.cursorTo(process.stdout, 0, 0);
        readline.clearScreenDown(process.stdout);

        console.log(data);
        console.log("Observer latitude: " + observerLatitude
            + ", longitude: " + observerLongitude
            + ", altitude: " + observerAltitude + ".");
        console.log("---------------------------------");
        airplanes.activeAirplanes.forEach((airplane, id) => {
            console.log("Airplane ID: " + id);
            console.log("Latitude: " + (airplane.latitude === 9999 ? "Not yet received" : airplane.latitude));
            console.log("Longitude: " + (airplane.longitude === 9999 ? "Not yet received" : airplane.longitude));
            console.log("Altitude: " + (airplane.altitude === -9999 ? "Not yet received": airplane.altitude));
            console.log("Azimuth: " + ( airplane.azimuth < 0 ? "Not enough data" :  airplane.azimuth));
            console.log("Elevation angle (m): " + (airplane.elevationAngle < 0 ? "Not enough data" : airplane.elevationAngle));
            console.log('---');
        });
        airplanes.removeInactiveAirplanes(maxInactiveTime);
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

const dump1090Host = '127.0.0.1';  // Replace with the actual IP address or hostname of your dump1090 server
const dump1090Port = 30003;        // Use port 30003 for SBS1 data

receiveAdsBData(dump1090Host, dump1090Port);
