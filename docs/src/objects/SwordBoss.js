export default class SwordBoss extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'boss_sword'); 
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDepth(100);
        this.setScale(7); 
        this.hp = 450;
        this.maxHp = 450;
        this.isDead = false;
        this.isInvulnerable = true;
        this.walkState = null;
        this.pendingLandingAction = null;
        this.entryGroundY = y;
        this.groundY = y;
        this.isFacingTransitionActive = false;
        this.sideSwapCount = 0;
        this.isSideSwapAttackRunning = false;
        this.nextAttackTimer = null;
        this.lastScriptAttack = null;
        this.lowHpGlowActive = false;

        this.HITBOX_BASELINE = 48;
        this.WALK_SPEED = 250;

        this.setFlipX(true);

        // Origin fixo ancorado nos pes para manter a base estavel.
        this.setOrigin(0.5, 1);

        this.lowHpGlowFX = this.preFX.addGlow(0x9900ff, 8, 2, false, 0.1, 10);
        this.lowHpGlowFX.active = false;

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

        let w = 16, h = 22, offX = 88;

        switch (animKey) {
            case 'boss_idle':
            case 'boss_walk':
            case 'boss_run':
                w = 16; h = 22; offX = 88;
                break;
            case 'boss_dash_attack':
            case 'boss_dash':
                w = 50; h = 22; offX = 54;
                break;
            case 'boss_spin':
                w = 60; h = 40; offX = 44;
                break;
            case 'boss_teleport':
            case 'boss_vanish':
                this.body.setEnable(false); 
                return;
        }

        this.body.setEnable(true);
        this.body.setSize(w, h, false);

        // Mantem o pe da hitbox na mesma linha para evitar afundar/flutuar.
        const offY = this.HITBOX_BASELINE - h;
        
        let finalOffX = this.flipX ? offX : (128 - (offX + w));
        this.body.setOffset(finalOffX, offY);
    }

    beginSpecialTweenMovement() {
        if (!this.body) return;
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);
        this.body.setVelocity(0, 0);
    }

    endSpecialTweenMovement() {
        if (!this.body) return;
        this.body.setImmovable(false);
        this.body.setAllowGravity(true);
        this.body.setVelocityX(0);
    }

    getGroundY() {
        if (this.scene && this.scene.ground) return this.scene.ground.y;
        return this.groundY;
    }

    getBirdY() {
        return this.scene && this.scene.bird ? this.scene.bird.y : this.y;
    }

    registerSideSwap() {
        this.sideSwapCount += 1;
        if (this.sideSwapCount < 6) return false;
        this.sideSwapCount = 0;
        return true;
    }

    performSideSwapSpinAttack() {
        if (this.isDead || this.isSideSwapAttackRunning) return;

        this.isSideSwapAttackRunning = true;
        this.walkState = null;
        if (this.nextAttackTimer) {
            this.nextAttackTimer.remove(false);
            this.nextAttackTimer = null;
        }
        if (this.body) this.body.setVelocity(0, 0);

        // Vanish lento antes de aparecer ao lado do Tori.
        this.playAnimation('boss_vanish');

        this.scene.time.delayedCall(950, () => {
            if (this.isDead) return;

            const birdX = this.scene.bird ? this.scene.bird.x : this.x;
            
            let spawnX = birdX;
            if (spawnX > 1800) spawnX = 1800;
            if (spawnX < 100) spawnX = 100;

            const spawnY = this.getBirdY() + 155;
            this.beginSpecialTweenMovement();
            if (this.body) this.body.reset(spawnX, spawnY);
            else this.setPosition(spawnX, spawnY);

            this.faceTarget(birdX, false, null, false);
            this.playAnimation('boss_spin');

            this.scene.time.delayedCall(1100, () => {
                if (this.isDead) return;

                this.endSpecialTweenMovement();
                this.playAnimation('boss_idle');
                this.isSideSwapAttackRunning = false;

                this.scene.time.delayedCall(150, () => {
                    if (!this.isDead) this.performTeleport();
                });
            });
        });
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
                            if (this.scene && this.scene.events) {
                                this.scene.events.emit('bossIntroComplete', this);
                            }
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
        if (this.isDead || this.isSideSwapAttackRunning) return;

        if (this.nextAttackTimer) {
            this.nextAttackTimer.remove(false);
            this.nextAttackTimer = null;
        }
        
        this.playAnimation('boss_idle');
        if (this.body) this.body.setAllowGravity(true); // Fica de pé aguardando

        const hpRatio = this.hp / this.maxHp;
        const delay = hpRatio <= 0.35
            ? Phaser.Math.Between(900, 1700)
            : Phaser.Math.Between(650, 1400);
        
        this.nextAttackTimer = this.scene.time.delayedCall(delay, () => {
            this.nextAttackTimer = null;
            if (this.isDead) return;
            this.executeRandomAttack();
        });
    }

    executeRandomAttack() {
        const chosen = this.chooseScriptAttack();
        this.lastScriptAttack = chosen;

        if (chosen === 'dash') this.performDashAttack();
        else if (chosen === 'spin') this.performSpinAttack();
        else if (chosen === 'teleport') this.performTeleport();
        else if (chosen === 'teleport_strike') this.performTeleportStrike();
        else if (chosen === 'walk') this.performWalk();
    }

    chooseScriptAttack() {
        const birdX = this.scene.bird ? this.scene.bird.x : this.x;
        const distanceX = Math.abs(this.x - birdX);
        const hpRatio = this.hp / this.maxHp;

        let pool;
        if (hpRatio > 0.7) {
            if (distanceX > 700) {
                pool = ['dash', 'dash', 'spin', 'walk'];
            } else if (distanceX > 360) {
                pool = ['dash', 'spin', 'spin', 'walk'];
            } else {
                pool = ['spin', 'dash', 'spin', 'walk'];
            }
        } else if (hpRatio > 0.35) {
            if (distanceX > 700) {
                pool = ['dash', 'dash', 'teleport_strike', 'walk'];
            } else if (distanceX > 360) {
                pool = ['dash', 'spin', 'teleport_strike', 'walk'];
            } else {
                pool = ['spin', 'dash', 'teleport_strike', 'walk'];
            }
        } else {
            if (distanceX > 700) {
                pool = ['dash', 'dash', 'teleport', 'walk'];
            } else if (distanceX > 360) {
                pool = ['dash', 'spin', 'teleport', 'walk'];
            } else {
                pool = ['spin', 'dash', 'teleport', 'walk'];
            }
        }

        if (this.lastScriptAttack) {
            const filtered = pool.filter((attack) => attack !== this.lastScriptAttack);
            if (filtered.length > 0) pool = filtered;
        }

        if (distanceX < 260 && hpRatio > 0.35) {
            pool.push('teleport_strike', 'teleport_strike', 'spin');
        }

        return Phaser.Utils.Array.GetRandom(pool);
    }

    performWalk() {
        // Passeio estratégico pela arena
        let targetX = this.x > 960 ? Phaser.Math.Between(300, 700) : Phaser.Math.Between(1200, 1600);
        
        this.faceTarget(targetX); // Vira para onde vai andar
        if (this.body) {
            this.body.setAllowGravity(true);
            this.body.setImmovable(false);
            this.body.setVelocityY(0);
        }
        
        this.playAnimation('boss_walk');

        const dir = targetX < this.x ? -1 : 1;
        this.walkState = { targetX, dir };
        if (this.body) this.body.setVelocityX(this.WALK_SPEED * dir);
    }

    performDashAttack() {
        this.faceTarget(this.scene.bird ? this.scene.bird.x : this.x, true, () => {
            if (this.isDead) return;
            const dir = this.flipX ? -1 : 1;

            this.beginSpecialTweenMovement();
            this.playAnimation('boss_run');

            this.scene.tweens.add({
                targets: this,
                x: this.x + (250 * dir),
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
                                this.endSpecialTweenMovement();
                                this.playAnimation('boss_idle');
                                this.scene.time.delayedCall(500, () => this.performTeleport());
                            }
                        });
                    });
                }
            });
        });
    }

    performSpinAttack() {
        if (this.scene && typeof this.scene.playSfx === 'function') {
            this.scene.playSfx('boss_swing_attack', { volume: 0.8 });
        }
        this.faceTarget(this.scene.bird ? this.scene.bird.x : this.x);
        const dir = this.flipX ? -1 : 1;

        this.beginSpecialTweenMovement();
        
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
                            onComplete: () => {
                                this.endSpecialTweenMovement();
                                this.performTeleport();
                            }
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
            
            // Aparece no lado oposto do Tori no mesmo nivel do chao da entrada.
            const nextX = (this.scene.bird.x < 960) ? 1600 : 300;
            const nextY = this.getGroundY();
            if (this.body) {
                this.body.setEnable(true);
                this.body.setAllowGravity(true);
                this.body.setImmovable(false);
                this.body.reset(nextX, nextY);
            } else {
                this.setPosition(nextX, nextY);
            }
            
            this.faceTarget(this.scene.bird ? this.scene.bird.x : this.x); 
            this.playAnimation('boss_idle');
            this.scene.time.delayedCall(150, () => {
                if (!this.isDead) this.scheduleNextAttack();
            });
        });
    }

    performTeleportStrike() {
        if (this.scene && typeof this.scene.playSfx === 'function') {
            this.scene.playSfx('boss_teleport_attack', { volume: 0.8 });
        }
        this.playAnimation('boss_vanish');
        
        this.scene.time.delayedCall(500, () => {
            if (this.isDead) return;

            this.beginSpecialTweenMovement();

            // Nasce nas costas do passarinho
            let spawnX = (this.scene.bird.x < 960) ? this.scene.bird.x + 450 : this.scene.bird.x - 450;
            if (spawnX > 1800) spawnX = 1800; 
            if (spawnX < 100) spawnX = 100;

            const spawnY = this.getBirdY() + 155;
            if (this.body) this.body.reset(spawnX, spawnY);
            else this.setPosition(spawnX, spawnY);

            this.faceTarget(this.scene.bird ? this.scene.bird.x : this.x, true, () => {
                if (this.isDead) return;
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
                                    this.endSpecialTweenMovement();
                                    this.playAnimation('boss_idle');
                                    this.scene.time.delayedCall(400, () => this.performTeleport());
                                }
                            });
                        });
                    }
                });
            });
        });
    }

    // ==========================================

    faceTarget(targetX, withTeleportTransition = false, onComplete = null, countSideSwap = false) {
        if (this.isDead) return;
        const facingLeft = targetX < this.x; 
        if (this.flipX === facingLeft) {
            if (onComplete) onComplete();
            return;
        }

        if (withTeleportTransition) {
            if (this.isFacingTransitionActive) return;
            this.isFacingTransitionActive = true;

            const currentKey = (this.anims && this.anims.currentAnim) ? this.anims.currentAnim.key : 'boss_idle';
            const resumeAnim = (currentKey === 'boss_teleport' || currentKey === 'boss_vanish') ? 'boss_idle' : currentKey;

            this.playAnimation('boss_teleport');
            this.scene.time.delayedCall(220, () => {
                this.isFacingTransitionActive = false;
                if (this.isDead) return;
                this.setFlipX(facingLeft);
                this.playAnimation(resumeAnim);

                if (countSideSwap && this.registerSideSwap()) {
                    this.performSideSwapSpinAttack();
                }

                if (onComplete) onComplete();
            });
            return;
        }
        
        this.setFlipX(facingLeft);
        if (this.anims && this.anims.currentAnim) {
            this.playAnimation(this.anims.currentAnim.key);
        }

        if (countSideSwap && this.registerSideSwap()) {
            this.performSideSwapSpinAttack();
        }

        if (onComplete) onComplete();
    }

    update() {
        if (this.isDead || !this.active) return;
        this.updateHealthBar();

        if (this.body && (this.body.blocked.down || this.body.touching.down)) {
            this.groundY = this.getGroundY();
        }

        if (this.walkState && this.body) {
            const reachedTarget = this.walkState.dir > 0 ? this.x >= this.walkState.targetX : this.x <= this.walkState.targetX;
            if (reachedTarget || this.body.blocked.left || this.body.blocked.right) {
                const stopX = reachedTarget ? this.walkState.targetX : this.x;
                this.body.reset(stopX, this.y);
                this.body.setVelocityX(0);
                this.walkState = null;

                this.playAnimation('boss_idle');
                this.faceTarget(this.scene.bird ? this.scene.bird.x : this.x);
                this.scene.time.delayedCall(600, () => this.scheduleNextAttack());
            }
        }

        if (this.pendingLandingAction && this.body) {
            const isGrounded = this.body.blocked.down || this.body.touching.down;
            if (isGrounded) {
                const action = this.pendingLandingAction;
                this.pendingLandingAction = null;
                action();
            }
        }
        
        if (this.anims.currentAnim && this.anims.currentAnim.key === 'boss_idle') {
            this.faceTarget(this.scene.bird ? this.scene.bird.x : this.x, true, null, true);
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

        if (!this.lowHpGlowActive && this.hp <= this.maxHp * 0.3) {
            this.lowHpGlowActive = true;
            if (this.lowHpGlowFX) {
                this.lowHpGlowFX.active = true;
                this.lowHpGlowFX.color = 0xbf00ff;
                this.lowHpGlowFX.outerStrength = 12;
            }
        }
        
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => this.clearTint());

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.isInvulnerable = true;
        if (this.scene && typeof this.scene.playSfx === 'function') {
            this.scene.playSfx('boss_die', { volume: 0.85 });
        }

        if (this.body) this.body.enable = false;

        if (this.nextAttackTimer) {
            this.nextAttackTimer.remove(false);
            this.nextAttackTimer = null;
        }

        this.scene.tweens.killTweensOf(this);
        this.setHealthBarVisible(false);

        if (this.scene && this.scene.events) {
            this.scene.events.emit('bossDefeated', this);
        }

        this.anims.play({ key: 'boss_vanish', repeat: -1 });

        let isRed = false;
        const flashTimer = this.scene.time.addEvent({
            delay: 100,
            loop: true,
            callback: () => {
                isRed = !isRed;
                if (isRed) this.setTintFill(0xff0000);
                else this.clearTint();
            }
        });

        this.scene.time.delayedCall(2500, () => {
            flashTimer.remove(false);
            this.clearTint();
            this.setVisible(false);

            for (let i = 0; i < 30; i++) {
                const clone = this.scene.add.sprite(this.x, this.y, 'boss_sword');
                clone.play('boss_dash');
                clone.setTint(0xff0000);
                clone.setAlpha(0.8);
                clone.setScale(this.scaleX, this.scaleY);
                clone.setDepth(this.depth);

                const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                const distance = Phaser.Math.Between(1500, 2500);
                const targetX = this.x + Math.cos(angle) * distance;
                const targetY = this.y + Math.sin(angle) * distance;

                clone.setFlipX(Math.cos(angle) < 0);

                this.scene.tweens.add({
                    targets: clone,
                    x: targetX,
                    y: targetY,
                    alpha: 0,
                    duration: Phaser.Math.Between(1000, 1500),
                    ease: 'Power2',
                    onComplete: () => clone.destroy()
                });
            }

            this.scene.time.delayedCall(2000, () => {
                if (this.scene && this.scene.events) {
                    this.scene.events.emit('bossDeathSequenceComplete', this);
                }
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
