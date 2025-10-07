// pagerank.js
/**
 * Computes PageRank scores for nodes in a graph using TensorFlow.js
 * @param {Object} graphData - Graph data with nodes and edges
 * @param {number} dampingFactor - Damping factor (typically 0.85)
 * @param {number} maxIterations - Maximum number of iterations
 * @returns {Promise<Object>} Object mapping node IDs to PageRank scores
 */
async function computePageRank(graphData, dampingFactor = 0.85, maxIterations = 50) {
    // Create node index mapping
    const nodes = graphData.nodes.map(node => node.id);
    const nodeIndex = {};
    nodes.forEach((nodeId, index) => {
        nodeIndex[nodeId] = index;
    });
    
    const n = nodes.length;
    
    // Build adjacency matrix and out-degree vector
    const adjacencyMatrix = Array(n).fill().map(() => Array(n).fill(0));
    const outDegree = Array(n).fill(0);
    
    graphData.edges.forEach(edge => {
        const i = nodeIndex[edge.source];
        const j = nodeIndex[edge.target];
        
        // For undirected graph, add connections in both directions
        adjacencyMatrix[i][j] = 1;
        adjacencyMatrix[j][i] = 1;
        
        outDegree[i]++;
        outDegree[j]++;
    });
    
    // Convert to TensorFlow tensors
    const tf = await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js');
    
    // Create transition probability matrix
    const transitionMatrix = [];
    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < n; j++) {
            if (outDegree[i] > 0) {
                row.push(adjacencyMatrix[i][j] / outDegree[i]);
            } else {
                // Handle dangling nodes by distributing probability evenly
                row.push(1 / n);
            }
        }
        transitionMatrix.push(row);
    }
    
    const M = tf.tensor2d(transitionMatrix);
    const d = tf.scalar(dampingFactor);
    const oneMinusD = tf.scalar(1 - dampingFactor);
    const nScalar = tf.scalar(n);
    const uniformVector = tf.fill([n, 1], 1 / n);
    
    // Initialize PageRank vector
    let p = tf.fill([n, 1], 1 / n);
    
    // Iterative PageRank computation
    for (let iter = 0; iter < maxIterations; iter++) {
        const newP = tf.add(
            tf.mul(tf.matMul(M, p), d),
            tf.mul(uniformVector, oneMinusD)
        );
        
        // Clean up old tensor
        if (iter > 0) {
            p.dispose();
        }
        p = newP;
    }
    
    // Convert result to JavaScript array
    const pArray = await p.data();
    
    // Create mapping from node ID to PageRank score
    const scores = {};
    nodes.forEach((nodeId, index) => {
        scores[nodeId] = pArray[index];
    });
    
    // Clean up tensors
    M.dispose();
    d.dispose();
    oneMinusD.dispose();
    nScalar.dispose();
    uniformVector.dispose();
    p.dispose();
    
    return scores;
}
