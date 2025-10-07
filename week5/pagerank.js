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
    
    // Create degree vector
    const degrees = adjacencyMatrix.map(row => 
        row.reduce((sum, val) => sum + val, 0)
    );
    const degreeTensor = tf.tensor1d(degrees, 'float32');
    
    // Create transition matrix (column-normalized adjacency matrix)
    const transitionMatrix = tf.div(adjacencyTensor, degreeTensor.add(1e-8));
    
    // Create teleportation matrix (uniform)
    const teleportationMatrix = tf.ones([numNodes, numNodes], 'float32').div(numNodes);
    
    // Initialize PageRank vector (uniform distribution)
    let pagerank = tf.ones([numNodes], 'float32').div(numNodes);
    
    // Power iteration
    const dampingTensor = tf.scalar(dampingFactor, 'float32');
    const oneMinusDamping = tf.scalar(1 - dampingFactor, 'float32');
    
    let previousPagerank;
    
    for (let iter = 0; iter < maxIterations; iter++) {
        previousPagerank = pagerank;
        
        // pagerank = damping * transitionMatrix * pagerank + (1-damping) * teleportationMatrix * pagerank
        const term1 = tf.matMul(transitionMatrix.transpose(), pagerank.reshape([numNodes, 1]));
        const term2 = tf.matMul(teleportationMatrix.transpose(), pagerank.reshape([numNodes, 1]));
        
        pagerank = tf.add(
            tf.mul(dampingTensor, term1.reshape([numNodes])),
            tf.mul(oneMinusDamping, term2.reshape([numNodes]))
        );
        
        // Check for convergence
        const diff = tf.norm(tf.sub(pagerank, previousPagerank));
        const diffValue = await diff.data();
        
        if (diffValue[0] < tolerance) {
            console.log(`PageRank converged after ${iter + 1} iterations`);
            break;
        }
        
        // Clean up tensors to avoid memory leaks
        tf.dispose([term1, term2, diff]);
        if (iter > 0) {
            tf.dispose(previousPagerank);
        }
    }
    
    // Normalize the final PageRank vector
    const sum = pagerank.sum();
    pagerank = pagerank.div(sum);
    
    // Convert to JavaScript array and clean up
    const pagerankArray = await pagerank.data();
    
    tf.dispose([
        adjacencyTensor, degreeTensor, transitionMatrix, teleportationMatrix,
        dampingTensor, oneMinusDamping, previousPagerank, sum
    ]);
    
    return Array.from(pagerankArray);
}
