class ConsoleDKC {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.worldMapCanvas = document.getElementById('worldMap');
        this.worldMapCtx = this.worldMapCanvas.getContext('2d');
        
        // UI Elements
        this.scoreElement = document.getElementById('score');
        this.bananasElement = document.getElementById('bananas');
        this.livesElement = document.getElementById('lives');
        this.timerElement = document.getElementById('timer');
        this.achievementElement = document.getElementById('achievement');
        
        // Console-like Game State
        this.gameState = 'titlescreen'; // Start with title screen like console games
        this.currentLevel = 1;
        this.maxLevel = 5;
        this.score = parseInt(localStorage.getItem('dkc-highscore') || '0');
        this.bananas = 0;
        this.lives = 3;
        this.gameRunning = true;
        this.camera = { x: 0, y: 0, shake: 0 };
        this.startTime = Date.now();
        this.currentCharacter = 'dk';
        this.paused = false;
        
        // Console-like features
        this.titleScreenTimer = 0;
        this.gamepadConnected = false;
        this.settings = {
            musicVolume: 0.7,
            sfxVolume: 0.8,
            difficulty: 'normal', // easy, normal, hard
            crtFilter: true,
            fullscreen: false
        };
        
        // Load settings
        this.loadSettings();
        
        // Enhanced player with console-like mechanics
        this.player = {
            x: 100, y: 300, width: 32, height: 40,
            velocityX: 0, velocityY: 0, onGround: false,
            speed: 4, jumpPower: 14, direction: 1,
            animFrame: 0, animTimer: 0,
            rolling: false, rollTimer: 0, groundPounding: false,
            invulnerable: false, invulnerabilityTimer: 0,
            doubleJumpAvailable: false, wallSliding: false,
            combo: 0, comboTimer: 0
        };
        
        // Multiple levels like console games
        this.levels = [
            { name: "Jungle Hijinx", theme: "jungle", difficulty: 1 },
            { name: "Ropey Rampage", theme: "jungle", difficulty: 2 },
            { name: "Reptile Rumble", theme: "cave", difficulty: 3 },
            { name: "Coral Capers", theme: "underwater", difficulty: 4 },
            { name: "Platform Perils", theme: "factory", difficulty: 5 }
        ];
        
        // Level data
        this.levelWidth = 3200;
        this.platforms = [];
        this.enemies = [];
        this.bananaItems = [];
        this.powerUps = [];
        this.checkpoints = [];
        this.secrets = [];
        
        // Console-like power-ups
        this.powerUpTypes = {
            extraLife: { color: '#00FF00', effect: 'life' },
            speedBoost: { color: '#FF00FF', effect: 'speed' },
            invincibility: { color: '#FFD700', effect: 'invincible' },
            doubleJump: { color: '#00FFFF', effect: 'doublejump' }
        };
        
        // Enhanced particles and effects
        this.particles = [];
        this.backgroundElements = [];
        this.weatherEffects = [];
        
        // Console-like audio system
        this.audioContext = null;
        this.musicTrack = null;
        this.soundEffects = {};
        
        // Performance monitoring
        this.fps = 60;
        this.frameCount = 0;
        this.lastFrameTime = Date.now();
        
        // Initialize systems
        this.initAudio();
        this.setupInput();
        this.setupGamepad();
        this.generateLevel(this.currentLevel);
        this.createTitleScreen();
        
