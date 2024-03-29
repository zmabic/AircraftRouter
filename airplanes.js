
const { time } = require('console');
const { Calculate }  = require('./geoUtils');
const fs = require('fs');


class Airplane {
    constructor(data, olat, olon, oalt) {
        this.azimuth = -1;
        this.elevationAngle = -1;
        this.aircraftId = data[4];
        this.flightId = data[5];
        this.latitude = 9999;
        this.longitude = 9999;
        this.altitude = -9999;
        this.groundSpeed = 0;
        this.verticalRate = 0;
        this.isOnGround = null;
        this.updateHistory = [];
        this.lastUpdateTime = Date.now();
        this.update(data, olat, olon, oalt);
    }

    update(newData, olat, olon, oalt) {
        // Update non null values
        this.latitude = Number(newData[14] !== "" ? newData[14] : this.latitude);
        this.longitude = Number(newData[15] !== "" ? newData[15] : this.longitude);
        if(newData[11] !== "") {
            this.altitude = Number(newData[11]) * 0.3048;
        }
        this.groundSpeed = Number(newData[13] !== "" ? newData[13] : this.groundSpeed);
        this.verticalRate = Number(newData[15] !== "" ? newData[15] : this.verticalRate);
        this.isOnGround = newData[20] !== "" ? newData[20] : this.isOnGround;

        // Calculate azimuth and elevation angle
        if(newData[14] !== "" && newData[14] !== null
            && newData[15] !== "" && newData[15] !== null
            && newData[11] !== "" && newData[11] !== null) {
                let calculate = Calculate(olat, olon, oalt, this.latitude, this.longitude, this.altitude);
                this.azimuth = calculate.azimuth;
                this.elevationAngle = calculate.altitude;
                // this.ptpDistance = calculate.distKm;
        }
        
        // Refresh update history
        if(this.latitude !== null && this.latitude !== ""
            && this.longitude !== null && this.longitude !== ""
            && this.altitude !== null && this.altitude !== ""
            && this.azimuth !== null && this.azimuth !== "" && this.azimuth !== -1
            && this.elevationAngle !== null && this.elevationAngle !== "" && this.elevationAngle !== -1) {
                this.lastUpdateTime = Date.now();
                this.updateHistory.push({ data: newData, timestamp: this.lastUpdateTime });
            }
        
    }
}

class AirplaneList {
    constructor(recordTime, olat, olon, oalt, filePath, datetimeOptions) {
        this.activeAirplanes = new Map();
        this.recordTime = recordTime;
        this.olat = Number(olat);
        this.olon = Number(olon);
        this.oalt = Number(oalt);
        this.filePath = filePath;
        this.datetimeOptions = datetimeOptions;
    }

    updateOrAddAirplane(data) {
        const airplaneId = data[4];

        // new airplane
        if (!this.activeAirplanes.has(airplaneId)) {
            const newAirplane = new Airplane(data, this.olat, this.olon, this.oalt);
            this.activeAirplanes.set(airplaneId, newAirplane);
        } else { // existing airplane                                        
            const existingAirplane = this.activeAirplanes.get(airplaneId);
            existingAirplane.update(data, this.olat, this.olon, this.oalt);

            const timeDifference = existingAirplane.lastUpdateTime - existingAirplane.updateHistory[existingAirplane.updateHistory.length - 2]?.timestamp || 0;
            // keeping record
            if (timeDifference*1000 > this.recordTime && 
                existingAirplane.aircraftId !== null &&
                existingAirplane.latitude !== "" &&
                existingAirplane.longitude !== "" &&
                existingAirplane.altitude !== "" &&
                existingAirplane.azimuth !== undefined &&
                existingAirplane.elevationAngle !== NaN
            ) {
                // ovdje se dodaje zapis 
                var record = existingAirplane.aircraftId + ", " + existingAirplane.latitude + ", " 
                                + existingAirplane.longitude + ", " + existingAirplane.altitude + ", " 
                                + existingAirplane.azimuth + ", " + existingAirplane.elevationAngle;
                console.log(record);
                this.updateRecord(record, this.filePath, this.datetimeOptions);
            }
        }
    }

    removeInactiveAirplanes(maxInactiveTime) {
        const currentTime = Date.now();

        for (const [airplaneId, airplane] of this.activeAirplanes) {
            const inactiveTime = currentTime - airplane.lastUpdateTime;
            if (inactiveTime > maxInactiveTime) {
                this.activeAirplanes.delete(airplaneId);
            }
        }
    }
    updateRecord(record) {
        const datum = new Date().toLocaleString('hr-HR');
        const formatiraniZapis = `${(new Date()).toLocaleString('en-HR', this.datetimeOptions)}: ${record}\n`;
          console.log(formatiraniZapis);
        fs.appendFileSync(this.filePath, formatiraniZapis, 'utf8', (err) => {
          if (err) {
            console.error('Greška prilikom dodavanja zapisa u datoteku:', err);
            return;
          }
        });
      }
}



module.exports = {
    Airplane,
    AirplaneList
};

