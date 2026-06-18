import Groq from 'groq-sdk';

// Initialize the Groq client
// It will automatically use the GROQ_API_KEY environment variable.
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default groq;
