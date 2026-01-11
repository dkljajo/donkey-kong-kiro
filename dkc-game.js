class DonkeyKongCountry {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.bananasElement = document.getElementById('bananas');
        this.livesElement = document.getElementById('lives');
        this.timerElement = document.getElementById('timer');
        this.achievementElement = document.getElementById('achievement');
        
        // Game state
        this.score = parseInt(localStorage.getItem('dkc-highscore') || '0');
        this.bananas = 0;
        this.lives = 3;
        this.gameRunning = true;
        this.camera = { x: 0, y: 0, shake: 0 };
        this.levelWidth = 3200;
        this.startTime = Date.now();
        this.currentCharacter = 'dk'; // 'dk' or 'diddy'
        
        // Achievements
        this.achievements = JSON.parse(localStorage.getItem('dkc-achievements') || '[]');
        this.totalBananas = 15;
        
        // Player characters
        this.characters = {
            dk: {
                x: 100, y: 300, width: 32, height: 40,
                velocityX: 0, velocityY: 0, onGround: false,
                speed: 4, jumpPower: 14, direction: 1,
                animFrame: 0, animTimer: 0,
                rolling: false, rollTimer: 0,
                groundPounding: false
            },
            diddy: {
                x: 100, y: 300, width: 24, height: 32,
                velocityX: 0, velocityY: 0, onGround: false,
                speed: 5, jumpPower: 16, direction: 1,
                animFrame: 0, animTimer: 0,
                rolling: false, rollTimer: 0,
                groundPounding: false
            }
        };
        
        this.player = this.characters[this.currentCharacter];
        
        // Enhanced platforms with types
        this.platforms = [
            { x: 0, y: 400, width: 3200, height: 80, type: 'ground' },
            { x: 300, y: 320, width: 120, height: 20, type: 'platform' },
            { x: 500, y: 250, width: 100, height: 20, type: 'moving', moveY: 250, moveSpeed: 1, moveRange: 60 },
            { x: 700, y: 180, width: 120, height: 20, type: 'platform' },
            { x: 900, y: 300, width: 150, height: 20, type: 'platform' },
            { x: 1200, y: 220, width: 100, height: 20, type: 'platform' },
            { x: 1400, y: 350, width: 120, height: 20, type: 'elevator', moveY: 350, moveSpeed: 0.8, moveRange: 100 },
            { x: 1600, y: 280, width: 100, height: 20, type: 'platform' },
            { x: 1800, y: 200, width: 150, height: 20, type: 'platform' },
            { x: 2000, y: 320, width: 120, height: 20, type: 'platform' },
            { x: 2200, y: 250, width: 200, height: 20, type: 'platform' },
            { x: 2500, y: 180, width: 120, height: 20, type: 'platform' },
            { x: 2800, y: 300, width: 150, height: 20, type: 'platform' }
        ];
        
        // Breakable blocks
        this.breakableBlocks = [
            { x: 450, y: 200, width: 30, height: 30, broken: false },
            { x: 750, y: 130, width: 30, height: 30, broken: false },
            { x: 1150, y: 170, width: 30, height: 30, broken: false },
            { x: 1550, y: 230, width: 30, height: 30, broken: false },
            { x: 1950, y: 150, width: 30, height: 30, broken: false }
        ];
        
        // Vines for swinging
        this.vines = [
            { x: 600, y: 50, length: 200, swinging: false, angle: 0 },
            { x: 1100, y: 80, length: 180, swinging: false, angle: 0 },
            { x: 1700, y: 60, length: 220, swinging: false, angle: 0 },
            { x: 2300, y: 70, length: 190, swinging: false, angle: 0 }
        ];
        
        // Enhanced bananas with secret areas
        this.bananaItems = [
            { x: 350, y: 280, width: 16, height: 16, collected: false, type: 'normal' },
            { x: 520, y: 210, width: 16, height: 16, collected: false, type: 'normal' },
            { x: 720, y: 140, width: 16, height: 16, collected: false, type: 'secret' },
            { x: 950, y: 260, width: 16, height: 16, collected: false, type: 'normal' },
            { x: 1220, y: 180, width: 16, height: 16, collected: false, type: 'normal' },
            { x: 1420, y: 310, width: 16, height: 16, collected: false, type: 'normal' },
            { x: 1620, y: 240, width: 16, height: 16, collected: false, type: 'normal' },
            { x: 1850, y: 160, width: 16, height: 16, collected: false, type: 'secret' },
            { x: 2050, y: 280, width: 16, height: 16, collected: false, type: 'normal' },
            { x: 2250, y: 210, width: 16, height: 16, collected: false, type: 'normal' },
            { x: 2450, y: 140, width: 16, height: 16, collected: false, type: 'secret' },
            { x: 2650, y: 260, width: 16, height: 16, collected: false, type: 'normal' },
            { x: 2850, y: 260, width: 16, height: 16, collected: false, type: 'normal' },
            // Secret area bananas
            { x: 400, y: 100, width: 16, height: 16, collected: false, type: 'bonus' },
            { x: 1500, y: 50, width: 16, height: 16, collected: false, type: 'bonus' }
        ];
        
        // Enhanced enemies
        this.enemies = [
            { x: 400, y: 360, width: 24, height: 30, velocityX: -1, direction: -1, type: 'kremling', stunned: false, stunnedTimer: 0 },
            { x: 800, y: 360, width: 24, height: 30, velocityX: 1, direction: 1, type: 'kremling', stunned: false, stunnedTimer: 0 },
            { x: 1300, y: 360, width: 24, height: 30, velocityX: -1, direction: -1, type: 'kremling', stunned: false, stunnedTimer: 0 },
            { x: 1700, y: 360, width: 24, height: 30, velocityX: 1, direction: 1, type: 'kremling', stunned: false, stunnedTimer: 0 },
            { x: 2100, y: 360, width: 24, height: 30, velocityX: -1, direction: -1, type: 'kremling', stunned: false, stunnedTimer: 0 }
        ];
        
        // Boss (King K. Rool)
        this.boss = {
            x: 2900, y: 320, width: 60, height: 80,
            health: 3, maxHealth: 3, active: false,
            attackTimer: 0, phase: 'idle'
        };
        
        // Particle system
        this.particles = [];
        
        // Background layers for parallax
        this.backgroundLayers = this.generateParallaxLayers();
        
        // Sound system (Web Audio API)
        this.initAudio();
        
        // Input handling
        this.keys = {};
        this.setupInput();
        
        // Start game loop
        this.gameLoop();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.sounds = {};
        } catch (e) {
            console.log('Web Audio not supported');
        }
    }
    
    playSound(frequency, duration, type = 'square') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    generateParallaxLayers() {
        const layers = [];
        
        // Far background mountains
        layers.push({
            elements: [],
            speed: 0.1,
            type: 'mountains'
        });
        
        // Mid background trees
        layers.push({
            elements: [],
            speed: 0.3,
            type: 'trees'
        });
        
        // Generate elements for each layer
        for (let i = 0; i < 30; i++) {
            layers[0].elements.push({
                x: i * 150 + Math.random() * 100,
                y: 100 + Math.random() * 50,
                width: 80 + Math.random() * 40,
                height: 120 + Math.random() * 60
            });
            
            layers[1].elements.push({
                x: i * 120 + Math.random() * 80,
                y: 150 + Math.random() * 100,
                width: 40 + Math.random() * 20,
                height: 80 + Math.random() * 40
            });
        }
        
        return layers;
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Resume audio context on first interaction
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });
    }
    
    switchCharacter() {
        // Save current character position
        this.characters[this.currentCharacter] = { ...this.player };
        
        // Switch character
        this.currentCharacter = this.currentCharacter === 'dk' ? 'diddy' : 'dk';
        this.player = this.characters[this.currentCharacter];
        
        // Position new character near old one
        this.player.x = this.characters[this.currentCharacter === 'dk' ? 'diddy' : 'dk'].x;
        this.player.y = this.characters[this.currentCharacter === 'dk' ? 'diddy' : 'dk'].y;
        
        this.playSound(400, 0.2);
        this.showAchievement(`Switched to ${this.currentCharacter.toUpperCase()}!`);
    }
    
    showAchievement(text) {
        this.achievementElement.textContent = text;
        this.achievementElement.classList.add('show');
        
        setTimeout(() => {
            this.achievementElement.classList.remove('show');
        }, 3000);
    }
    
    unlockAchievement(id, name) {
        if (!this.achievements.includes(id)) {
            this.achievements.push(id);
            localStorage.setItem('dkc-achievements', JSON.stringify(this.achievements));
            this.showAchievement(`🏆 ${name}`);
            this.score += 500;
        }
    }
    
    createParticle(x, y, color, velocityX = 0, velocityY = 0, life = 60) {
        this.particles.push({
            x, y, color, velocityX, velocityY, life, maxLife: life
        });
    }
    
    update() {
        if (!this.gameRunning) return;
        
        this.handleInput();
        this.updatePlayer();
        this.updatePlatforms();
        this.updateEnemies();
        this.updateBoss();
        this.updateParticles();
        this.updateCamera();
        this.checkCollisions();
        this.checkWinCondition();
        this.updateTimer();
        
        // Reduce camera shake
        if (this.camera.shake > 0) {
            this.camera.shake *= 0.9;
        }
    }
    
    handleInput() {
        // Character switching
        if (this.keys['KeyC'] && !this.player.rolling && !this.player.groundPounding) {
            this.keys['KeyC'] = false; // Prevent rapid switching
            this.switchCharacter();
        }
        
        // Barrel roll
        if (this.keys['KeyS'] && this.player.onGround && !this.player.rolling) {
            this.player.rolling = true;
            this.player.rollTimer = 30;
            this.playSound(200, 0.3);
        }
        
        // Ground pound
        if (this.keys['ArrowDown'] && this.keys['Space'] && !this.player.onGround && !this.player.groundPounding) {
            this.player.groundPounding = true;
            this.player.velocityY = 15;
            this.playSound(150, 0.4);
        }
        
        // Regular movement (disabled during special moves)
        if (!this.player.rolling && !this.player.groundPounding) {
            if (this.keys['ArrowLeft']) {
                this.player.velocityX = -this.player.speed;
                this.player.direction = -1;
            } else if (this.keys['ArrowRight']) {
                this.player.velocityX = this.player.speed;
                this.player.direction = 1;
            } else {
                this.player.velocityX *= 0.8;
            }
            
            // Jumping
            if (this.keys['Space'] && this.player.onGround) {
                this.player.velocityY = -this.player.jumpPower;
                this.player.onGround = false;
                this.playSound(300, 0.2);
            }
        }
        
        // Vine swinging
        this.handleVineSwinging();
        
        // Animation
        if (Math.abs(this.player.velocityX) > 0.1 || this.player.rolling) {
            this.player.animTimer++;
            if (this.player.animTimer > (this.player.rolling ? 4 : 8)) {
                this.player.animFrame = (this.player.animFrame + 1) % 4;
                this.player.animTimer = 0;
            }
        } else {
            this.player.animFrame = 0;
        }
    }
    
    handleVineSwinging() {
        for (let vine of this.vines) {
            const vineX = vine.x + Math.sin(vine.angle) * 30;
            const vineY = vine.y + vine.length;
            
            // Check if player can grab vine
            if (Math.abs(this.player.x - vineX) < 20 && 
                Math.abs(this.player.y - vineY) < 30 && 
                !this.player.onGround) {
                
                if (this.keys['ArrowUp'] || this.keys['Space']) {
                    vine.swinging = true;
                    this.player.x = vineX - this.player.width / 2;
                    this.player.y = vineY - this.player.height;
                    this.player.velocityY = 0;
                    
                    // Swing physics
                    if (this.keys['ArrowLeft']) vine.angle -= 0.1;
                    if (this.keys['ArrowRight']) vine.angle += 0.1;
                    
                    // Release vine
                    if (this.keys['Space']) {
                        vine.swinging = false;
                        this.player.velocityX = Math.sin(vine.angle) * 8;
                        this.player.velocityY = -Math.cos(vine.angle) * 6;
                        this.playSound(350, 0.3);
                    }
                }
            }
            
            // Vine physics
            if (vine.swinging) {
                vine.angle += Math.sin(vine.angle) * 0.02;
            } else {
                vine.angle *= 0.95; // Damping
            }
        }
    }
    
    updatePlayer() {
        // Handle rolling
        if (this.player.rolling) {
            this.player.rollTimer--;
            this.player.velocityX = this.player.direction * this.player.speed * 2;
            
            if (this.player.rollTimer <= 0) {
                this.player.rolling = false;
            }
        }
        
        // Handle ground pound
        if (this.player.groundPounding && this.player.onGround) {
            this.player.groundPounding = false;
            this.camera.shake = 10;
            this.playSound(100, 0.5);
            
            // Create dust particles
            for (let i = 0; i < 8; i++) {
                this.createParticle(
                    this.player.x + Math.random() * this.player.width,
                    this.player.y + this.player.height,
                    '#8B4513',
                    (Math.random() - 0.5) * 4,
                    -Math.random() * 3,
                    30
                );
            }
            
            // Stun nearby enemies
            for (let enemy of this.enemies) {
                if (Math.abs(enemy.x - this.player.x) < 100) {
                    enemy.stunned = true;
                    enemy.stunnedTimer = 120;
                }
            }
        }
        
        // Apply gravity
        if (!this.player.groundPounding) {
            this.player.velocityY += 0.6;
        }
        
        // Update position
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;
        
        // Bounds checking
        if (this.player.x < 0) {
            this.player.x = 0;
            this.player.velocityX = 0;
        }
        if (this.player.x + this.player.width > this.levelWidth) {
            this.player.x = this.levelWidth - this.player.width;
            this.player.velocityX = 0;
        }
        
        // Platform collision
        this.handlePlatformCollision();
        
        // Death check
        if (this.player.y > 500) {
            this.loseLife();
        }
    }
    
    handlePlatformCollision() {
        this.player.onGround = false;
        
        for (let platform of this.platforms) {
            if (this.player.x + this.player.width > platform.x &&
                this.player.x < platform.x + platform.width &&
                this.player.y + this.player.height > platform.y &&
                this.player.y + this.player.height < platform.y + platform.height + 15 &&
                this.player.velocityY >= 0) {
                
                this.player.y = platform.y - this.player.height;
                this.player.velocityY = 0;
                this.player.onGround = true;
                
                // Landing particles
                if (this.player.groundPounding) {
                    for (let i = 0; i < 5; i++) {
                        this.createParticle(
                            this.player.x + Math.random() * this.player.width,
                            this.player.y + this.player.height,
                            '#654321',
                            (Math.random() - 0.5) * 2,
                            -Math.random() * 2,
                            20
                        );
                    }
                }
                break;
            }
        }
    }
    
    updatePlatforms() {
        for (let platform of this.platforms) {
            if (platform.type === 'moving' || platform.type === 'elevator') {
                platform.moveY += platform.moveSpeed;
                
                if (platform.moveY > platform.y + platform.moveRange || 
                    platform.moveY < platform.y - platform.moveRange) {
                    platform.moveSpeed *= -1;
                }
                
                platform.y = platform.moveY;
            }
        }
    }
    
    updateEnemies() {
        for (let enemy of this.enemies) {
            if (enemy.stunned) {
                enemy.stunnedTimer--;
                if (enemy.stunnedTimer <= 0) {
                    enemy.stunned = false;
                }
                continue;
            }
            
            enemy.x += enemy.velocityX;
            
            // Platform collision and AI
            let onPlatform = false;
            for (let platform of this.platforms) {
                if (enemy.x + enemy.width > platform.x &&
                    enemy.x < platform.x + platform.width &&
                    enemy.y + enemy.height >= platform.y &&
                    enemy.y + enemy.height <= platform.y + platform.height + 5) {
                    onPlatform = true;
                    break;
                }
            }
            
            if (!onPlatform || enemy.x <= 0 || enemy.x >= this.levelWidth - enemy.width) {
                enemy.velocityX *= -1;
                enemy.direction *= -1;
            }
        }
    }
    
    updateBoss() {
        if (this.player.x > 2700 && !this.boss.active) {
            this.boss.active = true;
            this.showAchievement('Boss Battle: King K. Rool!');
        }
        
        if (this.boss.active && this.boss.health > 0) {
            this.boss.attackTimer++;
            
            // Simple boss AI
            if (this.boss.attackTimer > 180) {
                this.boss.phase = 'attack';
                this.boss.attackTimer = 0;
                
                // Boss throws projectiles
                this.enemies.push({
                    x: this.boss.x,
                    y: this.boss.y + 20,
                    width: 16,
                    height: 16,
                    velocityX: this.player.x < this.boss.x ? -3 : 3,
                    direction: this.player.x < this.boss.x ? -1 : 1,
                    type: 'projectile',
                    stunned: false,
                    stunnedTimer: 0
                });
            }
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let particle = this.particles[i];
            
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.velocityY += 0.1; // Gravity
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateCamera() {
        let targetX = this.player.x - this.canvas.width / 2;
        targetX = Math.max(0, Math.min(targetX, this.levelWidth - this.canvas.width));
        
        this.camera.x += (targetX - this.camera.x) * 0.1;
        
        // Add screen shake
        if (this.camera.shake > 0) {
            this.camera.x += (Math.random() - 0.5) * this.camera.shake;
            this.camera.y += (Math.random() - 0.5) * this.camera.shake;
        }
    }
    
    updateTimer() {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        this.timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    checkCollisions() {
        // Player vs bananas
        for (let banana of this.bananaItems) {
            if (!banana.collected &&
                this.player.x + this.player.width > banana.x &&
                this.player.x < banana.x + banana.width &&
                this.player.y + this.player.height > banana.y &&
                this.player.y < banana.y + banana.height) {
                
                banana.collected = true;
                this.bananas++;
                
                let points = banana.type === 'bonus' ? 500 : banana.type === 'secret' ? 200 : 100;
                this.score += points;
                
                this.playSound(500, 0.2);
                
                // Banana sparkle particles
                for (let i = 0; i < 6; i++) {
                    this.createParticle(
                        banana.x + 8,
                        banana.y + 8,
                        '#FFD700',
                        (Math.random() - 0.5) * 3,
                        -Math.random() * 3,
                        40
                    );
                }
                
                this.updateHUD();
                
                // Check achievements
                if (this.bananas === this.totalBananas) {
                    this.unlockAchievement('all-bananas', 'Banana Collector!');
                }
                
                if (banana.type === 'secret') {
                    this.unlockAchievement('secret-finder', 'Secret Hunter!');
                }
            }
        }
        
        // Player vs breakable blocks
        for (let block of this.breakableBlocks) {
            if (!block.broken &&
                this.player.x + this.player.width > block.x &&
                this.player.x < block.x + block.width &&
                this.player.y + this.player.height > block.y &&
                this.player.y < block.y + block.height) {
                
                if (this.player.rolling || this.player.groundPounding) {
                    block.broken = true;
                    this.score += 50;
                    this.camera.shake = 5;
                    this.playSound(250, 0.3);
                    
                    // Block break particles
                    for (let i = 0; i < 8; i++) {
                        this.createParticle(
                            block.x + Math.random() * block.width,
                            block.y + Math.random() * block.height,
                            '#8B4513',
                            (Math.random() - 0.5) * 6,
                            -Math.random() * 4,
                            50
                        );
                    }
                }
            }
        }
        
        // Player vs enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let enemy = this.enemies[i];
            
            if (this.player.x + this.player.width > enemy.x &&
                this.player.x < enemy.x + enemy.width &&
                this.player.y + this.player.height > enemy.y &&
                this.player.y < enemy.y + enemy.height) {
                
                if (this.player.rolling || 
                    (this.player.velocityY > 0 && this.player.y < enemy.y - 10)) {
                    
                    // Defeat enemy
                    this.enemies.splice(i, 1);
                    this.score += 200;
                    this.playSound(400, 0.3);
                    
                    if (!this.player.rolling) {
                        this.player.velocityY = -8; // Bounce
                    }
                    
                    // Enemy defeat particles
                    for (let j = 0; j < 5; j++) {
                        this.createParticle(
                            enemy.x + enemy.width / 2,
                            enemy.y + enemy.height / 2,
                            '#FF6B6B',
                            (Math.random() - 0.5) * 4,
                            -Math.random() * 3,
                            30
                        );
                    }
                    
                } else if (!enemy.stunned) {
                    this.loseLife();
                }
            }
        }
        
        // Player vs boss
        if (this.boss.active && this.boss.health > 0 &&
            this.player.x + this.player.width > this.boss.x &&
            this.player.x < this.boss.x + this.boss.width &&
            this.player.y + this.player.height > this.boss.y &&
            this.player.y < this.boss.y + this.boss.height) {
            
            if (this.player.rolling || 
                (this.player.velocityY > 0 && this.player.y < this.boss.y - 10)) {
                
                this.boss.health--;
                this.score += 1000;
                this.camera.shake = 15;
                this.playSound(150, 0.8);
                
                if (!this.player.rolling) {
                    this.player.velocityY = -12;
                }
                
                if (this.boss.health <= 0) {
                    this.unlockAchievement('boss-defeated', 'King K. Rool Defeated!');
                }
            } else {
                this.loseLife();
            }
        }
    }
    
    checkWinCondition() {
        if (this.player.x >= this.levelWidth - 100 && this.boss.health <= 0) {
            this.score += 2000;
            
            // Speed run achievements
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            if (elapsed < 120) {
                this.unlockAchievement('speed-runner', 'Speed Runner! (Under 2 min)');
            }
            
            this.updateHUD();
            this.gameWin();
        }
    }
    
    loseLife() {
        this.lives--;
        this.camera.shake = 20;
        this.playSound(100, 1.0);
        this.updateHUD();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Respawn
            this.player.x = Math.max(100, this.player.x - 200);
            this.player.y = 300;
            this.player.velocityX = 0;
            this.player.velocityY = 0;
            this.player.rolling = false;
            this.player.groundPounding = false;
        }
    }
    
    gameWin() {
        this.gameRunning = false;
        
        // Save high score
        if (this.score > parseInt(localStorage.getItem('dkc-highscore') || '0')) {
            localStorage.setItem('dkc-highscore', this.score.toString());
        }
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.font = '48px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('VICTORY!', this.canvas.width / 2, this.canvas.height / 2 - 60);
        
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.font = '24px Courier New';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 - 10);
        this.ctx.fillText(`Bananas: ${this.bananas}/${this.totalBananas}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.ctx.fillText(`Achievements: ${this.achievements.length}/5`, this.canvas.width / 2, this.canvas.height / 2 + 50);
        
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = '18px Courier New';
        this.ctx.fillText('Press F5 to play again', this.canvas.width / 2, this.canvas.height / 2 + 90);
    }
    
    gameOver() {
        this.gameRunning = false;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = '48px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
        
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = '24px Courier New';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.ctx.fillText('Press F5 to restart', this.canvas.width / 2, this.canvas.height / 2 + 60);
    }
    
    updateHUD() {
        this.scoreElement.textContent = this.score;
        this.bananasElement.textContent = this.bananas;
        
        this.livesElement.innerHTML = '';
        for (let i = 0; i < this.lives; i++) {
            const lifeIcon = document.createElement('div');
            lifeIcon.className = 'life-icon';
            this.livesElement.appendChild(lifeIcon);
        }
    }
    
    render() {
        // Clear with gradient sky
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#98FB98');
        gradient.addColorStop(1, '#90EE90');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Draw parallax background
        this.drawParallaxBackground();
        
        // Draw vines
        this.drawVines();
        
        // Draw platforms
        this.drawPlatforms();
        
        // Draw breakable blocks
        this.drawBreakableBlocks();
        
        // Draw bananas
        this.drawBananas();
        
        // Draw enemies
        this.drawEnemies();
        
        // Draw boss
        this.drawBoss();
        
        // Draw player
        this.drawPlayer();
        
        // Draw particles
        this.drawParticles();
        
        this.ctx.restore();
    }
    
    drawParallaxBackground() {
        for (let layer of this.backgroundLayers) {
            const offsetX = this.camera.x * layer.speed;
            
            for (let element of layer.elements) {
                const x = element.x - offsetX;
                
                if (x > -element.width && x < this.canvas.width + this.camera.x) {
                    if (layer.type === 'mountains') {
                        this.ctx.fillStyle = '#4a5568';
                        this.ctx.fillRect(x, element.y, element.width, element.height);
                        this.ctx.fillStyle = '#718096';
                        this.ctx.fillRect(x, element.y, element.width, element.height * 0.3);
                    } else {
                        this.ctx.fillStyle = '#2d5016';
                        this.ctx.fillRect(x + element.width * 0.4, element.y + element.height * 0.6, 
                                        element.width * 0.2, element.height * 0.4);
                        this.ctx.fillStyle = '#22543d';
                        this.ctx.beginPath();
                        this.ctx.arc(x + element.width * 0.5, element.y + element.height * 0.3, 
                                   element.width * 0.4, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                }
            }
        }
    }
    
    drawVines() {
        for (let vine of this.vines) {
            const vineX = vine.x + Math.sin(vine.angle) * 30;
            
            this.ctx.strokeStyle = '#228B22';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.moveTo(vine.x, vine.y);
            this.ctx.lineTo(vineX, vine.y + vine.length);
            this.ctx.stroke();
            
            // Vine leaves
            this.ctx.fillStyle = '#32CD32';
            for (let i = 0; i < vine.length; i += 30) {
                this.ctx.beginPath();
                this.ctx.arc(vine.x + Math.sin(vine.angle + i * 0.01) * 15, 
                           vine.y + i, 8, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    drawPlatforms() {
        for (let platform of this.platforms) {
            if (platform.x + platform.width > this.camera.x - 50 && 
                platform.x < this.camera.x + this.canvas.width + 50) {
                
                if (platform.type === 'ground') {
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    this.ctx.fillStyle = '#228B22';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, 8);
                    
                    // Grass details
                    this.ctx.fillStyle = '#32CD32';
                    for (let i = 0; i < platform.width; i += 10) {
                        this.ctx.fillRect(platform.x + i, platform.y - 2, 2, 6);
                    }
                } else {
                    this.ctx.fillStyle = '#DEB887';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    this.ctx.fillStyle = '#8B7355';
                    for (let i = 0; i < platform.width; i += 20) {
                        this.ctx.fillRect(platform.x + i, platform.y, 2, platform.height);
                    }
                    
                    // Platform glow for moving platforms
                    if (platform.type === 'moving' || platform.type === 'elevator') {
                        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
                        this.ctx.fillRect(platform.x - 2, platform.y - 2, 
                                        platform.width + 4, platform.height + 4);
                    }
                }
            }
        }
    }
    
    drawBreakableBlocks() {
        for (let block of this.breakableBlocks) {
            if (!block.broken && 
                block.x > this.camera.x - 50 && 
                block.x < this.camera.x + this.canvas.width + 50) {
                
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(block.x, block.y, block.width, block.height);
                this.ctx.fillStyle = '#A0522D';
                this.ctx.fillRect(block.x + 2, block.y + 2, block.width - 4, block.height - 4);
                
                // Crack pattern
                this.ctx.strokeStyle = '#654321';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(block.x + 5, block.y + 5);
                this.ctx.lineTo(block.x + 25, block.y + 15);
                this.ctx.moveTo(block.x + 15, block.y + 5);
                this.ctx.lineTo(block.x + 10, block.y + 25);
                this.ctx.stroke();
            }
        }
    }
    
    drawBananas() {
        for (let banana of this.bananaItems) {
            if (!banana.collected && 
                banana.x > this.camera.x - 50 && 
                banana.x < this.camera.x + this.canvas.width + 50) {
                
                // Banana glow for special types
                if (banana.type === 'secret' || banana.type === 'bonus') {
                    this.ctx.fillStyle = banana.type === 'bonus' ? 
                        'rgba(255, 0, 255, 0.3)' : 'rgba(0, 255, 255, 0.3)';
                    this.ctx.beginPath();
                    this.ctx.arc(banana.x + 8, banana.y + 8, 12, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.ellipse(banana.x + 8, banana.y + 8, 8, 12, 0.3, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#FFFF99';
                this.ctx.beginPath();
                this.ctx.ellipse(banana.x + 6, banana.y + 6, 3, 5, 0.3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    drawEnemies() {
        for (let enemy of this.enemies) {
            if (enemy.x > this.camera.x - 50 && 
                enemy.x < this.camera.x + this.canvas.width + 50) {
                
                if (enemy.type === 'projectile') {
                    // Boss projectile
                    this.ctx.fillStyle = '#8B0000';
                    this.ctx.beginPath();
                    this.ctx.arc(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 
                               enemy.width/2, 0, Math.PI * 2);
                    this.ctx.fill();
                } else {
                    // Kremling
                    if (enemy.stunned) {
                        this.ctx.fillStyle = '#FFB6C1';
                    } else {
                        this.ctx.fillStyle = '#228B22';
                    }
                    this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                    
                    this.ctx.fillStyle = '#90EE90';
                    this.ctx.fillRect(enemy.x + 4, enemy.y + 8, enemy.width - 8, enemy.height - 12);
                    
                    // Eyes
                    this.ctx.fillStyle = enemy.stunned ? '#FF69B4' : '#FF0000';
                    if (enemy.direction === 1) {
                        this.ctx.fillRect(enemy.x + 16, enemy.y + 4, 4, 4);
                    } else {
                        this.ctx.fillRect(enemy.x + 4, enemy.y + 4, 4, 4);
                    }
                    
                    // Stunned stars
                    if (enemy.stunned) {
                        this.ctx.fillStyle = '#FFD700';
                        for (let i = 0; i < 3; i++) {
                            this.ctx.beginPath();
                            this.ctx.arc(enemy.x + 12 + i * 8, enemy.y - 10, 2, 0, Math.PI * 2);
                            this.ctx.fill();
                        }
                    }
                }
            }
        }
    }
    
    drawBoss() {
        if (this.boss.active && this.boss.health > 0) {
            // King K. Rool
            this.ctx.fillStyle = '#228B22';
            this.ctx.fillRect(this.boss.x, this.boss.y, this.boss.width, this.boss.height);
            
            // Crown
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(this.boss.x + 10, this.boss.y - 10, this.boss.width - 20, 15);
            
            // Cape
            this.ctx.fillStyle = '#8B0000';
            this.ctx.fillRect(this.boss.x + 5, this.boss.y + 20, this.boss.width - 10, 40);
            
            // Eyes
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(this.boss.x + 15, this.boss.y + 15, 8, 8);
            this.ctx.fillRect(this.boss.x + 35, this.boss.y + 15, 8, 8);
            
            // Health bar
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(this.boss.x, this.boss.y - 30, this.boss.width, 8);
            this.ctx.fillStyle = '#00FF00';
            this.ctx.fillRect(this.boss.x, this.boss.y - 30, 
                            (this.boss.width * this.boss.health) / this.boss.maxHealth, 8);
        }
    }
    
    drawPlayer() {
        // Character-specific rendering
        if (this.currentCharacter === 'dk') {
            this.drawDonkeyKong();
        } else {
            this.drawDiddyKong();
        }
    }
    
    drawDonkeyKong() {
        // Rolling animation
        if (this.player.rolling) {
            this.ctx.fillStyle = '#8B4513';
            this.ctx.beginPath();
            this.ctx.arc(this.player.x + this.player.width/2, 
                       this.player.y + this.player.height/2, 
                       this.player.width/2, 0, Math.PI * 2);
            this.ctx.fill();
            return;
        }
        
        // DK body
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Chest
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(this.player.x + 6, this.player.y + 12, this.player.width - 12, 16);
        
        // Face
        this.ctx.fillStyle = '#F4A460';
        this.ctx.fillRect(this.player.x + 4, this.player.y + 2, this.player.width - 8, 14);
        
        // Eyes
        this.ctx.fillStyle = '#000000';
        if (this.player.direction === 1) {
            this.ctx.fillRect(this.player.x + 18, this.player.y + 6, 3, 3);
            this.ctx.fillRect(this.player.x + 24, this.player.y + 6, 3, 3);
        } else {
            this.ctx.fillRect(this.player.x + 5, this.player.y + 6, 3, 3);
            this.ctx.fillRect(this.player.x + 11, this.player.y + 6, 3, 3);
        }
        
        // Red tie
        this.ctx.fillStyle = '#DC143C';
        this.ctx.fillRect(this.player.x + 12, this.player.y + 16, 8, 12);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(this.player.x + 14, this.player.y + 18, 4, 2);
    }
    
    drawDiddyKong() {
        // Rolling animation
        if (this.player.rolling) {
            this.ctx.fillStyle = '#CD853F';
            this.ctx.beginPath();
            this.ctx.arc(this.player.x + this.player.width/2, 
                       this.player.y + this.player.height/2, 
                       this.player.width/2, 0, Math.PI * 2);
            this.ctx.fill();
            return;
        }
        
        // Diddy body (smaller, lighter brown)
        this.ctx.fillStyle = '#CD853F';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Red shirt
        this.ctx.fillStyle = '#DC143C';
        this.ctx.fillRect(this.player.x + 3, this.player.y + 12, this.player.width - 6, 12);
        
        // Face
        this.ctx.fillStyle = '#F4A460';
        this.ctx.fillRect(this.player.x + 2, this.player.y + 2, this.player.width - 4, 10);
        
        // Cap
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, 8);
        
        // Eyes
        this.ctx.fillStyle = '#000000';
        if (this.player.direction === 1) {
            this.ctx.fillRect(this.player.x + 14, this.player.y + 5, 2, 2);
            this.ctx.fillRect(this.player.x + 18, this.player.y + 5, 2, 2);
        } else {
            this.ctx.fillRect(this.player.x + 4, this.player.y + 5, 2, 2);
            this.ctx.fillRect(this.player.x + 8, this.player.y + 5, 2, 2);
        }
    }
    
    drawParticles() {
        for (let particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            this.ctx.fillRect(particle.x - 1, particle.y - 1, 3, 3);
        }
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game
window.addEventListener('load', () => {
    new DonkeyKongCountry();
});