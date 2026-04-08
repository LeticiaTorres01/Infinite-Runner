export default class SwordBoss extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'boss_sword'); 
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDepth(100);
        this.setScale(7); 
        this.hp = 1000;
        this.maxHp = 1000;
        this.isDead = false;
        this.isInvulnerable = true;

        this.setFlipX(true);
        
        // Âncora perfeita baseada no centro de massa (ajusta ao virar)
        this.setOrigin(101 / 128, 0.5); 

        if (this.body) {
            // GRAVIDADE LIGADA DESDE O INÍCIO!
            // Assim ele cai no chão fora da tela e entra andando perfeitamente rente ao solo.
            this.body.setAllowGravity(true);
            this.body.setImmovable(false);
        }

        this.createAnimations();
        this.playAnimation('boss_walk'); 
        
        this.createHealthBar();
        this.setHealthBarVisible(false);

        this.startCinematicIntro();
    }

    createAnimations() {
        if (this.scene.anims.exists('boss_idle')) return;
        this.scene.anims.create({ key: 'boss_idle', frames: this.scene.anims.generateFrameNumbers('boss_sword', { start: 0, end: 6 }), frameRate: 8, repeat: -1 });
        this.scene.anims.create({ key: 'boss_walk', frames: this.scene.anims.generateFrameNumbers('boss_sword', { start: 14, end: 17 }), frameRate: 6, repeat: -1 });
        this.scene.anims.create({ key: 'boss_run', frames: this.scene.anims.generateFrameNumbers('boss_sword', { start: 28, end: 35 }), frameRate: 12, repeat: -1 });
        this.scene.anims.create({ key: 'boss_dash', frames: this.scene.anims.generateFrameNumbers('boss_sword', { start: 42, end: 48 }), frameRate: 15, repeat: 0 });
        this.scene.anims.create({ key: 'boss_spin', frames: this.scene.anims.generateFrameNumbers('boss_sword', { start: 56, end: 69 }), frameRate: 15, repeat: 0 });
        this.scene.anims.create({ key: 'boss_dash_attack', frames: this.scene.anims.generateFrameNumbers('boss_sword', { start: 70, end: 76 }), frameRate: 12, repeat: 0 });
        this.scene.anims.create({ key: 'boss_teleport', frames: this.scene.anims.generateFrameNumbers('boss_sword', { start: 84, end: 85 }), frameRate: 10, repeat: 0 });
        this.scene.anims.create({ key: 'boss_vanish', frames: this.scene.anims.generateFrameNumbers('boss_sword', { start: 98, end: 106 }), frameRate: 10, repeat: 0 });
    }

    playAnimation(animKey) {
        this.play(animKey, true);
        if (!this.body) return;

        let w = 16, h = 22, offX = 88, offY = 42; // offY = 42 joga a caixa pros pés!

        switch (animKey) {
            case 'boss_idle':
            case 'boss_walk':
            case 'boss_run':
                w = 16; h = 22; offX = 88; offY = 25;
                break;
            case 'boss_dash_attack':
            case 'boss_dash':
                w = 50; h = 22; offX = 54; offY = 42; // Cresce a espada pros lados
                break;
            case 'boss_spin':
                w = 60; h = 40; offX = 44; offY = 24; // Tornado (24+40 = 64, bate no chão igual)
                break;
            case 'boss_teleport':
            case 'boss_vanish':
                this.body.setEnable(false); 
                return;
        }

        this.body.setEnable(true);
        this.body.setSize(w, h, false);
        
        let finalOffX = this.flipX ? offX : (128 - (offX + w));
        this.body.setOffset(finalOffX, offY);
    }

    createHealthBar() {
        const w = this.scene.scale.width;
        this.barBg = this.scene.add.rectangle(w / 2, 50, 600, 20, 0x333333).setScrollFactor(0).setDepth(1000);
        this.bar = this.scene.add.rectangle(w / 2 - 300, 50, 600, 20, 0xff0000).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1001);
        this.bossNameText = this.scene.add.text(w / 2, 25, 'KAGE NO KEN - SWORD MASTER', { 
            fontSize: '24px', fontFamily: 'KenneyRocket', fill: '#fff' 
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
    }

    setHealthBarVisible(visible) {
        if (this.barBg) this.barBg.setVisible(visible);
        if (this.bar) this.bar.setVisible(visible);
        if (this.bossNameText) this.bossNameText.setVisible(visible);
    }

    updateHealthBar() {
        if (!this.bar) return;
        const percentage = Math.max(0, this.hp / this.maxHp);
        this.bar.width = 600 * percentage;
    }

    startCinematicIntro() {
        // Ele vai entrar caminhando, e como a gravidade está ligada, ele vai cair no chão fora da tela
        this.scene.tweens.add({
            targets: this,
            x: 1450, 
            duration: 3500, 
            ease: 'Linear',
            onComplete: () => {
                this.playAnimation('boss_idle');
                this.scene.time.delayedCall(2000, () => {
                    this.startBattle();
                });
            }
        });
    }

    // ==========================================
    // LÓGICA DE INTELIGÊNCIA ARTIFICIAL (SCRIPT)
    // ==========================================
    
    startBattle() {
        this.isInvulnerable = false;
        this.setHealthBarVisible(true);
        if (this.scene.bird) this.scene.bird.isControlLocked = false; 

        this.scheduleNextAttack();
    }

    scheduleNextAttack() {
        if (this.isDead) return;
        
        this.playAnimation('boss_idle');
        if (this.body) this.body.setAllowGravity(true); // Fica de pé aguardando
        
        const delay = Phaser.Math.Between(1000, 2000);
        
        this.scene.time.delayedCall(delay, () => {
            if (this.isDead) return;
            this.executeRandomAttack();
        });
    }

    executeRandomAttack() {
        // O Passeio (Walk) agora faz parte da rotação de ataques!
        const attacks = ['dash', 'spin', 'teleport', 'teleport_strike', 'walk'];
        const chosen = Phaser.Utils.Array.GetRandom(attacks);

        if (chosen === 'dash') this.performDashAttack();
        else if (chosen === 'spin') this.performSpinAttack();
        else if (chosen === 'teleport') this.performTeleport();
        else if (chosen === 'teleport_strike') this.performTeleportStrike();
        else if (chosen === 'walk') this.performWalk();
    }

    performWalk() {
        // Passeio estratégico pela arena
        let targetX = this.x > 960 ? Phaser.Math.Between(300, 700) : Phaser.Math.Between(1200, 1600);
        
        this.faceTarget(targetX); // Vira para onde vai andar
        if (this.body) this.body.setAllowGravity(true);
        
        this.playAnimation('boss_walk');
        
        const walkDuration = Math.abs(this.x - targetX) * 4; // Ritmo cadenciado

        this.scene.tweens.add({
            targets: this,
            x: targetX,
            duration: walkDuration,
            ease: 'Linear',
            onComplete: () => {
                if (this.isDead) return;
                this.playAnimation('boss_idle');
                this.faceTarget(this.scene.bird ? this.scene.bird.x : this.x); 
                this.scene.time.delayedCall(600, () => this.scheduleNextAttack());
            }
        });
    }

    performDashAttack() {
        this.faceTarget(this.scene.bird ? this.scene.bird.x : this.x); 
        const dir = this.flipX ? -1 : 1; 

        if (this.body) {
            this.body.setAllowGravity(false);
            this.body.setVelocityY(0);
        }
        
        this.playAnimation('boss_run');
        
        this.scene.tweens.add({
            targets: this,
            x: this.x + (250 * dir), 
            y: this.scene.bird.y, 
            duration: 700,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                if (this.isDead) return;
                
                this.playAnimation('boss_idle'); 
                
                this.scene.time.delayedCall(400, () => {
                    if (this.isDead) return;
                    
                    this.playAnimation('boss_dash_attack');
                    
                    this.scene.tweens.add({
                        targets: this,
                        x: dir === -1 ? -200 : 2120, 
                        duration: 400, 
                        ease: 'Power2',
                        onComplete: () => {
                            this.playAnimation('boss_idle');
                            this.scene.time.delayedCall(500, () => this.performTeleport());
                        }
                    });
                });
            }
        });
    }

    performSpinAttack() {
        this.faceTarget(this.scene.bird ? this.scene.bird.x : this.x);
        const dir = this.flipX ? -1 : 1;

        if (this.body) {
            this.body.setAllowGravity(false);
            this.body.setVelocityY(0);
        }
        
        this.playAnimation('boss_run');
        
        this.scene.tweens.add({
            targets: this,
            x: this.x + (300 * dir), 
            duration: 500,
            ease: 'Linear',
            onComplete: () => {
                if (this.isDead) return;
                
                this.playAnimation('boss_spin');
                
                this.scene.tweens.add({
                    targets: this,
                    y: this.y - 300, 
                    x: this.x + (150 * dir), 
                    duration: 400, 
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                        if (this.isDead) return;
                        
                        this.scene.tweens.add({
                            targets: this,
                            x: dir === -1 ? -150 : 2070, 
                            y: this.scene.bird.y + 100, 
                            duration: 600,
                            ease: 'Power2',
                            onComplete: () => this.performTeleport()
                        });
                    }
                });
            }
        });
    }

    performTeleport() {
        this.playAnimation('boss_teleport');
        
        this.scene.time.delayedCall(400, () => {
            if (this.isDead) return;
            
            // Aparece no lado oposto do Tori, LÁ NO ALTO!
            this.x = (this.scene.bird.x < 960) ? 1600 : 300; 
            this.y = 100; // SUPER-HERO LANDING! A física puxa ele com tudo pro chão.
            
            this.faceTarget(this.scene.bird ? this.scene.bird.x : this.x); 
            if (this.body) this.body.setAllowGravity(true); 
            
            this.playAnimation('boss_idle');
            this.scene.time.delayedCall(500, () => this.scheduleNextAttack());
        });
    }

    performTeleportStrike() {
        this.playAnimation('boss_vanish');
        
        this.scene.time.delayedCall(500, () => {
            if (this.isDead) return;

            if (this.body) {
                this.body.setAllowGravity(false);
                this.body.setVelocityY(0);
            }

            // Nasce nas costas do passarinho
            this.x = (this.scene.bird.x < 960) ? this.scene.bird.x + 450 : this.scene.bird.x - 450;
            if (this.x > 1800) this.x = 1800; 
            if (this.x < 100) this.x = 100;

            this.y = this.scene.bird.y;
            this.faceTarget(this.scene.bird ? this.scene.bird.x : this.x); 
            const dir = this.flipX ? -1 : 1;

            this.playAnimation('boss_run'); 
            
            this.scene.tweens.add({
                targets: this,
                x: this.x + (150 * dir), 
                duration: 300,
                ease: 'Linear',
                onComplete: () => {
                    if (this.isDead) return;

                    this.playAnimation('boss_idle');
                    this.scene.time.delayedCall(250, () => {
                        if (this.isDead) return;

                        this.playAnimation('boss_dash_attack');
                        
                        this.scene.tweens.add({
                            targets: this,
                            x: this.x + (400 * dir), 
                            duration: 250, 
                            ease: 'Power2',
                            onComplete: () => {
                                this.playAnimation('boss_idle');
                                this.scene.time.delayedCall(400, () => this.performTeleport());
                            }
                        });
                    });
                }
            });
        });
    }

    // ==========================================

    faceTarget(targetX) {
        if (this.isDead) return;
        const facingLeft = targetX < this.x; 
        
        if (this.flipX !== facingLeft) {
            this.setFlipX(facingLeft);
            this.setOrigin(facingLeft ? (101 / 128) : (27 / 128), 0.5);
            if (this.anims && this.anims.currentAnim) {
                this.playAnimation(this.anims.currentAnim.key);
            }
        }
    }

    update() {
        if (this.isDead || !this.active) return;
        this.updateHealthBar();
        
        if (this.anims.currentAnim && this.anims.currentAnim.key === 'boss_idle') {
            this.faceTarget(this.scene.bird ? this.scene.bird.x : this.x);
        }
        
        if (this.scene.physics.overlap(this, this.scene.bird)) {
            if (!this.scene.bird.isDead && !this.scene.bird.isInvulnerable) {
                this.scene.bird.takeDamage(1);
            }
        }
    }

    takeDamage(amount) {
        if (this.isInvulnerable || this.isDead) return;
        
        this.hp -= amount;
        
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => this.clearTint());

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        if (this.body) this.body.enable = false;
        
        this.scene.tweens.killTweensOf(this); 

        this.setHealthBarVisible(false);
        this.playAnimation('boss_vanish');
        
        this.once('animationcomplete', () => {
            this.scene.time.delayedCall(2000, () => {
                this.destroy();
            });
        });
    }

    static preload(scene) {
        scene.load.spritesheet('boss_sword', 'assets/Sword.png', { 
            frameWidth: 128, 
            frameHeight: 64 
        });
    }

    static createAnimations(scene) {
        if (scene.anims.exists('boss_idle')) return;

        scene.anims.create({ key: 'boss_idle', frames: scene.anims.generateFrameNumbers('boss_sword', { start: 0, end: 6 }), frameRate: 8, repeat: -1 });
        scene.anims.create({ key: 'boss_walk', frames: scene.anims.generateFrameNumbers('boss_sword', { start: 14, end: 17 }), frameRate: 6, repeat: -1 });
        scene.anims.create({ key: 'boss_run', frames: scene.anims.generateFrameNumbers('boss_sword', { start: 28, end: 35 }), frameRate: 12, repeat: -1 });
        scene.anims.create({ key: 'boss_dash', frames: scene.anims.generateFrameNumbers('boss_sword', { start: 42, end: 48 }), frameRate: 15, repeat: 0 });
        scene.anims.create({ key: 'boss_spin', frames: scene.anims.generateFrameNumbers('boss_sword', { start: 56, end: 69 }), frameRate: 15, repeat: 0 });
        scene.anims.create({ key: 'boss_dash_attack', frames: scene.anims.generateFrameNumbers('boss_sword', { start: 70, end: 76 }), frameRate: 12, repeat: 0 });
        scene.anims.create({ key: 'boss_teleport', frames: scene.anims.generateFrameNumbers('boss_sword', { start: 84, end: 85 }), frameRate: 10, repeat: 0 });
        scene.anims.create({ key: 'boss_vanish', frames: scene.anims.generateFrameNumbers('boss_sword', { start: 98, end: 106 }), frameRate: 10, repeat: 0 });
    }
}
