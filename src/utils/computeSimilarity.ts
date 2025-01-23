import dot from 'compute-dot';
import cosineSimilarity from 'compute-cosine-similarity';
import { getSimilarityMeasure } from '../config';
import logger from '../utils/logger';

/**
 * Compute similarity between two vectors using the configured similarity measure
 * @param x First vector
 * @param y Second vector
 * @returns Similarity score between 0 and 1, or 0 if computation fails
 */
const computeSimilarity = (x: number[], y: number[]): number => {
  try {
    // Validate input vectors
    if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length) {
      logger.warn('Invalid input vectors for similarity computation');
      return 0;
    }

    // Check for null/undefined values in vectors
    if (x.some(val => val === null || val === undefined) || 
        y.some(val => val === null || val === undefined)) {
      logger.warn('Vectors contain null or undefined values');
      return 0;
    }

    const similarityMeasure: string = getSimilarityMeasure();

    if (similarityMeasure === 'cosine') {
      const similarity = cosineSimilarity(x, y);
      if (similarity === null || similarity === undefined) {
        logger.warn('Cosine similarity computation returned null/undefined');
        return 0;
      }
      return similarity;
    } else if (similarityMeasure === 'dot') {
      const similarity = dot(x, y);
      if (similarity === null || similarity === undefined) {
        logger.warn('Dot product computation returned null/undefined');
        return 0;
      }
      return similarity;
    }

    logger.warn(`Unknown similarity measure: ${similarityMeasure}`);
    return 0;
  } catch (error) {
    logger.error('Error computing similarity:', error);
    return 0;
  }
};

export default computeSimilarity;