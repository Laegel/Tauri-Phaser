import * as Phaser from "phaser";


import { $, $$ } from "./utils";
import Building from "./Building";

import buildingsData from './buildingsData.json';

const buildings = Object.entries(buildingsData);

const $coordinates = $('#coordinates');
const any = $("#any");

const intersect = (one, two) => one.filter((n) => two.indexOf(n) > -1);


interface SimplePoint {
  x: number;
  y: number;
}


const getCellTop = ({ x, y }: SimplePoint) => ({ x, y: y - 1 });
const getCellLeft = ({ x, y }: SimplePoint) => ({ x: x - 1, y });
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


const flattenPoint = ({ x, y }: SimplePoint) => `${x};${y}`;

const halfTileWidth = 30;
const halfTileHeight = 15;


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

    let zoom = 1;
    this.input.on('wheel', (pointer) => {
      const delta = pointer.event.deltaY / Math.abs(pointer.event.deltaY);

      if (delta > 0 && zoom < 1 || delta < 0 && zoom < 10) {
        zoom = zoom - delta;
        this.cameras.main.setZoom(zoom);
      }

      // if (delta > 0) {
      //   if (zoom > 1) {
      //     zoom = zoom - delta;
      //     this.cameras.main.setZoom(zoom);
      //   }
      // } else {
      //   if (zoom < 10) {
      //     zoom = zoom - delta;
      //     this.cameras.main.setZoom(zoom);
      //   }
      // }
    });

    this.input.on('pointerdown', (pointer, gameObjects) => {

      if (gameObjects[0] && gameObjects[0].type === "Image") {
        const target = gameObjects[0];
        const targetBuildingData = { ...buildingsData[target.texture.key] };

        const onMoveBuilding = (tile) => {
          const coordinates = JSON.parse(tile.polygonCoordinates);
          target.setX(coordinates[0].x);
          target.setY(coordinates[1].y);
          target.setDepth(coordinates[1].y);
          const currentCoordinates = { x: tile.isoCoordinates.x, y: tile.isoCoordinates.y };
          const topCoordinates = { ...currentCoordinates };
          const rightCoordinates = { x: topCoordinates.x + targetBuildingData.dimensions.width - 1, y: topCoordinates.y };
          const bottomCoordinates = { x: rightCoordinates.x, y: rightCoordinates.y + targetBuildingData.dimensions.length - 1 };
          const leftCoordinates = { x: bottomCoordinates.x - targetBuildingData.dimensions.width + 1, y: bottomCoordinates.y };
          const buildingCoordinates = [
            topCoordinates,
            rightCoordinates,
            bottomCoordinates,
            leftCoordinates
          ];

          const areaCoordinates = getAreaCoordinates(buildingCoordinates);
          const simplifiedCoordinates = areaCoordinates.map(flattenPoint).filter((item, index, input) => input.indexOf(item) === index);

          const reservedCoordinates = [].concat.apply([], this.buildings.filter(building => target !== building).map(({ areaCoordinates }) => areaCoordinates.map(row => row.x + ';' + row.y)));
          const coordinatesAreFree = intersect(reservedCoordinates, simplifiedCoordinates).length === 0;

          const isInsideOfMap = !areaCoordinates.find(({ x, y }) => x < 0 || y < 0);
          const isValidPosition = isInsideOfMap && coordinatesAreFree;
          this.tiles.children.each(subtile => {
            if (simplifiedCoordinates.includes(flattenPoint(subtile.isoCoordinates))) {
              subtile.setFillStyle(isValidPosition ? 0x0000FF : 0xFF0000, 0.5);
            } else {
              subtile.setFillStyle(0x00FF00, 0);
            }
          });
          target.areaCoordinates = areaCoordinates;
        }

        const onStopMovingBuilding = (pointer, gameObjects) => {
          this.input.off('isomove', onMoveBuilding);
          this.input.off('pointerup', onStopMovingBuilding);
        };
        this.input.on('isomove', onMoveBuilding);
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

    const buttons = $$('.button-list > button');

    Array.from(buttons).forEach(button => {
      button.addEventListener('click', e => {
        const building = new Building(this, 0, 0, e.target.dataset.type);
        this.buildings.push(this.add.existing(building));
      });
    });


    this.spawnTiles();

    this.input.on('pointermove', (pointer, gameObjects) => {
      this.tiles.children.entries.some((tile) => {
        const coordinates = JSON.parse(tile.polygonCoordinates);
        const polygon = new Phaser.Geom.Polygon(coordinates);

        if (polygon.contains(pointer.worldX, pointer.worldY)) {
          this.input.emit('isomove', tile);
          $coordinates.innerText = "ABS: " + pointer.worldX + ";" + pointer.worldY + " - ISO: " + tile.isoCoordinates.x + ";" + tile.isoCoordinates.y;
        }
      });
    });
  }

  spawnTiles() {
    const texture = this.textures.get("background");
    const { width, height } = texture.getSourceImage();
    const backgroundBlankSpaces = [];

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

        if ((!backgroundPolygon.contains(initialX, initialY) &&
          !backgroundPolygon.contains(initialX + halfTileWidth, initialY + halfTileHeight) &&
          !backgroundPolygon.contains(initialX, initialY + halfTileHeight * 2) &&
          !backgroundPolygon.contains(initialX - halfTileWidth, initialY + halfTileHeight)) ||
          backgroundBlankSpaces.includes(flattenPoint({ x, y }))
        ) {
          continue;
        }

        const coordinates = [
          new Phaser.Geom.Point(initialX, initialY),
          new Phaser.Geom.Point(initialX + halfTileWidth, initialY + halfTileHeight),
          new Phaser.Geom.Point(initialX, initialY + halfTileHeight * 2),
          new Phaser.Geom.Point(initialX - halfTileWidth, initialY + halfTileHeight)
        ];

        const tile = this.add.polygon(
          initialX,
          initialY,
          coordinates,
          0x000000,
          0
        ).setOrigin(0, 0).setStrokeStyle(1, 0xFFFFFF);
        tile.setDepth(1);
        tile.isoCoordinates = {
          x, y
        };

        const polygonX = rootX * 2 + x * halfTileWidth - (y - 1) * halfTileWidth;
        const polygonY = rootY * 2 + y * halfTileHeight + (x - 1) * halfTileHeight;

        tile.polygonCoordinates = JSON.stringify([
          { x: polygonX, y: polygonY },
          { x: polygonX + halfTileWidth, y: polygonY + halfTileHeight },
          { x: polygonX, y: polygonY + halfTileHeight * 2 },
          { x: polygonX - halfTileWidth, y: polygonY + halfTileHeight }
        ]);

        this.tiles.add(tile);
      }
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
