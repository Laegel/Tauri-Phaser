import * as Phaser from "phaser";


import { $, $$ } from "./utils";
import Building from "./Building";

import buildingsData from './buildingsData.json';

const buildings = Object.entries(buildingsData);

const $coordinates = $('#coordinates');
const any = $("#any");

const intersect = (one, two) => one.filter((n) => two.indexOf(n) > -1);

const contains = function (points, x, y) {
  var inside = false;

  for (var i = -1, j = points.length - 1; ++i < points.length; j = i) {
    var ix = points[i].x;
    var iy = points[i].y;

    var jx = points[j].x;
    var jy = points[j].y;

    if (((iy <= y && y < jy) || (jy <= y && y < iy)) && (x < (jx - ix) * (y - iy) / (jy - iy) + ix)) {
      inside = !inside;
    }
  }

  return inside;
};

interface SimplePoint {
  x: number;
  y: number;
}

type SimpleLine = [SimplePoint, SimplePoint];

const isAbove = (line: SimpleLine, { x, y }: SimplePoint) =>
  ((line[1].x - line[0].x) * (y - line[0].y) - (line[1].y - line[0].y) * (x - line[0].x)) > 0;

const isBelow = (line: SimpleLine, { x, y }: SimplePoint) =>
  ((line[1].x - line[0].x) * (y - line[0].y) - (line[1].y - line[0].y) * (x - line[0].x)) < 0;

const isBefore = (line: SimpleLine, { x, y }: SimplePoint) =>
  ((line[1].y - line[0].y) * (x - line[0].x) - (line[1].x - line[0].x) * (y - line[0].y)) > 0;

const isAfter = (line: SimpleLine, { x, y }: SimplePoint) =>
  ((line[1].y - line[0].y) * (x - line[0].x) - (line[1].x - line[0].x) * (y - line[0].y)) < 0;
/*

  2, 2 [0]
   3, 3 [1]
0, 4 [3]
 1, 5 [2]

 1, 3
 2, 4

  2, 2
 1, 3
    4, 4
   3, 5
*/

const rectangleContains = (rectangle: Array<{ x: number, y: number }>, point: SimplePoint) => {
  const zero = rectangle[0];
  const one = rectangle[2];
  const two = rectangle[1];
  const three = rectangle[3];

  const lengthIncluded = isAbove([zero, one], point) && isBelow([three, two], point);
  const widthIncluded = isAbove([zero, three], point) && isBelow([one, two], point);

  return lengthIncluded
  // && widthIncluded;
};

const getCellAbsolute = (point: SimplePoint) => ({ ...point });
const getCellTop = ({ x, y }: SimplePoint) => ({ x: x + 1, y: y - 1 });
// const getCellRight = ({ x, y }: SimplePoint) => ({ x: x + 1, y: y + 1 });
// const getCellBottom = ({ x, y }: SimplePoint) => ({ x: x - 1, y: y + 1 });
const getCellLeft = ({ x, y }: SimplePoint) => ({ x: x - 1, y: y - 1 });

const getCellRight = ({ x, y }: SimplePoint) => ({ x: x + 1, y });
const getCellBottom = ({ x, y }: SimplePoint) => ({ x, y: y + 1 });

const getAreaCoordinates = (points) => {
  let stop1 = 0;
  let stop2 = 0;
  const coordinates = [...points];
  let horizontalPoint = { ...points[0] };
  let bottomVerticalPoint = { ...points[3] };

  while (horizontalPoint.x <= points[1].x && horizontalPoint.y <= points[1].y && stop1 < 20) {
    let verticalPoint = { ...horizontalPoint };
    while (verticalPoint.x >= bottomVerticalPoint.x && verticalPoint.y <= bottomVerticalPoint.y && stop2 < 20) {
      coordinates.push(verticalPoint);
      verticalPoint = getCellBottom(verticalPoint);
      ++stop2;
    }
    horizontalPoint = getCellRight(horizontalPoint);
    bottomVerticalPoint = getCellRight(bottomVerticalPoint);
    ++stop1;
  }
  return coordinates;
}

