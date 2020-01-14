import * as Phaser from "phaser";

export default class extends Phaser.GameObjects.Image {
    public constructor(scene, x, y, image, data = null) {
        super(scene, x, y, image);

        this.depth = y + 64;
        // this.setTint(0x78ff78);
        this.setInteractive();
        this.setScale(0.25);
    }

    public setX(value: number) {
        super.setX(value);
        return this;
    }
}
