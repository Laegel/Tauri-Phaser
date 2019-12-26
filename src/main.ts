import * as Phaser from "phaser";
import Skeleton from "./Skeleton";
import { $ } from "./utils";


const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: 800,
  height: 600,
  backgroundColor: "#ababab",
  parent: "game",
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};
const skeletons = [];

let d = 0;

let scene;

function preload() {
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
}

function create() {
  scene = this;

  buildMap();
  placeHouses();

  skeletons.push(
    this.add.existing(new Skeleton(this, 240, 290, "walk", "southEast", 100))
  );
  skeletons.push(
    this.add.existing(new Skeleton(this, 100, 380, "walk", "southEast", 230))
  );
  skeletons.push(
    this.add.existing(new Skeleton(this, 620, 140, "walk", "south", 380))
  );
  skeletons.push(
    this.add.existing(new Skeleton(this, 460, 180, "idle", "south", 0))
  );

  skeletons.push(
    this.add.existing(new Skeleton(this, 760, 100, "attack", "southEast", 0))
  );
  skeletons.push(
    this.add.existing(new Skeleton(this, 800, 140, "attack", "northWest", 0))
  );

  skeletons.push(
    this.add.existing(new Skeleton(this, 750, 480, "walk", "east", 200))
  );

  skeletons.push(
    this.add.existing(new Skeleton(this, 1030, 300, "die", "west", 0))
  );

  skeletons.push(
    this.add.existing(new Skeleton(this, 1180, 340, "attack", "northEast", 0))
  );

  skeletons.push(
    this.add.existing(new Skeleton(this, 1180, 180, "walk", "southEast", 160))
  );

  skeletons.push(
    this.add.existing(new Skeleton(this, 1450, 320, "walk", "southWest", 320))
  );
  skeletons.push(
    this.add.existing(new Skeleton(this, 1500, 340, "walk", "southWest", 340))
  );
  skeletons.push(
    this.add.existing(new Skeleton(this, 1550, 360, "walk", "southWest", 330))
  );

  this.cameras.main.setSize(1600, 600);


  const contextMenu = $('#context-menu');
  // this.cameras.main.scrollX = 800;
  this.input.on('pointerdown', (pointer, gameObjects) => {
    const pointerMove = (pointer) => {
      // console.log({...pointer.midPoint});
      this.cameras.main.scrollX = pointer.midPoint.x - 100;
      // this.cameras.main.scrollY = pointer.midPoint.y;
      // this.cameras.main.scrollX = this.cameras.main.midPoint.x + pointer.position.x;
      // this.cameras.main.scrollY = this.cameras.main.midPoint.y + pointer.position.y;
    };

    const pointerUp = (pointer) => {
      this.input.off('pointermove', pointerMove);
      this.input.off('pointerup', pointerUp);
    };
    this.input.on('pointermove', pointerMove);
    this.input.on('pointerup', pointerUp);
    this.input.on('drag', () => console.log('moving'));
    
    // if (gameObjects.length) {
    //   gameObjects.forEach(gameObject => {
    //     // Building contextual menu should appear
    //     contextMenu.style.display = "block";
    //     gameObject.setTint(0x7878ff);
    //     contextMenu.style.top = pointer.position.y + "px";
    //     contextMenu.style.left = pointer.position.x + "px";
        
    //   });
    // } else { // If in map
    //   contextMenu.style.display = "none";
    //   // Map contextual menu should appear
    // }

  }, this);

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

      tile.depth = centerY + ty;

      i++;
    }
  }
}

function placeHouses() {
  var house = scene.add.image(240, 370, "house");

  house.depth = house.y + 86;

  house.setInteractive();

  house = scene.add.image(1300, 290, "house");

  house.depth = house.y + 86;

  house.setInteractive();
}

function update() {
  skeletons.forEach(function(skeleton) {
    skeleton.update();
  });

  // return;

  // if (d) {
  //   this.cameras.main.scrollX -= 0.5;

  //   if (this.cameras.main.scrollX <= 0) {
  //     d = 0;
  //   }
  // } else {
  //   this.cameras.main.scrollX += 0.5;

  //   if (this.cameras.main.scrollX >= 800) {
  //     d = 1;
  //   }
  // }
}

export const game = new Phaser.Game(gameConfig);