const areaCoordinates = getAreaCoordinates([
  { x: 6, y: 10 },
  { x: 7, y: 11 },
  { x: 5, y: 13 },
  { x: 4, y: 12 }
]);

const halfTileWidth = 30;
const halfTileHeight = 15;
// const ezCoords = areaCoordinates.map(({ x, y }) => x + ';' + y);

const state = {
  coordinates: null
};
const getCurrentCoordinates = () => ({ ...state.coordinates });

class IsoInteractionExample extends Phaser.Scene {

  tiles: Phaser.GameObjects.Group;
  buildings = [];
  background;

  preload() {
    this.load.image("background", "background.jpg");

    this.load.image("castle", "/castle.png");
    this.load.image("shop", "/shop.png");
    this.load.image("tree", "/tree.png");
  }

  create() {
    const texture = this.textures.get("background");
    const { width, height } = texture.getSourceImage();
    this.background = this.add.image(width * 0.25, height * 0.25, "background").setScale(0.5);

    const contextMenu = $('#context-menu');

    let zoom = 1;
    this.input.on('wheel', (pointer, currentlyOver) => {
      const delta = pointer.event.deltaY / Math.abs(pointer.event.deltaY);
      if (delta > 0) {
        if (zoom > 1) {
          zoom = zoom - delta;
          this.cameras.main.setZoom(zoom);
        }
      } else {
        if (zoom < 10) {
          zoom = zoom - delta;
          this.cameras.main.setZoom(zoom);
        }
      }
    });

    this.input.on('pointerdown', (pointer, gameObjects) => {

      if (gameObjects[0] && gameObjects[0].type === "Image") {
        const target = gameObjects[0];
        const targetBuildingData = { ...buildingsData[target.texture.key] };
        const onMoveBuilding = (pointer) => {

          this.tiles.children.entries.some((tile) => {
            const coordinates = JSON.parse(tile.polygonCoordinates);
            const polygon = new Phaser.Geom.Polygon(coordinates);

            if (polygon.contains(pointer.worldX, pointer.worldY)) {
              // console.log(tile.isoCoordinates);

              // Find a better way to place stuff
              target.setX(coordinates[0].x);
              target.setY(coordinates[1].y);
              target.setDepth(coordinates[1].y);
              const currentCoordinates = { x: tile.isoCoordinates.x, y: tile.isoCoordinates.y };
              const topCoordinates = { ...currentCoordinates };
              const rightCoordinates = { x: topCoordinates.x + targetBuildingData.dimensions.width - 1, y: topCoordinates.y + targetBuildingData.dimensions.width - 1 };
              const bottomCoordinates = { x: rightCoordinates.x - targetBuildingData.dimensions.length + 1, y: rightCoordinates.y + targetBuildingData.dimensions.length - 1 };
              const leftCoordinates = { x: bottomCoordinates.x - targetBuildingData.dimensions.width + 1, y: bottomCoordinates.y - targetBuildingData.dimensions.width + 1 };
              const buildingCoordinates = [
                topCoordinates,
                rightCoordinates,
                bottomCoordinates,
                leftCoordinates
              ];

              const bottomTile = getCellBottom(tile.isoCoordinates);
              const rightTile = getCellRight(tile.isoCoordinates);

              const areaCoordinates = getAreaCoordinates(buildingCoordinates);
              const ezCoords = areaCoordinates.map(({ x, y }) => x + ';' + y).filter((item, index, input) => input.indexOf(item) === index);

              const reservedCoordinates = [].concat.apply([], this.buildings.filter(building => target !== building).map(({ areaCoordinates }) => areaCoordinates.map(row => row.x + ';' + row.y)));
              const coordinatesAreFree = intersect(reservedCoordinates, ezCoords).length === 0;

              const isInsideOfMap = !areaCoordinates.find(({ x, y }) => x < 0 || y < 0);
              const isValidPosition = isInsideOfMap && coordinatesAreFree;
              this.tiles.children.each(subtile => {
                if (ezCoords.includes(subtile.isoCoordinates.x + ';' + subtile.isoCoordinates.y)) {
                  subtile.setFillStyle(isValidPosition ? 0x0000FF : 0xFF0000);
                } else {
                  subtile.setFillStyle(0x00FF00, 0);
                }
              });
              target.areaCoordinates = areaCoordinates;
              return true;
            }
          });
        }
        const onStopMovingBuilding = (pointer, gameObjects) => {
          this.input.off('pointermove', onMoveBuilding);
          this.input.off('pointerup', onStopMovingBuilding);
        };
        this.input.on('pointermove', onMoveBuilding);
        this.input.on('pointerup', onStopMovingBuilding);

        return;
      }

      const originalPosition = { worldX: pointer.worldX, worldY: pointer.worldY };
      const pointerMove = (pointer) => {
        this.cameras.main.scrollX = this.cameras.main.scrollX + originalPosition.worldX - pointer.worldX;
        this.cameras.main.scrollY = this.cameras.main.scrollY + originalPosition.worldY - pointer.worldY;
      };

      const pointerUp = (pointer) => {
        this.input.off('pointermove', pointerMove);
        this.input.off('pointerup', pointerUp);
      };
      this.input.on('pointermove', pointerMove);
      this.input.on('pointerup', pointerUp);

    });

    this.input.on('pointermove', (pointer) => coordinates.innerText = pointer.worldX + ";" + pointer.worldY);


    const buttons = $$('.button-list > button');

    Array.from(buttons).forEach(button => {
      button.addEventListener('click', e => {
        const building = new Building(this, 0, 0, e.target.dataset.type);
        this.buildings.push(this.add.existing(building));
      });
    });


    // this.spawnTiles();
    this.spawnTiles1();

    this.input.on('pointermove', (pointer, gameObjects) => {
      this.tiles.children.entries.some((tile) => {
        const coordinates = JSON.parse(tile.polygonCoordinates);
        const polygon = new Phaser.Geom.Polygon(coordinates);

        if (polygon.contains(pointer.worldX, pointer.worldY)) {
          $coordinates.innerText = "ABS: " + pointer.worldX + ";" + pointer.worldY + " - ISO: " + tile.isoCoordinates.x + ";" + tile.isoCoordinates.y;
        }
      });
    });
  }

