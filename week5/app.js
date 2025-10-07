// app.js
class PageRankApp {
    constructor() {
        this.graphData = null;
        this.pageRankScores = null;
        this.selectedNode = null;
        this.graph = null;
        
        this.init();
    }

    async init() {
        // Load the default dataset
        await this.loadData('data/karate.csv');
        
        // Initialize graph visualization
        this.graph = new GraphVisualization('graph');
        this.graph.render(this.graphData);
        
        // Set up event listeners
        document.getElementById('computeBtn').addEventListener('click', () => {
            this.computePageRank();
        });
        
        // Add click handler for table rows
        document.getElementById('tableBody').addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (row) {
                const nodeId = parseInt(row.dataset.nodeId);
                this.handleNodeClick(nodeId);
            }
        });
    }

    async loadData(filename) {
        try {
            const response = await fetch(filename);
            const csvText = await response.text();
            this.parseCSVData(csvText);
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback to sample data if file loading fails
            this.createSampleData();
        }
    }

    parseCSVData(csvText) {
        const lines = csvText.trim().split('\n');
        const edges = [];
        const nodes = new Set();
        
        // Skip header if exists, process each line
        for (let i = (lines[0].includes('source') ? 1 : 0); i < lines.length; i++) {
            const [source, target] = lines[i].split(',').map(x => parseInt(x.trim()));
            if (!isNaN(source) && !isNaN(target)) {
                edges.push({ source, target });
                nodes.add(source);
                nodes.add(target);
            }
        }
        
        this.graphData = {
            nodes: Array.from(nodes).map(id => ({ id })),
            edges: edges
        };
        
        console.log(`Loaded graph with ${this.graphData.nodes.length} nodes and ${this.graphData.edges.length} edges`);
    }

    createSampleData() {
        // Create a simple sample graph if data loading fails
        const nodes = [];
        const edges = [];
        
        for (let i = 1; i <= 10; i++) {
            nodes.push({ id: i });
        }
        
        // Create some connections
        edges.push({ source: 1, target: 2 }, { source: 1, target: 3 }, { source: 2, target: 3 },
                  { source: 3, target: 4 }, { source: 4, target: 5 }, { source: 5, target: 6 },
                  { source: 6, target: 7 }, { source: 7, target: 8 }, { source: 8, target: 9 },
                  { source: 9, target: 10 }, { source: 10, target: 1 });
        
        this.graphData = { nodes, edges };
        console.log('Created sample graph data');
    }

    async computePageRank() {
        if (!this.graphData) {
            alert('Please load graph data first');
            return;
        }

        try {
            // Show loading state
            document.getElementById('computeBtn').textContent = 'Computing...';
            document.getElementById('computeBtn').disabled = true;

            // Compute PageRank
            this.pageRankScores = await computePageRank(this.graphData);
            
            // Update visualization with scores
            this.graph.updateNodeScores(this.pageRankScores);
            
            // Update table
            this.updateScoresTable();
            
            console.log('PageRank computation completed');
            
        } catch (error) {
            console.error('Error computing PageRank:', error);
            alert('Error computing PageRank scores');
        } finally {
            document.getElementById('computeBtn').textContent = 'Compute PageRank';
            document.getElementById('computeBtn').disabled = false;
        }
    }

    updateScoresTable() {
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';
        
        this.graphData.nodes.forEach(node => {
            const row = document.createElement('tr');
            row.dataset.nodeId = node.id;
            
            const score = this.pageRankScores ? this.pageRankScores[node.id].toFixed(6) : 'N/A';
            const friendCount = this.getFriendCount(node.id);
            
            row.innerHTML = `
                <td>${node.id}</td>
                <td>${score}</td>
                <td>${friendCount}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }

    getFriendCount(nodeId) {
        return this.graphData.edges.filter(edge => 
            edge.source === nodeId || edge.target === nodeId
        ).length;
    }

    getFriends(nodeId) {
        const friends = new Set();
        this.graphData.edges.forEach(edge => {
            if (edge.source === nodeId) friends.add(edge.target);
            if (edge.target === nodeId) friends.add(edge.source);
        });
        return Array.from(friends);
    }

    handleNodeClick(nodeId) {
        this.selectedNode = nodeId;
        
        // Update table selection
        document.querySelectorAll('#tableBody tr').forEach(row => {
            row.classList.toggle('selected', parseInt(row.dataset.nodeId) === nodeId);
        });
        
        // Update graph selection
        this.graph.highlightNode(nodeId);
        
        // Show node information
        this.showNodeInfo(nodeId);
        
        // Show recommendations if PageRank is computed
        if (this.pageRankScores) {
            this.showRecommendations(nodeId);
        }
    }

    showNodeInfo(nodeId) {
        const friends = this.getFriends(nodeId);
        const infoDiv = document.getElementById('nodeInfo');
        const friendsDiv = document.getElementById('currentFriends');
        
        friendsDiv.innerHTML = `
            <p><strong>Node ${nodeId}</strong> has ${friends.length} friends:</p>
            <p>${friends.join(', ')}</p>
        `;
        
        infoDiv.style.display = 'block';
    }

    showRecommendations(nodeId) {
        const currentFriends = new Set(this.getFriends(nodeId));
        currentFriends.add(nodeId); // Exclude self from recommendations
        
        // Get all nodes sorted by PageRank score
        const candidates = this.graphData.nodes
            .filter(node => !currentFriends.has(node.id))
            .map(node => ({
                id: node.id,
                score: this.pageRankScores[node.id]
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
        
        const recDiv = document.getElementById('recommendations');
        const recFriendsDiv = document.getElementById('recommendedFriends');
        
        if (candidates.length > 0) {
            recFriendsDiv.innerHTML = candidates.map(candidate => `
                <div style="margin: 5px 0; padding: 8px; background: white; border-radius: 4px;">
                    Node ${candidate.id} (Score: ${candidate.score.toFixed(6)})
                    <button onclick="app.simulateConnection(${nodeId}, ${candidate.id})">Connect</button>
                </div>
            `).join('');
        } else {
            recFriendsDiv.innerHTML = '<p>No recommendations available</p>';
        }
        
        recDiv.style.display = 'block';
    }

    simulateConnection(source, target) {
        // Add new edge to graph data
        this.graphData.edges.push({ source, target });
        
        // Update visualization
        this.graph.render(this.graphData);
        
        // Recompute PageRank
        this.computePageRank();
        
        // Update the display for the selected node
        this.handleNodeClick(this.selectedNode);
        
        console.log(`Simulated connection between ${source} and ${target}`);
    }
}

// Initialize the application when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PageRankApp();
});
