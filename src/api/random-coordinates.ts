/**
 * Генерирует точку в заданном диапазоне расстояний
 * @param {number} lat - Текущая широта
 * @param {number} lng - Текущая долгота
 * @param {number} minDistance - Минимальное расстояние (в метрах)
 * @param {number} maxDistance - Максимальное расстояние (в метрах)
 */

interface Target {
     lat: number;
     lng: number;
     distanceSet: number;
}

export default function generateTargetPoint (lat: number, lng: number, minDistance: number, maxDistance: number): Target {
  const EARTH_RADIUS = 6371000;

  // 1. Генерируем случайное расстояние в заданном промежутке [min, max]
  // Используем корень для равномерного распределения площади
  const randomDist = Math.sqrt(Math.random() * (Math.pow(maxDistance, 2) - Math.pow(minDistance, 2)) + Math.pow(minDistance, 2));

  // 2. Генерируем случайное направление (угол от 0 до 360 градусов)
  const randomAngle = Math.random() * 2 * Math.PI;

  // 3. Рассчитываем смещение координат
  const deltaLat = (randomDist * Math.cos(randomAngle)) / EARTH_RADIUS;
  const deltaLng = (randomDist * Math.sin(randomAngle)) / (EARTH_RADIUS * Math.cos(lat * Math.PI / 180));

  return {
    lat: +(lat + deltaLat * (180 / Math.PI)).toFixed(6),
    lng: +(lng + deltaLng * (180 / Math.PI)).toFixed(6),
    distanceSet: Math.round(randomDist) // вернем для инфы, на каком расстоянии реально создалась точка
  };
};

// Примеры использования:
// Если хочешь точку СТРОГО в районе 5 км (например, от 4.5 до 5.5 км)
// const longWalk = generateTargetPoint(55.75, 37.61, 4500, 5500);

// Если просто "до 10 км"
// const randomTrip = generateTargetPoint(55.75, 37.61, 0, 10000);
// console.log(randomTrip);
