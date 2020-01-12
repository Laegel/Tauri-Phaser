import * as Phaser from "phaser";


import { $, $$ } from "./utils";
import Building from "./Building";

const coordinates = $('#coordinates');
const any = $("#any");

class IsoInteractionExample extends Phaser.Scene {

  tiles: Phaser.GameObjects.Group;

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
        const onMoveBuilding = (pointer) => {
          this.tiles.children.each((tile) => {
            const coordinates = JSON.parse(tile.polygonCoordinates);
            const polygon = new Phaser.Geom.Polygon(coordinates);

            if (polygon.contains(pointer.worldX, pointer.worldY)) {
              // Find a better way to place stuff
              target.setX(coordinates[0].x);
              target.setY(coordinates[1].y);
              target.setDepth(coordinates[1].y);
            }
          });
        };
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
        buildings.push(this.add.existing(building));
      });
    });


    this.spawnTiles();
  }

  spawnTiles() {
    this.tiles = this.add.group();
    for (let y = 0; y < 42; ++y) {
      for (let x = 0; x < 14; ++x) {
        const isEven = y % 2 === 0;

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
        const gridSquare = this.add.graphics({ x: initialX, y: initialY, lineStyle: { alpha: 1, color: 0xFFFFFF } });

        gridSquare.fillPoints(polygon.points, true);
        gridSquare.strokePoints(polygon.points, true);
        gridSquare.setDepth(1);
        gridSquare.id = x + ';' + y;

        const polygonX = x * halfTileWidth * 2 + (isEven ? 0 : halfTileWidth);
        const polygonY = -halfTileHeight + y * halfTileHeight;


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

  update(time, framesPerSec) {
    buildings.forEach(building => building.update());
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

const buildings = [];

export const game = new Phaser.Game(gameConfig);
