#include <iostream>
#include <cmath>
#include <fstream>
#include <string>
#include <iomanip>
#include <vector>

#define ld long double

using namespace std;

const long double pi = 3.141592653589793238462643383279502884L;

struct Vector {
    ld x;
    ld y;
    ld z;
};

struct Point {
    ld x;      // cartesian coordinates
    ld y;
    ld z; 
    Vector n;  // normal vector from the surface
    ld radius;
};

struct Result {
    ld azimuth;
    ld elevationAngle;
};


ld earthRadius(ld latitudeR) {

    ld a = 6378137.0;  // equator radius in meters
    ld b = 6356752.3;  // polar radius in meters
    ld cosL = cos(latitudeR);
    ld sinL = sin(latitudeR);
    ld t1 = a * a * cosL;
    ld t2 = b * b * sinL;
    ld t3 = a * cosL;
    ld t4 = b * sinL;
    return sqrt((t1*t1 + t2*t2) / (t3*t3 + t4*t4));
}

ld geocentricLatitude(ld latitude) {
    ld e = 0.00669437999014;
    ld clat = atan((1.0 - e) * tan(latitude));
    return clat;
}

Point locationToPoint(ld latitude, ld longitude, ld altitude) {
    Point point;
    ld lat = latitude * pi / 180.0;
    ld latGC = geocentricLatitude(lat);
    ld lon = longitude * pi / 180.0;
    ld radius = earthRadius(lat);

    ld cosLon = cos(lon); 
    ld sinLon = sin(lon);
    ld cosLatGC = cos(latGC);
    ld sinLatGC = sin(latGC);
    ld x = radius * cosLon * cosLatGC;
    ld y = radius * sinLon * cosLatGC;
    ld z = radius * sinLatGC;
    
    ld cosLatGD = cos(lat);
    ld sinLatGD = sin(lat);

    ld normX = cosLatGD * cosLon;
    ld normY = cosLatGD * sinLon;
    ld normZ = sinLatGD;

    x += altitude * normX;
    y += altitude * normY;
    z += altitude * normZ;

    point = {x, y, z, {normX, normY, normZ}, radius};

    return point;
}

Point rotateEarth(ld latitudeB, ld longitudeB, ld altitudeB, ld latitudeA, ld longitudeA) {
    Point br = locationToPoint(latitudeB, longitudeB - longitudeA, altitudeB);

    ld latA = geocentricLatitude((-latitudeA) * pi / 180.0);
    ld cosA = cos(latA);
    ld sinA = sin(latA);

    ld bx = (br.x * cosA) - (br.z * sinA);
    ld by = br.y;
    ld bz = (br.x * sinA) + (br.z * cosA);

    br.x = bx;
    br.y = by;
    br.z = bz;

    return br;
}

Vector normalizeVector(Point b, Point a) {
    ld dx = b.x - a.x;  
    ld dy = b.y - a.y;
    ld dz = b.z - a.z;
    ld dist = dx*dx + dy*dy + dz*dz;
    ld s = sqrt(dist);
    Vector v = {dx/s, dy/s, dz/s};
    return v;
}

Result calculate(ld latitudeA, ld longitudeA, ld altitudeA, ld latitudeB, ld longitudeB, ld altitudeB) {
    Point a = locationToPoint(latitudeA, longitudeA, altitudeA);
    Point b = locationToPoint(latitudeB, longitudeB, altitudeB);
    Result result;
    ld azimuth;
    ld elevationAngle;

    Point br = rotateEarth(latitudeB, longitudeB, altitudeB, latitudeA, longitudeA);
    if (br.z*br.z + br.y*br.y > 1.0e-6) {
        ld theta = atan2(br.z, br.y) * 180.0 / pi;
        azimuth = 90.0 - theta;
        if (azimuth < 0.0) {
            azimuth += 360.0;
        }
        if (azimuth > 360.0) {
            azimuth -= 360.0;
        }
    }

    Vector bma = normalizeVector(b, a);     // vector BA
    elevationAngle = 90.0 - ((180.0 / pi) * acos(bma.x * a.n.x + bma.y * a.n.y + bma.z * a.n.z));

    result = {azimuth, elevationAngle};
    return result;
}


int main() {
    string inputFilePath = "input.txt";     
    string outputFilePath = "output.txt";

    ofstream outputFile(outputFilePath);    //  , ios::app
    ifstream inputFile(inputFilePath);

    if (!inputFile.is_open()) {
        cerr << "Error opening the input file." << endl;
        return 1; 
    }
    if (!outputFile.is_open()) {
        cerr << "Error opening the output file." << endl;
        return 1; 
    }

    ld observerLat;
    ld observerLon;
    ld observerAlt;
    ld airplaneLat;
    ld airplaneLon;
    ld airplaneAlt;

    // Every input row contains 3 values: latitude, longitude and altitude.
    // First row is observer location.

    inputFile >> observerLat >> observerLon >> observerAlt;
    cout << "OBSERVER :: Latitude: " << observerLat << ", Longitude: " << observerLon << ", Altitude: " << observerAlt << endl;
    if(observerLat < -90              // checking input
            || observerLat > 90
            || observerLon < -180 
            || observerLon > 180) {
                cout << "Observer input is not valid" << endl;
                outputFile << "Observer input is not valid" << endl;
                return 1;
    }

    while (inputFile >> airplaneLat >> airplaneLon >> airplaneAlt) { 

        if(airplaneLat < -90          // checking input
            || airplaneLat > 90
            || airplaneLon < -180 
            || airplaneLon > 180) {
                cout << "Airplane input is not valid" << endl;
                outputFile << "Airplane input is not valid" << endl;
                continue;
            }

        cout << "Latitude: " << airplaneLat << ", Longitude: " << airplaneLon << ", Altitude: " << airplaneAlt << endl;
        Result result = calculate(observerLat, observerLon, observerAlt, airplaneLat, airplaneLon, airplaneAlt);

        cout << "Azimuth: " << result.azimuth << ", Elevation angle: " << result.elevationAngle << endl;
        outputFile << "Azimuth: " << result.azimuth << ", Elevation angle: " << result.elevationAngle << endl;
        cout << endl;
    }
}