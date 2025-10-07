// app.js
class PageRankApp {
    constructor() {
        this.graph = null;
        this.pageRankScores = null;
        this.selectedNode = null;
        this.nodeData = [];
        this.edgeData = [];
        
        this.init();
    }

    async init() {
        try {
            // Load the karate club dataset
            await this.loadData('data/karate.csv');
            
            // Compute PageRank scores
            this.pageRankScores = await computePageRank(this.nodeData, this.edgeData);
            
            // Update node data with PageRank scores
            this.nodeData.forEach(node => {
                node.pagerank = this.pageRankScores[node.id];
            });
            
            // Initialize visualization
            this.initGraph();
            this.initTable();
            
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    }

    async loadData(filename) {
        try {
            const response = await fetch(filename);
            const csvText = await response.text();
            this.parseCSV(csvText);
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback to demo data if file not found
            this.createDemoData();
        }
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const nodes = new Set();
        const edges = [];
        
        // Skip header if exists, process each line
        for (let i = (lines[0].includes('source') ? 1 : 0); i < lines.length; i++) {
            const [source, target] = lines[i].split(',').map(val => val.trim());
            if (source && target) {
                const sourceId = parseInt(source);
                const targetId = parseInt(target);
                
                nodes.add(sourceId);
                nodes.add(targetId);
                edges.push({ source: sourceId, target: targetId });
            }
        }
        
        // Convert Set to Array and create node objects
        this.nodeData = Array.from(nodes).map(id => ({ id }));
        this.edgeData = edges;
        
        console.log(`Loaded ${this.nodeData.length} nodes and ${this.edgeData.length} edges`);
    }

    createDemoData() {
        // Create a simple demo graph if data file is not found
        this.nodeData = [
            { id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 },
            { id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }, { id: 9 }
        ];
        
        this.edgeData = [
            { source: 0, target: 1 }, { source: 0, target: 2 }, { source: 0, target: 3 },
            { source: 1, target: 4 }, { source: 1, target: 5 }, { source: 2, target: 6 },
            { source: 3, target: 7 }, { source: 4, target: 8 }, { source: 5, target: 9 },
            { source: 6, target: 7 }, { source: 7, target: 8 }, { source: 8, target: 9 }
        ];
        
        console.log('Using demo data');
    }

    initGraph() {
        this.graph = new GraphVisualization(
            'graph',
            this.nodeData,
            this.edgeData,
            (node) => this.onNodeClick(node)
        );
    }

    initTable() {
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';
        
        // Sort nodes by PageRank score (descending)
        const sortedNodes = [...this.nodeData].sort((a, b) => b.pagerank - a.pagerank);
        
        sortedNodes.forEach(node => {
            const row = document.createElement('tr');
            row.dataset.nodeId = node.id;
            
            // Get current friends for this node
            const friends = this.getFriends(node.id);
            
            row.innerHTML = `
                <td>${node.id}</td>
                <td>${node.pagerank.toFixed(4)}</td>
                <td>${friends.map(f => f.id).join(', ')}</td>
            `;
            
            row.addEventListener('click', () => this.onNodeClick(node));
            tableBody.appendChild(row);
        });
    }

    getFriends(nodeId) {
        const friends = new Set();
        this.edgeData.forEach(edge => {
            if (edge.source === nodeId) friends.add(edge.target);
            if (edge.target === nodeId) friends.add(edge.source);
        });
        
        return Array.from(friends).map(id => this.nodeData.find(node => node.id === id));
    }

    onNodeClick(node) {
        this.selectedNode = node;
        
        // Update table selection
        document.querySelectorAll('#tableBody tr').forEach(row => {
            row.classList.toggle('selected', parseInt(row.dataset.nodeId) === node.id);
        });
        
        // Update graph selection
        if (this.graph) {
            this.graph.highlightNode(node.id);
        }
        
        // Show node information
        this.showNodeInfo(node);
    }

    showNodeInfo(node) {
        const nodeInfo = document.getElementById('nodeInfo');
        const currentFriendsDiv = document.getElementById('currentFriends');
        const recommendationsDiv = document.getElementById('recommendations');
        
        // Get current friends
        const currentFriends = this.getFriends(node.id);
        
        // Get recommendations
        const recommendations = this.getRecommendations(node.id);
        
        // Display current friends
        currentFriendsDiv.innerHTML = `
            <h4>Current Friends (${currentFriends.length})</h4>
            <p>${currentFriends.map(f => `Node ${f.id} (Score: ${f.pagerank.toFixed(4)})`).join(', ')}</p>
        `;
        
        // Display recommendations
        if (recommendations.length > 0) {
            recommendationsDiv.innerHTML = `
                <h4>Top 3 Recommended Friends</h4>
                ${recommendations.map(rec => `
                    <div class="recommendation">
                        <strong>Node ${rec.node.id}</strong> - Score: ${rec.node.pagerank.toFixed(4)}
                        <button onclick="app.connectNodes(${node.id}, ${rec.node.id})">Connect</button>
                    </div>
                `).join('')}
            `;
        } else {
            recommendationsDiv.innerHTML = '<p>No recommendations available</p>';
        }
        
        nodeInfo.style.display = 'block';
    }

    getRecommendations(nodeId) {
        const currentFriends = new Set(this.getFriends(nodeId).map(f => f.id));
        currentFriends.add(nodeId); // Exclude self
        
        const recommendations = this.nodeData
            .filter(node => !currentFriends.has(node.id))
            .map(node => ({
                node,
                score: node.pagerank
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
            
        return recommendations;
    }

    connectNodes(sourceId, targetId) {
        // Add new edge
        this.edgeData.push({ source: sourceId, target: targetId });
        
        // Recompute PageRank
        this.recomputePageRank();
        
        // Update visualization
        this.graph.updateData(this.nodeData, this.edgeData);
        this.initTable();
        
        // Refresh node info
        const node = this.nodeData.find(n => n.id === sourceId);
        this.showNodeInfo(node);
        
        console.log(`Connected nodes ${sourceId} and ${targetId}`);
    }

    async recomputePageRank() {
        this.pageRankScores = await computePageRank(this.nodeData, this.edgeData);
        
        // Update node data with new PageRank scores
        this.nodeData.forEach(node => {
            node.pagerank = this.pageRankScores[node.id];
        });
    }
}

// Initialize the application when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PageRankApp();
});
