class DonkeyKongGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameRunning = true;
        
        // Player (Mario)
        this.player = {
            x: 20,
            y: 250,
            width: 12,
            height: 16,
            velocityX: 0,
            velocityY: 0,
            onGround: false,
            speed: 2,
            jumpPower: 8
        };
        
        // Donkey Kong
        this.donkeyKong = {
            x: 50,
            y: 30,
            width: 24,
            height: 24
        };
        
        // Princess
        this.princess = {
            x: 360,
            y: 30,
            width: 12,
            height: 16
        };
        
        // Platforms
        this.platforms = [
            // Bottom
            { x: 0, y: 270, width: 400, height: 30 },
            // Level 1
            { x: 60, y: 220, width: 280, height: 10 },
            // Level 2
            { x: 40, y: 170, width: 320, height: 10 },
            // Level 3
            { x: 60, y: 120, width: 280, height: 10 },
            // Top
            { x: 320, y: 70, width: 80, height: 10 }
        ];
        
        // Ladders
        this.ladders = [
            { x: 100, y: 220, width: 8, height: 50 },
            { x: 300, y: 170, width: 8, height: 50 },
            { x: 120, y: 120, width: 8, height: 50 },
            { x: 280, y: 70, width: 8, height: 50 }
        ];
        
        // Barrels
        this.barrels = [];
        this.barrelTimer = 0;
        
        // Input
        this.keys = {};
        this.setupInput();
        
        // Start game
        this.gameLoop();
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    spawnBarrel() {
        this.barrels.push({
            x: this.donkeyKong.x + 12,
            y: this.donkeyKong.y + 24,
            width: 8,
            height: 8,
            velocityX: 1,
            velocityY: 0
        });
    }
    
    update() {
        if (!this.gameRunning) return;
        
        // Handle input
        this.handleInput();
        
        // Update player
        this.updatePlayer();
        
        // Spawn barrels
        this.barrelTimer++;
        if (this.barrelTimer > 180) { // Every 3 seconds
            this.spawnBarrel();
            this.barrelTimer = 0;
        }
        
        // Update barrels
        this.updateBarrels();
        
        // Check collisions
        this.checkCollisions();
        
        // Check win condition
        this.checkWin();
    }
    
    handleInput() {
        // Horizontal movement
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.velocityX = -this.player.speed;
        } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.velocityX = this.player.speed;
        } else {
            this.player.velocityX = 0;
        }
        
        // Jumping
        if ((this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW']) && this.player.onGround) {
            this.player.velocityY = -this.player.jumpPower;
            this.player.onGround = false;
        }
        
        // Ladder climbing
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.handleLadderClimbing(-1);
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.handleLadderClimbing(1);
        }
    }
    
    handleLadderClimbing(direction) {
        for (let ladder of this.ladders) {
            if (this.player.x + this.player.width > ladder.x &&
                this.player.x < ladder.x + ladder.width &&
                this.player.y + this.player.height > ladder.y &&
                this.player.y < ladder.y + ladder.height) {
                
                this.player.y += direction * 1.5;
                this.player.velocityY = 0;
                break;
            }
        }
    }
    
    updatePlayer() {
        // Apply gravity
        this.player.velocityY += 0.4;
        
        // Update position
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;
        
        // Keep in bounds
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.canvas.width) {
            this.player.x = this.canvas.width - this.player.width;
        }
        
        // Platform collision
        this.player.onGround = false;
        for (let platform of this.platforms) {
            if (this.player.x + this.player.width > platform.x &&
                this.player.x < platform.x + platform.width &&
                this.player.y + this.player.height > platform.y &&
                this.player.y + this.player.height < platform.y + platform.height + 10 &&
                this.player.velocityY >= 0) {
                
                this.player.y = platform.y - this.player.height;
                this.player.velocityY = 0;
                this.player.onGround = true;
                break;
            }
        }
        
        // Death if falling
        if (this.player.y > this.canvas.height) {
            this.lives--;
            if (this.lives <= 0) {
                this.gameOver();
            } else {
                this.resetPlayer();
            }
        }
    }
    
    updateBarrels() {
        for (let i = this.barrels.length - 1; i >= 0; i--) {
            let barrel = this.barrels[i];
            
            // Apply gravity
            barrel.velocityY += 0.3;
            
            // Update position
            barrel.x += barrel.velocityX;
            barrel.y += barrel.velocityY;
            
            // Platform collision
            for (let platform of this.platforms) {
                if (barrel.x + barrel.width > platform.x &&
                    barrel.x < platform.x + platform.width &&
                    barrel.y + barrel.height > platform.y &&
                    barrel.y + barrel.height < platform.y + platform.height + 10 &&
                    barrel.velocityY >= 0) {
                    
                    barrel.y = platform.y - barrel.height;
                    barrel.velocityY = 0;
                    break;
                }
            }
            
            // Remove if off screen
            if (barrel.y > this.canvas.height || barrel.x > this.canvas.width) {
                this.barrels.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        // Player vs barrels
        for (let barrel of this.barrels) {
            if (this.player.x + this.player.width > barrel.x &&
                this.player.x < barrel.x + barrel.width &&
                this.player.y + this.player.height > barrel.y &&
                this.player.y < barrel.y + barrel.height) {
                
                this.lives--;
                if (this.lives <= 0) {
                    this.gameOver();
                } else {
                    this.resetPlayer();
                }
                return;
            }
        }
    }
    
    checkWin() {
        // Check if player reached princess
        if (this.player.x + this.player.width > this.princess.x &&
            this.player.x < this.princess.x + this.princess.width &&
            this.player.y + this.player.height > this.princess.y &&
            this.player.y < this.princess.y + this.princess.height) {
            
            this.score += 1000;
            this.level++;
            this.resetLevel();
        }
    }
    
    resetPlayer() {
        this.player.x = 20;
        this.player.y = 250;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
    }
    
    resetLevel() {
        this.resetPlayer();
        this.barrels = [];
        this.barrelTimer = 0;
    }
    
    gameOver() {
        this.gameRunning = false;
    }
    
    updateScore() {
        this.scoreElement.textContent = `SCORE: ${this.score} | LIVES: ${this.lives}`;
    }
    
    render() {
        // Clear screen with Game Boy green
        this.ctx.fillStyle = '#9bbc0f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.gameRunning) {
            this.ctx.fillStyle = '#0f380f';
            this.ctx.font = '16px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.fillText('Press F5 to restart', this.canvas.width / 2, this.canvas.height / 2 + 30);
            return;
        }
        
        // Draw platforms
        this.ctx.fillStyle = '#0f380f';
        for (let platform of this.platforms) {
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }
        
        // Draw ladders
        this.ctx.fillStyle = '#8bac0f';
        for (let ladder of this.ladders) {
            this.ctx.fillRect(ladder.x, ladder.y, ladder.width, ladder.height);
            // Ladder rungs
            this.ctx.fillStyle = '#0f380f';
            for (let i = 0; i < ladder.height; i += 8) {
                this.ctx.fillRect(ladder.x, ladder.y + i, ladder.width, 2);
            }
            this.ctx.fillStyle = '#8bac0f';
        }
        
        // Draw Donkey Kong
        this.ctx.fillStyle = '#306230';
        this.ctx.fillRect(this.donkeyKong.x, this.donkeyKong.y, this.donkeyKong.width, this.donkeyKong.height);
        // Eyes
        this.ctx.fillStyle = '#0f380f';
        this.ctx.fillRect(this.donkeyKong.x + 4, this.donkeyKong.y + 4, 3, 3);
        this.ctx.fillRect(this.donkeyKong.x + 17, this.donkeyKong.y + 4, 3, 3);
        
        // Draw Princess
        this.ctx.fillStyle = '#8bac0f';
        this.ctx.fillRect(this.princess.x, this.princess.y, this.princess.width, this.princess.height);
        // Hair
        this.ctx.fillStyle = '#306230';
        this.ctx.fillRect(this.princess.x, this.princess.y, this.princess.width, 4);
        
        // Draw Mario
        this.ctx.fillStyle = '#0f380f';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        // Hat
        this.ctx.fillStyle = '#306230';
        this.ctx.fillRect(this.player.x + 2, this.player.y, 8, 4);
        
        // Draw barrels
        this.ctx.fillStyle = '#306230';
        for (let barrel of this.barrels) {
            this.ctx.fillRect(barrel.x, barrel.y, barrel.width, barrel.height);
        }
        
        // Update score
        this.updateScore();
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start game
window.addEventListener('load', () => {
    new DonkeyKongGame();
});