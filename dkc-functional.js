class FunctionalDKC {
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
        this.gameState = 'playing'; // Start directly in game
        this.currentLevel = 1;
        this.score = 0;
        this.bananas = 0;
        this.lives = 3;
        this.gameRunning = true;
        this.camera = { x: 0, y: 0, shake: 0 };
        this.startTime = Date.now();
        this.currentCharacter = 'dk';
        
        // Simple but effective player
        this.player = {
            x: 100,
            y: 300,
            width: 32,
            height: 40,
            velocityX: 0,
            velocityY: 0,
            onGround: false,
            speed: 4,
            jumpPower: 14,
            direction: 1,
            animFrame: 0,
            animTimer: 0,
            rolling: false,
            rollTimer: 0,
            groundPounding: false
        };
        
        // Level width
        this.levelWidth = 2400;
        
        // Solid platforms
        this.platforms = [
            // Ground
            { x: 0, y: 400, width: 2400, height: 80, type: 'ground' },
            // Platforms
            { x: 300, y: 320, width: 120, height: 20, type: 'platform' },
            { x: 500, y: 250, width: 100, height: 20, type: 'platform' },
            { x: 700, y: 180, width: 120, height: 20, type: 'platform' },
            { x: 900, y: 300, width: 150, height: 20, type: 'platform' },
            { x: 1200, y: 220, width: 100, height: 20, type: 'platform' },
            { x: 1400, y: 350, width: 120, height: 20, type: 'platform' },
            { x: 1600, y: 280, width: 100, height: 20, type: 'platform' },
            { x: 1800, y: 200, width: 150, height: 20, type: 'platform' },
            { x: 2000, y: 320, width: 120, height: 20, type: 'platform' }
        ];
        
        // Simple enemies
        this.enemies = [
            { x: 400, y: 360, width: 24, height: 30, velocityX: -1, direction: -1, alive: true },
            { x: 800, y: 360, width: 24, height: 30, velocityX: 1, direction: 1, alive: true },
            { x: 1300, y: 360, width: 24, height: 30, velocityX: -1, direction: -1, alive: true },
            { x: 1700, y: 360, width: 24, height: 30, velocityX: 1, direction: 1, alive: true }
        ];
        
        // Bananas
        this.bananaItems = [
            { x: 350, y: 280, width: 16, height: 16, collected: false },
            { x: 520, y: 210, width: 16, height: 16, collected: false },
            { x: 720, y: 140, width: 16, height: 16, collected: false },
            { x: 950, y: 260, width: 16, height: 16, collected: false },
            { x: 1220, y: 180, width: 16, height: 16, collected: false },
            { x: 1420, y: 310, width: 16, height: 16, collected: false },
            { x: 1620, y: 240, width: 16, height: 16, collected: false },
            { x: 1850, y: 160, width: 16, height: 16, collected: false },
            { x: 2050, y: 280, width: 16, height: 16, collected: false }
        ];
        
        // Particles for effects
        this.particles = [];
        
        // Audio
        this.initAudio();
        
        // Input
        this.keys = {};
        this.setupInput();
        
        // Hide world map initially
        this.worldMapCanvas.style.display = 'none';
        
        // Start game loop
        this.gameLoop();
        
        // Update HUD
        this.updateHUD();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
        
        // Audio controls
        document.getElementById('musicToggle').addEventListener('click', () => {
            // Toggle music (placeholder)
            this.showAchievement('Music toggled!');
        });
        
        document.getElementById('crtToggle').addEventListener('click', () => {
            this.canvas.classList.toggle('crt-filter');
            this.showAchievement('CRT filter toggled!');
        });
    }
    
    update() {
        if (!this.gameRunning) return;
        
        this.handleInput();
        this.updatePlayer();
        this.updateEnemies();
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
        if (this.keys['KeyC']) {
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
                this.player.velocityX *= 0.8; // Friction
            }
            
            // Jumping
            if (this.keys['Space'] && this.player.onGround) {
                this.player.velocityY = -this.player.jumpPower;
                this.player.onGround = false;
                this.playSound(300, 0.2);
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
        }
        
        // Apply gravity
        if (!this.player.groundPounding) {
            this.player.velocityY += 0.6;
        }
        
        // Update position
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;
        
        // Keep player in bounds
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
        
        // Death if falling off screen
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
            if (!enemy.alive) continue;
            
            enemy.x += enemy.velocityX;
            
            // Simple AI - turn around at platform edges or walls
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
            
            // Turn around if reaching platform edge or hitting boundaries
            if (!onPlatform || enemy.x <= 0 || enemy.x >= this.levelWidth - enemy.width) {
                enemy.velocityX *= -1;
                enemy.direction *= -1;
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
        // Follow player with smooth camera
        let targetX = this.player.x - this.canvas.width / 2;
        targetX = Math.max(0, Math.min(targetX, this.levelWidth - this.canvas.width));
        
        this.camera.x += (targetX - this.camera.x) * 0.1;
        
        // Add screen shake
        if (this.camera.shake > 0) {
            this.camera.x += (Math.random() - 0.5) * this.camera.shake;
            this.camera.y += (Math.random() - 0.5) * this.camera.shake;
        }
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
                this.score += 100;
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
            }
        }
        
        // Player vs enemies
        for (let enemy of this.enemies) {
            if (!enemy.alive) continue;
            
            if (this.player.x + this.player.width > enemy.x &&
                this.player.x < enemy.x + enemy.width &&
                this.player.y + this.player.height > enemy.y &&
                this.player.y < enemy.y + enemy.height) {
                
                // Check if player is jumping on enemy or rolling
                if (this.player.rolling || 
                    (this.player.velocityY > 0 && this.player.y < enemy.y - 10)) {
                    
                    // Defeat enemy
                    enemy.alive = false;
                    this.score += 200;
                    this.playSound(400, 0.3);
                    this.camera.shake = 5;
                    
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
                    
                    this.updateHUD();
                } else {
                    // Player hit by enemy
                    this.loseLife();
                }
            }
        }
    }
    
    checkWinCondition() {
        // Win if player reaches the end of the level
        if (this.player.x >= this.levelWidth - 100) {
            this.score += 1000;
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
            // Respawn player
            this.player.x = 100;
            this.player.y = 300;
            this.player.velocityX = 0;
            this.player.velocityY = 0;
            this.player.rolling = false;
            this.player.groundPounding = false;
        }
    }
    
    gameWin() {
        this.gameRunning = false;
        this.showAchievement('Level Complete!');
        
        setTimeout(() => {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.font = '48px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('LEVEL COMPLETE!', this.canvas.width / 2, this.canvas.height / 2 - 30);
            
            this.ctx.fillStyle = '#2ecc71';
            this.ctx.font = '24px Courier New';
            this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
            this.ctx.fillText('Press F5 to play again', this.canvas.width / 2, this.canvas.height / 2 + 60);
        }, 2000);
    }
    
    gameOver() {
        this.gameRunning = false;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
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
    
    switchCharacter() {
        this.currentCharacter = this.currentCharacter === 'dk' ? 'diddy' : 'dk';
        
        // Adjust player stats based on character
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
        
        // Update lives display
        this.livesElement.innerHTML = '';
        for (let i = 0; i < this.lives; i++) {
            const lifeIcon = document.createElement('div');
            lifeIcon.className = 'life-icon';
            this.livesElement.appendChild(lifeIcon);
        }
    }
    
    render() {
        // Clear canvas with simple sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#98FB98');
        gradient.addColorStop(1, '#90EE90');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context for camera transform
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Draw simple background elements
        this.drawBackground();
        
        // Draw platforms
        this.drawPlatforms();
        
        // Draw bananas
        this.drawBananas();
        
        // Draw enemies
        this.drawEnemies();
        
        // Draw player
        this.drawPlayer();
        
        // Draw particles
        this.drawParticles();
        
        // Restore context
        this.ctx.restore();
    }
    
    drawBackground() {
        // Simple background trees
        for (let i = 0; i < 20; i++) {
            const treeX = i * 120 + 50;
            const treeY = 200 + Math.random() * 100;
            
            if (treeX > this.camera.x - 100 && treeX < this.camera.x + this.canvas.width + 100) {
                // Tree trunk
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(treeX, treeY, 12, 80);
                
                // Tree canopy
                this.ctx.fillStyle = '#228B22';
                this.ctx.beginPath();
                this.ctx.arc(treeX + 6, treeY - 10, 25, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Tree highlight
                this.ctx.fillStyle = '#32CD32';
                this.ctx.beginPath();
                this.ctx.arc(treeX + 2, treeY - 15, 12, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    drawPlatforms() {
        for (let platform of this.platforms) {
            if (platform.x + platform.width > this.camera.x - 50 && 
                platform.x < this.camera.x + this.canvas.width + 50) {
                
                if (platform.type === 'ground') {
                    // Ground with grass texture
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    
                    // Grass layer
                    this.ctx.fillStyle = '#228B22';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, 8);
                    
                    // Grass details
                    this.ctx.fillStyle = '#32CD32';
                    for (let i = 0; i < platform.width; i += 10) {
                        this.ctx.fillRect(platform.x + i, platform.y - 2, 2, 6);
                    }
                } else {
                    // Wooden platform
                    this.ctx.fillStyle = '#DEB887';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    
                    // Wood grain
                    this.ctx.fillStyle = '#8B7355';
                    for (let i = 0; i < platform.width; i += 20) {
                        this.ctx.fillRect(platform.x + i, platform.y, 2, platform.height);
                    }
                    
                    // Platform edge highlight
                    this.ctx.fillStyle = '#F5DEB3';
                    this.ctx.fillRect(platform.x, platform.y, platform.width, 2);
                }
            }
        }
    }
    
    drawBananas() {
        for (let banana of this.bananaItems) {
            if (!banana.collected && 
                banana.x > this.camera.x - 50 && 
                banana.x < this.camera.x + this.canvas.width + 50) {
                
                // Banana body
                this.ctx.fillStyle = '#FFD700';
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
    
    drawEnemies() {
        for (let enemy of this.enemies) {
            if (!enemy.alive) continue;
            
            if (enemy.x > this.camera.x - 50 && 
                enemy.x < this.camera.x + this.canvas.width + 50) {
                
                // Kremling body
                this.ctx.fillStyle = '#228B22';
                this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                
                // Body highlight
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.fillRect(enemy.x + 1, enemy.y + 1, enemy.width - 2, 3);
                
                // Kremling belly
                this.ctx.fillStyle = '#90EE90';
                this.ctx.fillRect(enemy.x + 4, enemy.y + 8, enemy.width - 8, enemy.height - 12);
                
                // Eyes
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(enemy.x + 6, enemy.y + 4, 4, 4);
                this.ctx.fillRect(enemy.x + 14, enemy.y + 4, 4, 4);
                
                // Pupils
                this.ctx.fillStyle = '#FF0000';
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
                
                // Spikes on back
                this.ctx.fillStyle = '#228B22';
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
    
    drawPlayer() {
        if (this.player.rolling) {
            // Rolling animation
            const color = this.currentCharacter === 'dk' ? '#8B4513' : '#CD853F';
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x + this.player.width/2, 
                       this.player.y + this.player.height/2, 
                       this.player.width/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Rolling motion lines
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI / 2) + (Date.now() * 0.01);
                const x = this.player.x + this.player.width/2 + Math.cos(angle) * (this.player.width/3);
                const y = this.player.y + this.player.height/2 + Math.sin(angle) * (this.player.width/3);
                this.ctx.fillRect(x - 1, y - 1, 2, 2);
            }
            return;
        }
        
        if (this.currentCharacter === 'dk') {
            this.drawDonkeyKong();
        } else {
            this.drawDiddyKong();
        }
    }
    
    drawDonkeyKong() {
        // DK body
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Body highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(this.player.x + 2, this.player.y + 2, this.player.width - 4, 4);
        
        // Chest
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(this.player.x + 6, this.player.y + 12, this.player.width - 12, 16);
        
        // Face
        this.ctx.fillStyle = '#F4A460';
        this.ctx.fillRect(this.player.x + 4, this.player.y + 2, this.player.width - 8, 14);
        
        // Eyes
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(this.player.x + 8, this.player.y + 6, 6, 4);
        this.ctx.fillRect(this.player.x + 18, this.player.y + 6, 6, 4);
        
        // Pupils
        this.ctx.fillStyle = '#000000';
        if (this.player.direction === 1) {
            this.ctx.fillRect(this.player.x + 11, this.player.y + 7, 2, 2);
            this.ctx.fillRect(this.player.x + 21, this.player.y + 7, 2, 2);
        } else {
            this.ctx.fillRect(this.player.x + 9, this.player.y + 7, 2, 2);
            this.ctx.fillRect(this.player.x + 19, this.player.y + 7, 2, 2);
        }
        
        // Nose
        this.ctx.fillStyle = '#CD853F';
        this.ctx.fillRect(this.player.x + 14, this.player.y + 10, 4, 2);
        
        // Red tie
        this.ctx.fillStyle = '#DC143C';
        this.ctx.fillRect(this.player.x + 12, this.player.y + 16, 8, 12);
        
        // DK logo on tie
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(this.player.x + 14, this.player.y + 20, 4, 2);
        
        // Arms (simple)
        this.ctx.fillStyle = '#8B4513';
        if (Math.abs(this.player.velocityX) > 0.1) {
            // Walking arms
            const armOffset = Math.sin(Date.now() * 0.01) * 2;
            this.ctx.fillRect(this.player.x - 4 + armOffset, this.player.y + 12, 6, 16);
            this.ctx.fillRect(this.player.x + this.player.width - 2 - armOffset, this.player.y + 12, 6, 16);
        } else {
            // Idle arms
            this.ctx.fillRect(this.player.x - 2, this.player.y + 12, 6, 16);
            this.ctx.fillRect(this.player.x + this.player.width - 4, this.player.y + 12, 6, 16);
        }
    }
    
    drawDiddyKong() {
        // Diddy body (smaller, lighter brown)
        this.ctx.fillStyle = '#CD853F';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Body highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(this.player.x + 1, this.player.y + 1, this.player.width - 2, 3);
        
        // Red shirt
        this.ctx.fillStyle = '#DC143C';
        this.ctx.fillRect(this.player.x + 3, this.player.y + 12, this.player.width - 6, 12);
        
        // Face
        this.ctx.fillStyle = '#F4A460';
        this.ctx.fillRect(this.player.x + 2, this.player.y + 2, this.player.width - 4, 10);
        
        // Red cap
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, 8);
        
        // Cap logo
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(this.player.x + 10, this.player.y + 2, 4, 2);
        
        // Eyes
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(this.player.x + 6, this.player.y + 5, 4, 3);
        this.ctx.fillRect(this.player.x + 14, this.player.y + 5, 4, 3);
        
        // Pupils
        this.ctx.fillStyle = '#000000';
        if (this.player.direction === 1) {
            this.ctx.fillRect(this.player.x + 8, this.player.y + 6, 1, 1);
            this.ctx.fillRect(this.player.x + 16, this.player.y + 6, 1, 1);
        } else {
            this.ctx.fillRect(this.player.x + 7, this.player.y + 6, 1, 1);
            this.ctx.fillRect(this.player.x + 15, this.player.y + 6, 1, 1);
        }
        
        // Tail
        this.ctx.fillStyle = '#CD853F';
        const tailSway = Math.sin(Date.now() * 0.008) * 2;
        this.ctx.fillRect(this.player.x + this.player.width - 2 + tailSway, 
                         this.player.y + 16, 4, 8);
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

// Start the functional game
window.addEventListener('load', () => {
    new FunctionalDKC();
});