  spawnTiles1() {
    const texture = this.textures.get("background");
    const { width, height } = texture.getSourceImage();

    const backgroundPolygon = new Phaser.Geom.Polygon([
      new Phaser.Geom.Point(0, 0),
      new Phaser.Geom.Point(0 + width * 0.25, 0),
      new Phaser.Geom.Point(0 + width * 0.25, 0 + height * 0.25),
      new Phaser.Geom.Point(0, 0 + height * 0.25),
    ]);

    const rootX = 200;
    const rootY = -100;
    this.tiles = this.add.group();
    for (let y = 0; y < 35; ++y) {
      for (let x = 0; x < 34; ++x) {
        const quarterTileHeight = halfTileHeight / 2;
        const quarterTileWidth = halfTileWidth / 2;
        const initialX = rootX + x * quarterTileWidth - (y - 1) * quarterTileWidth;
        const initialY = rootY + y * quarterTileHeight + (x - 1) * quarterTileHeight;

        if (!backgroundPolygon.contains(initialX, initialY) &&
          !backgroundPolygon.contains(initialX + halfTileWidth, initialY + halfTileHeight) &&
          !backgroundPolygon.contains(initialX, initialY + halfTileHeight * 2) &&
          !backgroundPolygon.contains(initialX - halfTileWidth, initialY + halfTileHeight)
        ) {
          continue;
        }

        const coordinates = [
          new Phaser.Geom.Point(initialX, initialY),
          new Phaser.Geom.Point(initialX + halfTileWidth, initialY + halfTileHeight),
          new Phaser.Geom.Point(initialX, initialY + halfTileHeight * 2),
          new Phaser.Geom.Point(initialX - halfTileWidth, initialY + halfTileHeight)
        ];
        const polygon = new Phaser.Geom.Polygon(coordinates);

        const gridSquare = this.add.polygon(
          initialX,
          initialY,
          coordinates,
          0x000000,
          0
        ).setOrigin(0, 0).setStrokeStyle(1, 0xFFFFFF);
        gridSquare.setDepth(1);
        gridSquare.isoCoordinates = {
          x, y
        };
        gridSquare.coordinates = coordinates;

        const polygonX = rootX * 2 + x * halfTileWidth - (y - 1) * halfTileWidth;
        const polygonY = rootY * 2 + y * halfTileHeight + (x - 1) * halfTileHeight;
        
        gridSquare.polygonCoordinates = JSON.stringify([
          { x: polygonX, y: polygonY },
          { x: polygonX + halfTileWidth, y: polygonY + halfTileHeight },
          { x: polygonX, y: polygonY + halfTileHeight * 2 },
          { x: polygonX - halfTileWidth, y: polygonY + halfTileHeight }
        ]);

        this.tiles.add(gridSquare);
      }
    }
  }
  spawnTiles() {
    this.tiles = this.add.group();
    const isoCoordinates = {
      x: 0, y: 0
    };
    for (let y = 0; y < 42; ++y) {
      const isEven = y % 2 === 0;
      isoCoordinates.x = isEven ? 0 : 1;
      for (let x = 0; x < 14; ++x) {


        const halfTileWidth = 30;
        const halfTileHeight = 15;
        const initialX = x * halfTileWidth + (isEven ? 0 : halfTileWidth / 2);
        const initialY = isEven ? (y - 1) * halfTileHeight / 2 : (y - 1) * halfTileHeight / 2;

        const coordinates = [
          new Phaser.Geom.Point(initialX, initialY),
          new Phaser.Geom.Point(initialX + halfTileWidth, initialY + halfTileHeight),
          new Phaser.Geom.Point(initialX, initialY + halfTileHeight * 2),
          new Phaser.Geom.Point(initialX - halfTileWidth, initialY + halfTileHeight)
        ];
        const gridSquare = this.add.polygon(
          initialX,
          initialY,
          coordinates,
          0x000000,
          0
        ).setOrigin(0, 0).setStrokeStyle(1, 0xFFFFFF);
        gridSquare.setDepth(1);

        gridSquare.isoCoordinates = { x: isoCoordinates.x + x, y: isoCoordinates.y };
        gridSquare.isEven = isEven;
        gridSquare.coordinates = coordinates;

        const polygonX = x * halfTileWidth * 2 + (isEven ? 0 : halfTileWidth);
        const polygonY = -halfTileHeight + y * halfTileHeight;


        gridSquare.polygonCoordinates = JSON.stringify([
          { x: polygonX, y: polygonY },
          { x: polygonX + halfTileWidth, y: polygonY + halfTileHeight },
          { x: polygonX, y: polygonY + halfTileHeight * 2 },
          { x: polygonX - halfTileWidth, y: polygonY + halfTileHeight }
        ]);

        this.tiles.add(gridSquare);
        ++isoCoordinates.x;
      }
      ++isoCoordinates.y;
    }
  }

  update(time, framesPerSec) {
    this.buildings.forEach(building => building.update());
  }

}

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: 800,
  height: 600,
  backgroundColor: "#ababab",
  parent: "game",
  scene: IsoInteractionExample
};

let d = 0;

let scene;


const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;

export const game = new Phaser.Game(gameConfig);
