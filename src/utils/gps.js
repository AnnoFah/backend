// src/utils/gps.js
// Haversine formula untuk menghitung jarak GPS

const env = require('../config/env');

/**
 * Hitung jarak antara dua koordinat GPS menggunakan Haversine formula
 * @returns {number} jarak dalam meter
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Cek apakah koordinat user berada dalam radius kantor MCC
 */
const isWithinRadius = (
  userLat,
  userLng,
  officeLat = env.MCC_LAT,
  officeLng = env.MCC_LNG,
  radius = env.MCC_RADIUS
) => {
  const distance = calculateDistance(userLat, userLng, officeLat, officeLng);
  return {
    isValid: distance <= radius,
    distance: Math.round(distance),
    radius,
  };
};

module.exports = { calculateDistance, isWithinRadius };
