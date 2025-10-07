// pagerank.js
const pagerank = {
    async computePageRank(graph, dampingFactor = 0.85, maxIterations = 50) {
        const numNodes = graph.nodes.length;
        const nodeIds = graph.nodes.map(node => node.id);
        const nodeIndexMap = {};
        nodeIds.forEach((id, index) => {
            nodeIndexMap[id] = index;
        });
        
        console.log('Node index map:', nodeIndexMap);
        console.log('Graph edges:', graph.edges);
        
        // Build adjacency matrix with proper initialization
        const adjacencyMatrix = [];
        for (let i = 0; i < numNodes; i++) {
            adjacencyMatrix[i] = new Array(numNodes).fill(0);
        }
        
        // Fill adjacency matrix
        graph.edges.forEach(edge => {
            const i = nodeIndexMap[edge.source];
            const j = nodeIndexMap[edge.target];
            console.log(`Edge ${edge.source}->${edge.target} mapped to [${i},${j}]`);
            
            if (i !== undefined && j !== undefined && i < numNodes && j < numNodes) {
                adjacencyMatrix[i][j] = 1;
                adjacencyMatrix[j][i] = 1; // Undirected graph
            } else {
                console.warn(`Invalid edge indices: ${edge.source}->${edge.target} -> [${i},${j}]`);
            }
        });
        
        console.log('Adjacency matrix:', adjacencyMatrix);
        
        // Convert to column-stochastic matrix
        const stochasticMatrix = this.buildStochasticMatrix(adjacencyMatrix);
        console.log('Stochastic matrix:', stochasticMatrix);
        
        // Initialize PageRank vector
        const initialValue = 1 / numNodes;
        let pagerankVector = tf.fill([numNodes, 1], initialValue);
        
        // Power iteration
        const dampingValue = (1 - dampingFactor) / numNodes;
        const dampingVector = tf.fill([numNodes, 1], dampingValue);
        const M = tf.tensor2d(stochasticMatrix);
        
        console.log('Starting PageRank iterations...');
        
        for (let iter = 0; iter < maxIterations; iter++) {
            pagerankVector = tf.tidy(() => {
                const teleport = dampingVector;
                const follow = M.matMul(pagerankVector).mul(tf.scalar(dampingFactor));
                return teleport.add(follow);
            });
            
            // Normalize to ensure it sums to 1
            if (iter % 10 === 0) {
                const sum = pagerankVector.sum().dataSync()[0];
                pagerankVector = pagerankVector.div(tf.scalar(sum));
            }
        }
        
        // Convert to JavaScript object
        const scores = await pagerankVector.data();
        const result = {};
        nodeIds.forEach((id, index) => {
            result[id] = scores[index];
        });
        
        console.log('PageRank results:', result);
        
        // Clean up tensors
        M.dispose();
        pagerankVector.dispose();
        dampingVector.dispose();
        
        return result;
    },
    
    buildStochasticMatrix(adjacencyMatrix) {
        const numNodes = adjacencyMatrix.length;
        const stochasticMatrix = [];
        
        // Initialize stochastic matrix
        for (let i = 0; i < numNodes; i++) {
            stochasticMatrix[i] = new Array(numNodes).fill(0);
        }
        
        for (let j = 0; j < numNodes; j++) {
            let colSum = 0;
            for (let i = 0; i < numNodes; i++) {
                colSum += adjacencyMatrix[i][j];
            }
            
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
