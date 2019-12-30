import * as Phaser from "phaser";
import IsoPlugin from 'phaser3-plugin-isometric';
import Skeleton from "./Skeleton";
import IsometricTile from "./IsometricTile";

import { $, $$ } from "./utils";
import Building from "./Building";

class IsoInteractionExample extends Phaser.Scene {

  preload() {
    this.load.json("map", "/grass-water.json");
    this.load.spritesheet("tiles", "/grass-water.png", {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet("skeleton", "/skeleton.png", {
      frameWidth: 128,
      frameHeight: 128
    });
    this.load.image("house", "/house.png");
    this.load.image("tavern", "/tavern.png");
  }

  create() {
    scene = this;


    // const grid = new Phaser.GameObjects.Grid(scene, 0, 0, 1000, 1000, 64, 64, 0, 0, 0xFFFFFF, 1);
    // grid.depth = 1000;
    // grid.setRotation(-30);
    // grid.createGeometryMask();
    // scene.add.existing(grid);
    
    buildGrid(scene);

    buildMap();
    placeHouses();
    // spawnSkeletons(this);

    this.cameras.main.setSize(1600, 600);
    this.cameras.main.scrollX = 300;
    // this.cameras.main.scrollY = 300;


    const contextMenu = $('#context-menu');

    this.input.on('pointerdown', (pointer, gameObjects) => {
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

      if (gameObjects.length) {
        gameObjects.forEach(gameObject => {
          // Building contextual menu should appear
          contextMenu.style.display = "block";
          gameObject.setTint(0x7878ff);
          contextMenu.style.top = pointer.position.y + "px";
          contextMenu.style.left = pointer.position.x + "px";

        });

        this.input.off('pointermove', pointerMove);
        this.input.off('pointerup', pointerUp);
      } else { // If in map
        contextMenu.style.display = "none";
        // Map contextual menu should appear... or not, as the camera's moving on pointermove
      }
    }, this);


    const buttons = $$('.button-list > button');

    Array.from(buttons).forEach(button => {
      button.addEventListener('click', e => {
        buildings.push(this.add.existing(new Building(this, 240, 370, e.target.dataset.type)));
      });
    });
  }

  update() {
    skeletons.forEach(function (skeleton) {
      skeleton.update();
    });

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
const skeletons = [];

let d = 0;

let scene;

function spawnSkeletons(scene) {
  skeletons.push(
    scene.add.existing(new Skeleton(scene, 240, 290, "walk", "southEast", 100))
  );
  skeletons.push(
    scene.add.existing(new Skeleton(scene, 100, 380, "walk", "southEast", 230))
  );
  skeletons.push(
    scene.add.existing(new Skeleton(scene, 620, 140, "walk", "south", 380))
  );
  skeletons.push(
    scene.add.existing(new Skeleton(scene, 460, 180, "idle", "south", 0))
  );

  skeletons.push(
    scene.add.existing(new Skeleton(scene, 760, 100, "attack", "southEast", 0))
  );
  skeletons.push(
    scene.add.existing(new Skeleton(scene, 800, 140, "attack", "northWest", 0))
  );

  skeletons.push(
    scene.add.existing(new Skeleton(scene, 750, 480, "walk", "east", 200))
  );

  skeletons.push(
    scene.add.existing(new Skeleton(scene, 1030, 300, "die", "west", 0))
  );

  skeletons.push(
    scene.add.existing(new Skeleton(scene, 1180, 340, "attack", "northEast", 0))
  );

  skeletons.push(
    scene.add.existing(new Skeleton(scene, 1180, 180, "walk", "southEast", 160))
  );

  skeletons.push(
    scene.add.existing(new Skeleton(scene, 1450, 320, "walk", "southWest", 320))
  );
  skeletons.push(
    scene.add.existing(new Skeleton(scene, 1500, 340, "walk", "southWest", 340))
  );
  skeletons.push(
    scene.add.existing(new Skeleton(scene, 1550, 360, "walk", "southWest", 330))
  );
}


const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;

const buildings = [];

function buildGrid(scene) {

  var data = scene.cache.json.get("map");

  var tilewidth = data.tilewidth;
  var tileheight = data.tileheight;

  // const tileWidthHalf = tilewidth / 2;
  // const tileHeightHalf = tileheight / 2;
  console.log(tilewidth, tileheight);
  
  
  // Sets a grid size
  let gridSize = 120;

  // Sets up an increment for each time we loop through
  let xDiff = gridSize / 2;
  let yDiff = gridSize / 4;

  // Sets the initial position for placing the grid.
  let initialX = GAME_WIDTH / 2;
  let initialY = GAME_HEIGHT / 2 - 100;

  // Equation to balance everything out.
  initialY -= yDiff * 2;

  // Create a polygon surrounding the scene.
  var boundingPolygon = new Phaser.Geom.Rectangle(-100, -100, 1200, 1200);

  // let tiles = scene.add.group();

  let startX = 0;
  let startY = 0;

  for (let i = 0; i <= 12; i++) {
    let colX = startX;
    let colY = startY;

    for (let n = 0; n <= i + 1; n++) {
      // Try to place it with a 1px offset in both x and y to ensure that we are inside the object initially.
      let currentPoint = new Phaser.Geom.Point(colX + 1, colY + 1);

      // If we are contained inside the grid then 
      if (Phaser.Geom.Rectangle.ContainsPoint(boundingPolygon, currentPoint)) {
        const gridSquare = scene.add.graphics({ x: initialX, y: initialY, lineStyle: { width: 2, color: 0xFFFFFF } });
        
        const polygon = new Phaser.Geom.Polygon([
          new Phaser.Geom.Point(colX, colY),
          new Phaser.Geom.Point(colX + 60, colY + 30),
          new Phaser.Geom.Point(colX, colY + 60),
          new Phaser.Geom.Point(colX - 60, colY + 30)
        ]);

        gridSquare.lineStyle(1, 0xFFFFFF);
        gridSquare.fillPoints(polygon.points, true);
        gridSquare.strokePoints(polygon.points, true);
        gridSquare.setDepth(1000);
        
        // tiles.add(gridSquare);
      }

      colX = startX + ((xDiff * 2) * n);
    }


    // Start a new row.
    startX -= xDiff;
    startY += yDiff;
  }
}

function buildMap() {
  //  Parse the data out of the map
  var data = scene.cache.json.get("map");

  var tilewidth = data.tilewidth;
  var tileheight = data.tileheight;

  const tileWidthHalf = tilewidth / 2;
  const tileHeightHalf = tileheight / 2;

  var layer = data.layers[0].data;

  var mapwidth = data.layers[0].width;
  var mapheight = data.layers[0].height;

  var centerX = mapwidth * tileWidthHalf;
  var centerY = 16;

  var i = 0;

  for (var y = 0; y < mapheight; y++) {
    for (var x = 0; x < mapwidth; x++) {
      const id = layer[i] - 1;

      var tx = (x - y) * tileWidthHalf;
      var ty = (x + y) * tileHeightHalf;

      var tile = scene.add.image(centerX + tx, centerY + ty, "tiles", id);

      tile.depth = 1// centerY + ty;

      i++;
    }
  }
}

function placeHouses() {
  // var house = scene.add.image(240, 370, "house");

  // house.depth = house.y + 86;

  // house.setInteractive();

  const house2 = scene.add.image(1300, 290, "house");

  house2.depth = house2.y + 86;

  house2.setInteractive();
}


export const game = new Phaser.Game(gameConfig);
