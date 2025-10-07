// pagerank.js
const pagerank = {
    async computePageRank(graph, dampingFactor = 0.85, maxIterations = 50) {
        const numNodes = graph.nodes.length;
        const nodeIds = graph.nodes.map(node => node.id);
        const nodeIndexMap = {};
        nodeIds.forEach((id, index) => {
            nodeIndexMap[id] = index;
        });
        
        // Build adjacency matrix
        const adjacencyMatrix = Array(numNodes).fill().map(() => Array(numNodes).fill(0));
        
        graph.edges.forEach(edge => {
            const i = nodeIndexMap[edge.source];
            const j = nodeIndexMap[edge.target];
            adjacencyMatrix[i][j] = 1;
            adjacencyMatrix[j][i] = 1; // Undirected graph
        });
        
        // Convert to column-stochastic matrix
        const stochasticMatrix = this.buildStochasticMatrix(adjacencyMatrix);
        
        // Initialize PageRank vector
        let pagerankVector = tf.ones([numNodes, 1]).div(tf.scalar(numNodes));
        
        // Power iteration
        const dampingVector = tf.ones([numNodes, 1]).div(tf.scalar(numNodes)).mul(tf.scalar(1 - dampingFactor));
        const M = tf.tensor2d(stochasticMatrix);
        
        for (let iter = 0; iter < maxIterations; iter++) {
            pagerankVector = tf.tidy(() => {
                const teleport = dampingVector;
                const follow = M.matMul(pagerankVector).mul(tf.scalar(dampingFactor));
                return teleport.add(follow);
            });
        }
        
        // Convert to JavaScript object
        const scores = await pagerankVector.data();
        const result = {};
        nodeIds.forEach((id, index) => {
            result[id] = scores[index];
        });
        
        // Clean up tensors
        M.dispose();
        pagerankVector.dispose();
        
        return result;
    },
    
    buildStochasticMatrix(adjacencyMatrix) {
        const numNodes = adjacencyMatrix.length;
        const stochasticMatrix = Array(numNodes).fill().map(() => Array(numNodes).fill(0));
        
        for (let j = 0; j < numNodes; j++) {
            const colSum = adjacencyMatrix.reduce((sum, row) => sum + row[j], 0);
            
            if (colSum > 0) {
                for (let i = 0; i < numNodes; i++) {
                    stochasticMatrix[i][j] = adjacencyMatrix[i][j] / colSum;
                }
            } else {
                // Handle dangling nodes by distributing evenly
                for (let i = 0; i < numNodes; i++) {
                    stochasticMatrix[i][j] = 1 / numNodes;
                }
            }
        }
        
        return stochasticMatrix;
    }
};
