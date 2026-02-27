// import { RedisCache, RedisPubSub } from "@repo/redis";
// export let cache : RedisCache;
// export let pubsub : RedisPubSub;

// export function infra(){
//     if(cache && pubsub){
//         return;
//     }
//     cache = new RedisCache();
//     pubsub = new RedisPubSub();
//     console.log("infra success");
// }

// import geohash from "ngeohash";
// export const GEO_PRECISION = 5;
// export const RADIUS_KM = 5;
// export const EARTH_RADIUS_KM = 6371;

// export function getUserCells(lat: number, lng: number): string[] {
//   const center = geohash.encode(lat, lng, GEO_PRECISION);
//   const neighbours = geohash.neighbors(center);
//   return [center, ...Object.values(neighbours)];
// }

// export function haversineDistance(
//   lat1: number,
//   lng1: number,
//   lat2: number,
//   lng2: number,
// ): number {
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLng = ((lng2 - lng1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((lat1 * Math.PI) / 180) *
//       Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLng / 2) ** 2;
//   return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// }

// export function getRoomCells(lat: number, lng: number): string[] {
//   // A room belongs to its own cell + neighbors
//   // so it gets indexed in all cells that might query it
//   const center = geohash.encode(lat, lng, GEO_PRECISION);
//   const neighbors = geohash.neighbors(center);
//   return [center, ...Object.values(neighbors)];
// }
