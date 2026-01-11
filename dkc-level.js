class DonkeyKongCountryLevel {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        // Game state
        this.score = 0;
        this.bananas = 0;
        this.lives = 3;
        this.gameTime = 0;
        this.currentCharacter = 'DK';
        this.gameRunning = true;
        this.levelComplete = false;
        this.frameCount = 0;
        
        // Level progression
        this.levelWidth = 2400;
        this.levelGoal = 2300; // Level end position
        this.checkpoints = [800, 1600]; // Checkpoint positions
        this.currentCheckpoint = 0;
        
        // Player with detailed animations
        this.player = {
            x: 100, y: 350, width: 32, height: 48,
            vx: 0, vy: 0, onGround: false,
            rolling: false, rollTimer: 0, rollCooldown: 0,
            swinging: false, vineIndex: -1, swingAngle: 0,
            invulnerable: false, invulnerableTimer: 0,
            doubleJump: false, dashCooldown: 0, canDash: true,
            animFrame: 0, animTimer: 0, facing: 1,
            state: 'idle', jumpHeight: 0
        };
        
        // Enhanced jungle level design
        this.platforms = [
            // Ground platforms
            {x: 0, y: 450, width: 400, height: 30, type: 'ground'},
            {x: 500, y: 450, width: 300, height: 30, type: 'ground'},
            {x: 900, y: 450, width: 400, height: 30, type: 'ground'},
            {x: 1400, y: 450, width: 300, height: 30, type: 'ground'},
            {x: 1800, y: 450, width: 600, height: 30, type: 'ground'},
            
            // Elevated platforms
            {x: 300, y: 350, width: 120, height: 20, type: 'wood'},
            {x: 550, y: 300, width: 100, height: 20, type: 'wood'},
            {x: 750, y: 250, width: 80, height: 20, type: 'wood'},
            {x: 950, y: 200, width: 120, height: 20, type: 'wood'},
            {x: 1200, y: 300, width: 100, height: 20, type: 'wood'},
            {x: 1450, y: 250, width: 150, height: 20, type: 'wood'},
            {x: 1700, y: 200, width: 100, height: 20, type: 'wood'},
            {x: 1950, y: 300, width: 120, height: 20, type: 'wood'},
            
            // Moving platforms
            {x: 450, y: 380, width: 80, height: 15, type: 'moving', moveX: 450, moveSpeed: 1, moveRange: 100},
            {x: 1100, y: 350, width: 80, height: 15, type: 'moving', moveX: 1100, moveSpeed: 1.5, moveRange: 120},
            
            // Bouncy platforms
            {x: 650, y: 400, width: 60, height: 15, type: 'bouncy'},
            {x: 1350, y: 380, width: 60, height: 15, type: 'bouncy'},
            
            // Crumbling platforms
            {x: 850, y: 350, width: 80, height: 15, type: 'crumbling', crumbleTimer: 0},
            {x: 1550, y: 320, width: 80, height: 15, type: 'crumbling', crumbleTimer: 0}
        ];
        
        // Jungle vines for swinging
        this.vines = [
            {x: 420, y: 100, length: 180, swingAngle: 0.1, swingSpeed: 0.02},
            {x: 680, y: 80, length: 200, swingAngle: -0.15, swingSpeed: 0.025},
            {x: 1050, y: 120, length: 160, swingAngle: 0.2, swingSpeed: 0.018},
            {x: 1380, y: 90, length: 190, swingAngle: -0.1, swingSpeed: 0.022},
            {x: 1750, y: 110, length: 170, swingAngle: 0.12, swingSpeed: 0.02}
        ];
        
        // Collectible bananas throughout the level
        this.bananaItems = [
            // Regular bananas
            {x: 250, y: 320, collected: false, type: 'normal', sparkle: 0, bobOffset: 0},
            {x: 380, y: 280, collected: false, type: 'normal', sparkle: 0, bobOffset: Math.PI/3},
            {x: 580, y: 270, collected: false, type: 'normal', sparkle: 0, bobOffset: Math.PI/2},
            {x: 780, y: 220, collected: false, type: 'normal', sparkle: 0, bobOffset: Math.PI},
            {x: 980, y: 170, collected: false, type: 'normal', sparkle: 0, bobOffset: Math.PI*1.2},
            {x: 1230, y: 270, collected: false, type: 'normal', sparkle: 0, bobOffset: Math.PI*1.5},
            {x: 1480, y: 220, collected: false, type: 'normal', sparkle: 0, bobOffset: Math.PI*1.8},
            {x: 1730, y: 170, collected: false, type: 'normal', sparkle: 0, bobOffset: Math.PI*2},
            {x: 1980, y: 270, collected: false, type: 'normal', sparkle: 0, bobOffset: Math.PI/4},
            
            // Golden bananas (bonus points)
            {x: 500, y: 200, collected: false, type: 'golden', sparkle: 0, bobOffset: Math.PI/6},
            {x: 1150, y: 150, collected: false, type: 'golden', sparkle: 0, bobOffset: Math.PI*1.3},
            {x: 1850, y: 180, collected: false, type: 'golden', sparkle: 0, bobOffset: Math.PI*1.7},
            
            // Secret bonus bananas
            {x: 350, y: 100, collected: false, type: 'bonus', sparkle: 0, bobOffset: Math.PI*0.8},
            {x: 1250, y: 80, collected: false, type: 'bonus', sparkle: 0, bobOffset: Math.PI*1.4},
            
            // Level end reward
            {x: 2250, y: 300, collected: false, type: 'golden', sparkle: 0, bobOffset: Math.PI*0.5}
        ];
        
        // Kremling enemies with patrol patterns
        this.enemies = [
            {x: 350, y: 410, width: 24, height: 30, vx: -1, type: 'kremling', stunned: false, stunnedTimer: 0, animFrame: 0, patrolStart: 300, patrolEnd: 450},
            {x: 600, y: 410, width: 24, height: 30, vx: 1, type: 'kremling', stunned: false, stunnedTimer: 0, animFrame: 0, patrolStart: 550, patrolEnd: 750},
            {x: 1000, y: 410, width: 24, height: 30, vx: -1, type: 'kremling', stunned: false, stunnedTimer: 0, animFrame: 0, patrolStart: 950, patrolEnd: 1150},
            {x: 1500, y: 410, width: 24, height: 30, vx: 1, type: 'kremling', stunned: false, stunnedTimer: 0, animFrame: 0, patrolStart: 1450, patrolEnd: 1650},
            {x: 1900, y: 410, width: 24, height: 30, vx: -1, type: 'kremling', stunned: false, stunnedTimer: 0, animFrame: 0, patrolStart: 1850, patrolEnd: 2050}
        ];
        
        // Level decorations
        this.decorations = [
            // Jungle plants
            {x: 150, y: 400, type: 'plant', size: 'large'},
            {x: 320, y: 420, type: 'plant', size: 'small'},
            {x: 480, y: 410, type: 'plant', size: 'medium'},
            {x: 720, y: 430, type: 'plant', size: 'large'},
            {x: 890, y: 420, type: 'plant', size: 'small'},
            {x: 1080, y: 410, type: 'plant', size: 'medium'},
            {x: 1320, y: 430, type: 'plant', size: 'large'},
            {x: 1580, y: 420, type: 'plant', size: 'small'},
            {x: 1820, y: 410, type: 'plant', size: 'medium'},
            {x: 2100, y: 430, type: 'plant', size: 'large'},
            
            // Background trees
            {x: 200, y: 200, type: 'tree', size: 'large'},
            {x: 600, y: 150, type: 'tree', size: 'medium'},
            {x: 1000, y: 180, type: 'tree', size: 'large'},
            {x: 1400, y: 160, type: 'tree', size: 'medium'},
            {x: 1800, y: 140, type: 'tree', size: 'large'},
            
            // Level end flag
            {x: 2300, y: 350, type: 'flag', size: 'large'}
        ];
        
        // Visual effects
        this.particles = [];
        this.screenShake = {x: 0, y: 0, intensity: 0};
        this.camera = {x: 0, y: 0, targetX: 0};
        this.backgroundOffset = 0;
        
        // Authentic DKC color palette
        this.colors = {
            jungle: ['#0d4f3c', '#1a6b4f', '#2d8659', '#4da373', '#6bb58a'],
            wood: ['#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F4A460'],
            banana: ['#FFD700', '#FFA500', '#FFFF00', '#FFE135'],
            dk: ['#8B4513', '#A0522D', '#654321', '#D2691E'],
            diddy: ['#FF4500', '#FF6347', '#DC143C', '#B22222'],
            kremling: ['#228B22', '#32CD32', '#90EE90', '#006400'],
            sky: ['#87CEEB', '#98FB98', '#228B22', '#0d4f3c']
        };
        
        // Input
        this.keys = {};
        this.setupInput();
        this.gameLoop();
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'KeyC') this.switchCharacter();
            if (e.code === 'KeyS' && this.rollCooldown <= 0) this.barrelRoll();
            if (e.code === 'KeyP') this.togglePause();
            if (e.code === 'KeyR' && (!this.gameRunning || this.levelComplete)) this.restart();
            if (e.code === 'KeyX' && this.canDash) this.dash();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    switchCharacter() {
        this.currentCharacter = this.currentCharacter === 'DK' ? 'Diddy' : 'DK';
        this.showNotification(`Switched to ${this.currentCharacter}!`);
        this.createCharacterSwitchEffect();
    }
    
    barrelRoll() {
        this.player.rolling = true;
        this.player.rollTimer = 30;
        this.rollCooldown = 60;
        this.player.vx += this.currentCharacter === 'DK' ? 8 : 6;
        this.player.state = 'rolling';
        this.createRollDust();
        this.screenShakeEffect(3);
        this.playSound(200, 0.2);
    }
    
    dash() {
        if (this.dashCooldown <= 0) {
            this.player.vx += this.player.vx > 0 ? 12 : -12;
            this.dashCooldown = 120;
            this.canDash = false;
            this.createDashEffect();
            this.playSound(400, 0.1);
        }
    }
    
    restart() {
        this.score = 0;
        this.bananas = 0;
        this.lives = 3;
        this.gameTime = 0;
        this.gameRunning = true;
        this.levelComplete = false;
        this.currentCheckpoint = 0;
        this.player.x = 100;
        this.player.y = 350;
        this.player.vx = 0;
        this.player.vy = 0;
        this.resetLevel();
    }
    
    update() {
        if (!this.gameRunning) return;
        
        this.frameCount++;
        this.gameTime++;
        this.updatePlayer();
        this.updateEnemies();
        this.updatePlatforms();
        this.updateParticles();
        this.updateCamera();
        this.updateAnimations();
        this.checkCollisions();
        this.checkLevelProgress();
        this.updateTimers();
        this.updateUI();
        
        // Screen shake decay
        if (this.screenShake.intensity > 0) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.intensity *= 0.9;
        }
    }
    
    updatePlayer() {
        const stats = this.currentCharacter === 'DK' ? 
            {speed: 5, jump: 14, weight: 1.2} : 
            {speed: 6, jump: 16, weight: 0.8};
        
        // Movement with animation states
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.vx = Math.max(this.player.vx - 0.8, -stats.speed);
            this.player.facing = -1;
            if (this.player.onGround && !this.player.rolling) this.player.state = 'walking';
        } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.vx = Math.min(this.player.vx + 0.8, stats.speed);
            this.player.facing = 1;
            if (this.player.onGround && !this.player.rolling) this.player.state = 'walking';
        } else {
            this.player.vx *= 0.85;
            if (this.player.onGround && !this.player.rolling) this.player.state = 'idle';
        }
        
        // Jumping with enhanced animation
        if ((this.keys['Space'] || this.keys['ArrowUp']) && this.player.onGround) {
            this.player.vy = -stats.jump;
            this.player.onGround = false;
            this.player.doubleJump = true;
            this.player.state = 'jumping';
            this.player.jumpHeight = 0;
            this.createJumpDust();
            this.playSound(300, 0.15);
        } else if ((this.keys['Space'] || this.keys['ArrowUp']) && this.player.doubleJump && this.player.vy > -5) {
            this.player.vy = -stats.jump * 0.7;
            this.player.doubleJump = false;
            this.createDoubleJumpEffect();
            this.playSound(350, 0.1);
        }
        
        // Vine swinging
        if (this.keys['ArrowUp'] && !this.player.swinging) {
            this.checkVineGrab();
        }
        
        if (this.player.swinging) {
            this.updateSwinging();
        } else {
            // Gravity and physics
            this.player.vy += 0.6 * stats.weight;
            this.player.vy = Math.min(this.player.vy, 15);
            
            // Track jump height for animation
            if (this.player.state === 'jumping') {
                this.player.jumpHeight = Math.max(0, -this.player.vy);
            }
            
            // Position update
            this.player.x += this.player.vx;
            this.player.y += this.player.vy;
        }
        
        // Platform collision
        this.checkPlatformCollision();
        
        // Level bounds
        this.player.x = Math.max(0, Math.min(this.levelWidth - this.player.width, this.player.x));
        if (this.player.y > 500) {
            this.loseLife();
        }
    }
    
    checkVineGrab() {
        this.vines.forEach((vine, index) => {
            const vineEndX = vine.x + Math.sin(vine.swingAngle) * vine.length;
            const vineEndY = vine.y + Math.cos(vine.swingAngle) * vine.length;
            
            if (Math.abs(this.player.x - vineEndX) < 40 && 
                Math.abs(this.player.y - vineEndY) < 40) {
                this.player.swinging = true;
                this.player.vineIndex = index;
                this.player.swingAngle = vine.swingAngle;
                this.player.state = 'swinging';
                this.createVineGrabEffect();
                this.playSound(250, 0.2);
            }
        });
    }
    
    updateSwinging() {
        const vine = this.vines[this.player.vineIndex];
        
        // Swing physics
        if (this.keys['ArrowLeft']) this.player.swingAngle -= 0.03;
        if (this.keys['ArrowRight']) this.player.swingAngle += 0.03;
        
        // Natural swing momentum
        this.player.swingAngle += Math.sin(this.gameTime * 0.1) * 0.01;
        
        // Update position
        this.player.x = vine.x + Math.sin(this.player.swingAngle) * vine.length - 16;
        this.player.y = vine.y + Math.cos(this.player.swingAngle) * vine.length - 24;
        
        // Release
        if (this.keys['Space']) {
            this.player.swinging = false;
            this.player.vx = Math.sin(this.player.swingAngle) * 12;
            this.player.vy = -Math.cos(this.player.swingAngle) * 8;
            this.player.state = 'jumping';
            this.createVineReleaseEffect();
        }
    }
    
    checkPlatformCollision() {
        this.player.onGround = false;
        
        this.platforms.forEach(platform => {
            if (this.player.x < platform.x + platform.width &&
                this.player.x + this.player.width > platform.x &&
                this.player.y + this.player.height > platform.y &&
                this.player.y + this.player.height < platform.y + platform.height + 15) {
                
                if (platform.type === 'bouncy') {
                    this.player.vy = -18;
                    this.createBounceEffect(platform.x + platform.width/2, platform.y);
                    this.playSound(400, 0.2);
                } else if (platform.type === 'crumbling') {
                    platform.crumbleTimer = 60;
                    this.screenShakeEffect(2);
                } else {
                    this.player.y = platform.y - this.player.height;
                    this.player.vy = 0;
                    this.player.onGround = true;
                    this.player.doubleJump = true;
                    this.canDash = true;
                    if (this.player.state === 'jumping') this.player.state = 'idle';
                }
            }
        });
    }
    
    updatePlatforms() {
        this.platforms.forEach(platform => {
            if (platform.type === 'moving') {
                platform.x += platform.moveSpeed;
                if (platform.x > platform.moveX + platform.moveRange || 
                    platform.x < platform.moveX) {
                    platform.moveSpeed *= -1;
                }
            } else if (platform.type === 'crumbling' && platform.crumbleTimer > 0) {
                platform.crumbleTimer--;
                if (platform.crumbleTimer <= 0) {
                    platform.y += 500;
                    this.createCrumbleEffect(platform.x + platform.width/2, platform.y);
                }
            }
        });
    }
    
    updateEnemies() {
        this.enemies.forEach(enemy => {
            if (enemy.stunned) {
                enemy.stunnedTimer--;
                if (enemy.stunnedTimer <= 0) enemy.stunned = false;
                return;
            }
            
            enemy.x += enemy.vx;
            
            // Patrol boundaries
            if (enemy.x <= enemy.patrolStart || enemy.x >= enemy.patrolEnd) {
                enemy.vx *= -1;
            }
            
            // Simple AI - chase player if close
            if (Math.abs(enemy.x - this.player.x) < 150) {
                enemy.vx = enemy.x < this.player.x ? Math.abs(enemy.vx) : -Math.abs(enemy.vx);
            }
        });
    }
    
    updateAnimations() {
        // Player animation
        this.player.animTimer++;
        if (this.player.animTimer > 8) {
            this.player.animTimer = 0;
            this.player.animFrame = (this.player.animFrame + 1) % 4;
        }
        
        // Banana bobbing animation
        this.bananaItems.forEach(banana => {
            banana.bobOffset += 0.1;
            banana.sparkle = (banana.sparkle + 0.15) % (Math.PI * 2);
        });
        
        // Enemy animation
        this.enemies.forEach(enemy => {
            if (this.frameCount % 10 === 0) {
                enemy.animFrame = (enemy.animFrame + 1) % 2;
            }
        });
        
        // Vine swaying
        this.vines.forEach(vine => {
            vine.swingAngle += vine.swingSpeed;
            if (Math.abs(vine.swingAngle) > 0.3) vine.swingSpeed *= -1;
        });
        
        // Background parallax
        this.backgroundOffset += 0.5;
    }
    
    checkCollisions() {
        // Banana collection
        this.bananaItems.forEach((banana, i) => {
            if (!banana.collected &&
                Math.abs(this.player.x - banana.x) < 25 &&
                Math.abs(this.player.y - banana.y) < 25) {
                
                banana.collected = true;
                this.bananas++;
                this.score += banana.type === 'golden' ? 500 : 
                             banana.type === 'bonus' ? 1000 : 100;
                
                this.createBananaCollectEffect(banana.x, banana.y, banana.type);
                this.playSound(500, 0.1);
            }
        });
        
        // Enemy collision
        this.enemies.forEach(enemy => {
            if (Math.abs(this.player.x - enemy.x) < 20 &&
                Math.abs(this.player.y - enemy.y) < 20) {
                
                if (this.player.rolling || this.player.invulnerable) {
                    enemy.stunned = true;
                    enemy.stunnedTimer = 120;
                    this.score += 200;
                    this.createEnemyStunEffect(enemy.x, enemy.y);
                    this.playSound(150, 0.3);
                } else {
                    this.loseLife();
                }
            }
        });
    }
    
    checkLevelProgress() {
        // Check if player reached the end
        if (this.player.x >= this.levelGoal && !this.levelComplete) {
            this.levelComplete = true;
            this.completeLevel();
        }
        
        // Check checkpoints
        this.checkpoints.forEach((checkpoint, i) => {
            if (this.player.x >= checkpoint && this.currentCheckpoint === i) {
                this.currentCheckpoint = i + 1;
                this.showNotification('Checkpoint reached!');
                this.createCheckpointEffect(checkpoint);
            }
        });
    }
    
    completeLevel() {
        this.gameRunning = false;
        this.score += 5000; // Level completion bonus
        this.createLevelCompleteEffect();
        this.showNotification('LEVEL COMPLETE! Press R to restart');
        this.playSound(600, 1.0);
    }
    
    updateTimers() {
        if (this.player.rollTimer > 0) {
            this.player.rollTimer--;
            if (this.player.rollTimer <= 0) {
                this.player.rolling = false;
                this.player.state = 'idle';
            }
        }
        
        if (this.rollCooldown > 0) this.rollCooldown--;
        if (this.dashCooldown > 0) this.dashCooldown--;
        
        if (this.player.invulnerableTimer > 0) {
            this.player.invulnerableTimer--;
            if (this.player.invulnerableTimer <= 0) this.player.invulnerable = false;
        }
    }
    
    updateCamera() {
        this.camera.targetX = this.player.x - 400;
        this.camera.x += (this.camera.targetX - this.camera.x) * 0.1;
        this.camera.x = Math.max(0, Math.min(this.levelWidth - 800, this.camera.x));
    }
    
    loseLife() {
        if (this.player.invulnerable) return;
        
        this.lives--;
        this.player.invulnerable = true;
        this.player.invulnerableTimer = 120;
        this.screenShakeEffect(10);
        this.createDeathEffect();
        this.playSound(100, 0.5);
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Respawn at last checkpoint
            const checkpointX = this.currentCheckpoint > 0 ? this.checkpoints[this.currentCheckpoint - 1] : 100;
            this.player.x = checkpointX;
            this.player.y = 350;
            this.player.vx = 0;
            this.player.vy = 0;
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        this.showNotification('GAME OVER - Press R to restart');
    }
    
    // Enhanced particle effects
    createCharacterSwitchEffect() {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: this.player.x + 16, y: this.player.y + 24,
                vx: Math.cos(i * Math.PI / 6) * 4,
                vy: Math.sin(i * Math.PI / 6) * 4,
                life: 30, color: '#FFD700', type: 'star', size: 3
            });
        }
    }
    
    createRollDust() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.player.x + Math.random() * 32,
                y: this.player.y + 40,
                vx: (Math.random() - 0.5) * 6 - this.player.vx * 0.5,
                vy: -Math.random() * 3,
                life: 25, color: '#8B4513', type: 'dust', size: 2
            });
        }
    }
    
    createJumpDust() {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: this.player.x + 8 + Math.random() * 16,
                y: this.player.y + 45,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 2,
                life: 20, color: '#654321', type: 'dust', size: 1
            });
        }
    }
    
    createDoubleJumpEffect() {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.player.x + 16, y: this.player.y + 24,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 25, color: '#00FFFF', type: 'sparkle', size: 2
            });
        }
    }
    
    createBananaCollectEffect(x, y, type) {
        const colors = type === 'golden' ? ['#FFD700', '#FFA500'] : 
                      type === 'bonus' ? ['#FF1493', '#FF69B4'] : 
                      ['#FFFF00', '#FFD700'];
        
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x + 8, y: y + 8,
                vx: (Math.random() - 0.5) * 10,
                vy: -Math.random() * 8,
                life: 30, color: colors[Math.floor(Math.random() * colors.length)], 
                type: 'sparkle', size: 2
            });
        }
    }
    
    createLevelCompleteEffect() {
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: this.player.x + 16, y: this.player.y + 24,
                vx: (Math.random() - 0.5) * 15,
                vy: -Math.random() * 12,
                life: 60, color: ['#FFD700', '#FF1493', '#00FFFF', '#32CD32'][Math.floor(Math.random() * 4)],
                type: 'confetti', size: 3
            });
        }
    }
    
    updateParticles() {
        this.particles.forEach((particle, i) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        });
    }
    
    screenShakeEffect(intensity) {
        this.screenShake.intensity = intensity;
    }
    
    showNotification(text) {
        const achievement = document.getElementById('achievement');
        achievement.textContent = text;
        achievement.classList.add('show');
        setTimeout(() => achievement.classList.remove('show'), 3000);
    }
    
    playSound(frequency, duration) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (e) {}
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('bananas').textContent = this.bananas;
        
        const minutes = Math.floor(this.gameTime / 3600);
        const seconds = Math.floor((this.gameTime % 3600) / 60);
        document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const livesContainer = document.getElementById('lives');
        livesContainer.innerHTML = '';
        for (let i = 0; i < this.lives; i++) {
            const life = document.createElement('div');
            life.className = 'life-icon';
            livesContainer.appendChild(life);
        }
    }
    
    render() {
        this.ctx.save();
        this.ctx.translate(this.screenShake.x - this.camera.x, this.screenShake.y);
        
        // Enhanced jungle background
        this.renderBackground();
        
        // Level decorations
        this.renderDecorations();
        
        // Platforms with detailed textures
        this.renderPlatforms();
        
        // Jungle vines
        this.renderVines();
        
        // Collectible bananas
        this.renderBananas();
        
        // Kremling enemies
        this.renderEnemies();
        
        // Player character
        this.renderPlayer();
        
        // Particle effects
        this.renderParticles();
        
        // Level progress indicator
        this.renderLevelProgress();
        
        // UI overlays
        this.renderUI();
        
        this.ctx.restore();
    }
    
    renderBackground() {
        // Multi-layer jungle background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, this.colors.sky[0]);
        gradient.addColorStop(0.3, this.colors.sky[1]);
        gradient.addColorStop(0.7, this.colors.sky[2]);
        gradient.addColorStop(1, this.colors.sky[3]);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.levelWidth, this.canvas.height);
        
        // Parallax background layers
        for (let layer = 0; layer < 3; layer++) {
            const speed = 0.2 + layer * 0.1;
            const offset = this.camera.x * speed;
            
            for (let i = 0; i < 30; i++) {
                const x = (i * 100 - offset) % (this.levelWidth + 200);
                const y = 50 + layer * 30 + Math.sin(this.frameCount * 0.01 + i) * 10;
                
                this.ctx.fillStyle = this.colors.jungle[layer];
                this.ctx.fillRect(x, y, 20 + layer * 10, 100 + layer * 20);
            }
        }
    }
    
    renderDecorations() {
        this.decorations.forEach(decoration => {
            if (decoration.x > this.camera.x - 100 && decoration.x < this.camera.x + 900) {
                switch (decoration.type) {
                    case 'plant':
                        this.renderPlant(decoration);
                        break;
                    case 'tree':
                        this.renderTree(decoration);
                        break;
                    case 'flag':
                        this.renderFlag(decoration);
                        break;
                }
            }
        });
    }
    
    renderPlant(plant) {
        const sizes = {small: 15, medium: 25, large: 35};
        const size = sizes[plant.size];
        
        this.ctx.fillStyle = this.colors.jungle[2];
        this.ctx.fillRect(plant.x, plant.y, size, size/2);
        this.ctx.fillStyle = this.colors.jungle[1];
        this.ctx.fillRect(plant.x + 2, plant.y - size/3, size - 4, size/3);
    }
    
    renderTree(tree) {
        const sizes = {medium: 40, large: 60};
        const size = sizes[tree.size];
        
        // Tree trunk
        this.ctx.fillStyle = this.colors.wood[0];
        this.ctx.fillRect(tree.x + size/3, tree.y + size, size/3, 100);
        
        // Tree canopy
        this.ctx.fillStyle = this.colors.jungle[1];
        this.ctx.fillRect(tree.x, tree.y, size, size);
        this.ctx.fillStyle = this.colors.jungle[0];
        this.ctx.fillRect(tree.x + 5, tree.y + 5, size - 10, size - 10);
    }
    
    renderFlag(flag) {
        // Flag pole
        this.ctx.fillStyle = this.colors.wood[0];
        this.ctx.fillRect(flag.x, flag.y, 8, 100);
        
        // Flag
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(flag.x + 8, flag.y, 40, 25);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(flag.x + 12, flag.y + 4, 32, 17);
        
        // Flag animation
        const wave = Math.sin(this.frameCount * 0.1) * 3;
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(flag.x + 48, flag.y + wave, 8, 25 - Math.abs(wave));
    }
    
    renderPlatforms() {
        this.platforms.forEach(platform => {
            if (platform.x > this.camera.x - 100 && platform.x < this.camera.x + 900) {
                // Platform base color
                if (platform.type === 'bouncy') {
                    this.ctx.fillStyle = '#FF69B4';
                } else if (platform.type === 'crumbling') {
                    this.ctx.fillStyle = platform.crumbleTimer > 0 ? '#FF4500' : this.colors.wood[0];
                } else if (platform.type === 'moving') {
                    this.ctx.fillStyle = '#4169E1';
                } else {
                    this.ctx.fillStyle = this.colors.wood[0];
                }
                
                this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                
                // Wood grain texture
                if (platform.type === 'wood' || platform.type === 'ground') {
                    for (let i = 0; i < platform.width; i += 12) {
                        this.ctx.fillStyle = this.colors.wood[1];
                        this.ctx.fillRect(platform.x + i, platform.y + 2, 3, platform.height - 4);
                        this.ctx.fillStyle = this.colors.wood[2];
                        this.ctx.fillRect(platform.x + i + 6, platform.y + 1, 2, platform.height - 2);
                    }
                }
                
                // Platform highlight
                this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
                this.ctx.fillRect(platform.x, platform.y, platform.width, 2);
                
                // Platform shadow
                this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
                this.ctx.fillRect(platform.x, platform.y + platform.height - 2, platform.width, 2);
            }
        });
    }
    
    renderVines() {
        this.vines.forEach(vine => {
            if (vine.x > this.camera.x - 100 && vine.x < this.camera.x + 900) {
                // Vine rope with segments
                this.ctx.strokeStyle = this.colors.jungle[2];
                this.ctx.lineWidth = 6;
                this.ctx.beginPath();
                this.ctx.moveTo(vine.x, vine.y);
                const endX = vine.x + Math.sin(vine.swingAngle) * vine.length;
                const endY = vine.y + Math.cos(vine.swingAngle) * vine.length;
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
                
                // Vine texture segments
                for (let i = 0; i < vine.length; i += 15) {
                    const segX = vine.x + Math.sin(vine.swingAngle) * i;
                    const segY = vine.y + Math.cos(vine.swingAngle) * i;
                    this.ctx.fillStyle = this.colors.jungle[1];
                    this.ctx.fillRect(segX - 2, segY - 1, 4, 3);
                }
                
                // Vine end handle
                this.ctx.fillStyle = this.colors.wood[0];
                this.ctx.fillRect(endX - 8, endY - 4, 16, 8);
                this.ctx.fillStyle = this.colors.wood[1];
                this.ctx.fillRect(endX - 6, endY - 2, 12, 4);
            }
        });
    }
    
    renderBananas() {
        this.bananaItems.forEach(banana => {
            if (!banana.collected && banana.x > this.camera.x - 50 && banana.x < this.camera.x + 850) {
                const bobY = banana.y + Math.sin(banana.bobOffset) * 4;
                
                // Banana glow effect
                const glowSize = 10 + Math.sin(banana.sparkle) * 4;
                this.ctx.shadowColor = banana.type === 'golden' ? '#FFD700' : 
                                      banana.type === 'bonus' ? '#FF1493' : '#FFFF00';
                this.ctx.shadowBlur = glowSize;
                
                // Banana shape with detailed rendering
                this.ctx.fillStyle = banana.type === 'golden' ? this.colors.banana[0] : 
                                   banana.type === 'bonus' ? '#FF1493' : this.colors.banana[2];
                this.ctx.beginPath();
                this.ctx.ellipse(banana.x + 8, bobY + 8, 9, 14, 0.3, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Banana highlight
                this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
                this.ctx.fillRect(banana.x + 4, bobY + 3, 4, 10);
                
                // Banana stem
                this.ctx.fillStyle = this.colors.jungle[0];
                this.ctx.fillRect(banana.x + 7, bobY - 2, 2, 4);
                
                this.ctx.shadowBlur = 0;
                
                // Sparkle particles for special bananas
                if (banana.type !== 'normal' && this.frameCount % 8 === 0) {
                    this.particles.push({
                        x: banana.x + Math.random() * 16,
                        y: bobY + Math.random() * 16,
                        vx: (Math.random() - 0.5) * 2,
                        vy: -Math.random() * 2,
                        life: 20, color: banana.type === 'golden' ? '#FFD700' : '#FF1493',
                        type: 'twinkle', size: 1
                    });
                }
            }
        });
    }
    
    renderEnemies() {
        this.enemies.forEach(enemy => {
            if (enemy.x > this.camera.x - 50 && enemy.x < this.camera.x + 850) {
                if (enemy.stunned) {
                    // Spinning stunned effect
                    this.ctx.save();
                    this.ctx.translate(enemy.x + 12, enemy.y + 15);
                    this.ctx.rotate(this.frameCount * 0.3);
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.fillRect(-12, -15, 24, 30);
                    this.ctx.restore();
                    
                    // Stars around stunned enemy
                    for (let i = 0; i < 3; i++) {
                        const angle = this.frameCount * 0.1 + i * Math.PI * 2 / 3;
                        const starX = enemy.x + 12 + Math.cos(angle) * 25;
                        const starY = enemy.y + 15 + Math.sin(angle) * 18;
                        this.renderStar(starX, starY, 5, '#FFD700');
                    }
                } else {
                    // Detailed Kremling rendering
                    // Body
                    this.ctx.fillStyle = this.colors.kremling[0];
                    this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                    
                    // Body shading
                    this.ctx.fillStyle = this.colors.kremling[1];
                    this.ctx.fillRect(enemy.x + 2, enemy.y + 2, enemy.width - 4, enemy.height - 4);
                    
                    // Animated walking legs
                    const walkOffset = enemy.animFrame * 3;
                    this.ctx.fillStyle = this.colors.kremling[0];
                    this.ctx.fillRect(enemy.x + 2, enemy.y + 22 + walkOffset, 8, 8); // Left leg
                    this.ctx.fillRect(enemy.x + 14, enemy.y + 22 - walkOffset, 8, 8); // Right leg
                    
                    // Arms
                    this.ctx.fillRect(enemy.x - 2, enemy.y + 12, 6, 10);
                    this.ctx.fillRect(enemy.x + 20, enemy.y + 12, 6, 10);
                    
                    // Eyes
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.fillRect(enemy.x + 4, enemy.y + 4, 5, 5);
                    this.ctx.fillRect(enemy.x + 15, enemy.y + 4, 5, 5);
                    this.ctx.fillStyle = '#000000';
                    this.ctx.fillRect(enemy.x + 5, enemy.y + 5, 3, 3);
                    this.ctx.fillRect(enemy.x + 16, enemy.y + 5, 3, 3);
                    
                    // Teeth
                    this.ctx.fillStyle = '#FFFFFF';
                    for (let i = 0; i < 4; i++) {
                        this.ctx.fillRect(enemy.x + 5 + i * 3, enemy.y + 12, 2, 5);
                    }
                    
                    // Spikes on back
                    this.ctx.fillStyle = this.colors.kremling[3];
                    for (let i = 0; i < 3; i++) {
                        this.ctx.fillRect(enemy.x + 6 + i * 4, enemy.y - 2, 3, 4);
                    }
                }
            }
        });
    }
    
    renderPlayer() {
        if (this.player.x > this.camera.x - 50 && this.player.x < this.camera.x + 850) {
            const colors = this.currentCharacter === 'DK' ? this.colors.dk : this.colors.diddy;
            
            // Invulnerability flashing
            if (this.player.invulnerable && Math.floor(this.frameCount / 5) % 2) {
                this.ctx.globalAlpha = 0.5;
            }
            
            if (this.player.rolling) {
                // Enhanced rolling animation
                this.ctx.save();
                this.ctx.translate(this.player.x + 16, this.player.y + 24);
                this.ctx.rotate(this.frameCount * 0.6 * this.player.facing);
                
                // Rolling body
                this.ctx.fillStyle = colors[0];
                this.ctx.fillRect(-16, -24, 32, 48);
                
                // Rolling motion blur effect
                this.ctx.fillStyle = colors[1];
                this.ctx.fillRect(-12, -20, 24, 40);
                
                this.ctx.restore();
            } else {
                // Detailed character rendering
                this.ctx.fillStyle = colors[0];
                
                // Body with animation
                const bodyBob = this.player.state === 'walking' ? Math.sin(this.frameCount * 0.3) * 1 : 0;
                this.ctx.fillRect(this.player.x + 8, this.player.y + 16 + bodyBob, 16, 24);
                
                // Body shading
                this.ctx.fillStyle = colors[1];
                this.ctx.fillRect(this.player.x + 10, this.player.y + 18 + bodyBob, 12, 20);
                
                // Head
                this.ctx.fillStyle = colors[0];
                this.ctx.fillRect(this.player.x + 6, this.player.y + 4, 20, 16);
                this.ctx.fillStyle = colors[1];
                this.ctx.fillRect(this.player.x + 8, this.player.y + 6, 16, 12);
                
                // Arms with enhanced animation
                const armOffset = this.player.state === 'walking' ? Math.sin(this.frameCount * 0.4) * 3 : 0;
                const jumpArmOffset = this.player.state === 'jumping' ? -this.player.jumpHeight * 0.5 : 0;
                
                this.ctx.fillStyle = colors[0];
                this.ctx.fillRect(this.player.x + 2, this.player.y + 18 + armOffset + jumpArmOffset, 6, 14);
                this.ctx.fillRect(this.player.x + 24, this.player.y + 18 - armOffset + jumpArmOffset, 6, 14);
                
                // Legs with detailed walking animation
                if (this.player.state === 'walking') {
                    const legOffset1 = Math.sin(this.frameCount * 0.5) * 4;
                    const legOffset2 = Math.sin(this.frameCount * 0.5 + Math.PI) * 4;
                    this.ctx.fillRect(this.player.x + 10, this.player.y + 36 + legOffset1, 6, 12);
                    this.ctx.fillRect(this.player.x + 16, this.player.y + 36 + legOffset2, 6, 12);
                } else if (this.player.state === 'jumping') {
                    // Jumping pose
                    this.ctx.fillRect(this.player.x + 8, this.player.y + 38, 8, 10);
                    this.ctx.fillRect(this.player.x + 16, this.player.y + 38, 8, 10);
                } else {
                    // Standing pose
                    this.ctx.fillRect(this.player.x + 10, this.player.y + 36, 6, 12);
                    this.ctx.fillRect(this.player.x + 16, this.player.y + 36, 6, 12);
                }
                
                // Eyes with direction
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(this.player.x + 10, this.player.y + 8, 4, 4);
                this.ctx.fillRect(this.player.x + 18, this.player.y + 8, 4, 4);
                this.ctx.fillStyle = '#000000';
                const eyeOffset = this.player.facing > 0 ? 1 : 0;
                this.ctx.fillRect(this.player.x + 11 + eyeOffset, this.player.y + 9, 2, 2);
                this.ctx.fillRect(this.player.x + 19 + eyeOffset, this.player.y + 9, 2, 2);
                
                // Character-specific details
                if (this.currentCharacter === 'DK') {
                    // DK's red tie
                    this.ctx.fillStyle = '#FF0000';
                    this.ctx.fillRect(this.player.x + 12, this.player.y + 20, 8, 18);
                    this.ctx.fillStyle = '#FFFF00';
                    this.ctx.fillRect(this.player.x + 14, this.player.y + 24, 4, 6);
                    
                    // DK's gorilla features
                    this.ctx.fillStyle = colors[2];
                    this.ctx.fillRect(this.player.x + 4, this.player.y + 12, 4, 8); // Left sideburn
                    this.ctx.fillRect(this.player.x + 24, this.player.y + 12, 4, 8); // Right sideburn
                } else {
                    // Diddy's red cap
                    this.ctx.fillStyle = '#FF0000';
                    this.ctx.fillRect(this.player.x + 4, this.player.y + 2, 24, 10);
                    this.ctx.fillStyle = '#FFFF00';
                    this.ctx.fillRect(this.player.x + 12, this.player.y + 4, 8, 6);
                    
                    // Diddy's tail
                    this.ctx.fillStyle = colors[0];
                    const tailWag = Math.sin(this.frameCount * 0.2) * 3;
                    this.ctx.fillRect(this.player.x + 28, this.player.y + 25 + tailWag, 8, 3);
                    this.ctx.fillRect(this.player.x + 32, this.player.y + 20 + tailWag, 3, 8);
                }
            }
            
            this.ctx.globalAlpha = 1;
        }
    }
    
    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / 30;
            
            switch (particle.type) {
                case 'star':
                    this.renderStar(particle.x, particle.y, particle.size, particle.color);
                    break;
                case 'sparkle':
                    this.ctx.fillRect(particle.x - 1, particle.y - 1, 3, 3);
                    this.ctx.fillRect(particle.x - 2, particle.y, 5, 1);
                    this.ctx.fillRect(particle.x, particle.y - 2, 1, 5);
                    break;
                case 'confetti':
                    this.ctx.save();
                    this.ctx.translate(particle.x, particle.y);
                    this.ctx.rotate(particle.life * 0.1);
                    this.ctx.fillRect(-2, -2, 4, 4);
                    this.ctx.restore();
                    break;
                case 'twinkle':
                    this.ctx.fillRect(particle.x, particle.y, 2, 2);
                    break;
                default:
                    this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            }
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    renderLevelProgress() {
        // Progress bar at top of screen
        const progressWidth = 200;
        const progress = Math.min(this.player.x / this.levelGoal, 1);
        
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(this.camera.x + 300, 20, progressWidth + 4, 14);
        
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(this.camera.x + 302, 22, progressWidth, 10);
        
        this.ctx.fillStyle = progress === 1 ? '#FFD700' : '#32CD32';
        this.ctx.fillRect(this.camera.x + 302, 22, progressWidth * progress, 10);
        
        // Checkpoint markers
        this.checkpoints.forEach((checkpoint, i) => {
            const checkpointX = this.camera.x + 302 + (checkpoint / this.levelGoal) * progressWidth;
            this.ctx.fillStyle = i < this.currentCheckpoint ? '#FFD700' : '#FFFFFF';
            this.ctx.fillRect(checkpointX - 1, 20, 2, 14);
        });
        
        // Level end marker
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(this.camera.x + 500, 20, 2, 14);
    }
    
    renderStar(x, y, size, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - size, y, size * 2, 1);
        this.ctx.fillRect(x, y - size, 1, size * 2);
        this.ctx.fillRect(x - size/2, y - size/2, size, 1);
        this.ctx.fillRect(x - size/2, y + size/2, size, 1);
    }
    
    renderUI() {
        if (!this.gameRunning && !this.levelComplete) {
            this.ctx.fillStyle = 'rgba(255,0,0,0.8)';
            this.ctx.fillRect(this.camera.x, 0, 800, 480);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '36px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.camera.x + 400, 220);
            this.ctx.font = '18px monospace';
            this.ctx.fillText('Press R to Restart', this.camera.x + 400, 260);
            this.ctx.textAlign = 'left';
        } else if (this.levelComplete) {
            this.ctx.fillStyle = 'rgba(0,255,0,0.8)';
            this.ctx.fillRect(this.camera.x, 0, 800, 480);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '36px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('LEVEL COMPLETE!', this.camera.x + 400, 200);
            this.ctx.font = '24px monospace';
            this.ctx.fillText(`Final Score: ${this.score}`, this.camera.x + 400, 240);
            this.ctx.font = '18px monospace';
            this.ctx.fillText('Press R to Play Again', this.camera.x + 400, 280);
            this.ctx.textAlign = 'left';
        }
    }
    
    resetLevel() {
        this.bananaItems.forEach(banana => banana.collected = false);
        this.enemies.forEach(enemy => {
            enemy.stunned = false;
            enemy.stunnedTimer = 0;
        });
        this.platforms.forEach(platform => {
            if (platform.type === 'crumbling') {
                platform.y = platform.originalY || platform.y;
                platform.crumbleTimer = 0;
            }
        });
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the complete DKC level experience
new DonkeyKongCountryLevel();