        // Start game loop
        this.gameLoop();
    }
    
    loadSettings() {
        const saved = localStorage.getItem('dkc-settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }
    
    saveSettings() {
        localStorage.setItem('dkc-settings', JSON.stringify(this.settings));
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.settings.sfxVolume;
        } catch (e) {
            console.log('Web Audio not supported');
        }
    }
    
    setupGamepad() {
        window.addEventListener('gamepadconnected', (e) => {
            this.gamepadConnected = true;
            this.showAchievement('Gamepad Connected!');
        });
        
        window.addEventListener('gamepaddisconnected', (e) => {
            this.gamepadConnected = false;
            this.showAchievement('Gamepad Disconnected');
        });
    }
    
    handleGamepad() {
        if (!this.gamepadConnected) return;
        
        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[0];
        
        if (gamepad) {
            // D-pad or left stick for movement
            const leftStickX = gamepad.axes[0];
            const leftStickY = gamepad.axes[1];
            
            if (Math.abs(leftStickX) > 0.2) {
                this.keys[leftStickX > 0 ? 'ArrowRight' : 'ArrowLeft'] = true;
            }
            
            // Buttons
            this.keys['Space'] = gamepad.buttons[0].pressed; // A button (jump)
            this.keys['KeyS'] = gamepad.buttons[1].pressed; // B button (roll)
            this.keys['KeyC'] = gamepad.buttons[2].pressed; // X button (switch)
            this.keys['Escape'] = gamepad.buttons[9].pressed; // Start button (pause)
        }
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys = this.keys || {};
            this.keys[e.code] = true;
            
            // Console-like menu navigation
            if (this.gameState === 'titlescreen') {
                if (e.code === 'Enter' || e.code === 'Space') {
                    this.startGame();
                }
                if (e.code === 'KeyS') {
                    this.showSettings();
                }
            }
            
            // Pause functionality
            if (e.code === 'Escape' && this.gameState === 'playing') {
                this.togglePause();
            }
            
            // Resume audio context
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys = this.keys || {};
            this.keys[e.code] = false;
            e.preventDefault();
        });
        
        // Fullscreen toggle
        document.addEventListener('keydown', (e) => {
            if (e.code === 'F11') {
                this.toggleFullscreen();
                e.preventDefault();
            }
        });
    }
    
    createTitleScreen() {
        this.titleScreenElements = {
            logo: { x: 400, y: 150, text: "DONKEY KONG COUNTRY", size: 36 },
            subtitle: { x: 400, y: 200, text: "Web Edition", size: 18 },
            startButton: { x: 400, y: 300, text: "PRESS ENTER TO START", size: 16 },
            settingsButton: { x: 400, y: 340, text: "PRESS S FOR SETTINGS", size: 14 },
            highScore: { x: 400, y: 400, text: `HIGH SCORE: ${this.score}`, size: 14 }
        };
    }
    
    generateLevel(levelNum) {
        const level = this.levels[levelNum - 1];
        if (!level) return;
        
        // Clear existing level data
        this.platforms = [];
        this.enemies = [];
        this.bananaItems = [];
        this.powerUps = [];
        this.checkpoints = [];
        
        // Generate platforms based on difficulty
        const platformCount = 8 + level.difficulty * 2;
        const enemyCount = 3 + level.difficulty;
        const bananaCount = 10 + level.difficulty * 2;
        
        // Ground platform
        this.platforms.push({ x: 0, y: 400, width: this.levelWidth, height: 80, type: 'ground' });
        
        // Generate platforms
        for (let i = 0; i < platformCount; i++) {
            this.platforms.push({
                x: 200 + i * (this.levelWidth / platformCount),
                y: 150 + Math.sin(i * 0.5) * 100 + Math.random() * 50,
                width: 80 + Math.random() * 60,
                height: 20,
                type: 'platform'
            });
        }
        
        // Generate enemies
        for (let i = 0; i < enemyCount; i++) {
            this.enemies.push({
                x: 300 + i * (this.levelWidth / enemyCount) + Math.random() * 200,
                y: 360,
                width: 24, height: 30,
                velocityX: (Math.random() > 0.5 ? 1 : -1) * (1 + level.difficulty * 0.2),
                direction: Math.random() > 0.5 ? 1 : -1,
                alive: true,
                type: 'kremling'
            });
        }
        
        // Generate bananas
        for (let i = 0; i < bananaCount; i++) {
            this.bananaItems.push({
                x: 150 + i * (this.levelWidth / bananaCount) + Math.random() * 100,
                y: 200 + Math.random() * 150,
                width: 16, height: 16,
                collected: false,
                value: 100
            });
        }
        
        // Generate power-ups (console-like collectibles)
        for (let i = 0; i < 3; i++) {
            const types = Object.keys(this.powerUpTypes);
            const type = types[Math.floor(Math.random() * types.length)];
            
            this.powerUps.push({
                x: 500 + i * 800 + Math.random() * 200,
                y: 250 + Math.random() * 100,
                width: 20, height: 20,
                type: type,
                collected: false,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
        
        // Generate checkpoints
        for (let i = 1; i < 4; i++) {
            this.checkpoints.push({
                x: i * (this.levelWidth / 4),
                y: 350,
                width: 30, height: 50,
                activated: false
            });
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.resetPlayer();
        this.generateLevel(this.currentLevel);
        this.startTime = Date.now();
        this.playSound(400, 0.3);
    }
    
    togglePause() {
        this.paused = !this.paused;
        this.showAchievement(this.paused ? 'PAUSED' : 'RESUMED');
        this.playSound(300, 0.2);
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Fullscreen not supported');
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    resetPlayer() {
        this.player.x = 100;
        this.player.y = 300;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.player.rolling = false;
        this.player.groundPounding = false;
        this.player.invulnerable = false;
        this.player.combo = 0;
    }
    
    update() {
        // Handle gamepad input
        this.handleGamepad();
        
        // Update FPS counter
        this.updateFPS();
        
        if (this.gameState === 'titlescreen') {
            this.updateTitleScreen();
            return;
        }
        
        if (this.paused || !this.gameRunning) return;
        
        this.handleInput();
        this.updatePlayer();
        this.updateEnemies();
        this.updatePowerUps();
        this.updateParticles();
        this.updateCamera();
        this.checkCollisions();
        this.checkWinCondition();
        this.updateTimer();
        this.updateComboSystem();
        
        // Reduce camera shake
        if (this.camera.shake > 0) {
            this.camera.shake *= 0.9;
        }
        
        // Update invulnerability
        if (this.player.invulnerable) {
            this.player.invulnerabilityTimer--;
            if (this.player.invulnerabilityTimer <= 0) {
                this.player.invulnerable = false;
            }
        }
    }
    
    updateFPS() {
        this.frameCount++;
        const now = Date.now();
        if (now - this.lastFrameTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFrameTime = now;
        }
    }
    
    updateTitleScreen() {
        this.titleScreenTimer++;
        
        // Animate title screen elements
        for (let element of Object.values(this.titleScreenElements)) {
            element.pulse = Math.sin(this.titleScreenTimer * 0.05) * 0.1 + 1;
        }
    }
    
    updateComboSystem() {
        if (this.player.combo > 0) {
            this.player.comboTimer--;
            if (this.player.comboTimer <= 0) {
                this.player.combo = 0;
            }
        }
    }
    
    updatePowerUps() {
        for (let powerUp of this.powerUps) {
            if (!powerUp.collected) {
                powerUp.pulsePhase += 0.1;
                powerUp.y += Math.sin(powerUp.pulsePhase) * 0.5;
            }
        }
    }
    
    handleInput() {
        if (!this.keys) return;
        
        // Character switching
        if (this.keys['KeyC']) {
            this.keys['KeyC'] = false;
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
        
        // Enhanced movement with console-like precision
        if (!this.player.rolling && !this.player.groundPounding) {
            if (this.keys['ArrowLeft']) {
                this.player.velocityX = -this.player.speed;
                this.player.direction = -1;
            } else if (this.keys['ArrowRight']) {
                this.player.velocityX = this.player.speed;
                this.player.direction = 1;
            } else {
                this.player.velocityX *= 0.85; // Console-like friction
            }
            
            // Enhanced jumping with double jump
            if (this.keys['Space']) {
                if (this.player.onGround) {
                    this.player.velocityY = -this.player.jumpPower;
                    this.player.onGround = false;
                    this.player.doubleJumpAvailable = true;
                    this.playSound(300, 0.2);
                } else if (this.player.doubleJumpAvailable && !this.keys['SpacePressed']) {
                    this.player.velocityY = -this.player.jumpPower * 0.8;
                    this.player.doubleJumpAvailable = false;
                    this.playSound(350, 0.2);
                    
                    // Double jump particles
                    for (let i = 0; i < 6; i++) {
                        this.createParticle(
                            this.player.x + this.player.width / 2,
                            this.player.y + this.player.height,
                            '#FFFFFF',
                            (Math.random() - 0.5) * 4,
                            -Math.random() * 2,
                            30
                        );
                    }
                }
                this.keys['SpacePressed'] = true;
            } else {
                this.keys['SpacePressed'] = false;
            }
        }
        
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
    
    updatePlayer() {
        // Enhanced rolling mechanics
        if (this.player.rolling) {
            this.player.rollTimer--;
            this.player.velocityX = this.player.direction * this.player.speed * 2.5;
            
            if (this.player.rollTimer <= 0) {
                this.player.rolling = false;
            }
        }
        
        // Enhanced ground pound
        if (this.player.groundPounding && this.player.onGround) {
            this.player.groundPounding = false;
            this.camera.shake = 15;
            this.playSound(100, 0.5);
            
            // Enhanced ground pound effects
            for (let i = 0; i < 12; i++) {
                this.createParticle(
                    this.player.x + Math.random() * this.player.width,
                    this.player.y + this.player.height,
                    '#8B4513',
                    (Math.random() - 0.5) * 6,
                    -Math.random() * 4,
                    40
                );
            }
            
            // Stun nearby enemies
            for (let enemy of this.enemies) {
                if (Math.abs(enemy.x - this.player.x) < 120) {
                    enemy.stunned = true;
                    enemy.stunnedTimer = 180;
                }
            }
        }
        
        // Console-like physics
        if (!this.player.groundPounding) {
            this.player.velocityY += 0.6;
        }
        
        // Update position
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;
        
        // Enhanced bounds checking
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
        
        // Death check with checkpoint system
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
                this.player.doubleJumpAvailable = true; // Reset double jump on landing
                break;
            }
        }
    }
    
    updateEnemies() {
        for (let enemy of this.enemies) {
            if (!enemy.alive) continue;
            
            if (enemy.stunned) {
                enemy.stunnedTimer--;
                if (enemy.stunnedTimer <= 0) {
                    enemy.stunned = false;
                }
                continue;
            }
            
            enemy.x += enemy.velocityX;
            
            // Enhanced AI with platform detection
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
    
    checkCollisions() {
        // Enhanced banana collection
        for (let banana of this.bananaItems) {
            if (!banana.collected &&
                this.player.x + this.player.width > banana.x &&
                this.player.x < banana.x + banana.width &&
                this.player.y + this.player.height > banana.y &&
                this.player.y < banana.y + banana.height) {
                
                banana.collected = true;
                this.bananas++;
                this.score += banana.value;
                this.playSound(500, 0.2);
                
                // Enhanced banana effects
                for (let i = 0; i < 8; i++) {
                    this.createParticle(
                        banana.x + 8, banana.y + 8,
                        '#FFD700',
                        (Math.random() - 0.5) * 4,
                        -Math.random() * 4,
                        50
                    );
                }
                
                this.updateHUD();
            }
        }
        
        // Power-up collection
        for (let powerUp of this.powerUps) {
            if (!powerUp.collected &&
                this.player.x + this.player.width > powerUp.x &&
                this.player.x < powerUp.x + powerUp.width &&
                this.player.y + this.player.height > powerUp.y &&
                this.player.y < powerUp.y + powerUp.height) {
                
                powerUp.collected = true;
                this.applyPowerUp(powerUp.type);
                this.playSound(600, 0.3);
                
                // Power-up effects
                for (let i = 0; i < 10; i++) {
                    this.createParticle(
                        powerUp.x + 10, powerUp.y + 10,
                        this.powerUpTypes[powerUp.type].color,
                        (Math.random() - 0.5) * 6,
                        -Math.random() * 5,
                        60
                    );
                }
            }
        }
        
        // Checkpoint activation
        for (let checkpoint of this.checkpoints) {
            if (!checkpoint.activated &&
                this.player.x + this.player.width > checkpoint.x &&
                this.player.x < checkpoint.x + checkpoint.width &&
                this.player.y + this.player.height > checkpoint.y &&
                this.player.y < checkpoint.y + checkpoint.height) {
                
                checkpoint.activated = true;
                this.lastCheckpoint = checkpoint;
                this.showAchievement('Checkpoint Activated!');
                this.playSound(450, 0.4);
            }
        }
        
        // Enhanced enemy collision with combo system
        for (let enemy of this.enemies) {
            if (!enemy.alive || enemy.stunned || this.player.invulnerable) continue;
            
            if (this.player.x + this.player.width > enemy.x &&
                this.player.x < enemy.x + enemy.width &&
                this.player.y + this.player.height > enemy.y &&
                this.player.y < enemy.y + enemy.height) {
                
                if (this.player.rolling || 
                    (this.player.velocityY > 0 && this.player.y < enemy.y - 10)) {
                    
                    // Defeat enemy with combo system
                    enemy.alive = false;
                    this.player.combo++;
                    this.player.comboTimer = 180;
                    
                    const comboBonus = this.player.combo * 50;
                    this.score += 200 + comboBonus;
                    
                    this.playSound(400, 0.3);
                    this.camera.shake = 8;
                    
                    if (!this.player.rolling) {
                        this.player.velocityY = -10;
                    }
                    
                    // Enhanced defeat effects
                    for (let j = 0; j < 8; j++) {
                        this.createParticle(
                            enemy.x + enemy.width / 2,
                            enemy.y + enemy.height / 2,
                            '#FF6B6B',
                            (Math.random() - 0.5) * 6,
                            -Math.random() * 5,
                            40
                        );
                    }
                    
                    if (this.player.combo > 1) {
                        this.showAchievement(`${this.player.combo}x COMBO! +${comboBonus}`);
                    }
                    
                    this.updateHUD();
                } else {
                    this.loseLife();
                }
            }
        }
    }
    
    applyPowerUp(type) {
        switch(type) {
            case 'extraLife':
                this.lives++;
                this.showAchievement('Extra Life!');
                break;
            case 'speedBoost':
                this.player.speed *= 1.5;
                setTimeout(() => { this.player.speed /= 1.5; }, 10000);
                this.showAchievement('Speed Boost!');
                break;
            case 'invincibility':
                this.player.invulnerable = true;
                this.player.invulnerabilityTimer = 600;
                this.showAchievement('Invincible!');
                break;
            case 'doubleJump':
                this.player.doubleJumpAvailable = true;
                this.showAchievement('Double Jump Ready!');
                break;
        }
    }
    
    checkWinCondition() {
        if (this.player.x >= this.levelWidth - 100) {
            this.completeLevel();
        }
    }
    
    completeLevel() {
        this.score += 1000;
        const timeBonus = Math.max(0, 300 - Math.floor((Date.now() - this.startTime) / 1000)) * 10;
        this.score += timeBonus;
        
        this.updateHUD();
        this.saveHighScore();
        
        if (this.currentLevel < this.maxLevel) {
            this.currentLevel++;
            this.showAchievement(`Level ${this.currentLevel - 1} Complete! Next Level...`);
            setTimeout(() => {
                this.generateLevel(this.currentLevel);
                this.resetPlayer();
                this.startTime = Date.now();
            }, 3000);
        } else {
            this.gameWin();
        }
    }
    
    loseLife() {
        if (this.player.invulnerable) return;
        
        this.lives--;
        this.camera.shake = 25;
        this.playSound(100, 1.0);
        this.updateHUD();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Respawn at checkpoint or start
            if (this.lastCheckpoint) {
                this.player.x = this.lastCheckpoint.x;
                this.player.y = this.lastCheckpoint.y - this.player.height;
            } else {
                this.resetPlayer();
            }
            
            this.player.invulnerable = true;
            this.player.invulnerabilityTimer = 180;
        }
    }
    
    gameWin() {
        this.gameRunning = false;
        this.saveHighScore();
        this.showAchievement('GAME COMPLETE!');
        
        setTimeout(() => {
            this.gameState = 'titlescreen';
            this.gameRunning = true;
            this.currentLevel = 1;
            this.createTitleScreen();
        }, 5000);
    }
    
    gameOver() {
        this.gameRunning = false;
        this.saveHighScore();
        
        setTimeout(() => {
            this.gameState = 'titlescreen';
            this.gameRunning = true;
            this.lives = 3;
            this.currentLevel = 1;
            this.createTitleScreen();
        }, 3000);
    }
    
    saveHighScore() {
        const currentHigh = parseInt(localStorage.getItem('dkc-highscore') || '0');
        if (this.score > currentHigh) {
            localStorage.setItem('dkc-highscore', this.score.toString());
            this.showAchievement('NEW HIGH SCORE!');
        }
    }
    
    switchCharacter() {
        this.currentCharacter = this.currentCharacter === 'dk' ? 'diddy' : 'dk';
        
        if (this.currentCharacter === 'diddy') {
            this.player.speed = 5;
            this.player.jumpPower = 16;
            this.player.width = 24;
            this.player.height = 32;
        } else {
            this.player.speed = 4;
            this.player.jumpPower = 14;
            this.player.width = 32;
            this.player.height = 40;
        }
        
        this.playSound(400, 0.2);
        this.showAchievement(`Switched to ${this.currentCharacter.toUpperCase()}!`);
    }
    
    createParticle(x, y, color, velocityX = 0, velocityY = 0, life = 60) {
        this.particles.push({
            x, y, color, velocityX, velocityY, life, maxLife: life
        });
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let particle = this.particles[i];
            
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.velocityY += 0.1;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateCamera() {
        let targetX = this.player.x - this.canvas.width / 2;
        targetX = Math.max(0, Math.min(targetX, this.levelWidth - this.canvas.width));
        
        this.camera.x += (targetX - this.camera.x) * 0.12; // Smoother camera
        
        if (this.camera.shake > 0) {
            this.camera.x += (Math.random() - 0.5) * this.camera.shake;
            this.camera.y += (Math.random() - 0.5) * this.camera.shake;
        }
    }
    
    playSound(frequency, duration, type = 'square') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1 * this.settings.sfxVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    showAchievement(text) {
        this.achievementElement.textContent = text;
        this.achievementElement.classList.add('show');
        
        setTimeout(() => {
            this.achievementElement.classList.remove('show');
        }, 3000);
    }
    
    updateTimer() {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        this.timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
        if (this.gameState === 'titlescreen') {
            this.renderTitleScreen();
            return;
        }
        
        // Enhanced sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#98FB98');
        gradient.addColorStop(1, '#90EE90');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        this.drawBackground();
        this.drawPlatforms();
        this.drawCheckpoints();
        this.drawBananas();
        this.drawPowerUps();
        this.drawEnemies();
        this.drawPlayer();
        this.drawParticles();
        
        this.ctx.restore();
        
        // Draw UI overlays
        this.drawUI();
        
        if (this.paused) {
            this.drawPauseScreen();
        }
    }
    
    renderTitleScreen() {
        // Animated background
        const gradient = this.ctx.createRadialGradient(400, 240, 0, 400, 240, 400);
        gradient.addColorStop(0, '#2c5530');
        gradient.addColorStop(1, '#1a4c96');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Animated stars
        for (let i = 0; i < 50; i++) {
            const x = (i * 137.5) % this.canvas.width;
            const y = (i * 73.3) % this.canvas.height;
            const twinkle = Math.sin(this.titleScreenTimer * 0.05 + i) * 0.5 + 0.5;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.8})`;
            this.ctx.fillRect(x, y, 2, 2);
        }
        
        // Draw title elements
        for (let [key, element] of Object.entries(this.titleScreenElements)) {
            this.ctx.fillStyle = key === 'logo' ? '#FFD700' : '#FFFFFF';
            this.ctx.font = `${element.size * (element.pulse || 1)}px Courier New`;
            this.ctx.textAlign = 'center';
            
            if (key === 'startButton') {
                const alpha = Math.sin(this.titleScreenTimer * 0.1) * 0.3 + 0.7;
                this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            }
            
            this.ctx.fillText(element.text, element.x, element.y);
        }
        
        // Version info
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '12px Courier New';
        this.ctx.fillText('v1.0.0 - Web Edition', this.canvas.width - 100, this.canvas.height - 20);
    }
    
    drawBackground() {
        // Enhanced background with parallax
        for (let i = 0; i < 25; i++) {
            const treeX = i * 120 + 50 - this.camera.x * 0.3;
            const treeY = 200 + Math.sin(i * 0.5) * 50;
            
            if (treeX > -100 && treeX < this.canvas.width + 100) {
                // Tree trunk
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(treeX, treeY, 12, 80);
                
                // Tree canopy with layers
                this.ctx.fillStyle = '#006400';
                this.ctx.beginPath();
                this.ctx.arc(treeX + 6, treeY - 10, 28, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#228B22';
                this.ctx.beginPath();
                this.ctx.arc(treeX + 6, treeY - 15, 22, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#32CD32';
                this.ctx.beginPath();
                this.ctx.arc(treeX + 2, treeY - 20, 15, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    drawPlatforms() {
        for (let platform of this.platforms) {
            if (platform.x + platform.width > this.camera.x - 50 && 
                platform.x < this.camera.x + this.canvas.width + 50) {
                
                if (platform.type === 'ground') {
                    // Enhanced ground texture
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    
                    // Grass layer
                    this.ctx.fillStyle = '#228B22';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, 12);
                    
                    // Individual grass blades
                    this.ctx.fillStyle = '#32CD32';
                    for (let i = 0; i < platform.width; i += 8) {
                        const grassHeight = 4 + Math.sin(i * 0.1) * 2;
                        this.ctx.fillRect(platform.x + i, platform.y - grassHeight, 2, grassHeight + 4);
                    }
                    
                    // Dirt texture
                    this.ctx.fillStyle = '#654321';
                    for (let i = 0; i < platform.width; i += 25) {
                        for (let j = 15; j < platform.height; j += 20) {
                            this.ctx.fillRect(platform.x + i + Math.random() * 5, 
                                            platform.y + j + Math.random() * 3, 4, 4);
                        }
                    }
                } else {
                    // Enhanced wooden platforms
                    this.ctx.fillStyle = '#DEB887';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    
                    // Wood grain
                    this.ctx.fillStyle = '#8B7355';
                    for (let i = 0; i < platform.width; i += 20) {
                        this.ctx.fillRect(platform.x + i, platform.y, 2, platform.height);
                    }
                    
                    // Platform highlights
                    this.ctx.fillStyle = '#F5DEB3';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, 3);
                    
                    // Nails
                    this.ctx.fillStyle = '#696969';
                    for (let i = 15; i < platform.width; i += 30) {
                        this.ctx.fillRect(platform.x + i, platform.y + 3, 3, 3);
                        this.ctx.fillRect(platform.x + i, platform.y + platform.height - 6, 3, 3);
                    }
                }
            }
        }
    }
    
    drawCheckpoints() {
        for (let checkpoint of this.checkpoints) {
            if (checkpoint.x > this.camera.x - 50 && 
                checkpoint.x < this.camera.x + this.canvas.width + 50) {
                
                // Checkpoint flag
                this.ctx.fillStyle = checkpoint.activated ? '#00FF00' : '#FF0000';
                this.ctx.fillRect(checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height);
                
                // Flag pole
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(checkpoint.x + checkpoint.width - 5, checkpoint.y, 5, checkpoint.height + 20);
                
                // Flag animation
                if (checkpoint.activated) {
                    const wave = Math.sin(Date.now() * 0.01) * 2;
                    this.ctx.fillStyle = '#00FF00';
                    this.ctx.fillRect(checkpoint.x + wave, checkpoint.y, checkpoint.width - 5, checkpoint.height);
                }
            }
        }
    }
    
    drawBananas() {
        for (let banana of this.bananaItems) {
            if (!banana.collected && 
                banana.x > this.camera.x - 50 && 
                banana.x < this.camera.x + this.canvas.width + 50) {
                
                // Banana with enhanced shading
                const gradient = this.ctx.createLinearGradient(banana.x, banana.y, banana.x + 16, banana.y + 16);
                gradient.addColorStop(0, '#FFD700');
                gradient.addColorStop(0.5, '#FFA500');
                gradient.addColorStop(1, '#FF8C00');
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.ellipse(banana.x + 8, banana.y + 8, 8, 12, 0.3, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Banana highlight
                this.ctx.fillStyle = '#FFFF99';
                this.ctx.beginPath();
                this.ctx.ellipse(banana.x + 6, banana.y + 6, 3, 5, 0.3, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Banana tip
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(banana.x + 6, banana.y + 2, 4, 2);
            }
        }
    }
    
    drawPowerUps() {
        for (let powerUp of this.powerUps) {
            if (!powerUp.collected && 
                powerUp.x > this.camera.x - 50 && 
                powerUp.x < this.camera.x + this.canvas.width + 50) {
                
                const pulse = Math.sin(powerUp.pulsePhase) * 0.2 + 1;
                const color = this.powerUpTypes[powerUp.type].color;
                
                // Power-up glow
                this.ctx.shadowColor = color;
                this.ctx.shadowBlur = 10 * pulse;
                
                this.ctx.fillStyle = color;
                this.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width * pulse, powerUp.height * pulse);
                
                // Power-up symbol
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '12px Courier New';
                this.ctx.textAlign = 'center';
                
                const symbols = {
                    extraLife: '♥',
                    speedBoost: '⚡',
                    invincibility: '★',
                    doubleJump: '↑'
                };
                
                this.ctx.fillText(symbols[powerUp.type], 
                                powerUp.x + powerUp.width / 2, 
                                powerUp.y + powerUp.height / 2 + 4);
                
                this.ctx.shadowBlur = 0;
            }
        }
    }
    
    drawEnemies() {
        for (let enemy of this.enemies) {
            if (!enemy.alive) continue;
            
            if (enemy.x > this.camera.x - 50 && 
                enemy.x < this.camera.x + this.canvas.width + 50) {
                
                // Enhanced Kremling with stunned state
                this.ctx.fillStyle = enemy.stunned ? '#FFB6C1' : '#228B22';
                this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                
                // Body highlight
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.fillRect(enemy.x + 1, enemy.y + 1, enemy.width - 2, 4);
                
                // Belly
                this.ctx.fillStyle = enemy.stunned ? '#FFC0CB' : '#90EE90';
                this.ctx.fillRect(enemy.x + 4, enemy.y + 8, enemy.width - 8, enemy.height - 12);
                
                // Eyes
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(enemy.x + 6, enemy.y + 4, 4, 4);
                this.ctx.fillRect(enemy.x + 14, enemy.y + 4, 4, 4);
                
                // Pupils
                this.ctx.fillStyle = enemy.stunned ? '#FF69B4' : '#FF0000';
                if (enemy.direction === 1) {
                    this.ctx.fillRect(enemy.x + 8, enemy.y + 5, 2, 2);
                    this.ctx.fillRect(enemy.x + 16, enemy.y + 5, 2, 2);
                } else {
                    this.ctx.fillRect(enemy.x + 6, enemy.y + 5, 2, 2);
                    this.ctx.fillRect(enemy.x + 14, enemy.y + 5, 2, 2);
                }
                
                // Mouth
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(enemy.x + 10, enemy.y + 12, 4, 1);
                
                // Spikes
                this.ctx.fillStyle = enemy.stunned ? '#FFB6C1' : '#228B22';
                for (let i = 0; i < 3; i++) {
                    const spikeX = enemy.x + 6 + i * 4;
                    this.ctx.beginPath();
                    this.ctx.moveTo(spikeX, enemy.y);
                    this.ctx.lineTo(spikeX + 2, enemy.y - 4);
                    this.ctx.lineTo(spikeX + 4, enemy.y);
                    this.ctx.closePath();
                    this.ctx.fill();
                }
                
                // Stunned stars
                if (enemy.stunned) {
                    this.ctx.fillStyle = '#FFD700';
                    for (let i = 0; i < 3; i++) {
                        const starX = enemy.x + 8 + i * 6;
                        const starY = enemy.y - 8;
                        this.ctx.fillRect(starX - 1, starY - 1, 3, 3);
                    }
                }
            }
        }
    }
    
    drawPlayer() {
        // Invulnerability flashing
        if (this.player.invulnerable && Math.floor(Date.now() / 100) % 2) {
            return; // Skip drawing for flashing effect
        }
        
        if (this.player.rolling) {
            // Enhanced rolling animation
            const color = this.currentCharacter === 'dk' ? '#8B4513' : '#CD853F';
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x + this.player.width/2, 
                       this.player.y + this.player.height/2, 
                       this.player.width/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Rolling motion blur
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI / 3) + (Date.now() * 0.02);
                const x = this.player.x + this.player.width/2 + Math.cos(angle) * (this.player.width/3);
                const y = this.player.y + this.player.height/2 + Math.sin(angle) * (this.player.width/3);
                this.ctx.fillRect(x - 1, y - 1, 2, 2);
            }
            return;
        }
        
        if (this.currentCharacter === 'dk') {
            this.drawEnhancedDonkeyKong();
        } else {
            this.drawEnhancedDiddyKong();
        }
    }
    
    drawEnhancedDonkeyKong() {
        // Enhanced DK with more detail
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Muscle definition
        this.ctx.fillStyle = '#A0522D';
        this.ctx.fillRect(this.player.x + 2, this.player.y + 2, this.player.width - 4, this.player.height - 4);
        
        // Chest
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(this.player.x + 6, this.player.y + 12, this.player.width - 12, 16);
        
        // Chest highlights
        this.ctx.fillStyle = '#F5DEB3';
        this.ctx.fillRect(this.player.x + 8, this.player.y + 14, this.player.width - 16, 2);
        this.ctx.fillRect(this.player.x + 8, this.player.y + 18, this.player.width - 16, 2);
        
        // Face
        this.ctx.fillStyle = '#F4A460';
        this.ctx.fillRect(this.player.x + 4, this.player.y + 2, this.player.width - 8, 14);
        
        // Face highlight
        this.ctx.fillStyle = '#FFEFD5';
        this.ctx.fillRect(this.player.x + 6, this.player.y + 4, this.player.width - 12, 2);
        
        // Eyes with detail
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(this.player.x + 8, this.player.y + 6, 6, 4);
        this.ctx.fillRect(this.player.x + 18, this.player.y + 6, 6, 4);
        
        this.ctx.fillStyle = '#000000';
        if (this.player.direction === 1) {
            this.ctx.fillRect(this.player.x + 11, this.player.y + 7, 2, 2);
            this.ctx.fillRect(this.player.x + 21, this.player.y + 7, 2, 2);
        } else {
            this.ctx.fillRect(this.player.x + 9, this.player.y + 7, 2, 2);
            this.ctx.fillRect(this.player.x + 19, this.player.y + 7, 2, 2);
        }
        
        // Nose with shading
        this.ctx.fillStyle = '#CD853F';
        this.ctx.fillRect(this.player.x + 14, this.player.y + 10, 4, 3);
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(this.player.x + 15, this.player.y + 10, 2, 1);
        
        // Enhanced red tie
        this.ctx.fillStyle = '#DC143C';
        this.ctx.fillRect(this.player.x + 12, this.player.y + 16, 8, 12);
        this.ctx.fillStyle = '#B22222';
        this.ctx.fillRect(this.player.x + 13, this.player.y + 17, 6, 10);
        
        // DK logo
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(this.player.x + 14, this.player.y + 20, 4, 2);
        this.ctx.fillRect(this.player.x + 15, this.player.y + 22, 2, 2);
        
        // Enhanced arms with animation
        this.ctx.fillStyle = '#8B4513';
        if (Math.abs(this.player.velocityX) > 0.1) {
            const armSwing = Math.sin(Date.now() * 0.015) * 3;
            this.ctx.fillRect(this.player.x - 4 + armSwing, this.player.y + 12, 8, 18);
            this.ctx.fillRect(this.player.x + this.player.width - 4 - armSwing, this.player.y + 12, 8, 18);
        } else {
            this.ctx.fillRect(this.player.x - 2, this.player.y + 12, 6, 16);
            this.ctx.fillRect(this.player.x + this.player.width - 4, this.player.y + 12, 6, 16);
        }
    }
    
    drawEnhancedDiddyKong() {
        // Enhanced Diddy with more detail
        this.ctx.fillStyle = '#CD853F';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Body highlights
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(this.player.x + 1, this.player.y + 1, this.player.width - 2, this.player.height - 2);
        
        // Red shirt with details
        this.ctx.fillStyle = '#DC143C';
        this.ctx.fillRect(this.player.x + 3, this.player.y + 12, this.player.width - 6, 12);
        this.ctx.fillStyle = '#B22222';
        this.ctx.fillRect(this.player.x + 4, this.player.y + 13, this.player.width - 8, 10);
        
        // Face
        this.ctx.fillStyle = '#F4A460';
        this.ctx.fillRect(this.player.x + 2, this.player.y + 2, this.player.width - 4, 10);
        
        // Red cap with details
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, 8);
        this.ctx.fillStyle = '#CC0000';
        this.ctx.fillRect(this.player.x + 1, this.player.y + 1, this.player.width - 2, 6);
        
        // Cap logo
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(this.player.x + 10, this.player.y + 2, 4, 2);
        this.ctx.fillRect(this.player.x + 11, this.player.y + 4, 2, 1);
        
        // Eyes with detail
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(this.player.x + 6, this.player.y + 5, 4, 3);
        this.ctx.fillRect(this.player.x + 14, this.player.y + 5, 4, 3);
        
        this.ctx.fillStyle = '#000000';
        if (this.player.direction === 1) {
            this.ctx.fillRect(this.player.x + 8, this.player.y + 6, 1, 1);
            this.ctx.fillRect(this.player.x + 16, this.player.y + 6, 1, 1);
        } else {
            this.ctx.fillRect(this.player.x + 7, this.player.y + 6, 1, 1);
            this.ctx.fillRect(this.player.x + 15, this.player.y + 6, 1, 1);
        }
        
        // Animated tail
        this.ctx.fillStyle = '#CD853F';
        const tailSway = Math.sin(Date.now() * 0.01) * 3;
        this.ctx.fillRect(this.player.x + this.player.width - 2 + tailSway, 
                         this.player.y + 16, 5, 10);
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(this.player.x + this.player.width - 1 + tailSway, 
                         this.player.y + 17, 3, 8);
    }
    
    drawParticles() {
        for (let particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            
            // Enhanced particles with glow
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = 3 * alpha;
            this.ctx.fillRect(particle.x - 1, particle.y - 1, 3, 3);
            this.ctx.shadowBlur = 0;
        }
    }
    
    drawUI() {
        // Combo display
        if (this.player.combo > 1) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 24px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${this.player.combo}x COMBO!`, this.canvas.width / 2, 50);
        }
        
        // FPS counter (debug)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.font = '12px Courier New';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`FPS: ${this.fps}`, 10, this.canvas.height - 10);
        
        // Level indicator
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Courier New';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Level ${this.currentLevel}`, this.canvas.width - 10, 30);
    }
    
    drawPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '48px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '16px Courier New';
        this.ctx.fillText('Press ESC to resume', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the console-enhanced game
window.addEventListener('load', () => {
    new ConsoleDKC();
});