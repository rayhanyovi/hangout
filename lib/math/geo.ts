import type { Coordinate } from "@/lib/contracts";

export function haversineKm(a: Coordinate, b: Coordinate) {
  const earthRadiusKm = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng *
      sinLng;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function computeGeometricMedian(points: Coordinate[]) {
  if (points.length === 0) {
    return null;
  }

  if (points.length === 1) {
    return points[0];
  }

  let x = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
  let y = points.reduce((sum, point) => sum + point.lng, 0) / points.length;

  for (let iteration = 0; iteration < 100; iteration += 1) {
    let numeratorX = 0;
    let numeratorY = 0;
    let denominator = 0;

    for (const point of points) {
      const distance = Math.sqrt((point.lat - x) ** 2 + (point.lng - y) ** 2);

      if (distance < 1e-10) {
        continue;
      }

      const weight = 1 / distance;
      numeratorX += weight * point.lat;
      numeratorY += weight * point.lng;
      denominator += weight;
    }

    if (denominator === 0) {
      break;
    }

    const nextX = numeratorX / denominator;
    const nextY = numeratorY / denominator;

    if (Math.abs(nextX - x) < 1e-8 && Math.abs(nextY - y) < 1e-8) {
      x = nextX;
      y = nextY;
      break;
    }

    x = nextX;
    y = nextY;
  }

  return { lat: x, lng: y };
}
