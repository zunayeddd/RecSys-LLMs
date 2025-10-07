// app.js
const app = {
    graph: null,
    pagerankScores: null,
    selectedNode: null,
    
    async loadDefaultData() {
        try {
            const response = await fetch('data/karate.csv');
            const csvText = await response.text();
            this.graph = this.parseCSV(csvText);
            this.renderGraph();
            this.renderTable();
            console.log('Graph loaded:', this.graph);
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Error loading data. Make sure data/karate.csv exists.');
        }
    },
    
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const edges = [];
        const nodes = new Set();
        
        for (let i = 1; i < lines.length; i++) { // Skip header
            const [source, target] = lines[i].split(',').map(x => x.trim());
            if (source && target) {
                edges.push({ source: parseInt(source), target: parseInt(target) });
                nodes.add(parseInt(source));
                nodes.add(parseInt(target));
            }
        }
        
        return {
            nodes: Array.from(nodes).map(id => ({ id })),
            edges: edges
        };
    },
    
    async computePageRank() {
        if (!this.graph) {
            alert('Please load graph data first.');
            return;
        }
        
        try {
            this.pagerankScores = await pagerank.computePageRank(this.graph);
            this.renderGraph();
            this.renderTable();
            console.log('PageRank computed:', this.pagerankScores);
        } catch (error) {
            console.error('Error computing PageRank:', error);
            alert('Error computing PageRank.');
        }
    },
    
    renderGraph() {
        if (this.graph) {
            graphVisualization.render(this.graph, this.pagerankScores, this.selectedNode);
        }
    },
    
    renderTable() {
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';
        
        if (!this.graph || !this.pagerankScores) return;
        
        this.graph.nodes.forEach(node => {
            const row = document.createElement('tr');
            const score = this.pagerankScores ? this.pagerankScores[node.id] : 0;
            const friends = this.getFriends(node.id);
            
            row.innerHTML = `
                <td>${node.id}</td>
                <td>${score ? score.toFixed(4) : 'N/A'}</td>
                <td>${friends.join(', ')}</td>
            `;
            
            row.addEventListener('click', () => this.selectNode(node.id));
            if (this.selectedNode === node.id) {
                row.classList.add('selected');
            }
            
            tableBody.appendChild(row);
        });
    },
    
    getFriends(nodeId) {
        return this.graph.edges
            .filter(edge => edge.source === nodeId || edge.target === nodeId)
            .map(edge => edge.source === nodeId ? edge.target : edge.source)
            .sort((a, b) => a - b);
    },
    
    selectNode(nodeId) {
        this.selectedNode = nodeId;
        this.renderGraph();
        this.renderTable();
        this.showNodeInfo(nodeId);
    },
    
    showNodeInfo(nodeId) {
        const infoDiv = document.getElementById('selectedNodeInfo');
        const friendDiv = document.getElementById('friendInfo');
        const recommendationDiv = document.getElementById('recommendationInfo');
        
        const score = this.pagerankScores ? this.pagerankScores[nodeId] : 0;
        const friends = this.getFriends(nodeId);
        
        infoDiv.innerHTML = `<strong>Node ${nodeId}</strong> - PageRank: ${score ? score.toFixed(4) : 'N/A'}`;
        
        // Show current friends
        const currentFriendsDiv = document.getElementById('currentFriends');
        currentFriendsDiv.innerHTML = '';
        friends.forEach(friendId => {
            const friendDiv = document.createElement('div');
            friendDiv.className = 'friend-item';
            friendDiv.textContent = `Node ${friendId}`;
            currentFriendsDiv.appendChild(friendDiv);
        });
        friendDiv.style.display = 'block';
        
        // Show recommendations
        if (this.pagerankScores) {
            const recommendations = this.getRecommendations(nodeId);
            const recommendedFriendsDiv = document.getElementById('recommendedFriends');
            recommendedFriendsDiv.innerHTML = '';
            
            recommendations.forEach(rec => {
                const recDiv = document.createElement('div');
                recDiv.className = 'recommendation-item';
                recDiv.innerHTML = `
                    Node ${rec.node} (Score: ${rec.score.toFixed(4)})
                    <button onclick="app.simulateConnection(${nodeId}, ${rec.node})">Connect</button>
                `;
                recommendedFriendsDiv.appendChild(recDiv);
            });
            recommendationDiv.style.display = 'block';
        }
    },
    
    getRecommendations(nodeId) {
        const currentFriends = new Set(this.getFriends(nodeId));
        currentFriends.add(nodeId); // Exclude self
        
        const allNodes = this.graph.nodes.map(node => node.id);
        const candidates = allNodes.filter(node => !currentFriends.has(node));
        
        return candidates
            .map(node => ({
                node,
                score: this.pagerankScores[node]
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
    },
    
    simulateConnection(source, target) {
        if (!this.graph) return;
        
        // Add new edge
        this.graph.edges.push({ source, target });
        
        // Recompute PageRank
        this.computePageRank();
        
        // Refresh display
        this.selectNode(source);
        
        console.log(`Simulated connection: ${source} - ${target}`);
    }
};

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    app.loadDefaultData();
});
