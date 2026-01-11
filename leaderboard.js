class LocalLeaderboard {
    constructor() {
        this.scores = this.loadScores();
        this.createLeaderboardUI();
    }
    
    loadScores() {
        const saved = localStorage.getItem('donkeyKongLeaderboard');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveScores() {
        localStorage.setItem('donkeyKongLeaderboard', JSON.stringify(this.scores));
    }
    
    addScore(playerName, score, level, stage) {
        const newScore = {
            playerName: playerName || 'Anonymous',
            score: score,
            level: level,
            stage: stage,
            date: new Date().toLocaleDateString(),
            timestamp: Date.now()
        };
        
        this.scores.push(newScore);
        this.scores.sort((a, b) => b.score - a.score);
        this.scores = this.scores.slice(0, 50); // Keep top 50
        
        this.saveScores();
        this.updateLeaderboardUI();
        
        return this.getPlayerRank(score);
    }
    
    getPlayerRank(score) {
        return this.scores.findIndex(s => s.score === score) + 1;
    }
    
    getTopScores(limit = 10) {
        return this.scores.slice(0, limit);
    }
    
    createLeaderboardUI() {
        const style = document.createElement('style');
        style.textContent = `
            .leaderboard-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #c0c0c0;
                border: 2px outset #c0c0c0;
                padding: 20px;
                max-height: 500px;
                width: 400px;
                overflow-y: auto;
                display: none;
                z-index: 1001;
            }
            
            .leaderboard-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            
            .leaderboard-table th,
            .leaderboard-table td {
                padding: 6px;
                text-align: left;
                border-bottom: 1px solid #999;
                font-size: 11px;
            }
            
            .leaderboard-table th {
                background: #999;
                color: white;
                font-weight: bold;
            }
            
            .leaderboard-table tr:nth-child(even) {
                background: #f0f0f0;
            }
            
            .rank-1 { color: #FFD700; font-weight: bold; }
            .rank-2 { color: #C0C0C0; font-weight: bold; }
            .rank-3 { color: #CD7F32; font-weight: bold; }
            
            .score-input-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #c0c0c0;
                border: 2px outset #c0c0c0;
                padding: 20px;
                display: none;
                z-index: 1002;
            }
        `;
        document.head.appendChild(style);
        
        // Add leaderboard button to title bar
        const leaderboardBtn = document.createElement('button');
        leaderboardBtn.textContent = '📊';
        leaderboardBtn.style.cssText = 'background: #c0c0c0; border: 1px outset #c0c0c0; margin-left: 5px; cursor: pointer;';
        leaderboardBtn.onclick = () => this.showLeaderboard();
        document.getElementById('titleBar').appendChild(leaderboardBtn);
    }
    
    showLeaderboard() {
        let panel = document.querySelector('.leaderboard-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.className = 'leaderboard-panel';
            document.body.appendChild(panel);
        }
        
        const topScores = this.getTopScores(20);
        
        panel.innerHTML = `
            <h3>📊 Local Leaderboard</h3>
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Score</th>
                        <th>Level</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${topScores.map((score, index) => `
                        <tr>
                            <td class="rank-${index + 1 <= 3 ? index + 1 : ''}">#${index + 1}</td>
                            <td>${score.playerName}</td>
                            <td>${score.score.toLocaleString()}</td>
                            <td>L${score.level}-${score.stage}</td>
                            <td>${score.date}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="margin-top: 15px;">
                <button onclick="this.parentElement.style.display='none'" style="padding: 5px 15px; margin-right: 10px;">Close</button>
                <button onclick="window.leaderboard.exportScores()" style="padding: 5px 15px; margin-right: 10px;">Export</button>
                <button onclick="window.leaderboard.clearScores()" style="padding: 5px 15px;">Clear All</button>
            </div>
        `;
        
        panel.style.display = 'block';
    }
    
    showScoreInput(score, level, stage, callback) {
        let panel = document.querySelector('.score-input-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.className = 'score-input-panel';
            document.body.appendChild(panel);
        }
        
        panel.innerHTML = `
            <h3>🎉 New High Score!</h3>
            <p>Score: <strong>${score.toLocaleString()}</strong></p>
            <p>Enter your name:</p>
            <input type="text" id="playerNameInput" maxlength="20" placeholder="Anonymous" style="width: 200px; padding: 5px;">
            <div style="margin-top: 15px;">
                <button onclick="window.leaderboard.submitScore('${score}', '${level}', '${stage}', this)" style="padding: 5px 15px; margin-right: 10px;">Submit</button>
                <button onclick="this.parentElement.style.display='none'" style="padding: 5px 15px;">Skip</button>
            </div>
        `;
        
        panel.style.display = 'block';
        document.getElementById('playerNameInput').focus();
        
        // Handle Enter key
        document.getElementById('playerNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitScore(score, level, stage, e.target);
            }
        });
        
        this.scoreCallback = callback;
    }
    
    submitScore(score, level, stage, button) {
        const playerName = document.getElementById('playerNameInput').value.trim() || 'Anonymous';
        const rank = this.addScore(playerName, parseInt(score), level, stage);
        
        document.querySelector('.score-input-panel').style.display = 'none';
        
        if (this.scoreCallback) {
            this.scoreCallback(rank);
        }
        
        // Show achievement if top 10
        if (rank <= 10 && window.achievements) {
            window.achievements.unlock('highScore', parseInt(score));
        }
    }
    
    updateLeaderboardUI() {
        const panel = document.querySelector('.leaderboard-panel');
        if (panel && panel.style.display === 'block') {
            this.showLeaderboard();
        }
    }
    
    exportScores() {
        const dataStr = JSON.stringify(this.scores, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'donkey-kong-scores.json';
        link.click();
        URL.revokeObjectURL(url);
    }
    
    clearScores() {
        if (confirm('Are you sure you want to clear all scores?')) {
            this.scores = [];
            this.saveScores();
            this.updateLeaderboardUI();
        }
    }
    
    isHighScore(score) {
        return this.scores.length < 50 || score > this.scores[this.scores.length - 1].score;
    }
}

// Export for use in main game
window.LocalLeaderboard = LocalLeaderboard;