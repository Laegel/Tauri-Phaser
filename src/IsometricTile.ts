import * as Phaser from 'phaser';

export default class extends Phaser.GameObjects.Graphics {
    public constructor(scene, options) {
        super(scene, options);
        this.setInteractive().on('pointermove', function() {
            console.log('hi')
        });
    }
}