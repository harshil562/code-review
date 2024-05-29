import express from 'express';
import dotenv from 'dotenv';
import { Webhooks } from '@octokit/webhooks';
import { Octokit } from '@octokit/rest';
import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { VertexAI } from '@google-cloud/vertexai' // Import PredictionServiceClient directly

dotenv.config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const webhooks = new Webhooks({
    secret: process.env.WEBHOOK_SECRET,
});

const octokit = new Octokit({ auth: process.env.GITHUB_ACCESS_TOKEN });

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const location = process.env.GOOGLE_CLOUD_LOCATION;
const endpointId = process.env.VERTEX_AI_ENDPOINT_ID;

// const vertexClient = new PredictionServiceClient(); // Initialize PredictionServiceClient directly

// Initialize Vertex with your Cloud project and location
const vertex_ai = new VertexAI({ project: projectId, location });
const model = endpointId;

app.post('/webhooks', async (req, res) => {
    console.log('Request received:', req.body);
    const payload = req.body;
    if (!payload) {
        return res.status(400).send('No payload received');
    }

    try {
        const { action, pull_request } = payload;
        if (action === 'opened' || action === 'synchronize' || action === 'reopened') {
            const { number, head } = pull_request;
            const owner = head.user.login;
            const repo = head.repo.name;

            console.log(`Checking PR#${number} for ${owner}/${repo}`);

            // Fetch the list of files changed in the pull request
            const filesResponse = await octokit.pulls.listFiles({
                owner,
                repo,
                pull_number: number,
            });

            // Extract diffs for the changed files
            const codeDiffs = filesResponse.data.map((file) => file.patch).join('\n');

            console.log('codeDiffs are', codeDiffs)

            // Perform code analysis with Vertex AI
            const generativeModel = vertex_ai.preview.getGenerativeModel({
                model,// Replace with your model ID
                generationConfig: {
                    'maxOutputTokens': 8192,
                    'temperature': 1,
                    'topP': 0.95,
                },
                safetySettings: [
                    {
                        'category': 'HARM_CATEGORY_HATE_SPEECH',
                        'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
                    },
                    {
                        'category': 'HARM_CATEGORY_DANGEROUS_CONTENT',
                        'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
                    },
                    {
                        'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                        'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
                    },
                    {
                        'category': 'HARM_CATEGORY_HARASSMENT',
                        'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
                    }
                ],
            });

            const req = {
                content: codeDiffs
            };

            const response = await generativeModel.generateContent(req);

            console.log('Code analysis result:', response.content);

            // Add a comment to the pull request with the code analysis
            await octokit.issues.createComment({
                owner,
                repo,
                issue_number: number,
                body: `Code analysis results for PR#${number}: \n\n${response.content}`,
            });

            console.log(`Comment added to PR#${number}`);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error processing webhook:', error.message);
        res.status(500).send('Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
