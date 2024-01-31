
/*
    azimuth and elevation angle calculation
*/


function EarthRadiusInMeters(latitudeRadians) {
    // latitudeRadians is geodetic, i.e. that reported by GPS.
    // http://en.wikipedia.org/wiki/Earth_radius
    var a = 6378137.0;  // equatorial radius in meters
    var b = 6356752.3;  // polar radius in meters
    var cos = Math.cos(latitudeRadians);
    var sin = Math.sin(latitudeRadians);
    var t1 = a * a * cos;
    var t2 = b * b * sin;
    var t3 = a * cos;
    var t4 = b * sin;
    return Math.sqrt((t1 * t1 + t2 * t2) / (t3 * t3 + t4 * t4));
}

function GeocentricLatitude(lat) {
    // Convert geodetic latitude reported by GPS to geocentric latitude 
    // Geocentric latitude is angle measured from the center of Earth between a point and the equator
    var e2 = 0.00669437999014;
    var clat = Math.atan((1.0 - e2) * Math.tan(lat));
    return clat;
}

function LocationToPoint(c) {
    // Convert (lat, lon, elv) to (x, y, z) => Cartesian coordinate system
    var lat = c.lat * Math.PI / 180.0;
    var lon = c.lon * Math.PI / 180.0;
    var radius = EarthRadiusInMeters(lat);
    var clat = GeocentricLatitude(lat);

    var cosLon = Math.cos(lon);
    var sinLon = Math.sin(lon);
    var cosLat = Math.cos(clat);
    var sinLat = Math.sin(clat);
    var x = radius * cosLon * cosLat;
    var y = radius * sinLon * cosLat;
    var z = radius * sinLat;

    // We used geocentric latitude to calculate (x,y,z) on the Earth's ellipsoid.
    // Now we use geodetic latitude to calculate normal vector from the surface, to correct for elevation.
    var cosGlat = Math.cos(lat);
    var sinGlat = Math.sin(lat);

    var nx = cosGlat * cosLon;
    var ny = cosGlat * sinLon;
    var nz = sinGlat;

    x += c.elv * nx;
    y += c.elv * ny;
    z += c.elv * nz;

    return { x: x, y: y, z: z, radius: radius, nx: nx, ny: ny, nz: nz };
}

function Distance(ap, bp) {
    var dx = ap.x - bp.x;
    var dy = ap.y - bp.y;
    var dz = ap.z - bp.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function RotateGlobe(b, a, bradius, aradius) {
    // Get modified coordinates of 'b' by rotating the globe so that 'a' is at lat=0, lon=0.
    var br = { lat: b.lat, lon: (b.lon - a.lon), elv: b.elv };
    var brp = LocationToPoint(br);

    // Rotate brp cartesian coordinates around the z-axis by a.lon degrees,
    // then around the y-axis by a.lat degrees.
    // Though we are decreasing by a.lat degrees, as seen above the y-axis,
    // this is a positive (counterclockwise) rotation (if B's longitude is east of A's).
    // However, from this point of view the x-axis is pointing left.
    // So we will look the other way making the x-axis pointing right, the z-axis
    // pointing up, and the rotation treated as negative.

    var alat = GeocentricLatitude(-a.lat * Math.PI / 180.0);
    var acos = Math.cos(alat);
    var asin = Math.sin(alat);

    var bx = (brp.x * acos) - (brp.z * asin);
    var by = brp.y;
    var bz = (brp.x * asin) + (brp.z * acos);

    return { x: bx, y: by, z: bz, radius: bradius };
}

function NormalizeVectorDiff(b, a) {
    // Calculate norm(b-a), where norm divides a vector by its length to produce a unit vector.
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var dz = b.z - a.z;
    var dist2 = dx * dx + dy * dy + dz * dz;
    if (dist2 == 0) {
        return null;
    }
    var dist = Math.sqrt(dist2);
    return { x: (dx / dist), y: (dy / dist), z: (dz / dist), radius: 1.0 };
}

function Calculate(olat, olon, oalt, lat, lon, alt) {
    // turning altitude from feet to meters
    var a = {lat: olat, lon: olon, elv: olat};
    var b = {lat, lon, elv: alt};
    if (a !== null) {
        if (b !== null) {
            var ap = LocationToPoint(a);
            var bp = LocationToPoint(b);
            var distKm = 0.001 * Distance(ap, bp);

            // Center A to have latitude 0 and longitude 0
            // And then adjust B coordinates accordingly
            var br = RotateGlobe(b, a, bp.radius, ap.radius);
            if (br.z * br.z + br.y * br.y > 1.0e-6) {
                var theta = Math.atan2(br.z, br.y) * 180.0 / Math.PI;
                var azimuth = 90.0 - theta;
                if (azimuth < 0.0) {
                    azimuth += 360.0;
                }
                if (azimuth > 360.0) {
                    azimuth -= 360.0;
                }
            }

            var bma = NormalizeVectorDiff(bp, ap);
            if (bma != null) {
                // Calculate altitude, which is the angle above the horizon of B as seen from A.
                var altitude = 90.0 - (180.0 / Math.PI) * Math.acos(bma.x * ap.nx + bma.y * ap.ny + bma.z * ap.nz);
                if(altitude < 0) altitude = -1;
            }
            return {azimuth, altitude, distKm};
        }
    }
    return null;
}

module.exports = {
    EarthRadiusInMeters,
    GeocentricLatitude,
    LocationToPoint,
    Distance,
    RotateGlobe,
    NormalizeVectorDiff,
    Calculate,
};