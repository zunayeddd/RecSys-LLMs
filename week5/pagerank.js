// pagerank.js
/**
 * Computes PageRank scores for nodes in a graph using TensorFlow.js
 * @param {Array} nodes - Array of node objects with id property
 * @param {Array} edges - Array of edge objects with source and target properties
 * @param {number} dampingFactor - Damping factor (typically 0.85)
 * @param {number} iterations - Number of iterations to run
 * @returns {Promise<Object>} Object mapping node IDs to PageRank scores
 */
async function computePageRank(nodes, edges, dampingFactor = 0.85, iterations = 50) {
    // Create node ID to index mapping
    const nodeIndexMap = new Map();
    nodes.forEach((node, index) => {
        nodeIndexMap.set(node.id, index);
    });
    
    const n = nodes.length;
    
    // Build adjacency matrix as a 2D array
    const adjacencyMatrix = Array(n).fill().map(() => Array(n).fill(0));
    
    edges.forEach(edge => {
        const sourceIndex = nodeIndexMap.get(edge.source);
        const targetIndex = nodeIndexMap.get(edge.target);
        
        if (sourceIndex !== undefined && targetIndex !== undefined) {
            // For undirected graph, add connections in both directions
            adjacencyMatrix[sourceIndex][targetIndex] = 1;
            adjacencyMatrix[targetIndex][sourceIndex] = 1;
        }
    });
    
    // Convert to TensorFlow tensors
    const adjacencyTensor = tf.tensor2d(adjacencyMatrix, [n, n], 'float32');
    
    // Create stochastic matrix (transition probabilities)
    const outDegree = tf.sum(adjacencyTensor, 1);
    const stochasticMatrix = adjacencyTensor.div(outDegree.reshape([n, 1]));
    
    // Handle dangling nodes (nodes with no outgoing links)
    const danglingMask = tf.equal(outDegree, 0);
    const uniformDistribution = tf.ones([n, n]).div(tf.scalar(n));
    const finalStochastic = stochasticMatrix.add(
        uniformDistribution.mul(danglingMask.reshape([n, 1]).cast('float32'))
    );
    
    // Apply damping factor
    const teleportation = tf.ones([n, n]).div(tf.scalar(n));
    const transitionMatrix = finalStochastic.mul(tf.scalar(dampingFactor))
        .add(teleportation.mul(tf.scalar(1 - dampingFactor)));
    
    // Initialize PageRank vector (uniform distribution)
    let pagerank = tf.ones([n, 1]).div(tf.scalar(n));
    
    // Power iteration
    for (let i = 0; i < iterations; i++) {
        pagerank = transitionMatrix.matMul(pagerank);
        
        // Normalize to ensure it sums to 1
        const sum = tf.sum(pagerank);
        pagerank = pagerank.div(sum);
    }
    
    // Convert to JavaScript array and create node ID to score mapping
    const pagerankArray = await pagerank.data();
    const scores = {};
    
    nodes.forEach((node, index) => {
        scores[node.id] = pagerankArray[index];
    });
    
    // Clean up tensors to free memory
    tf.dispose([
        adjacencyTensor, outDegree, stochasticMatrix, danglingMask,
        uniformDistribution, finalStochastic, teleportation,
        transitionMatrix, pagerank
    ]);
    
    return scores;
}
