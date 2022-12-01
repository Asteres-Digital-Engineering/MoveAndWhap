import { filter } from "lodash";

class PositionMapper {
  static mapPositionX = {};
  static mapPositionY = {};
  static boatMap = {};

  static setMapPositionX = (boat) => {
    const { x } = boat.position;
    const boatsOnX = PositionMapper.mapPositionX[x] || [];
    boatsOnX.push(boat);
    PositionMapper.mapPositionX[x] = boatsOnX;
  };

  static setMapPositionY = (boat) => {
    const { y } = boat.position;
    const boatsOnY = PositionMapper.mapPositionY[y] || [];
    boatsOnY.push(boat);
    PositionMapper.mapPositionY[y] = boatsOnY;
  };

  static setBoatMap = (boat) => {
    const address = boat.address;
    PositionMapper.boatMap[address] = boat;
  };

  static setBoatPositionToMap = (boat) => {
    PositionMapper.setMapPositionX(boat);
    PositionMapper.setMapPositionY(boat);
    PositionMapper.setBoatMap(boat);
  };

  static getBoatByAddress = (address) => {
    return PositionMapper.boatMap[address];
  };

  static getBoatsOnX = (x) => {
    return PositionMapper.mapPositionX[x] || [];
  };

  static getBoatsOnY = (y) => {
    return PositionMapper.mapPositionY[y] || [];
  };

  static findNearestBoatUp = (playerBoat) => {
    const { x: playerBoatX, y: playerBoatY } = playerBoat.position;
    if (playerBoatY === 0) return null;

    const boatsOnX = PositionMapper.getBoatsOnX(playerBoatX);
    const topBoats = filter(boatsOnX, (boat) => {
      const isTopBoat =
        boat.position.y < playerBoatY && boat.address !== playerBoat.address;
      return isTopBoat;
    });

    if (topBoats.length === 0) return null;

    const lowestTopBoat = topBoats.reduce((lowestBoat, boat) => {
      if (boat.position.y > lowestBoat.position.y) return boat;
      return lowestBoat;
    });

    return lowestTopBoat;
  };
}

export default PositionMapper;
