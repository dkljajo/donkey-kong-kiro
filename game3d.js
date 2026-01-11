class DonkeyKong3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.donkeyKong = null;
        this.princess = null;
        this.platforms = [];
        this.barrels = [];
        this.particles = [];
        this.bananas = [];
        this.vines = [];
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameRunning = true;
        this.bananaCount = 0;
        this.currentCharacter = 'DK'; // DK or Diddy
        this.gameTime = 0;
        
        // Input
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        
        // Player physics
        this.playerVelocity = new THREE.Vector3();
        this.isOnGround = false;
        this.isRolling = false;
        this.rollCooldown = 0;
        this.isSwinging = false;
        this.currentVine = null;
        
        // Screen shake
        this.screenShake = { intensity: 0, duration: 0 };
        
        this.init();
    }
    
    updateLoading(step, progress) {
        const steps = [
            'Loading Three.js...',
            'Initializing 3D Scene...',
            'Creating World...',
            'Loading Characters...',
            'Setting up Physics...',
            'Ready to Play!'
        ];
        
        document.getElementById('loadingText').textContent = steps[step];
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('loadingPercent').textContent = Math.round(progress) + '%';
    }
    
    init() {
        // Fast loading with progress feedback
        this.updateLoading(0, 10);
        
        setTimeout(() => {
            this.updateLoading(1, 30);
            this.setupScene();
            
            setTimeout(() => {
                this.updateLoading(2, 50);
                this.setupLights();
                this.createWorld();
                
                setTimeout(() => {
                    this.updateLoading(3, 70);
                    this.createPlayer();
                    this.createEnemies();
                    
                    setTimeout(() => {
                        this.updateLoading(4, 90);
                        this.setupInput();
                        this.setupCamera();
                        
                        setTimeout(() => {
                            this.updateLoading(5, 100);
                            
                            // Hide loading screen
                            setTimeout(() => {
                                const loading = document.getElementById('loading');
                                loading.style.opacity = '0';
                                setTimeout(() => {
                                    loading.classList.add('hidden');
                                    this.animate();
                                }, 300);
                            }, 200);
                        }, 100);
                    }, 100);
                }, 100);
            }, 100);
        }, 100);
    }
    
    setupScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x1a1a2e, 50, 200);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 15, 25);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x1a1a2e);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Colored lights
        const pointLight1 = new THREE.PointLight(0xff6b35, 0.8, 30);
        pointLight1.position.set(-10, 10, 10);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0x35ff6b, 0.6, 25);
        pointLight2.position.set(10, 8, -10);
        this.scene.add(pointLight2);
    }
    
    createWorld() {
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2d5a27,
            transparent: true,
            opacity: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Create platforms
        this.createPlatforms();
        
        // Create ladders
        this.createLadders();
        
        // Background particles
        this.createBackground();
    }
    
    createPlatforms() {
        const platformData = [
            { x: 0, y: 0, z: 0, width: 40, depth: 2 },
            { x: 0, y: 5, z: -5, width: 30, depth: 2 },
            { x: 5, y: 10, z: -10, width: 25, depth: 2 },
            { x: -5, y: 15, z: -15, width: 20, depth: 2 },
            { x: 0, y: 20, z: -20, width: 15, depth: 2 }
        ];
        
        platformData.forEach(data => {
            const geometry = new THREE.BoxGeometry(data.width, 1, data.depth);
            const material = new THREE.MeshPhongMaterial({ 
                color: 0xff6b35,
                shininess: 30
            });
            const platform = new THREE.Mesh(geometry, material);
            platform.position.set(data.x, data.y, data.z);
            platform.castShadow = true;
            platform.receiveShadow = true;
            this.scene.add(platform);
            this.platforms.push({
                mesh: platform,
                bounds: {
                    minX: data.x - data.width/2,
                    maxX: data.x + data.width/2,
                    minZ: data.z - data.depth/2,
                    maxZ: data.z + data.depth/2,
                    y: data.y + 0.5
                }
            });
        });
    }
    
    createLadders() {
        const ladderPositions = [
            { x: 15, y: 2.5, z: -2.5 },
            { x: -10, y: 7.5, z: -7.5 },
            { x: 12, y: 12.5, z: -12.5 },
            { x: -8, y: 17.5, z: -17.5 }
        ];
        
        ladderPositions.forEach(pos => {
            const geometry = new THREE.BoxGeometry(0.5, 5, 0.2);
            const material = new THREE.MeshPhongMaterial({ color: 0xdaa520 });
            const ladder = new THREE.Mesh(geometry, material);
            ladder.position.set(pos.x, pos.y, pos.z);
            ladder.castShadow = true;
            this.scene.add(ladder);
            
            // Ladder rungs
            for (let i = 0; i < 5; i++) {
                const rungGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.1);
                const rung = new THREE.Mesh(rungGeometry, material);
                rung.position.set(pos.x, pos.y - 2 + i, pos.z);
                this.scene.add(rung);
            }
        });
    }
    
    createBackground() {
        // Simplified particles for faster loading
        const particleGeometry = new THREE.SphereGeometry(0.1, 6, 6);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.4
        });
        
        for (let i = 0; i < 50; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(
                (Math.random() - 0.5) * 100,
                Math.random() * 30,
                (Math.random() - 0.5) * 100
            );
            this.scene.add(particle);
            this.particles.push({
                mesh: particle,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.01,
                    (Math.random() - 0.5) * 0.01,
                    (Math.random() - 0.5) * 0.01
                )
            });
        }
    }
    
    createPlayer() {
        // Mario (simplified for faster loading)
        const playerGroup = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.BoxGeometry(1, 2, 0.8);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1;
        body.castShadow = true;
        playerGroup.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.6, 12, 12);
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.5;
        head.castShadow = true;
        playerGroup.add(head);
        
        // Hat
        const hatGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.3, 12);
        const hatMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const hat = new THREE.Mesh(hatGeometry, hatMaterial);
        hat.position.y = 3;
        hat.castShadow = true;
        playerGroup.add(hat);
        
        playerGroup.position.set(-15, 1, 0);
        this.scene.add(playerGroup);
        this.player = playerGroup;
    }
    
    createEnemies() {
        // Donkey Kong (simplified)
        const dkGroup = new THREE.Group();
        
        const dkBodyGeometry = new THREE.BoxGeometry(3, 4, 2);
        const dkBodyMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
        const dkBody = new THREE.Mesh(dkBodyGeometry, dkBodyMaterial);
        dkBody.position.y = 2;
        dkBody.castShadow = true;
        dkGroup.add(dkBody);
        
        const dkHeadGeometry = new THREE.SphereGeometry(1.5, 12, 12);
        const dkHead = new THREE.Mesh(dkHeadGeometry, dkBodyMaterial);
        dkHead.position.y = 5;
        dkHead.castShadow = true;
        dkGroup.add(dkHead);
        
        dkGroup.position.set(-10, 21, -20);
        this.scene.add(dkGroup);
        this.donkeyKong = dkGroup;
        
        // Princess (simplified)
        const princessGroup = new THREE.Group();
        
        const dressGeometry = new THREE.CylinderGeometry(0.8, 1.2, 2, 12);
        const dressMaterial = new THREE.MeshPhongMaterial({ color: 0xff69b4 });
        const dress = new THREE.Mesh(dressGeometry, dressMaterial);
        dress.position.y = 1;
        dress.castShadow = true;
        princessGroup.add(dress);
        
        const princessHeadGeometry = new THREE.SphereGeometry(0.5, 12, 12);
        const princessHeadMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });
        const princessHead = new THREE.Mesh(princessHeadGeometry, princessHeadMaterial);
        princessHead.position.y = 2.5;
        princessHead.castShadow = true;
        princessGroup.add(princessHead);
        
        princessGroup.position.set(5, 21, -20);
        this.scene.add(princessGroup);
        this.princess = princessGroup;
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
    }
    
    setupCamera() {
        this.cameraOffset = new THREE.Vector3(0, 8, 15);
    }
    
    spawnBarrel() {
        const barrelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
        const barrelMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8b4513,
            shininess: 10
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        
        barrel.position.copy(this.donkeyKong.position);
        barrel.position.y -= 2;
        barrel.castShadow = true;
        
        this.scene.add(barrel);
        this.barrels.push({
            mesh: barrel,
            velocity: new THREE.Vector3(0.1, 0, 0.1),
            life: 300
        });
    }
    
    updatePlayer() {
        const moveSpeed = 0.2;
        const jumpPower = 0.3;
        
        // Movement
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.playerVelocity.z -= moveSpeed;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.playerVelocity.z += moveSpeed;
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.playerVelocity.x -= moveSpeed;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.playerVelocity.x += moveSpeed;
        }
        
        // Jumping
        if (this.keys['Space'] && this.isOnGround) {
            this.playerVelocity.y = jumpPower;
            this.isOnGround = false;
        }
        
        // Apply gravity
        this.playerVelocity.y -= 0.01;
        
        // Apply friction
        this.playerVelocity.x *= 0.9;
        this.playerVelocity.z *= 0.9;
        
        // Update position
        this.player.position.add(this.playerVelocity);
        
        // Platform collision
        this.isOnGround = false;
        for (let platform of this.platforms) {
            const bounds = platform.bounds;
            if (this.player.position.x > bounds.minX && this.player.position.x < bounds.maxX &&
                this.player.position.z > bounds.minZ && this.player.position.z < bounds.maxZ &&
                this.player.position.y <= bounds.y + 1 && this.player.position.y >= bounds.y - 1) {
                
                this.player.position.y = bounds.y;
                this.playerVelocity.y = 0;
                this.isOnGround = true;
                break;
            }
        }
        
        // Bounds checking
        if (this.player.position.y < -10) {
            this.resetPlayer();
        }
    }
    
    updateCamera() {
        // Smooth camera follow
        const targetPosition = this.player.position.clone().add(this.cameraOffset);
        this.camera.position.lerp(targetPosition, 0.05);
        this.camera.lookAt(this.player.position);
        
        // Mouse look
        this.camera.position.x += this.mouse.x * 2;
        this.camera.position.y += this.mouse.y * 2;
    }
    
    updateBarrels() {
        for (let i = this.barrels.length - 1; i >= 0; i--) {
            const barrel = this.barrels[i];
            
            barrel.velocity.y -= 0.01;
            barrel.mesh.position.add(barrel.velocity);
            barrel.mesh.rotation.x += 0.1;
            
            // Platform collision
            for (let platform of this.platforms) {
                const bounds = platform.bounds;
                if (barrel.mesh.position.x > bounds.minX && barrel.mesh.position.x < bounds.maxX &&
                    barrel.mesh.position.z > bounds.minZ && barrel.mesh.position.z < bounds.maxZ &&
                    barrel.mesh.position.y <= bounds.y + 1 && barrel.mesh.position.y >= bounds.y - 1) {
                    
                    barrel.mesh.position.y = bounds.y;
                    barrel.velocity.y = 0;
                    break;
                }
            }
            
            barrel.life--;
            if (barrel.life <= 0 || barrel.mesh.position.y < -10) {
                this.scene.remove(barrel.mesh);
                this.barrels.splice(i, 1);
            }
        }
    }
    
    updateParticles() {
        this.particles.forEach(particle => {
            particle.mesh.position.add(particle.velocity);
            
            // Wrap around
            if (particle.mesh.position.x > 50) particle.mesh.position.x = -50;
            if (particle.mesh.position.x < -50) particle.mesh.position.x = 50;
            if (particle.mesh.position.y > 30) particle.mesh.position.y = 0;
            if (particle.mesh.position.z > 50) particle.mesh.position.z = -50;
            if (particle.mesh.position.z < -50) particle.mesh.position.z = 50;
        });
    }
    
    checkCollisions() {
        // Player vs barrels
        this.barrels.forEach(barrel => {
            const distance = this.player.position.distanceTo(barrel.mesh.position);
            if (distance < 2) {
                this.lives--;
                this.updateUI();
                this.resetPlayer();
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
            }
        });
        
        // Player vs princess
        const distanceToPrincess = this.player.position.distanceTo(this.princess.position);
        if (distanceToPrincess < 3) {
            this.score += 1000;
            this.level++;
            this.updateUI();
            this.resetLevel();
        }
    }
    
    resetPlayer() {
        this.player.position.set(-15, 1, 0);
        this.playerVelocity.set(0, 0, 0);
    }
    
    resetLevel() {
        this.resetPlayer();
        this.barrels.forEach(barrel => this.scene.remove(barrel.mesh));
        this.barrels = [];
    }
    
    gameOver() {
        this.gameRunning = false;
        alert(`Game Over! Final Score: ${this.score}`);
        location.reload();
    }
    
    updateUI() {
        document.getElementById('score').textContent = `Score: ${this.score}`;
        document.getElementById('lives').textContent = `Lives: ${this.lives}`;
        document.getElementById('level').textContent = `Level: ${this.level}`;
    }
    
    animate() {
        if (!this.gameRunning) return;
        
        requestAnimationFrame(() => this.animate());
        
        // Update game objects
        this.updatePlayer();
        this.updateCamera();
        this.updateBarrels();
        this.updateParticles();
        this.checkCollisions();
        
        // Spawn barrels occasionally
        if (Math.random() < 0.008) {
            this.spawnBarrel();
        }
        
        // Animate characters
        this.donkeyKong.rotation.y += 0.01;
        this.princess.position.y += Math.sin(Date.now() * 0.003) * 0.005;
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game
window.addEventListener('load', () => {
    new DonkeyKong3D();
});