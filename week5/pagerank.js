// pagerank.js
/**
 * Computes PageRank scores for a graph using TensorFlow.js
 * @param {number[][]} adjacencyMatrix - Adjacency matrix of the graph
 * @param {number} dampingFactor - Damping factor (typically 0.85)
 * @param {number} maxIterations - Maximum number of iterations
 * @param {number} tolerance - Convergence tolerance
 * @returns {Promise<number[]>} Array of PageRank scores
 */
async function computePageRankScores(
    adjacencyMatrix, 
    dampingFactor = 0.85, 
    maxIterations = 50,
    tolerance = 1e-6
) {
    const numNodes = adjacencyMatrix.length;
    
    // Convert adjacency matrix to TensorFlow tensors
    const adjacencyTensor = tf.tensor2d(adjacencyMatrix, [numNodes, numNodes], 'float32');
    
    // Create degree vector (sum of each row)
    const degrees = adjacencyMatrix.map(row => 
        row.reduce((sum, val) => sum + val, 0)
    );
    const degreeTensor = tf.tensor1d(degrees, 'float32');
    
    // Handle nodes with zero degree (dangling nodes)
    const hasZeroDegree = degrees.some(deg => deg === 0);
    
    let transitionMatrix;
    
    if (hasZeroDegree) {
        // For dangling nodes, use uniform distribution
        const rowSums = tf.sum(adjacencyTensor, 1).reshape([numNodes, 1]);
        const normalized = tf.div(adjacencyTensor, rowSums.add(1e-8));
        
        // Replace NaN values (from division by zero) with 1/numNodes
        const isDangling = tf.equal(rowSums, 0);
        const uniform = tf.ones([numNodes, numNodes], 'float32').div(numNodes);
        
        transitionMatrix = tf.where(isDangling, uniform, normalized);
    } else {
        // Simple case: all nodes have outgoing links
        transitionMatrix = tf.div(adjacencyTensor, degreeTensor.reshape([numNodes, 1]));
    }
    
    // Initialize PageRank vector (uniform distribution)
    let pagerank = tf.ones([numNodes], 'float32').div(numNodes);
    
    // Power iteration
    const damping = tf.scalar(dampingFactor, 'float32');
    const oneMinusDamping = tf.scalar(1 - dampingFactor, 'float32');
    const teleportation = tf.ones([numNodes], 'float32').div(numNodes);
    
    let previousPagerank = pagerank;
    
    for (let iter = 0; iter < maxIterations; iter++) {
        // pagerank = damping * transitionMatrix^T * pagerank + (1-damping) * teleportation
        
        // Matrix multiplication: transitionMatrix^T * pagerank
        const transitionPart = tf.matMul(
            transitionMatrix.transpose(), 
            pagerank.reshape([numNodes, 1])
        ).reshape([numNodes]);
        
        // Damping factor applied to transition part
        const dampedTransition = tf.mul(damping, transitionPart);
        
        // Teleportation part
        const teleportPart = tf.mul(oneMinusDamping, teleportation);
        
        // New PageRank vector
        const newPagerank = tf.add(dampedTransition, teleportPart);
        
        // Check for convergence
        const diff = tf.norm(tf.sub(newPagerank, pagerank));
        const diffValue = await diff.data();
        
        // Clean up intermediate tensors
        tf.dispose([transitionPart, dampedTransition, teleportPart, diff]);
        if (iter > 0) {
            tf.dispose(previousPagerank);
        }
        
        previousPagerank = pagerank;
        pagerank = newPagerank;
        
        if (diffValue[0] < tolerance) {
            console.log(`PageRank converged after ${iter + 1} iterations`);
            break;
        }
    }
    
    // Normalize the final PageRank vector to sum to 1
    const sum = tf.sum(pagerank);
    pagerank = pagerank.div(sum);
    
    // Convert to JavaScript array
    const pagerankArray = await pagerank.data();
    
    // Clean up all remaining tensors
    tf.dispose([
        adjacencyTensor, degreeTensor, transitionMatrix, 
        damping, oneMinusDamping, teleportation, sum
    ]);
    
    return Array.from(pagerankArray);
}
