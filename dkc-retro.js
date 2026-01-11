class DonkeyKongCountryRetro {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false; // Pixel perfect rendering
        
        // Game state
        this.score = 0;
        this.bananas = 0;
        this.lives = 3;
        this.gameTime = 0;
        this.currentCharacter = 'DK';
        this.gameRunning = true;
        this.paused = false;
        
        // Animation frame counter
        this.frameCount = 0;
        
        // Player with retro animations
        this.player = {
            x: 100, y: 350, width: 32, height: 48,
            vx: 0, vy: 0, onGround: false,
            rolling: false, rollTimer: 0, rollCooldown: 0,
            swinging: false, vineIndex: -1, swingAngle: 0,
            invulnerable: false, invulnerableTimer: 0,
            doubleJump: false, dashCooldown: 0, canDash: true,
            animFrame: 0, animTimer: 0, facing: 1,
            state: 'idle' // idle, walking, jumping, rolling, swinging
        };
        
        // Enhanced world with retro aesthetics
        this.platforms = [
            {x: 0, y: 450, width: 800, height: 30, type: 'ground'},
            {x: 200, y: 350, width: 150, height: 20, type: 'wood'},
            {x: 450, y: 280, width: 100, height: 20, type: 'moving', moveX: 450, moveSpeed: 1, moveRange: 100},
            {x: 650, y: 200, width: 120, height: 20, type: 'bouncy'},
            {x: 300, y: 150, width: 80, height: 20, type: 'crumbling', crumbleTimer: 0},
            {x: 500, y: 100, width: 200, height: 20, type: 'wood'}
        ];
        
        this.vines = [
            {x: 380, y: 50, length: 180, swingAngle: 0.2, swingSpeed: 0.02},
            {x: 580, y: 80, length: 150, swingAngle: -0.1, swingSpeed: 0.015}
        ];
        
        this.bananaItems = [
            {x: 250, y: 320, collected: false, type: 'normal', sparkle: 0, bobOffset: 0},
            {x: 480, y: 250, collected: false, type: 'golden', sparkle: 0, bobOffset: Math.PI/2},
            {x: 680, y: 170, collected: false, type: 'normal', sparkle: 0, bobOffset: Math.PI},
            {x: 350, y: 120, collected: false, type: 'bonus', sparkle: 0, bobOffset: Math.PI*1.5}
        ];
        
        this.enemies = [
            {x: 300, y: 410, width: 24, height: 30, vx: -1, type: 'kremling', stunned: false, stunnedTimer: 0, animFrame: 0},
            {x: 500, y: 410, width: 24, height: 30, vx: 1, type: 'kremling', stunned: false, stunnedTimer: 0, animFrame: 0}
        ];
        
        // Visual effects
        this.particles = [];
        this.screenShake = {x: 0, y: 0, intensity: 0};
        this.camera = {x: 0, y: 0, targetX: 0};
        this.backgroundOffset = 0;
        
        // Retro color palette
        this.colors = {
            jungle: ['#0d4f3c', '#1a6b4f', '#2d8659', '#4da373'],
            wood: ['#8B4513', '#A0522D', '#CD853F', '#DEB887'],
            banana: ['#FFD700', '#FFA500', '#FFFF00'],
            dk: ['#8B4513', '#A0522D', '#654321'],
            diddy: ['#FF4500', '#FF6347', '#DC143C'],
            kremling: ['#228B22', '#32CD32', '#90EE90']
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
            if (e.code === 'KeyR' && !this.gameRunning) this.restart();
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
    
    togglePause() {
        this.paused = !this.paused;
        this.showNotification(this.paused ? 'PAUSED' : 'RESUMED');
    }
    
    restart() {
        this.score = 0;
        this.bananas = 0;
        this.lives = 3;
        this.gameTime = 0;
        this.gameRunning = true;
        this.player.x = 100;
        this.player.y = 350;
        this.player.vx = 0;
        this.player.vy = 0;
        this.resetCollectibles();
    }
    
    update() {
        if (!this.gameRunning || this.paused) return;
        
        this.frameCount++;
        this.gameTime++;
        this.updatePlayer();
        this.updateEnemies();
        this.updatePlatforms();
        this.updateParticles();
        this.updateCamera();
        this.updateAnimations();
        this.checkCollisions();
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
        
        // Jumping
        if ((this.keys['Space'] || this.keys['ArrowUp']) && this.player.onGround) {
            this.player.vy = -stats.jump;
            this.player.onGround = false;
            this.player.doubleJump = true;
            this.player.state = 'jumping';
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
            // Gravity
            this.player.vy += 0.6 * stats.weight;
            this.player.vy = Math.min(this.player.vy, 15);
            
            // Position update
            this.player.x += this.player.vx;
            this.player.y += this.player.vy;
        }
        
        // Platform collision
        this.checkPlatformCollision();
        
        // Bounds
        this.player.x = Math.max(0, Math.min(800 - this.player.width, this.player.x));
        if (this.player.y > 500) {
            this.loseLife();
        }
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
            
            // Turn around at edges
            if (enemy.x <= 0 || enemy.x >= 800 - enemy.width) {
                enemy.vx *= -1;
            }
            
            // Simple AI
            if (Math.abs(enemy.x - this.player.x) < 100) {
                enemy.vx = enemy.x < this.player.x ? 1 : -1;
            }
        });
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
        this.camera.x = Math.max(0, Math.min(0, this.camera.x));
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
            this.player.x = 100;
            this.player.y = 350;
            this.player.vx = 0;
            this.player.vy = 0;
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        this.showNotification('GAME OVER - Press R to restart');
    }
    
    // Enhanced particle effects with retro style
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
    
    createDashEffect() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.player.x - 20 - i * 8,
                y: this.player.y + Math.random() * 48,
                vx: -12, vy: (Math.random() - 0.5) * 2,
                life: 15, color: '#FFFFFF', type: 'line', size: 1
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
    
    createVineGrabEffect() {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: this.player.x + 16, y: this.player.y + 12,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 4,
                life: 20, color: '#228B22', type: 'leaf', size: 2
            });
        }
    }
    
    createBounceEffect(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 6,
                life: 25, color: '#FF69B4', type: 'bounce', size: 3
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
        setTimeout(() => achievement.classList.remove('show'), 2000);
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
        
        // Retro jungle background with parallax
        this.renderBackground();
        
        // Platforms with retro wood texture
        this.renderPlatforms();
        
        // Vines with swaying animation
        this.renderVines();
        
        // Bananas with bobbing and sparkle effects
        this.renderBananas();
        
        // Enemies with retro sprite animation
        this.renderEnemies();
        
        // Player with detailed retro animation
        this.renderPlayer();
        
        // Particles with retro effects
        this.renderParticles();
        
        // UI overlays
        this.renderUI();
        
        this.ctx.restore();
    }
    
    renderBackground() {
        // Multi-layer parallax background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.3, '#98FB98');
        gradient.addColorStop(0.7, '#228B22');
        gradient.addColorStop(1, '#0d4f3c');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width + Math.abs(this.camera.x), this.canvas.height);
        
        // Animated background elements
        for (let i = 0; i < 20; i++) {
            const x = (i * 80 + this.backgroundOffset * 0.3) % (this.canvas.width + 100);
            const y = 50 + Math.sin(this.frameCount * 0.01 + i) * 20;
            
            // Background trees
            this.ctx.fillStyle = this.colors.jungle[i % 4];
            this.ctx.fillRect(x, y, 15, 80);
            this.ctx.fillRect(x - 10, y - 10, 35, 25);
        }
    }
    
    renderPlatforms() {
        this.platforms.forEach(platform => {
            // Platform base
            if (platform.type === 'bouncy') {
                this.ctx.fillStyle = '#FF69B4';
            } else if (platform.type === 'crumbling') {
                this.ctx.fillStyle = platform.crumbleTimer > 0 ? '#FF4500' : '#8B4513';
            } else if (platform.type === 'moving') {
                this.ctx.fillStyle = '#4169E1';
            } else {
                this.ctx.fillStyle = this.colors.wood[0];
            }
            
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // Wood grain texture effect
            if (platform.type === 'wood' || platform.type === 'ground') {
                for (let i = 0; i < platform.width; i += 8) {
                    this.ctx.fillStyle = this.colors.wood[1];
                    this.ctx.fillRect(platform.x + i, platform.y + 2, 2, platform.height - 4);
                }
            }
            
            // Platform shine
            this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
            this.ctx.fillRect(platform.x, platform.y, platform.width, 2);
        });
    }
    
    renderVines() {
        this.vines.forEach(vine => {
            // Vine rope
            this.ctx.strokeStyle = '#228B22';
            this.ctx.lineWidth = 6;
            this.ctx.beginPath();
            this.ctx.moveTo(vine.x, vine.y);
            const endX = vine.x + Math.sin(vine.swingAngle) * vine.length;
            const endY = vine.y + Math.cos(vine.swingAngle) * vine.length;
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
            
            // Vine segments for texture
            for (let i = 0; i < vine.length; i += 20) {
                const segX = vine.x + Math.sin(vine.swingAngle) * i;
                const segY = vine.y + Math.cos(vine.swingAngle) * i;
                this.ctx.fillStyle = '#32CD32';
                this.ctx.fillRect(segX - 2, segY - 1, 4, 2);
            }
            
            // Vine end handle
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(endX - 6, endY - 3, 12, 6);
        });
    }
    
    renderBananas() {
        this.bananaItems.forEach(banana => {
            if (!banana.collected) {
                const bobY = banana.y + Math.sin(banana.bobOffset) * 3;
                
                // Banana glow effect
                const glowSize = 8 + Math.sin(banana.sparkle) * 3;
                this.ctx.shadowColor = banana.type === 'golden' ? '#FFD700' : 
                                      banana.type === 'bonus' ? '#FF1493' : '#FFFF00';
                this.ctx.shadowBlur = glowSize;
                
                // Banana shape
                this.ctx.fillStyle = banana.type === 'golden' ? '#FFD700' : 
                                   banana.type === 'bonus' ? '#FF1493' : '#FFFF00';
                this.ctx.beginPath();
                this.ctx.ellipse(banana.x + 8, bobY + 8, 8, 12, 0.2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Banana highlight
                this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
                this.ctx.fillRect(banana.x + 4, bobY + 4, 3, 8);
                
                this.ctx.shadowBlur = 0;
                
                // Sparkle particles around special bananas
                if (banana.type !== 'normal' && this.frameCount % 10 === 0) {
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
                    const starX = enemy.x + 12 + Math.cos(angle) * 20;
                    const starY = enemy.y + 15 + Math.sin(angle) * 15;
                    this.renderStar(starX, starY, 4, '#FFD700');
                }
            } else {
                // Kremling body
                this.ctx.fillStyle = this.colors.kremling[0];
                this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                
                // Animated walking
                const walkOffset = enemy.animFrame * 2;
                this.ctx.fillStyle = this.colors.kremling[1];
                this.ctx.fillRect(enemy.x + 2, enemy.y + 20 + walkOffset, 8, 8); // Left leg
                this.ctx.fillRect(enemy.x + 14, enemy.y + 20 - walkOffset, 8, 8); // Right leg
                
                // Eyes
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(enemy.x + 4, enemy.y + 5, 4, 4);
                this.ctx.fillRect(enemy.x + 16, enemy.y + 5, 4, 4);
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(enemy.x + 5, enemy.y + 6, 2, 2);
                this.ctx.fillRect(enemy.x + 17, enemy.y + 6, 2, 2);
                
                // Teeth
                this.ctx.fillStyle = '#FFFFFF';
                for (let i = 0; i < 3; i++) {
                    this.ctx.fillRect(enemy.x + 6 + i * 4, enemy.y + 12, 2, 4);
                }
            }
        });
    }
    
    renderPlayer() {
        const colors = this.currentCharacter === 'DK' ? this.colors.dk : this.colors.diddy;
        
        // Invulnerability flashing
        if (this.player.invulnerable && Math.floor(this.frameCount / 5) % 2) {
            this.ctx.globalAlpha = 0.5;
        }
        
        if (this.player.rolling) {
            // Rolling animation
            this.ctx.save();
            this.ctx.translate(this.player.x + 16, this.player.y + 24);
            this.ctx.rotate(this.frameCount * 0.5 * this.player.facing);
            this.ctx.fillStyle = colors[0];
            this.ctx.fillRect(-16, -24, 32, 48);
            this.ctx.restore();
        } else {
            // Normal character rendering
            this.ctx.fillStyle = colors[0];
            
            // Body
            this.ctx.fillRect(this.player.x + 8, this.player.y + 16, 16, 24);
            
            // Head
            this.ctx.fillRect(this.player.x + 6, this.player.y + 4, 20, 16);
            
            // Arms with animation
            const armOffset = this.player.state === 'walking' ? Math.sin(this.frameCount * 0.3) * 2 : 0;
            this.ctx.fillRect(this.player.x + 2, this.player.y + 18 + armOffset, 6, 12);
            this.ctx.fillRect(this.player.x + 24, this.player.y + 18 - armOffset, 6, 12);
            
            // Legs with walking animation
            if (this.player.state === 'walking') {
                const legOffset = Math.sin(this.frameCount * 0.4) * 3;
                this.ctx.fillRect(this.player.x + 10, this.player.y + 36 + legOffset, 6, 12);
                this.ctx.fillRect(this.player.x + 16, this.player.y + 36 - legOffset, 6, 12);
            } else {
                this.ctx.fillRect(this.player.x + 10, this.player.y + 36, 6, 12);
                this.ctx.fillRect(this.player.x + 16, this.player.y + 36, 6, 12);
            }
            
            // Eyes
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(this.player.x + 10, this.player.y + 8, 4, 4);
            this.ctx.fillRect(this.player.x + 18, this.player.y + 8, 4, 4);
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(this.player.x + 11, this.player.y + 9, 2, 2);
            this.ctx.fillRect(this.player.x + 19, this.player.y + 9, 2, 2);
            
            // Character-specific details
            if (this.currentCharacter === 'DK') {
                // DK's tie
                this.ctx.fillStyle = '#FF0000';
                this.ctx.fillRect(this.player.x + 12, this.player.y + 20, 8, 16);
                this.ctx.fillStyle = '#FFFF00';
                this.ctx.fillRect(this.player.x + 14, this.player.y + 24, 4, 4);
            } else {
                // Diddy's cap
                this.ctx.fillStyle = '#FF0000';
                this.ctx.fillRect(this.player.x + 4, this.player.y + 2, 24, 8);
                this.ctx.fillStyle = '#FFFF00';
                this.ctx.fillRect(this.player.x + 12, this.player.y + 4, 8, 4);
            }
        }
        
        this.ctx.globalAlpha = 1;
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
                case 'line':
                    this.ctx.fillRect(particle.x, particle.y, 15, 2);
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
    
    renderStar(x, y, size, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - size, y, size * 2, 1);
        this.ctx.fillRect(x, y - size, 1, size * 2);
        this.ctx.fillRect(x - size/2, y - size/2, size, 1);
        this.ctx.fillRect(x - size/2, y + size/2, size, 1);
    }
    
    renderUI() {
        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '48px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width/2, this.canvas.height/2);
            this.ctx.textAlign = 'left';
        }
        
        if (!this.gameRunning) {
            this.ctx.fillStyle = 'rgba(255,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '36px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width/2, this.canvas.height/2 - 20);
            this.ctx.font = '18px monospace';
            this.ctx.fillText('Press R to Restart', this.canvas.width/2, this.canvas.height/2 + 20);
            this.ctx.textAlign = 'left';
        }
    }
    
    resetCollectibles() {
        this.bananaItems.forEach(banana => banana.collected = false);
        this.enemies.forEach(enemy => {
            enemy.stunned = false;
            enemy.stunnedTimer = 0;
        });
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the retro enhanced game
new DonkeyKongCountryRetro();