import express from 'express';
import dotenv from 'dotenv';
import { Webhooks } from '@octokit/webhooks';
import { Octokit } from '@octokit/rest';
import * as aiplatform from '@google-cloud/aiplatform'; // Correct import for CommonJS module
import axios from 'axios';

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

const { PredictionServiceClient } = aiplatform.v1; // Access the client from the v1 namespace

const vertexClient = new PredictionServiceClient();

app.post('/webhooks', async (req, res) => {
	console.log('request is', req.body);
	const payload = req.body;
	if (!payload) {
		return res.status(400).send('No payload received');
	}

	try {
		const { action, pull_request } = payload;
		if (action === 'opened' || action === 'synchronize' || action === 'reopened') {
			const { html_url, number, head, base } = pull_request;
			const owner = head.user.login;
			const repo = head.repo.name;

			console.log(`Checking PR#${number} for ${owner}/${repo}`);

			// Fetch the list of files changed in the pull request
			const filesResponse = await octokit.pulls.listFiles({
				owner,
				repo,
				pull_number: number,
			});

			// Extract filenames from the files changed
			const filenames = filesResponse.data.map((file) => file.filename);

			// Extract code changes from filenames
			const codeChanges = filenames.join('\n');

			console.log('code changes are', codeChanges);

			// Perform code analysis with Vertex AI
			const request = {
				endpoint: `projects/${projectId}/locations/${location}/endpoints/${endpointId}`,
				instances: [
					{
						content: codeChanges,
					},
				],
			};

			console.log('request vertex is', request)

			const [response] = await vertexClient.predict(request);
			console.log('response is', response)
			const codeAnalysis = response.predictions[0].content.trim();

			console.log('Vertex AI analysis result:', codeAnalysis);

			// Simulate code review results
			const reviewResults = 'Code looks good!';

			// Add a comment to the pull request with the code analysis
			await octokit.pulls.createReviewComment({
				owner,
				repo,
				pull_number: number,
				commit_id: head.sha,
				body: `Code analysis results for PR#${number}: \n\n${codeAnalysis}\n\n${reviewResults}`,
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
