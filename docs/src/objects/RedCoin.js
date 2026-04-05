export default class RedCoin extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'red_coin');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setScale(2.5);
        this.setDepth(20);
        
        if (this.body) {
            this.body.setAllowGravity(false);
            this.body.setVelocityX(-150); // Move para a esquerda
            this.body.setSize(16, 16);
        }
        
        this.isCollected = false;
        
        this.scene.tweens.add({
            targets: this,
            y: y - 20,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    static preload(scene) {
        scene.load.spritesheet('red_coin', 'assets/spr_coin_roj.png', { frameWidth: 16, frameHeight: 16 });
    }

    static createAnimations(scene) {
        if (!scene.anims.exists('red_coin_anim')) {
            scene.anims.create({
                key: 'red_coin_anim',
                frames: scene.anims.generateFrameNumbers('red_coin', { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1
            });
        }
    }

    collect(bird) {
        if (this.isCollected) return;
        this.isCollected = true;
        
        // Adiciona o item de cura no inventário do passarinho
        bird.collectHealItem();
        bird.gainExperience(5, 50);
        
        this.destroy();
    }

    update() {
        if (this.x < -100) this.destroy();
        else if (!this.anims.isPlaying) this.play('red_coin_anim');
    }
}
