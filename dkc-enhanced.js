class EnhancedDKC {
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
        
        // Game State
        this.gameState = 'worldmap'; // 'worldmap', 'playing', 'paused'
        this.currentLevel = 1;
        this.score = parseInt(localStorage.getItem('dkc-highscore') || '0');
        this.bananas = 0;
        this.lives = 3;
        this.gameRunning = true;
        this.camera = { x: 0, y: 0, shake: 0 };
        this.startTime = Date.now();
        this.currentCharacter = 'dk';
        
        // World Map Data
        this.worldData = {
            levels: [
                { id: 1, x: 100, y: 200, name: "Jungle Hijinx", completed: false, unlocked: true },
                { id: 2, x: 200, y: 150, name: "Ropey Rampage", completed: false, unlocked: false },
                { id: 3, x: 300, y: 180, name: "Reptile Rumble", completed: false, unlocked: false },
                { id: 4, x: 450, y: 120, name: "Coral Capers", completed: false, unlocked: false },
                { id: 5, x: 600, y: 160, name: "Barrel Cannon Canyon", completed: false, unlocked: false }
            ]
        };
        
        // Load world progress
        const savedWorld = localStorage.getItem('dkc-world');
        if (savedWorld) {
            this.worldData = JSON.parse(savedWorld);
        }
        
        // Dynamic Music System
        this.musicEnabled = true;
        this.currentTrack = null;
        this.musicTracks = {
            worldmap: { tempo: 120, notes: [262, 330, 392, 523] },
            jungle: { tempo: 140, notes: [196, 247, 294, 349] },
            underwater: { tempo: 100, notes: [147, 185, 220, 277] },
            boss: { tempo: 160, notes: [131, 165, 196, 247] }
        };
        
        // Animal Buddies
        this.animalBuddies = {
            rambi: { 
                name: 'Rambi', 
                speed: 6, 
                jumpPower: 10, 
                ability: 'charge',
                width: 48, 
                height: 32 
            },
            enguarde: { 
                name: 'Enguarde', 
                speed: 5, 
                jumpPower: 8, 
                ability: 'swim',
                width: 40, 
                height: 24 
            }
        };
        
        this.currentBuddy = null;
        this.ridingBuddy = false;
        
        // Save States
        this.saveSlots = [null, null, null];
        this.loadSaveSlots();
        
        // CRT Filter
        this.crtEnabled = true;
        
        // Enhanced Player System
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
        
        // Level Data (varies by current level)
        this.levelWidth = 3200;
        this.platforms = [];
        this.enemies = [];
        this.bananaItems = [];
        this.animalCrates = [];
        
        // Initialize level
        this.loadLevel(this.currentLevel);
        
        // Audio Context
        this.initAudio();
        
        // Input System
        this.keys = {};
        this.setupInput();
        
        // Start with world map
        this.showWorldMap();
        
        // Game Loop
        this.gameLoop();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.musicGain = this.audioContext.createGain();
            this.musicGain.connect(this.audioContext.destination);
            this.musicGain.gain.value = 0.3;
            
            this.startBackgroundMusic('worldmap');
        } catch (e) {
            console.log('Web Audio not supported');
        }
    }
    
    startBackgroundMusic(trackName) {
        if (!this.audioContext || !this.musicEnabled) return;
        
        if (this.currentTrack) {
            this.currentTrack.stop();
        }
        
        const track = this.musicTracks[trackName];
        if (!track) return;
        
        this.playMelody(track.notes, track.tempo);
    }
    
    playMelody(notes, tempo) {
        if (!this.audioContext) return;
        
        const noteLength = 60 / tempo;
        let time = this.audioContext.currentTime;
        
        const playNote = (frequency, startTime, duration) => {
            const oscillator = this.audioContext.createOscillator();
            const envelope = this.audioContext.createGain();
            
            oscillator.connect(envelope);
            envelope.connect(this.musicGain);
            
            oscillator.frequency.setValueAtTime(frequency, startTime);
            oscillator.type = 'square';
            
            envelope.gain.setValueAtTime(0, startTime);
            envelope.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
            envelope.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };
        
        // Play melody loop
        const playLoop = () => {
            if (!this.musicEnabled) return;
            
            notes.forEach((note, index) => {
                playNote(note, time + index * noteLength, noteLength * 0.8);
            });
            
            time += notes.length * noteLength;
            setTimeout(playLoop, notes.length * noteLength * 1000);
        };
        
        playLoop();
    }
    
    loadLevel(levelId) {
        // Reset level data
        this.platforms = [];
        this.enemies = [];
        this.bananaItems = [];
        this.animalCrates = [];
        
        // Level-specific generation
        switch(levelId) {
            case 1: // Jungle Hijinx
                this.generateJungleLevel();
                break;
            case 2: // Ropey Rampage
                this.generateRopeLevel();
                break;
            case 3: // Reptile Rumble
                this.generateCaveLevel();
                break;
            case 4: // Coral Capers
                this.generateUnderwaterLevel();
                break;
            case 5: // Barrel Cannon Canyon
                this.generateCannonLevel();
                break;
        }
    }
    
    generateJungleLevel() {
        // Ground platforms
        this.platforms = [
            { x: 0, y: 400, width: 3200, height: 80, type: 'ground' },
            { x: 300, y: 320, width: 120, height: 20, type: 'platform' },
            { x: 500, y: 250, width: 100, height: 20, type: 'platform' },
            { x: 700, y: 180, width: 120, height: 20, type: 'platform' },
            { x: 1000, y: 300, width: 150, height: 20, type: 'platform' },
            { x: 1300, y: 220, width: 100, height: 20, type: 'platform' },
            { x: 1600, y: 280, width: 120, height: 20, type: 'platform' },
            { x: 1900, y: 200, width: 150, height: 20, type: 'platform' },
            { x: 2200, y: 320, width: 120, height: 20, type: 'platform' },
            { x: 2500, y: 250, width: 200, height: 20, type: 'platform' }
        ];
        
        // Enemies
        this.enemies = [
            { x: 400, y: 360, width: 24, height: 30, velocityX: -1, type: 'kremling' },
            { x: 800, y: 360, width: 24, height: 30, velocityX: 1, type: 'kremling' },
            { x: 1400, y: 360, width: 24, height: 30, velocityX: -1, type: 'kremling' },
            { x: 1800, y: 360, width: 24, height: 30, velocityX: 1, type: 'kremling' }
        ];
        
        // Bananas
        this.bananaItems = [
            { x: 350, y: 280, collected: false },
            { x: 520, y: 210, collected: false },
            { x: 720, y: 140, collected: false },
            { x: 1050, y: 260, collected: false },
            { x: 1320, y: 180, collected: false },
            { x: 1620, y: 240, collected: false },
            { x: 1950, y: 160, collected: false },
            { x: 2250, y: 280, collected: false }
        ];
        
        // Animal Crates
        this.animalCrates = [
            { x: 600, y: 350, buddy: 'rambi', opened: false },
            { x: 1500, y: 350, buddy: 'rambi', opened: false }
        ];
    }
    
    generateRopeLevel() {
        // More vertical level with ropes
        this.platforms = [
            { x: 0, y: 400, width: 800, height: 80, type: 'ground' },
            { x: 200, y: 300, width: 80, height: 20, type: 'platform' },
            { x: 400, y: 200, width: 80, height: 20, type: 'platform' },
            { x: 600, y: 100, width: 80, height: 20, type: 'platform' },
            { x: 800, y: 150, width: 100, height: 20, type: 'platform' },
            { x: 1000, y: 250, width: 80, height: 20, type: 'platform' },
            { x: 1200, y: 350, width: 120, height: 20, type: 'platform' },
            { x: 1400, y: 400, width: 1800, height: 80, type: 'ground' }
        ];
        
        this.enemies = [
            { x: 300, y: 360, width: 24, height: 30, velocityX: -1, type: 'kremling' },
            { x: 900, y: 360, width: 24, height: 30, velocityX: 1, type: 'kremling' }
        ];
        
        this.bananaItems = [
            { x: 220, y: 260, collected: false },
            { x: 420, y: 160, collected: false },
            { x: 620, y: 60, collected: false },
            { x: 820, y: 110, collected: false },
            { x: 1020, y: 210, collected: false }
        ];
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Resume audio context
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            // World Map Controls
            if (this.gameState === 'worldmap') {
                if (e.code === 'Enter' || e.code === 'Space') {
                    this.selectLevel();
                }
                if (e.code === 'ArrowLeft') this.navigateWorldMap(-1);
                if (e.code === 'ArrowRight') this.navigateWorldMap(1);
            }
            
            // Save State Controls
            if (e.code === 'F1') this.saveGame(0);
            if (e.code === 'F2') this.saveGame(1);
            if (e.code === 'F3') this.saveGame(2);
            if (e.code === 'F5') this.loadGame(0);
            if (e.code === 'F6') this.loadGame(1);
            if (e.code === 'F7') this.loadGame(2);
            
            // World Map Toggle
            if (e.code === 'KeyM') {
                if (this.gameState === 'playing') {
                    this.showWorldMap();
                } else if (this.gameState === 'worldmap') {
                    this.hideWorldMap();
                }
            }
            
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });
        
        // Save Slot Clicks
        document.querySelectorAll('.save-slot').forEach((slot, index) => {
            slot.addEventListener('click', () => {
                if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) {
                    this.loadGame(index);
                } else {
                    this.saveGame(index);
                }
            });
        });
        
        // Audio Controls
        document.getElementById('musicToggle').addEventListener('click', () => {
            this.musicEnabled = !this.musicEnabled;
            if (!this.musicEnabled && this.currentTrack) {
                this.currentTrack.stop();
            } else if (this.musicEnabled) {
                this.startBackgroundMusic(this.gameState === 'worldmap' ? 'worldmap' : 'jungle');
            }
        });
        
        document.getElementById('crtToggle').addEventListener('click', () => {
            this.crtEnabled = !this.crtEnabled;
            this.canvas.classList.toggle('crt-filter', this.crtEnabled);
        });
    }
    
    showWorldMap() {
        this.gameState = 'worldmap';
        this.worldMapCanvas.style.display = 'block';
        this.startBackgroundMusic('worldmap');
        this.selectedLevel = this.findFirstUnlockedLevel();
    }
    
    hideWorldMap() {
        this.gameState = 'playing';
        this.worldMapCanvas.style.display = 'none';
        this.startBackgroundMusic('jungle');
    }
    
    findFirstUnlockedLevel() {
        return this.worldData.levels.find(level => level.unlocked && !level.completed) || this.worldData.levels[0];
    }
    
    navigateWorldMap(direction) {
        const unlockedLevels = this.worldData.levels.filter(level => level.unlocked);
        const currentIndex = unlockedLevels.findIndex(level => level.id === this.selectedLevel.id);
        const newIndex = Math.max(0, Math.min(unlockedLevels.length - 1, currentIndex + direction));
        this.selectedLevel = unlockedLevels[newIndex];
        this.playSound(300, 0.1);
    }
    
    selectLevel() {
        if (this.selectedLevel && this.selectedLevel.unlocked) {
            this.currentLevel = this.selectedLevel.id;
            this.loadLevel(this.currentLevel);
            this.hideWorldMap();
            this.resetPlayer();
            this.playSound(400, 0.2);
        }
    }
    
    resetPlayer() {
        this.player.x = 100;
        this.player.y = 300;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.player.rolling = false;
        this.player.groundPounding = false;
        this.ridingBuddy = false;
        this.currentBuddy = null;
        this.startTime = Date.now();
    }
    
    saveGame(slotIndex) {
        const saveData = {
            score: this.score,
            lives: this.lives,
            currentLevel: this.currentLevel,
            worldData: this.worldData,
            playerX: this.player.x,
            playerY: this.player.y,
            character: this.currentCharacter,
            timestamp: Date.now()
        };
        
        this.saveSlots[slotIndex] = saveData;
        localStorage.setItem(`dkc-save-${slotIndex}`, JSON.stringify(saveData));
        
        // Update UI
        const slot = document.querySelector(`[data-slot="${slotIndex + 1}"]`);
        slot.classList.add('filled');
        
        this.showAchievement(`Game Saved to Slot ${slotIndex + 1}!`);
        this.playSound(500, 0.3);
    }
    
    loadGame(slotIndex) {
        const saveData = this.saveSlots[slotIndex];
        if (!saveData) return;
        
        this.score = saveData.score;
        this.lives = saveData.lives;
        this.currentLevel = saveData.currentLevel;
        this.worldData = saveData.worldData;
        this.currentCharacter = saveData.character;
        this.player = this.characters[this.currentCharacter];
        this.player.x = saveData.playerX;
        this.player.y = saveData.playerY;
        
        this.loadLevel(this.currentLevel);
        this.updateHUD();
        
        this.showAchievement(`Game Loaded from Slot ${slotIndex + 1}!`);
        this.playSound(600, 0.3);
    }
    
    loadSaveSlots() {
        for (let i = 0; i < 3; i++) {
            const saveData = localStorage.getItem(`dkc-save-${i}`);
            if (saveData) {
                this.saveSlots[i] = JSON.parse(saveData);
                document.querySelector(`[data-slot="${i + 1}"]`).classList.add('filled');
            }
        }
    }
    
    update() {
        if (this.gameState === 'worldmap') {
            this.updateWorldMap();
            return;
        }
        
        if (!this.gameRunning || this.gameState !== 'playing') return;
        
        this.handleInput();
        this.updatePlayer();
        this.updateEnemies();
        this.updateAnimalBuddies();
        this.updateCamera();
        this.checkCollisions();
        this.checkLevelComplete();
        this.updateTimer();
        
        // Camera shake
        if (this.camera.shake > 0) {
            this.camera.shake *= 0.9;
        }
    }
    
    updateWorldMap() {
        // Simple world map update logic
    }
    
    handleInput() {
        // Animal Buddy Controls
        if (this.keys['KeyR'] && this.currentBuddy && !this.ridingBuddy) {
            this.ridingBuddy = true;
            this.playSound(350, 0.3);
            this.showAchievement(`Riding ${this.currentBuddy.name}!`);
        }
        
        // Character switching (only when not riding)
        if (this.keys['KeyC'] && !this.ridingBuddy) {
            this.keys['KeyC'] = false;
            this.switchCharacter();
        }
        
        // Enhanced movement with animal buddy
        const currentSpeed = this.ridingBuddy ? this.currentBuddy.speed : this.player.speed;
        const currentJump = this.ridingBuddy ? this.currentBuddy.jumpPower : this.player.jumpPower;
        
        // Barrel roll
        if (this.keys['KeyS'] && this.player.onGround && !this.player.rolling) {
            this.player.rolling = true;
            this.player.rollTimer = 30;
            this.playSound(200, 0.3);
        }
        
        // Ground pound
        if (this.keys['ArrowDown'] && this.keys['Space'] && !this.player.onGround) {
            this.player.groundPounding = true;
            this.player.velocityY = 15;
            this.playSound(150, 0.4);
        }
        
        // Movement
        if (!this.player.rolling && !this.player.groundPounding) {
            if (this.keys['ArrowLeft']) {
                this.player.velocityX = -currentSpeed;
                this.player.direction = -1;
            } else if (this.keys['ArrowRight']) {
                this.player.velocityX = currentSpeed;
                this.player.direction = 1;
            } else {
                this.player.velocityX *= 0.8;
            }
            
            // Jumping
            if (this.keys['Space'] && this.player.onGround) {
                this.player.velocityY = -currentJump;
                this.player.onGround = false;
                this.playSound(300, 0.2);
            }
        }
        
        // Special buddy abilities
        if (this.ridingBuddy && this.currentBuddy) {
            if (this.currentBuddy.ability === 'charge' && this.keys['KeyS']) {
                this.player.velocityX = this.player.direction * (currentSpeed * 1.5);
                this.camera.shake = 3;
            }
        }
    }
    
    updatePlayer() {
        // Rolling logic
        if (this.player.rolling) {
            this.player.rollTimer--;
            this.player.velocityX = this.player.direction * this.player.speed * 2;
            
            if (this.player.rollTimer <= 0) {
                this.player.rolling = false;
            }
        }
        
        // Ground pound
        if (this.player.groundPounding && this.player.onGround) {
            this.player.groundPounding = false;
            this.camera.shake = 10;
            this.playSound(100, 0.5);
            
            // Stun nearby enemies
            for (let enemy of this.enemies) {
                if (Math.abs(enemy.x - this.player.x) < 100) {
                    enemy.stunned = true;
                    enemy.stunnedTimer = 120;
                }
            }
        }
        
        // Physics
        if (!this.player.groundPounding) {
            this.player.velocityY += 0.6;
        }
        
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;
        
        // Bounds
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
                break;
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
            
            // Simple AI
            if (enemy.x <= 0 || enemy.x >= this.levelWidth - enemy.width) {
                enemy.velocityX *= -1;
            }
        }
    }
    
    updateAnimalBuddies() {
        // Update animal crate logic
        for (let crate of this.animalCrates) {
            if (!crate.opened &&
                this.player.x + this.player.width > crate.x &&
                this.player.x < crate.x + 40 &&
                this.player.y + this.player.height > crate.y &&
                this.player.y < crate.y + 40) {
                
                if (this.player.rolling || this.player.groundPounding) {
                    crate.opened = true;
                    this.currentBuddy = this.animalBuddies[crate.buddy];
                    this.showAchievement(`Found ${this.currentBuddy.name}!`);
                    this.playSound(450, 0.4);
                }
            }
        }
    }
    
    updateCamera() {
        let targetX = this.player.x - this.canvas.width / 2;
        targetX = Math.max(0, Math.min(targetX, this.levelWidth - this.canvas.width));
        
        this.camera.x += (targetX - this.camera.x) * 0.1;
        
        if (this.camera.shake > 0) {
            this.camera.x += (Math.random() - 0.5) * this.camera.shake;
            this.camera.y += (Math.random() - 0.5) * this.camera.shake;
        }
    }
    
    checkCollisions() {
        // Bananas
        for (let banana of this.bananaItems) {
            if (!banana.collected &&
                this.player.x + this.player.width > banana.x &&
                this.player.x < banana.x + 16 &&
                this.player.y + this.player.height > banana.y &&
                this.player.y < banana.y + 16) {
                
                banana.collected = true;
                this.bananas++;
                this.score += 100;
                this.playSound(500, 0.2);
                this.updateHUD();
            }
        }
        
        // Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let enemy = this.enemies[i];
            
            if (this.player.x + this.player.width > enemy.x &&
                this.player.x < enemy.x + enemy.width &&
                this.player.y + this.player.height > enemy.y &&
                this.player.y < enemy.y + enemy.height) {
                
                if (this.player.rolling || 
                    (this.player.velocityY > 0 && this.player.y < enemy.y - 10) ||
                    (this.ridingBuddy && this.currentBuddy.ability === 'charge')) {
                    
                    this.enemies.splice(i, 1);
                    this.score += 200;
                    this.playSound(400, 0.3);
                    this.camera.shake = 5;
                    
                    if (!this.player.rolling) {
                        this.player.velocityY = -8;
                    }
                } else if (!enemy.stunned) {
                    this.loseLife();
                }
            }
        }
    }
    
    checkLevelComplete() {
        if (this.player.x >= this.levelWidth - 100) {
            this.completeLevel();
        }
    }
    
    completeLevel() {
        // Mark level as completed
        const level = this.worldData.levels.find(l => l.id === this.currentLevel);
        if (level) {
            level.completed = true;
            
            // Unlock next level
            const nextLevel = this.worldData.levels.find(l => l.id === this.currentLevel + 1);
            if (nextLevel) {
                nextLevel.unlocked = true;
            }
        }
        
        // Save world progress
        localStorage.setItem('dkc-world', JSON.stringify(this.worldData));
        
        this.score += 1000;
        this.updateHUD();
        this.showAchievement('Level Complete!');
        
        // Return to world map
        setTimeout(() => {
            this.showWorldMap();
        }, 2000);
    }
    
    loseLife() {
        this.lives--;
        this.camera.shake = 20;
        this.playSound(100, 1.0);
        this.updateHUD();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.resetPlayer();
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        this.showAchievement('Game Over!');
        
        setTimeout(() => {
            this.showWorldMap();
            this.lives = 3;
            this.gameRunning = true;
            this.updateHUD();
        }, 3000);
    }
    
    switchCharacter() {
        this.currentCharacter = this.currentCharacter === 'dk' ? 'diddy' : 'dk';
        const oldPlayer = this.player;
        this.player = this.characters[this.currentCharacter];
        this.player.x = oldPlayer.x;
        this.player.y = oldPlayer.y;
        
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
        if (this.gameState === 'worldmap') {
            this.renderWorldMap();
            return;
        }
        
        // Clear canvas
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#98FB98');
        gradient.addColorStop(1, '#90EE90');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        this.drawPlatforms();
        this.drawAnimalCrates();
        this.drawBananas();
        this.drawEnemies();
        this.drawPlayer();
        
        this.ctx.restore();
    }
    
    renderWorldMap() {
        // Clear world map canvas
        const gradient = this.worldMapCtx.createLinearGradient(0, 0, 0, this.worldMapCanvas.height);
        gradient.addColorStop(0, '#2c5530');
        gradient.addColorStop(1, '#1a4c96');
        this.worldMapCtx.fillStyle = gradient;
        this.worldMapCtx.fillRect(0, 0, this.worldMapCanvas.width, this.worldMapCanvas.height);
        
        // Draw path connections
        this.worldMapCtx.strokeStyle = '#f1c40f';
        this.worldMapCtx.lineWidth = 4;
        this.worldMapCtx.beginPath();
        for (let i = 0; i < this.worldData.levels.length - 1; i++) {
            const current = this.worldData.levels[i];
            const next = this.worldData.levels[i + 1];
            this.worldMapCtx.moveTo(current.x + 20, current.y + 20);
            this.worldMapCtx.lineTo(next.x + 20, next.y + 20);
        }
        this.worldMapCtx.stroke();
        
        // Draw level nodes
        for (let level of this.worldData.levels) {
            let color = '#7f8c8d'; // Locked
            if (level.unlocked) {
                color = level.completed ? '#2ecc71' : '#f1c40f';
            }
            
            // Highlight selected level
            if (this.selectedLevel && level.id === this.selectedLevel.id) {
                this.worldMapCtx.fillStyle = '#e74c3c';
                this.worldMapCtx.beginPath();
                this.worldMapCtx.arc(level.x + 20, level.y + 20, 25, 0, Math.PI * 2);
                this.worldMapCtx.fill();
            }
            
            this.worldMapCtx.fillStyle = color;
            this.worldMapCtx.beginPath();
            this.worldMapCtx.arc(level.x + 20, level.y + 20, 20, 0, Math.PI * 2);
            this.worldMapCtx.fill();
            
            // Level number
            this.worldMapCtx.fillStyle = '#2c3e50';
            this.worldMapCtx.font = 'bold 16px Courier New';
            this.worldMapCtx.textAlign = 'center';
            this.worldMapCtx.fillText(level.id.toString(), level.x + 20, level.y + 26);
            
            // Level name
            this.worldMapCtx.fillStyle = '#ecf0f1';
            this.worldMapCtx.font = '12px Courier New';
            this.worldMapCtx.fillText(level.name, level.x + 20, level.y + 50);
        }
        
        // Instructions
        this.worldMapCtx.fillStyle = '#ecf0f1';
        this.worldMapCtx.font = '16px Courier New';
        this.worldMapCtx.textAlign = 'center';
        this.worldMapCtx.fillText('Use ARROW KEYS to navigate • ENTER to select level', 
                                 this.worldMapCanvas.width / 2, this.worldMapCanvas.height - 30);
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
                } else {
                    this.ctx.fillStyle = '#DEB887';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    this.ctx.fillStyle = '#8B7355';
                    for (let i = 0; i < platform.width; i += 20) {
                        this.ctx.fillRect(platform.x + i, platform.y, 2, platform.height);
                    }
                }
            }
        }
    }
    
    drawAnimalCrates() {
        for (let crate of this.animalCrates) {
            if (!crate.opened && 
                crate.x > this.camera.x - 50 && 
                crate.x < this.camera.x + this.canvas.width + 50) {
                
                // Crate
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(crate.x, crate.y, 40, 40);
                this.ctx.fillStyle = '#A0522D';
                this.ctx.fillRect(crate.x + 2, crate.y + 2, 36, 36);
                
                // Animal icon
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = '20px Courier New';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(crate.buddy === 'rambi' ? '🦏' : '🐟', 
                                 crate.x + 20, crate.y + 25);
            }
        }
    }
    
    drawBananas() {
        for (let banana of this.bananaItems) {
            if (!banana.collected && 
                banana.x > this.camera.x - 50 && 
                banana.x < this.camera.x + this.canvas.width + 50) {
                
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
                
                this.ctx.fillStyle = enemy.stunned ? '#FFB6C1' : '#228B22';
                this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                
                this.ctx.fillStyle = '#90EE90';
                this.ctx.fillRect(enemy.x + 4, enemy.y + 8, enemy.width - 8, enemy.height - 12);
                
                this.ctx.fillStyle = enemy.stunned ? '#FF69B4' : '#FF0000';
                this.ctx.fillRect(enemy.x + 16, enemy.y + 4, 4, 4);
            }
        }
    }
    
    drawPlayer() {
        if (this.ridingBuddy && this.currentBuddy) {
            this.drawAnimalBuddy();
        }
        
        if (this.player.rolling) {
            this.ctx.fillStyle = this.currentCharacter === 'dk' ? '#8B4513' : '#CD853F';
            this.ctx.beginPath();
            this.ctx.arc(this.player.x + this.player.width/2, 
                       this.player.y + this.player.height/2, 
                       this.player.width/2, 0, Math.PI * 2);
            this.ctx.fill();
            return;
        }
        
        if (this.currentCharacter === 'dk') {
            this.drawDonkeyKong();
        } else {
            this.drawDiddyKong();
        }
    }
    
    drawAnimalBuddy() {
        const buddy = this.currentBuddy;
        const x = this.player.x - 8;
        const y = this.player.y + 10;
        
        if (buddy.name === 'Rambi') {
            this.ctx.fillStyle = '#696969';
            this.ctx.fillRect(x, y, buddy.width, buddy.height);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(x + 35, y + 5, 8, 6); // Horn
        } else if (buddy.name === 'Enguarde') {
            this.ctx.fillStyle = '#4682B4';
            this.ctx.fillRect(x, y, buddy.width, buddy.height);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(x + 30, y + 8, 10, 4); // Sword
        }
    }
    
    drawDonkeyKong() {
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(this.player.x + 6, this.player.y + 12, this.player.width - 12, 16);
        
        this.ctx.fillStyle = '#F4A460';
        this.ctx.fillRect(this.player.x + 4, this.player.y + 2, this.player.width - 8, 14);
        
        this.ctx.fillStyle = '#000000';
        if (this.player.direction === 1) {
            this.ctx.fillRect(this.player.x + 18, this.player.y + 6, 3, 3);
            this.ctx.fillRect(this.player.x + 24, this.player.y + 6, 3, 3);
        } else {
            this.ctx.fillRect(this.player.x + 5, this.player.y + 6, 3, 3);
            this.ctx.fillRect(this.player.x + 11, this.player.y + 6, 3, 3);
        }
        
        this.ctx.fillStyle = '#DC143C';
        this.ctx.fillRect(this.player.x + 12, this.player.y + 16, 8, 12);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(this.player.x + 14, this.player.y + 18, 4, 2);
    }
    
    drawDiddyKong() {
        this.ctx.fillStyle = '#CD853F';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        this.ctx.fillStyle = '#DC143C';
        this.ctx.fillRect(this.player.x + 3, this.player.y + 12, this.player.width - 6, 12);
        
        this.ctx.fillStyle = '#F4A460';
        this.ctx.fillRect(this.player.x + 2, this.player.y + 2, this.player.width - 4, 10);
        
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, 8);
        
        this.ctx.fillStyle = '#000000';
        if (this.player.direction === 1) {
            this.ctx.fillRect(this.player.x + 14, this.player.y + 5, 2, 2);
            this.ctx.fillRect(this.player.x + 18, this.player.y + 5, 2, 2);
        } else {
            this.ctx.fillRect(this.player.x + 4, this.player.y + 5, 2, 2);
            this.ctx.fillRect(this.player.x + 8, this.player.y + 5, 2, 2);
        }
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the enhanced game
window.addEventListener('load', () => {
    new EnhancedDKC();
});