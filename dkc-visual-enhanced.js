class VisuallyEnhancedDKC {
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
        this.gameState = 'worldmap';
        this.currentLevel = 1;
        this.score = parseInt(localStorage.getItem('dkc-highscore') || '0');
        this.bananas = 0;
        this.lives = 3;
        this.gameRunning = true;
        this.camera = { x: 0, y: 0, shake: 0 };
        this.startTime = Date.now();
        this.currentCharacter = 'dk';
        
        // Enhanced Visual Effects
        this.particles = [];
        this.backgroundAnimations = [];
        this.waterDrops = [];
        this.leaves = [];
        this.fireflies = [];
        this.clouds = [];
        this.animationFrame = 0;
        
        // Rich Background Layers
        this.backgroundLayers = {
            sky: { elements: [], speed: 0.1 },
            mountains: { elements: [], speed: 0.2 },
            trees: { elements: [], speed: 0.4 },
            foliage: { elements: [], speed: 0.6 },
            foreground: { elements: [], speed: 0.8 }
        };
        
        // World Map Data
        this.worldData = {
            levels: [
                { id: 1, x: 100, y: 200, name: "Jungle Hijinx", completed: false, unlocked: true, theme: 'jungle' },
                { id: 2, x: 200, y: 150, name: "Ropey Rampage", completed: false, unlocked: false, theme: 'jungle' },
                { id: 3, x: 300, y: 180, name: "Reptile Rumble", completed: false, unlocked: false, theme: 'cave' },
                { id: 4, x: 450, y: 120, name: "Coral Capers", completed: false, unlocked: false, theme: 'underwater' },
                { id: 5, x: 600, y: 160, name: "Barrel Cannon Canyon", completed: false, unlocked: false, theme: 'factory' }
            ]
        };
        
        // Load world progress
        const savedWorld = localStorage.getItem('dkc-world');
        if (savedWorld) {
            this.worldData = JSON.parse(savedWorld);
        }
        
        // Enhanced Character System
        this.characters = {
            dk: {
                x: 100, y: 300, width: 32, height: 40,
                velocityX: 0, velocityY: 0, onGround: false,
                speed: 4, jumpPower: 14, direction: 1,
                animFrame: 0, animTimer: 0,
                rolling: false, rollTimer: 0,
                groundPounding: false,
                sprites: this.generateDKSprites()
            },
            diddy: {
                x: 100, y: 300, width: 24, height: 32,
                velocityX: 0, velocityY: 0, onGround: false,
                speed: 5, jumpPower: 16, direction: 1,
                animFrame: 0, animTimer: 0,
                rolling: false, rollTimer: 0,
                groundPounding: false,
                sprites: this.generateDiddySprites()
            }
        };
        
        this.player = this.characters[this.currentCharacter];
        
        // Level Data
        this.levelWidth = 3200;
        this.platforms = [];
        this.enemies = [];
        this.bananaItems = [];
        this.animalCrates = [];
        this.decorativeElements = [];
        
        // Generate rich backgrounds
        this.generateRichBackgrounds();
        this.generateAtmosphericEffects();
        
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
    
    generateDKSprites() {
        return {
            idle: this.createDKIdleSprite(),
            walk: [this.createDKWalkSprite(0), this.createDKWalkSprite(1), this.createDKWalkSprite(2), this.createDKWalkSprite(3)],
            jump: this.createDKJumpSprite(),
            roll: this.createDKRollSprite()
        };
    }
    
    generateDiddySprites() {
        return {
            idle: this.createDiddyIdleSprite(),
            walk: [this.createDiddyWalkSprite(0), this.createDiddyWalkSprite(1), this.createDiddyWalkSprite(2), this.createDiddyWalkSprite(3)],
            jump: this.createDiddyJumpSprite(),
            roll: this.createDiddyRollSprite()
        };
    }
    
    createDKIdleSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        
        // DK Body with detailed shading
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 0, 32, 40);
        
        // Muscle definition
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(2, 2, 28, 36);
        
        // Chest
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(6, 12, 20, 16);
        
        // Chest highlights
        ctx.fillStyle = '#F5DEB3';
        ctx.fillRect(8, 14, 16, 2);
        ctx.fillRect(8, 18, 16, 2);
        
        // Face with detailed features
        ctx.fillStyle = '#F4A460';
        ctx.fillRect(4, 2, 24, 14);
        
        // Face highlights
        ctx.fillStyle = '#FFEFD5';
        ctx.fillRect(6, 4, 20, 2);
        
        // Eyes with pupils
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(8, 6, 6, 4);
        ctx.fillRect(18, 6, 6, 4);
        ctx.fillStyle = '#000000';
        ctx.fillRect(10, 7, 2, 2);
        ctx.fillRect(20, 7, 2, 2);
        
        // Nose
        ctx.fillStyle = '#CD853F';
        ctx.fillRect(14, 10, 4, 2);
        
        // Mouth
        ctx.fillStyle = '#000000';
        ctx.fillRect(12, 12, 8, 1);
        
        // Red tie with DK logo
        ctx.fillStyle = '#DC143C';
        ctx.fillRect(12, 16, 8, 12);
        ctx.fillStyle = '#B22222';
        ctx.fillRect(13, 17, 6, 10);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(14, 20, 4, 2);
        
        // Arms with muscle definition
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-2, 12, 6, 16);
        ctx.fillRect(28, 12, 6, 16);
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(-1, 14, 4, 12);
        ctx.fillRect(29, 14, 4, 12);
        
        return canvas;
    }
    
    createDKWalkSprite(frame) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        
        // Similar to idle but with walking animation offsets
        const offsetY = Math.sin(frame * Math.PI / 2) * 2;
        const armSwing = Math.sin(frame * Math.PI / 2) * 3;
        
        // Body (slightly bouncing)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, offsetY, 32, 40 - offsetY);
        
        // Add walking details...
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(2, 2 + offsetY, 28, 36 - offsetY);
        
        // Chest
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(6, 12 + offsetY, 20, 16);
        
        // Face
        ctx.fillStyle = '#F4A460';
        ctx.fillRect(4, 2 + offsetY, 24, 14);
        
        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(8, 6 + offsetY, 6, 4);
        ctx.fillRect(18, 6 + offsetY, 6, 4);
        ctx.fillStyle = '#000000';
        ctx.fillRect(10, 7 + offsetY, 2, 2);
        ctx.fillRect(20, 7 + offsetY, 2, 2);
        
        // Red tie
        ctx.fillStyle = '#DC143C';
        ctx.fillRect(12, 16 + offsetY, 8, 12);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(14, 20 + offsetY, 4, 2);
        
        // Animated arms
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-2 + armSwing, 12 + offsetY, 6, 16);
        ctx.fillRect(28 - armSwing, 12 + offsetY, 6, 16);
        
        return canvas;
    }
    
    createDKJumpSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        
        // DK in jumping pose with arms up
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 0, 32, 40);
        
        // Body
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(2, 2, 28, 36);
        
        // Chest
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(6, 12, 20, 16);
        
        // Face
        ctx.fillStyle = '#F4A460';
        ctx.fillRect(4, 2, 24, 14);
        
        // Eyes (excited)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(8, 6, 6, 4);
        ctx.fillRect(18, 6, 6, 4);
        ctx.fillStyle = '#000000';
        ctx.fillRect(10, 7, 2, 2);
        ctx.fillRect(20, 7, 2, 2);
        
        // Red tie
        ctx.fillStyle = '#DC143C';
        ctx.fillRect(12, 16, 8, 12);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(14, 20, 4, 2);
        
        // Arms raised up
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-4, 4, 8, 12);
        ctx.fillRect(28, 4, 8, 12);
        
        return canvas;
    }
    
    createDKRollSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Rolling ball with DK colors
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(16, 16, 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Darker outline
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Rolling motion lines
        ctx.fillStyle = '#A0522D';
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI / 2) + (this.animationFrame * 0.2);
            const x = 16 + Math.cos(angle) * 8;
            const y = 16 + Math.sin(angle) * 8;
            ctx.fillRect(x - 1, y - 1, 2, 2);
        }
        
        return canvas;
    }
    
    createDiddyIdleSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Diddy's lighter brown body
        ctx.fillStyle = '#CD853F';
        ctx.fillRect(0, 0, 24, 32);
        
        // Body highlights
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(2, 2, 20, 28);
        
        // Red shirt with Nintendo logo style
        ctx.fillStyle = '#DC143C';
        ctx.fillRect(3, 12, 18, 12);
        ctx.fillStyle = '#B22222';
        ctx.fillRect(4, 13, 16, 10);
        
        // Face
        ctx.fillStyle = '#F4A460';
        ctx.fillRect(2, 2, 20, 10);
        
        // Red cap
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 24, 8);
        ctx.fillStyle = '#CC0000';
        ctx.fillRect(1, 1, 22, 6);
        
        // Cap logo
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(10, 2, 4, 2);
        
        // Eyes with more detail
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(6, 5, 4, 3);
        ctx.fillRect(14, 5, 4, 3);
        ctx.fillStyle = '#000000';
        ctx.fillRect(7, 6, 2, 1);
        ctx.fillRect(15, 6, 2, 1);
        
        // Nose
        ctx.fillStyle = '#CD853F';
        ctx.fillRect(11, 8, 2, 1);
        
        // Tail
        ctx.fillStyle = '#CD853F';
        ctx.fillRect(20, 16, 4, 8);
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(21, 17, 2, 6);
        
        return canvas;
    }
    
    createDiddyWalkSprite(frame) {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        const offsetY = Math.sin(frame * Math.PI / 2) * 1;
        const tailSwing = Math.sin(frame * Math.PI / 2) * 2;
        
        // Body
        ctx.fillStyle = '#CD853F';
        ctx.fillRect(0, offsetY, 24, 32 - offsetY);
        
        // Body highlights
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(2, 2 + offsetY, 20, 28 - offsetY);
        
        // Red shirt
        ctx.fillStyle = '#DC143C';
        ctx.fillRect(3, 12 + offsetY, 18, 12);
        
        // Face
        ctx.fillStyle = '#F4A460';
        ctx.fillRect(2, 2 + offsetY, 20, 10);
        
        // Red cap
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, offsetY, 24, 8);
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(10, 2 + offsetY, 4, 2);
        
        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(6, 5 + offsetY, 4, 3);
        ctx.fillRect(14, 5 + offsetY, 4, 3);
        ctx.fillStyle = '#000000';
        ctx.fillRect(7, 6 + offsetY, 2, 1);
        ctx.fillRect(15, 6 + offsetY, 2, 1);
        
        // Animated tail
        ctx.fillStyle = '#CD853F';
        ctx.fillRect(20 + tailSwing, 16 + offsetY, 4, 8);
        
        return canvas;
    }
    
    createDiddyJumpSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Diddy in acrobatic jumping pose
        ctx.fillStyle = '#CD853F';
        ctx.fillRect(0, 0, 24, 32);
        
        // Body
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(2, 2, 20, 28);
        
        // Red shirt
        ctx.fillStyle = '#DC143C';
        ctx.fillRect(3, 12, 18, 12);
        
        // Face
        ctx.fillStyle = '#F4A460';
        ctx.fillRect(2, 2, 20, 10);
        
        // Red cap
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 24, 8);
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(10, 2, 4, 2);
        
        // Eyes (excited)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(6, 5, 4, 3);
        ctx.fillRect(14, 5, 4, 3);
        ctx.fillStyle = '#000000';
        ctx.fillRect(7, 6, 2, 1);
        ctx.fillRect(15, 6, 2, 1);
        
        // Tail extended for balance
        ctx.fillStyle = '#CD853F';
        ctx.fillRect(22, 8, 6, 4);
        
        return canvas;
    }
    
    createDiddyRollSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 24;
        const ctx = canvas.getContext('2d');
        
        // Rolling ball with Diddy colors
        ctx.fillStyle = '#CD853F';
        ctx.beginPath();
        ctx.arc(12, 12, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Red cap visible
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(12, 8, 8, 0, Math.PI);
        ctx.fill();
        
        // Motion blur effect
        ctx.fillStyle = 'rgba(205, 133, 63, 0.5)';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(12 - i * 2, 12, 12 - i, 0, Math.PI * 2);
            ctx.fill();
        }
        
        return canvas;
    }
    
    generateRichBackgrounds() {
        // Sky layer with gradient clouds
        for (let i = 0; i < 10; i++) {
            this.backgroundLayers.sky.elements.push({
                x: i * 300 + Math.random() * 200,
                y: 20 + Math.random() * 80,
                width: 80 + Math.random() * 60,
                height: 30 + Math.random() * 20,
                type: 'cloud',
                opacity: 0.6 + Math.random() * 0.4
            });
        }
        
        // Mountain layer with detailed peaks
        for (let i = 0; i < 8; i++) {
            this.backgroundLayers.mountains.elements.push({
                x: i * 400 + Math.random() * 100,
                y: 80 + Math.random() * 40,
                width: 120 + Math.random() * 80,
                height: 100 + Math.random() * 60,
                type: 'mountain',
                peaks: Math.floor(3 + Math.random() * 4)
            });
        }
        
        // Dense jungle trees with variety
        for (let i = 0; i < 25; i++) {
            this.backgroundLayers.trees.elements.push({
                x: i * 120 + Math.random() * 80,
                y: 120 + Math.random() * 80,
                width: 40 + Math.random() * 30,
                height: 80 + Math.random() * 50,
                type: Math.random() > 0.5 ? 'palm' : 'jungle',
                swayOffset: Math.random() * Math.PI * 2
            });
        }
        
        // Foreground foliage
        for (let i = 0; i < 40; i++) {
            this.backgroundLayers.foliage.elements.push({
                x: i * 80 + Math.random() * 60,
                y: 200 + Math.random() * 150,
                width: 20 + Math.random() * 15,
                height: 30 + Math.random() * 25,
                type: 'fern',
                animOffset: Math.random() * Math.PI * 2
            });
        }
        
        // Foreground grass and flowers
        for (let i = 0; i < 60; i++) {
            this.backgroundLayers.foreground.elements.push({
                x: i * 50 + Math.random() * 40,
                y: 350 + Math.random() * 50,
                width: 8 + Math.random() * 6,
                height: 15 + Math.random() * 10,
                type: Math.random() > 0.7 ? 'flower' : 'grass',
                color: Math.random() > 0.5 ? '#FF69B4' : '#FFD700'
            });
        }
    }
    
    generateAtmosphericEffects() {
        // Fireflies for magical atmosphere
        for (let i = 0; i < 15; i++) {
            this.fireflies.push({
                x: Math.random() * 3200,
                y: 100 + Math.random() * 200,
                velocityX: (Math.random() - 0.5) * 0.5,
                velocityY: (Math.random() - 0.5) * 0.3,
                brightness: Math.random(),
                pulseSpeed: 0.02 + Math.random() * 0.03
            });
        }
        
        // Falling leaves
        for (let i = 0; i < 20; i++) {
            this.leaves.push({
                x: Math.random() * 3200,
                y: -50 - Math.random() * 100,
                velocityX: (Math.random() - 0.5) * 0.3,
                velocityY: 0.5 + Math.random() * 0.5,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.05,
                type: Math.floor(Math.random() * 3),
                size: 4 + Math.random() * 4
            });
        }
        
        // Water drops for jungle humidity
        for (let i = 0; i < 10; i++) {
            this.waterDrops.push({
                x: Math.random() * 3200,
                y: -20,
                velocityY: 2 + Math.random() * 2,
                size: 2 + Math.random() * 2,
                opacity: 0.3 + Math.random() * 0.4
            });
        }
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
        if (!this.audioContext) return;
        
        const tracks = {
            worldmap: { tempo: 120, notes: [262, 330, 392, 523] },
            jungle: { tempo: 140, notes: [196, 247, 294, 349] },
            underwater: { tempo: 100, notes: [147, 185, 220, 277] },
            boss: { tempo: 160, notes: [131, 165, 196, 247] }
        };
        
        const track = tracks[trackName];
        if (track) {
            this.playMelody(track.notes, track.tempo);
        }
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
        
        const playLoop = () => {
            notes.forEach((note, index) => {
                playNote(note, time + index * noteLength, noteLength * 0.8);
            });
            
            time += notes.length * noteLength;
            setTimeout(playLoop, notes.length * noteLength * 1000);
        };
        
        playLoop();
    }
    
    loadLevel(levelId) {
        this.platforms = [];
        this.enemies = [];
        this.bananaItems = [];
        this.animalCrates = [];
        this.decorativeElements = [];
        
        // Generate level based on theme
        const level = this.worldData.levels.find(l => l.id === levelId);
        const theme = level ? level.theme : 'jungle';
        
        switch(theme) {
            case 'jungle':
                this.generateJungleLevel();
                break;
            case 'cave':
                this.generateCaveLevel();
                break;
            case 'underwater':
                this.generateUnderwaterLevel();
                break;
            case 'factory':
                this.generateFactoryLevel();
                break;
        }
    }
    
    generateJungleLevel() {
        // Enhanced platforms with visual variety
        this.platforms = [
            { x: 0, y: 400, width: 3200, height: 80, type: 'ground', texture: 'grass' },
            { x: 300, y: 320, width: 120, height: 20, type: 'wood', texture: 'log' },
            { x: 500, y: 250, width: 100, height: 20, type: 'wood', texture: 'plank' },
            { x: 700, y: 180, width: 120, height: 20, type: 'wood', texture: 'log' },
            { x: 1000, y: 300, width: 150, height: 20, type: 'wood', texture: 'plank' },
            { x: 1300, y: 220, width: 100, height: 20, type: 'wood', texture: 'log' },
            { x: 1600, y: 280, width: 120, height: 20, type: 'wood', texture: 'plank' },
            { x: 1900, y: 200, width: 150, height: 20, type: 'wood', texture: 'log' },
            { x: 2200, y: 320, width: 120, height: 20, type: 'wood', texture: 'plank' },
            { x: 2500, y: 250, width: 200, height: 20, type: 'wood', texture: 'log' }
        ];
        
        // Enhanced enemies with detailed sprites
        this.enemies = [
            { x: 400, y: 360, width: 24, height: 30, velocityX: -1, type: 'kremling', color: 'green' },
            { x: 800, y: 360, width: 24, height: 30, velocityX: 1, type: 'kremling', color: 'blue' },
            { x: 1400, y: 360, width: 24, height: 30, velocityX: -1, type: 'kremling', color: 'red' },
            { x: 1800, y: 360, width: 24, height: 30, velocityX: 1, type: 'kremling', color: 'green' }
        ];
        
        // Enhanced bananas with glow effects
        this.bananaItems = [
            { x: 350, y: 280, collected: false, glowPhase: 0 },
            { x: 520, y: 210, collected: false, glowPhase: 1 },
            { x: 720, y: 140, collected: false, glowPhase: 2 },
            { x: 1050, y: 260, collected: false, glowPhase: 3 },
            { x: 1320, y: 180, collected: false, glowPhase: 0 },
            { x: 1620, y: 240, collected: false, glowPhase: 1 },
            { x: 1950, y: 160, collected: false, glowPhase: 2 },
            { x: 2250, y: 280, collected: false, glowPhase: 3 }
        ];
        
        // Decorative jungle elements
        this.decorativeElements = [
            { x: 200, y: 350, type: 'mushroom', size: 'large' },
            { x: 450, y: 370, type: 'flower', color: 'red' },
            { x: 650, y: 360, type: 'mushroom', size: 'small' },
            { x: 850, y: 375, type: 'flower', color: 'blue' },
            { x: 1150, y: 365, type: 'mushroom', size: 'medium' },
            { x: 1450, y: 370, type: 'flower', color: 'yellow' },
            { x: 1750, y: 360, type: 'mushroom', size: 'large' },
            { x: 2050, y: 375, type: 'flower', color: 'purple' }
        ];
    }
    
    generateCaveLevel() {
        // Cave-themed level with stalactites and crystals
        this.platforms = [
            { x: 0, y: 400, width: 3200, height: 80, type: 'stone', texture: 'rock' },
            { x: 250, y: 320, width: 100, height: 15, type: 'stone', texture: 'crystal' },
            { x: 450, y: 250, width: 80, height: 15, type: 'stone', texture: 'rock' },
            { x: 650, y: 180, width: 100, height: 15, type: 'stone', texture: 'crystal' }
        ];
        
        this.decorativeElements = [
            { x: 100, y: 50, type: 'stalactite', length: 60 },
            { x: 300, y: 50, type: 'stalactite', length: 80 },
            { x: 500, y: 50, type: 'stalactite', length: 70 },
            { x: 150, y: 380, type: 'stalagmite', height: 40 },
            { x: 350, y: 370, type: 'stalagmite', height: 50 },
            { x: 550, y: 375, type: 'stalagmite', height: 45 }
        ];
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            if (this.gameState === 'worldmap') {
                if (e.code === 'Enter' || e.code === 'Space') {
                    this.selectLevel();
                }
                if (e.code === 'ArrowLeft') this.navigateWorldMap(-1);
                if (e.code === 'ArrowRight') this.navigateWorldMap(1);
            }
            
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
        this.startTime = Date.now();
    }
    
    update() {
        this.animationFrame++;
        
        if (this.gameState === 'worldmap') {
            this.updateWorldMapEffects();
            return;
        }
        
        if (!this.gameRunning || this.gameState !== 'playing') return;
        
        this.handleInput();
        this.updatePlayer();
        this.updateEnemies();
        this.updateAtmosphericEffects();
        this.updateParticles();
        this.updateCamera();
        this.checkCollisions();
        this.checkLevelComplete();
        this.updateTimer();
        
        if (this.camera.shake > 0) {
            this.camera.shake *= 0.9;
        }
    }
    
    updateWorldMapEffects() {
        // Animate world map elements
        for (let level of this.worldData.levels) {
            if (this.selectedLevel && level.id === this.selectedLevel.id) {
                level.pulsePhase = (level.pulsePhase || 0) + 0.1;
            }
        }
    }
    
    updateAtmosphericEffects() {
        // Update fireflies
        for (let firefly of this.fireflies) {
            firefly.x += firefly.velocityX;
            firefly.y += firefly.velocityY;
            firefly.brightness += firefly.pulseSpeed;
            
            // Boundary wrapping
            if (firefly.x < this.camera.x - 100) firefly.x = this.camera.x + this.canvas.width + 50;
            if (firefly.x > this.camera.x + this.canvas.width + 100) firefly.x = this.camera.x - 50;
            if (firefly.y < 50) firefly.y = 300;
            if (firefly.y > 350) firefly.y = 50;
            
            // Random direction changes
            if (Math.random() < 0.02) {
                firefly.velocityX += (Math.random() - 0.5) * 0.2;
                firefly.velocityY += (Math.random() - 0.5) * 0.2;
                firefly.velocityX = Math.max(-1, Math.min(1, firefly.velocityX));
                firefly.velocityY = Math.max(-0.5, Math.min(0.5, firefly.velocityY));
            }
        }
        
        // Update falling leaves
        for (let leaf of this.leaves) {
            leaf.x += leaf.velocityX;
            leaf.y += leaf.velocityY;
            leaf.rotation += leaf.rotationSpeed;
            
            // Wind effect
            leaf.velocityX += Math.sin(this.animationFrame * 0.01 + leaf.x * 0.001) * 0.01;
            
            // Reset when off screen
            if (leaf.y > this.canvas.height + 50) {
                leaf.y = -50;
                leaf.x = Math.random() * this.levelWidth;
            }
        }
        
        // Update water drops
        for (let drop of this.waterDrops) {
            drop.y += drop.velocityY;
            
            if (drop.y > this.canvas.height) {
                drop.y = -20;
                drop.x = Math.random() * this.levelWidth;
            }
        }
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
    
    handleInput() {
        if (this.keys['KeyC'] && !this.player.rolling) {
            this.keys['KeyC'] = false;
            this.switchCharacter();
        }
        
        if (this.keys['KeyS'] && this.player.onGround && !this.player.rolling) {
            this.player.rolling = true;
            this.player.rollTimer = 30;
            this.playSound(200, 0.3);
        }
        
        if (this.keys['ArrowDown'] && this.keys['Space'] && !this.player.onGround) {
            this.player.groundPounding = true;
            this.player.velocityY = 15;
            this.playSound(150, 0.4);
        }
        
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
            
            if (this.keys['Space'] && this.player.onGround) {
                this.player.velocityY = -this.player.jumpPower;
                this.player.onGround = false;
                this.playSound(300, 0.2);
                
                // Jump particles
                for (let i = 0; i < 5; i++) {
                    this.createParticle(
                        this.player.x + Math.random() * this.player.width,
                        this.player.y + this.player.height,
                        '#8B4513',
                        (Math.random() - 0.5) * 2,
                        -Math.random() * 2,
                        20
                    );
                }
            }
        }
        
        // Update animation
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
        if (this.player.rolling) {
            this.player.rollTimer--;
            this.player.velocityX = this.player.direction * this.player.speed * 2;
            
            if (this.player.rollTimer <= 0) {
                this.player.rolling = false;
            }
        }
        
        if (this.player.groundPounding && this.player.onGround) {
            this.player.groundPounding = false;
            this.camera.shake = 10;
            this.playSound(100, 0.5);
            
            // Ground pound particles
            for (let i = 0; i < 12; i++) {
                this.createParticle(
                    this.player.x + Math.random() * this.player.width,
                    this.player.y + this.player.height,
                    '#654321',
                    (Math.random() - 0.5) * 6,
                    -Math.random() * 4,
                    40
                );
            }
        }
        
        if (!this.player.groundPounding) {
            this.player.velocityY += 0.6;
        }
        
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;
        
        if (this.player.x < 0) {
            this.player.x = 0;
            this.player.velocityX = 0;
        }
        if (this.player.x + this.player.width > this.levelWidth) {
            this.player.x = this.levelWidth - this.player.width;
            this.player.velocityX = 0;
        }
        
        this.handlePlatformCollision();
        
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
            enemy.x += enemy.velocityX;
            
            if (enemy.x <= 0 || enemy.x >= this.levelWidth - enemy.width) {
                enemy.velocityX *= -1;
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
        // Enhanced banana collection with effects
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
                
                // Banana collection particles
                for (let i = 0; i < 8; i++) {
                    this.createParticle(
                        banana.x + 8,
                        banana.y + 8,
                        '#FFD700',
                        (Math.random() - 0.5) * 4,
                        -Math.random() * 4,
                        50
                    );
                }
                
                this.updateHUD();
            }
        }
        
        // Enemy collisions
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let enemy = this.enemies[i];
            
            if (this.player.x + this.player.width > enemy.x &&
                this.player.x < enemy.x + enemy.width &&
                this.player.y + this.player.height > enemy.y &&
                this.player.y < enemy.y + enemy.height) {
                
                if (this.player.rolling || 
                    (this.player.velocityY > 0 && this.player.y < enemy.y - 10)) {
                    
                    this.enemies.splice(i, 1);
                    this.score += 200;
                    this.playSound(400, 0.3);
                    this.camera.shake = 5;
                    
                    // Enemy defeat particles
                    for (let j = 0; j < 6; j++) {
                        this.createParticle(
                            enemy.x + enemy.width / 2,
                            enemy.y + enemy.height / 2,
                            '#FF6B6B',
                            (Math.random() - 0.5) * 5,
                            -Math.random() * 4,
                            35
                        );
                    }
                    
                    if (!this.player.rolling) {
                        this.player.velocityY = -8;
                    }
                } else {
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
        const level = this.worldData.levels.find(l => l.id === this.currentLevel);
        if (level) {
            level.completed = true;
            
            const nextLevel = this.worldData.levels.find(l => l.id === this.currentLevel + 1);
            if (nextLevel) {
                nextLevel.unlocked = true;
            }
        }
        
        localStorage.setItem('dkc-world', JSON.stringify(this.worldData));
        
        this.score += 1000;
        this.updateHUD();
        this.showAchievement('Level Complete!');
        
        setTimeout(() => {
            this.showWorldMap();
        }, 2000);
    }
    
    createParticle(x, y, color, velocityX = 0, velocityY = 0, life = 60) {
        this.particles.push({
            x, y, color, velocityX, velocityY, life, maxLife: life
        });
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
            this.renderEnhancedWorldMap();
            return;
        }
        
        // Enhanced sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.3, '#98FB98');
        gradient.addColorStop(0.7, '#90EE90');
        gradient.addColorStop(1, '#228B22');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        this.drawEnhancedParallaxBackground();
        this.drawAtmosphericEffects();
        this.drawEnhancedPlatforms();
        this.drawDecorativeElements();
        this.drawEnhancedBananas();
        this.drawEnhancedEnemies();
        this.drawEnhancedPlayer();
        this.drawParticles();
        
        this.ctx.restore();
    }
    
    renderEnhancedWorldMap() {
        // Animated gradient background
        const gradient = this.worldMapCtx.createRadialGradient(
            this.worldMapCanvas.width / 2, this.worldMapCanvas.height / 2, 0,
            this.worldMapCanvas.width / 2, this.worldMapCanvas.height / 2, this.worldMapCanvas.width
        );
        gradient.addColorStop(0, '#2c5530');
        gradient.addColorStop(0.5, '#1a4c96');
        gradient.addColorStop(1, '#0f2027');
        this.worldMapCtx.fillStyle = gradient;
        this.worldMapCtx.fillRect(0, 0, this.worldMapCanvas.width, this.worldMapCanvas.height);
        
        // Animated stars
        for (let i = 0; i < 50; i++) {
            const x = (i * 137.5) % this.worldMapCanvas.width;
            const y = (i * 73.3) % this.worldMapCanvas.height;
            const twinkle = Math.sin(this.animationFrame * 0.05 + i) * 0.5 + 0.5;
            
            this.worldMapCtx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.8})`;
            this.worldMapCtx.fillRect(x, y, 2, 2);
        }
        
        // Enhanced path connections with glow
        this.worldMapCtx.shadowColor = '#f1c40f';
        this.worldMapCtx.shadowBlur = 10;
        this.worldMapCtx.strokeStyle = '#f1c40f';
        this.worldMapCtx.lineWidth = 6;
        this.worldMapCtx.beginPath();
        for (let i = 0; i < this.worldData.levels.length - 1; i++) {
            const current = this.worldData.levels[i];
            const next = this.worldData.levels[i + 1];
            this.worldMapCtx.moveTo(current.x + 20, current.y + 20);
            this.worldMapCtx.lineTo(next.x + 20, next.y + 20);
        }
        this.worldMapCtx.stroke();
        this.worldMapCtx.shadowBlur = 0;
        
        // Enhanced level nodes
        for (let level of this.worldData.levels) {
            let color = '#7f8c8d';
            let glowColor = '#95a5a6';
            
            if (level.unlocked) {
                color = level.completed ? '#2ecc71' : '#f1c40f';
                glowColor = level.completed ? '#27ae60' : '#f39c12';
            }
            
            // Selection pulse effect
            if (this.selectedLevel && level.id === this.selectedLevel.id) {
                const pulse = Math.sin(this.animationFrame * 0.1) * 0.3 + 0.7;
                this.worldMapCtx.shadowColor = '#e74c3c';
                this.worldMapCtx.shadowBlur = 20 * pulse;
                
                this.worldMapCtx.fillStyle = '#e74c3c';
                this.worldMapCtx.beginPath();
                this.worldMapCtx.arc(level.x + 20, level.y + 20, 25 * pulse, 0, Math.PI * 2);
                this.worldMapCtx.fill();
            }
            
            // Level node with glow
            this.worldMapCtx.shadowColor = glowColor;
            this.worldMapCtx.shadowBlur = 15;
            this.worldMapCtx.fillStyle = color;
            this.worldMapCtx.beginPath();
            this.worldMapCtx.arc(level.x + 20, level.y + 20, 20, 0, Math.PI * 2);
            this.worldMapCtx.fill();
            
            // Inner highlight
            this.worldMapCtx.shadowBlur = 0;
            this.worldMapCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.worldMapCtx.beginPath();
            this.worldMapCtx.arc(level.x + 16, level.y + 16, 8, 0, Math.PI * 2);
            this.worldMapCtx.fill();
            
            // Level number with shadow
            this.worldMapCtx.shadowColor = '#000000';
            this.worldMapCtx.shadowBlur = 3;
            this.worldMapCtx.fillStyle = '#2c3e50';
            this.worldMapCtx.font = 'bold 16px Courier New';
            this.worldMapCtx.textAlign = 'center';
            this.worldMapCtx.fillText(level.id.toString(), level.x + 20, level.y + 26);
            
            // Level name with glow
            this.worldMapCtx.shadowColor = '#ecf0f1';
            this.worldMapCtx.shadowBlur = 5;
            this.worldMapCtx.fillStyle = '#ecf0f1';
            this.worldMapCtx.font = '12px Courier New';
            this.worldMapCtx.fillText(level.name, level.x + 20, level.y + 50);
            
            // Theme icon
            const themeIcons = {
                jungle: '🌴',
                cave: '🗿',
                underwater: '🌊',
                factory: '⚙️'
            };
            
            this.worldMapCtx.shadowBlur = 0;
            this.worldMapCtx.font = '20px Arial';
            this.worldMapCtx.fillText(themeIcons[level.theme] || '🌴', level.x + 20, level.y + 70);
        }
        
        // Enhanced instructions
        this.worldMapCtx.shadowColor = '#2c3e50';
        this.worldMapCtx.shadowBlur = 5;
        this.worldMapCtx.fillStyle = '#ecf0f1';
        this.worldMapCtx.font = '16px Courier New';
        this.worldMapCtx.textAlign = 'center';
        this.worldMapCtx.fillText('🎮 Use ARROW KEYS to navigate • ENTER to select level 🎮', 
                                 this.worldMapCanvas.width / 2, this.worldMapCanvas.height - 30);
        this.worldMapCtx.shadowBlur = 0;
    }
    
    drawEnhancedParallaxBackground() {
        // Sky layer with animated clouds
        for (let element of this.backgroundLayers.sky.elements) {
            const x = element.x - this.camera.x * this.backgroundLayers.sky.speed;
            
            if (x > -element.width && x < this.canvas.width + element.width) {
                // Animated cloud
                this.ctx.globalAlpha = element.opacity;
                this.ctx.fillStyle = '#FFFFFF';
                
                // Cloud shape with multiple circles
                for (let i = 0; i < 4; i++) {
                    this.ctx.beginPath();
                    this.ctx.arc(
                        x + (element.width / 4) * i + Math.sin(this.animationFrame * 0.01 + i) * 2,
                        element.y + Math.sin(this.animationFrame * 0.008 + i) * 3,
                        element.height / 2 + Math.sin(this.animationFrame * 0.012 + i) * 2,
                        0, Math.PI * 2
                    );
                    this.ctx.fill();
                }
                this.ctx.globalAlpha = 1;
            }
        }
        
        // Mountain layer with detailed peaks
        for (let element of this.backgroundLayers.mountains.elements) {
            const x = element.x - this.camera.x * this.backgroundLayers.mountains.speed;
            
            if (x > -element.width && x < this.canvas.width + element.width) {
                // Mountain silhouette
                this.ctx.fillStyle = '#4a5568';
                this.ctx.beginPath();
                this.ctx.moveTo(x, element.y + element.height);
                
                // Create jagged peaks
                for (let i = 0; i <= element.peaks; i++) {
                    const peakX = x + (element.width / element.peaks) * i;
                    const peakY = element.y + Math.random() * (element.height * 0.3);
                    this.ctx.lineTo(peakX, peakY);
                }
                
                this.ctx.lineTo(x + element.width, element.y + element.height);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Mountain highlights
                this.ctx.fillStyle = '#718096';
                this.ctx.beginPath();
                this.ctx.moveTo(x, element.y + element.height);
                this.ctx.lineTo(x + element.width * 0.3, element.y + element.height * 0.2);
                this.ctx.lineTo(x + element.width * 0.6, element.y + element.height * 0.4);
                this.ctx.lineTo(x, element.y + element.height * 0.6);
                this.ctx.closePath();
                this.ctx.fill();
            }
        }
        
        // Animated jungle trees
        for (let element of this.backgroundLayers.trees.elements) {
            const x = element.x - this.camera.x * this.backgroundLayers.trees.speed;
            
            if (x > -element.width && x < this.canvas.width + element.width) {
                const sway = Math.sin(this.animationFrame * 0.02 + element.swayOffset) * 3;
                
                if (element.type === 'palm') {
                    // Palm tree trunk
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(x + element.width * 0.4 + sway, element.y + element.height * 0.3, 
                                    element.width * 0.2, element.height * 0.7);
                    
                    // Palm fronds
                    this.ctx.fillStyle = '#228B22';
                    for (let i = 0; i < 6; i++) {
                        const angle = (i * Math.PI / 3) + sway * 0.1;
                        const frondX = x + element.width * 0.5 + Math.cos(angle) * element.width * 0.4;
                        const frondY = element.y + Math.sin(angle) * element.height * 0.2;
                        
                        this.ctx.beginPath();
                        this.ctx.ellipse(frondX, frondY, element.width * 0.3, element.height * 0.1, 
                                       angle, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                } else {
                    // Jungle tree trunk
                    this.ctx.fillStyle = '#654321';
                    this.ctx.fillRect(x + element.width * 0.3 + sway, element.y + element.height * 0.4, 
                                    element.width * 0.4, element.height * 0.6);
                    
                    // Tree canopy with layers
                    this.ctx.fillStyle = '#006400';
                    this.ctx.beginPath();
                    this.ctx.arc(x + element.width * 0.5 + sway, element.y + element.height * 0.2, 
                               element.width * 0.4, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    this.ctx.fillStyle = '#228B22';
                    this.ctx.beginPath();
                    this.ctx.arc(x + element.width * 0.5 + sway, element.y + element.height * 0.15, 
                               element.width * 0.3, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
    }
    
    drawAtmosphericEffects() {
        // Draw fireflies with glow
        for (let firefly of this.fireflies) {
            if (firefly.x > this.camera.x - 50 && firefly.x < this.camera.x + this.canvas.width + 50) {
                const brightness = Math.sin(firefly.brightness) * 0.5 + 0.5;
                
                this.ctx.shadowColor = '#FFFF00';
                this.ctx.shadowBlur = 10 * brightness;
                this.ctx.fillStyle = `rgba(255, 255, 0, ${brightness})`;
                this.ctx.beginPath();
                this.ctx.arc(firefly.x, firefly.y, 2 + brightness, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
        }
        
        // Draw falling leaves
        for (let leaf of this.leaves) {
            if (leaf.x > this.camera.x - 20 && leaf.x < this.camera.x + this.canvas.width + 20) {
                this.ctx.save();
                this.ctx.translate(leaf.x, leaf.y);
                this.ctx.rotate(leaf.rotation);
                
                const colors = ['#8B4513', '#CD853F', '#DAA520'];
                this.ctx.fillStyle = colors[leaf.type];
                
                // Leaf shape
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, leaf.size, leaf.size * 1.5, 0, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Leaf vein
                this.ctx.strokeStyle = '#654321';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(0, -leaf.size * 1.5);
                this.ctx.lineTo(0, leaf.size * 1.5);
                this.ctx.stroke();
                
                this.ctx.restore();
            }
        }
        
        // Draw water drops
        for (let drop of this.waterDrops) {
            if (drop.x > this.camera.x - 10 && drop.x < this.camera.x + this.canvas.width + 10) {
                this.ctx.globalAlpha = drop.opacity;
                this.ctx.fillStyle = '#87CEEB';
                this.ctx.beginPath();
                this.ctx.ellipse(drop.x, drop.y, drop.size * 0.5, drop.size, 0, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Drop highlight
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.beginPath();
                this.ctx.arc(drop.x - drop.size * 0.2, drop.y - drop.size * 0.3, drop.size * 0.2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
            }
        }
    }
    
    drawEnhancedPlatforms() {
        for (let platform of this.platforms) {
            if (platform.x + platform.width > this.camera.x - 50 && 
                platform.x < this.camera.x + this.canvas.width + 50) {
                
                if (platform.type === 'ground') {
                    // Rich ground texture
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    
                    // Grass layer with individual blades
                    this.ctx.fillStyle = '#228B22';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, 12);
                    
                    // Grass details
                    this.ctx.fillStyle = '#32CD32';
                    for (let i = 0; i < platform.width; i += 8) {
                        const grassHeight = 4 + Math.sin(i * 0.1 + this.animationFrame * 0.02) * 2;
                        this.ctx.fillRect(platform.x + i, platform.y - grassHeight, 2, grassHeight + 4);
                    }
                    
                    // Dirt texture
                    this.ctx.fillStyle = '#654321';
                    for (let i = 0; i < platform.width; i += 20) {
                        for (let j = 15; j < platform.height; j += 15) {
                            this.ctx.fillRect(platform.x + i + Math.random() * 5, 
                                            platform.y + j + Math.random() * 3, 3, 3);
                        }
                    }
                    
                } else if (platform.type === 'wood') {
                    // Enhanced wooden platforms
                    if (platform.texture === 'log') {
                        // Log texture
                        this.ctx.fillStyle = '#8B4513';
                        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                        
                        // Wood grain
                        this.ctx.fillStyle = '#A0522D';
                        for (let i = 0; i < platform.width; i += 15) {
                            this.ctx.fillRect(platform.x + i, platform.y + 2, 2, platform.height - 4);
                        }
                        
                        // Log rings
                        this.ctx.strokeStyle = '#654321';
                        this.ctx.lineWidth = 2;
                        this.ctx.beginPath();
                        this.ctx.arc(platform.x + 20, platform.y + platform.height / 2, 8, 0, Math.PI * 2);
                        this.ctx.arc(platform.x + platform.width - 20, platform.y + platform.height / 2, 8, 0, Math.PI * 2);
                        this.ctx.stroke();
                        
                    } else {
                        // Plank texture
                        this.ctx.fillStyle = '#DEB887';
                        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                        
                        // Plank separations
                        this.ctx.fillStyle = '#8B7355';
                        for (let i = 0; i < platform.width; i += 25) {
                            this.ctx.fillRect(platform.x + i, platform.y, 2, platform.height);
                        }
                        
                        // Nail details
                        this.ctx.fillStyle = '#696969';
                        for (let i = 12; i < platform.width; i += 25) {
                            this.ctx.fillRect(platform.x + i, platform.y + 3, 2, 2);
                            this.ctx.fillRect(platform.x + i, platform.y + platform.height - 5, 2, 2);
                        }
                    }
                }
            }
        }
    }
    
    drawDecorativeElements() {
        for (let element of this.decorativeElements) {
            if (element.x > this.camera.x - 50 && element.x < this.camera.x + this.canvas.width + 50) {
                
                if (element.type === 'mushroom') {
                    const sizes = { small: 0.7, medium: 1.0, large: 1.3 };
                    const scale = sizes[element.size] || 1.0;
                    
                    // Mushroom stem
                    this.ctx.fillStyle = '#F5F5DC';
                    this.ctx.fillRect(element.x + 8 * scale, element.y + 10 * scale, 
                                    6 * scale, 15 * scale);
                    
                    // Mushroom cap
                    this.ctx.fillStyle = '#FF6347';
                    this.ctx.beginPath();
                    this.ctx.arc(element.x + 11 * scale, element.y + 12 * scale, 
                               10 * scale, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Mushroom spots
                    this.ctx.fillStyle = '#FFFFFF';
                    for (let i = 0; i < 4; i++) {
                        const spotX = element.x + (5 + i * 3) * scale;
                        const spotY = element.y + (8 + (i % 2) * 4) * scale;
                        this.ctx.beginPath();
                        this.ctx.arc(spotX, spotY, 2 * scale, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                    
                } else if (element.type === 'flower') {
                    // Flower stem
                    this.ctx.fillStyle = '#228B22';
                    this.ctx.fillRect(element.x + 6, element.y + 8, 2, 12);
                    
                    // Flower petals
                    this.ctx.fillStyle = element.color;
                    for (let i = 0; i < 6; i++) {
                        const angle = (i * Math.PI / 3) + Math.sin(this.animationFrame * 0.05) * 0.1;
                        const petalX = element.x + 7 + Math.cos(angle) * 5;
                        const petalY = element.y + 10 + Math.sin(angle) * 5;
                        
                        this.ctx.beginPath();
                        this.ctx.arc(petalX, petalY, 3, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                    
                    // Flower center
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.beginPath();
                    this.ctx.arc(element.x + 7, element.y + 10, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
    }
    
    drawEnhancedBananas() {
        for (let banana of this.bananaItems) {
            if (!banana.collected && 
                banana.x > this.camera.x - 50 && 
                banana.x < this.camera.x + this.canvas.width + 50) {
                
                // Banana glow effect
                const glowIntensity = Math.sin(this.animationFrame * 0.1 + banana.glowPhase) * 0.3 + 0.7;
                
                this.ctx.shadowColor = '#FFD700';
                this.ctx.shadowBlur = 15 * glowIntensity;
                
                // Banana body with gradient
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
                
                this.ctx.shadowBlur = 0;
                
                // Floating sparkles around banana
                for (let i = 0; i < 3; i++) {
                    const sparkleX = banana.x + 8 + Math.cos(this.animationFrame * 0.05 + i * 2) * 12;
                    const sparkleY = banana.y + 8 + Math.sin(this.animationFrame * 0.05 + i * 2) * 8;
                    const sparkleAlpha = Math.sin(this.animationFrame * 0.1 + i) * 0.5 + 0.5;
                    
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha})`;
                    this.ctx.fillRect(sparkleX - 1, sparkleY - 1, 2, 2);
                }
            }
        }
    }
    
    drawEnhancedEnemies() {
        for (let enemy of this.enemies) {
            if (enemy.x > this.camera.x - 50 && 
                enemy.x < this.camera.x + this.canvas.width + 50) {
                
                const colors = {
                    green: { body: '#228B22', belly: '#90EE90', eyes: '#FF0000' },
                    blue: { body: '#4169E1', belly: '#87CEEB', eyes: '#FFFF00' },
                    red: { body: '#DC143C', belly: '#FFB6C1', eyes: '#FFFFFF' }
                };
                
                const colorScheme = colors[enemy.color] || colors.green;
                
                // Enemy body with shading
                this.ctx.fillStyle = colorScheme.body;
                this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                
                // Body highlight
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.fillRect(enemy.x + 1, enemy.y + 1, enemy.width - 2, 3);
                
                // Belly
                this.ctx.fillStyle = colorScheme.belly;
                this.ctx.fillRect(enemy.x + 4, enemy.y + 8, enemy.width - 8, enemy.height - 12);
                
                // Eyes with pupils
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(enemy.x + 6, enemy.y + 4, 4, 4);
                this.ctx.fillRect(enemy.x + 14, enemy.y + 4, 4, 4);
                
                this.ctx.fillStyle = colorScheme.eyes;
                this.ctx.fillRect(enemy.x + 7, enemy.y + 5, 2, 2);
                this.ctx.fillRect(enemy.x + 15, enemy.y + 5, 2, 2);
                
                // Mouth
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(enemy.x + 10, enemy.y + 12, 4, 1);
                
                // Spikes on back
                this.ctx.fillStyle = colorScheme.body;
                for (let i = 0; i < 3; i++) {
                    const spikeX = enemy.x + 6 + i * 4;
                    this.ctx.beginPath();
                    this.ctx.moveTo(spikeX, enemy.y);
                    this.ctx.lineTo(spikeX + 2, enemy.y - 3);
                    this.ctx.lineTo(spikeX + 4, enemy.y);
                    this.ctx.closePath();
                    this.ctx.fill();
                }
            }
        }
    }
    
    drawEnhancedPlayer() {
        const character = this.characters[this.currentCharacter];
        let sprite;
        
        if (this.player.rolling) {
            sprite = character.sprites.roll;
        } else if (!this.player.onGround) {
            sprite = character.sprites.jump;
        } else if (Math.abs(this.player.velocityX) > 0.1) {
            sprite = character.sprites.walk[this.player.animFrame];
        } else {
            sprite = character.sprites.idle;
        }
        
        // Draw sprite with direction
        this.ctx.save();
        if (this.player.direction === -1) {
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(sprite, -this.player.x - this.player.width, this.player.y);
        } else {
            this.ctx.drawImage(sprite, this.player.x, this.player.y);
        }
        this.ctx.restore();
        
        // Character glow effect when moving fast
        if (Math.abs(this.player.velocityX) > 3) {
            this.ctx.shadowColor = this.currentCharacter === 'dk' ? '#8B4513' : '#CD853F';
            this.ctx.shadowBlur = 10;
            this.ctx.globalAlpha = 0.3;
            
            if (this.player.direction === -1) {
                this.ctx.scale(-1, 1);
                this.ctx.drawImage(sprite, -this.player.x - this.player.width - 2, this.player.y);
                this.ctx.scale(-1, 1);
            } else {
                this.ctx.drawImage(sprite, this.player.x - 2, this.player.y);
            }
            
            this.ctx.globalAlpha = 1;
            this.ctx.shadowBlur = 0;
        }
    }
    
    drawParticles() {
        for (let particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            
            // Particle with glow
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = 5 * alpha;
            this.ctx.fillRect(particle.x - 1, particle.y - 1, 3, 3);
            this.ctx.shadowBlur = 0;
        }
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the visually enhanced game
window.addEventListener('load', () => {
    new VisuallyEnhancedDKC();
});