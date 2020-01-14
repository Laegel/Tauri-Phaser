import * as Phaser from "phaser";


import { $, $$ } from "./utils";
import Building from "./Building";

import buildingsData from './buildingsData.json';

const buildings = Object.entries(buildingsData);

const coordinates = $('#coordinates');
const any = $("#any");

const isInside = (point, vs) => {
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

  var x = point.x, y = point.y;

  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    var xi = vs[i].x, yi = vs[i].y;
    var xj = vs[j].x, yj = vs[j].y;

    var intersect = ((yi > y) != (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
};

class IsoInteractionExample extends Phaser.Scene {

  tiles: Phaser.GameObjects.Group;
  grid: any;

  preload() {
    this.load.image("background", "background.jpg");

    this.load.image("castle", "/castle.png");
    this.load.image("shop", "/shop.png");
    this.load.image("tree", "/tree.png");
  }

  create() {
    const texture = this.textures.get("background");
    const { width, height } = texture.getSourceImage();
    this.add.image(width * 0.25, height * 0.25, "background").setScale(0.5);

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
        const computeNotLessThan = (expression, floor) => expression > floor ? expression : floor;
        const computeNotMoreThan = (expression, ceil) => expression < ceil ? expression : ceil;
        // const effectAreaCoordinates = 
        const onMoveBuilding = (pointer) => {
          // this.tiles.children.entries.some(tile => {
          //   const polygon = new Phaser.Geom.Polygon(coordinates);
          //   if (polygon.contains(pointer.worldX, pointer.worldY)) {
          //     // Find a better way to place stuff
          //     target.setX(coordinates[0].x);
          //     target.setY(coordinates[1].y);
          //     target.setDepth(coordinates[1].y);
          //     const currentCoordinates = { x: tile.isoCoordinates.x, y: tile.isoCoordinates.y };

          //     const targetBoundaries = [
          //       { x: computeNotLessThan(currentCoordinates.x - targetBuildingData.effectArea, 0), y: computeNotLessThan(currentCoordinates.y - targetBuildingData.effectArea, 0) },
          //       { x: computeNotMoreThan(currentCoordinates.x + targetBuildingData.effectArea, 14), y: computeNotLessThan(currentCoordinates.y - targetBuildingData.effectArea, 0) },
          //       { x: computeNotMoreThan(currentCoordinates.x + targetBuildingData.effectArea, 14), y: computeNotMoreThan(currentCoordinates.y + targetBuildingData.effectArea, 42) },
          //       { x: computeNotLessThan(currentCoordinates.x - targetBuildingData.effectArea, 0), y: computeNotMoreThan(currentCoordinates.y + targetBuildingData.effectArea, 42) },
          //     ];

          //     this.tiles.children.each(subtile => {
          //       if (isInside(subtile.isoCoordinates, targetBoundaries)) {
          //         subtile.setFillStyle(0x00FF00);
          //       } else {
          //         subtile.setFillStyle(0x00FF00, 0);
          //       }
          //     });
          //     return true;
          //   }
          // });

          this.tiles.children.entries.some((tile) => {
            // tile.fillStyle(0x00FF00);
            const coordinates = JSON.parse(tile.polygonCoordinates);
            const polygon = new Phaser.Geom.Polygon(coordinates);

            if (polygon.contains(pointer.worldX, pointer.worldY)) {
              // Find a better way to place stuff
              target.setX(coordinates[0].x);
              target.setY(coordinates[1].y);
              target.setDepth(coordinates[1].y);
              const currentCoordinates = { x: tile.isoCoordinates.x, y: tile.isoCoordinates.y };

              this.tiles.children.each(subtile => {

                if (currentCoordinates.x - targetBuildingData.effectArea <= subtile.isoCoordinates.x && subtile.isoCoordinates.x <= currentCoordinates.x + targetBuildingData.effectArea &&
                  currentCoordinates.y - targetBuildingData.effectArea <= subtile.isoCoordinates.y && subtile.isoCoordinates.y <= currentCoordinates.y + targetBuildingData.effectArea) {
                  subtile.setFillStyle(0x00FF00);
                } else {
                  subtile.setFillStyle(0x00FF00, 0);
                }
              });
              tile.setFillStyle(0x0000FF);
              return true;
            }
          });
        }
        const onStopMovingBuilding = () => {
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
        buildingList.push(this.add.existing(building));
      });
    });


    this.spawnTiles();
  }

  // spawnTiles() {
  //   const rootX = 200;
  //   const rootY = -100;
  //   this.tiles = this.add.group();
  //   // const grid = [];
  //   for (let y = 0; y < 35; ++y) {
  //     for (let x = 0; x < 34; ++x) {
  //       // if (!grid[x]) {
  //       //   grid[x] = {};
  //       // }
  //       const halfTileWidth = 30;
  //       const halfTileHeight = 15;
  //       const quarterTileHeight = halfTileHeight / 2;
  //       const quarterTileWidth = halfTileWidth / 2;
  //       const initialX = rootX + x * quarterTileWidth - (y - 1) * quarterTileWidth;
  //       const initialY = rootY + y * quarterTileHeight + (x - 1) * quarterTileHeight;

  //       const coordinates = [
  //         new Phaser.Geom.Point(initialX, initialY),
  //         new Phaser.Geom.Point(initialX + halfTileWidth, initialY + halfTileHeight),
  //         new Phaser.Geom.Point(initialX, initialY + halfTileHeight * 2),
  //         new Phaser.Geom.Point(initialX - halfTileWidth, initialY + halfTileHeight)
  //       ];
  //       const polygon = new Phaser.Geom.Polygon(coordinates);
  //       const gridSquare = this.add.polygon(
  //         initialX,
  //         initialY,
  //         polygon.points,
  //         0x000000,
  //         0
  //       ).setOrigin(0, 0).setStrokeStyle(1, 0xFFFFFF);
  //       gridSquare.setDepth(1);
  //       gridSquare.isoCoordinates = {
  //         x, y
  //       };
  //       gridSquare.coordinates = coordinates;

  //       const polygonX = rootX + x * halfTileWidth - (y - 1) * halfTileWidth * 2;
  //       const polygonY = rootY + y * quarterTileHeight / 2 + (x - 1) * quarterTileHeight / 2;


  //       gridSquare.polygonCoordinates = JSON.stringify([
  //         { x: polygonX, y: polygonY },
  //         { x: polygonX + halfTileWidth, y: polygonY + halfTileHeight },
  //         { x: polygonX, y: polygonY + halfTileHeight * 2 },
  //         { x: polygonX - halfTileWidth, y: polygonY + halfTileHeight }
  //       ]);
  //       // grid[x][y] = gridSquare;
  //       this.tiles.add(gridSquare);
  //     }
  //   }
  // }
  spawnTiles() {
    // this.grid = [];
    this.tiles = this.add.group();
    const isoCoordinates = {
      x: 0, y: 0
    };
    for (let y = 0; y < 42; ++y) {
      // this.grid[y] = {};
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
        const polygon = new Phaser.Geom.Polygon(coordinates);
        const gridSquare = this.add.polygon(
          initialX,
          initialY,
          polygon.points,
          0x000000,
          0
        ).setOrigin(0, 0).setStrokeStyle(1, 0xFFFFFF);
        gridSquare.setDepth(1);

        // gridSquare.isoCoordinates = {
        //   x: isEven ? x + 1 : x + 2, y: isEven ? y + 2 : y + 1
        // };
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

        // this.grid[y][x] = gridSquare;
        this.tiles.add(gridSquare);
        ++isoCoordinates.x;
      }
      ++isoCoordinates.y;
    }
  }

  update(time, framesPerSec) {
    buildingList.forEach(building => building.update());
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

const buildingList = [];

export const game = new Phaser.Game(gameConfig);
