class AchievementSystem {
    constructor() {
        this.achievements = {
            firstJump: { name: "First Steps", description: "Make your first jump", unlocked: false, icon: "🦘" },
            barrel100: { name: "Barrel Jumper", description: "Jump over 100 barrels", unlocked: false, icon: "🛢️", progress: 0, target: 100 },
            speedRun: { name: "Speed Demon", description: "Complete stage in under 60 seconds", unlocked: false, icon: "⚡" },
            perfectStage: { name: "Perfectionist", description: "Complete stage without taking damage", unlocked: false, icon: "💎" },
            hammerTime: { name: "Hammer Time", description: "Destroy 50 barrels with hammer", unlocked: false, icon: "🔨", progress: 0, target: 50 },
            highScore: { name: "High Scorer", description: "Reach 50,000 points", unlocked: false, icon: "🏆", progress: 0, target: 50000 },
            allStages: { name: "Stage Master", description: "Complete all 3 stages", unlocked: false, icon: "🎯", progress: 0, target: 3 },
            noDeaths: { name: "Immortal", description: "Play for 10 minutes without dying", unlocked: false, icon: "👑" }
        };
        
        this.loadAchievements();
        this.createAchievementUI();
    }
    
    loadAchievements() {
        const saved = localStorage.getItem('donkeyKongAchievements');
        if (saved) {
            const savedAchievements = JSON.parse(saved);
            Object.keys(savedAchievements).forEach(key => {
                if (this.achievements[key]) {
                    this.achievements[key] = { ...this.achievements[key], ...savedAchievements[key] };
                }
            });
        }
    }
    
    saveAchievements() {
        localStorage.setItem('donkeyKongAchievements', JSON.stringify(this.achievements));
    }
    
    unlock(achievementId, progress = null) {
        const achievement = this.achievements[achievementId];
        if (!achievement) return;
        
        if (progress !== null && achievement.target) {
            achievement.progress = Math.min(progress, achievement.target);
            if (achievement.progress >= achievement.target && !achievement.unlocked) {
                achievement.unlocked = true;
                this.showAchievementNotification(achievement);
            }
        } else if (!achievement.unlocked) {
            achievement.unlocked = true;
            this.showAchievementNotification(achievement);
        }
        
        this.saveAchievements();
        this.updateAchievementUI();
    }
    
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <span class="achievement-icon">${achievement.icon}</span>
                <div>
                    <div class="achievement-title">Achievement Unlocked!</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.description}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    createAchievementUI() {
        const style = document.createElement('style');
        style.textContent = `
            .achievement-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #FFD700, #FFA500);
                border: 2px solid #FF8C00;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                transform: translateX(400px);
                transition: transform 0.3s ease;
                z-index: 1000;
                max-width: 300px;
            }
            
            .achievement-notification.show {
                transform: translateX(0);
            }
            
            .achievement-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .achievement-icon {
                font-size: 24px;
            }
            
            .achievement-title {
                font-weight: bold;
                color: #8B4513;
                font-size: 12px;
            }
            
            .achievement-name {
                font-weight: bold;
                color: #000;
                font-size: 14px;
            }
            
            .achievement-desc {
                color: #333;
                font-size: 11px;
            }
            
            .achievements-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #c0c0c0;
                border: 2px outset #c0c0c0;
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
                display: none;
                z-index: 1001;
            }
            
            .achievement-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px;
                margin: 4px 0;
                background: #f0f0f0;
                border: 1px inset #c0c0c0;
            }
            
            .achievement-item.unlocked {
                background: #e6ffe6;
            }
            
            .progress-bar {
                width: 100px;
                height: 8px;
                background: #ddd;
                border: 1px inset #c0c0c0;
                margin-top: 4px;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #00ff00, #008000);
                transition: width 0.3s ease;
            }
        `;
        document.head.appendChild(style);
        
        // Add achievements button to title bar
        const achievementsBtn = document.createElement('button');
        achievementsBtn.textContent = '🏆';
        achievementsBtn.style.cssText = 'background: #c0c0c0; border: 1px outset #c0c0c0; margin-left: 10px; cursor: pointer;';
        achievementsBtn.onclick = () => this.showAchievementsPanel();
        document.getElementById('titleBar').appendChild(achievementsBtn);
    }
    
    showAchievementsPanel() {
        let panel = document.querySelector('.achievements-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.className = 'achievements-panel';
            document.body.appendChild(panel);
        }
        
        panel.innerHTML = `
            <h3>🏆 Achievements</h3>
            ${Object.entries(this.achievements).map(([id, achievement]) => `
                <div class="achievement-item ${achievement.unlocked ? 'unlocked' : ''}">
                    <span style="font-size: 20px; opacity: ${achievement.unlocked ? 1 : 0.3}">${achievement.icon}</span>
                    <div style="flex: 1;">
                        <div style="font-weight: bold;">${achievement.name}</div>
                        <div style="font-size: 11px; color: #666;">${achievement.description}</div>
                        ${achievement.target ? `
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${(achievement.progress / achievement.target) * 100}%"></div>
                            </div>
                            <div style="font-size: 10px;">${achievement.progress}/${achievement.target}</div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
            <button onclick="this.parentElement.style.display='none'" style="margin-top: 10px; padding: 5px 15px;">Close</button>
        `;
        
        panel.style.display = 'block';
    }
    
    updateAchievementUI() {
        const panel = document.querySelector('.achievements-panel');
        if (panel && panel.style.display === 'block') {
            this.showAchievementsPanel();
        }
    }
}

// Export for use in main game
window.AchievementSystem = AchievementSystem;