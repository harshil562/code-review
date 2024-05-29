import express from 'express';
import dotenv from 'dotenv';
import { Webhooks } from '@octokit/webhooks';
import { Octokit } from '@octokit/rest';
import cors from 'cors';
import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { analyzeCodeDiffs, analyzeComments, analyzeReactions, analyzeCommits, deriveBusinessInsights } from '././helper.js'

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const webhooks = new Webhooks({
	secret: process.env.WEBHOOK_SECRET,
});

const octokit = new Octokit({ auth: process.env.GITHUB_ACCESS_TOKEN });

const vertexClient = new PredictionServiceClient();

let latestInsights = {
	codeInsights: {},
	commentInsights: {},
	reactionInsights: {},
	commitInsights: {},
	businessInsights: {}
};

app.post('/webhooks', async (req, res) => {
	console.log('Request received:', req.body);
	const payload = req.body;
	if (!payload) {
		return res.status(400).send('No payload received');
	}

	try {
		const { action, pull_request } = payload;
		if (action === 'opened' || action === 'synchronize' || action === 'reopened' || 'submitted') {
			const { number, head } = pull_request;
			const owner = head.user.login;
			const repo = head.repo.name;

			console.log(`Checking PR#${number} for ${owner}/${repo}`);

			const filesResponse = await octokit.pulls.listFiles({
				owner,
				repo,
				pull_number: number,
			});

			const codeDiffs = filesResponse.data.map((file) => file.patch).join('\n');
			const insights = analyzeCodeDiffs(codeDiffs);

			const commentsResponse = await octokit.issues.listComments({
				owner,
				repo,
				issue_number: number,
			});
			const commentInsights = analyzeComments(commentsResponse.data);

			const reactionsResponse = await octokit.reactions.listForIssue({
				owner,
				repo,
				issue_number: number,
			});
			const reactionInsights = analyzeReactions(reactionsResponse.data);

			const commitsResponse = await octokit.pulls.listCommits({
				owner,
				repo,
				pull_number: number,
			});
			const commitInsights = analyzeCommits(commitsResponse.data);

			const businessInsights = deriveBusinessInsights(reactionInsights, commitInsights);

			latestInsights = {
				codeInsights: insights,
				commentInsights: commentInsights,
				reactionInsights: reactionInsights,
				commitInsights: commitInsights,
				businessInsights: businessInsights
			};

			await addInsightsToPullRequest(owner, repo, number, insights, commentInsights, reactionInsights, businessInsights, commitInsights);

			console.log(`Insights added to PR#${number}`);
			res.status(200).send('OK');
		} else {
			res.status(200).send('No action needed');
		}
	} catch (error) {
		console.error('Error processing webhook:', error.message);
		res.status(500).send('Error');
	}
});

// Function to add insights as comments to the pull request
export async function addInsightsToPullRequest(owner, repo, number, insights, commentInsights, reactionInsights, businessInsights, commitInsights) {
	const commentBody = `
        **Code Analysis Insights for PR#${number}**:
        - Lines Added: ${insights.linesAdded}
        - Lines Deleted: ${insights.linesDeleted}
        - Code Churn: ${insights.codeChurn}
        - Number of Files Changed: ${insights.numFilesChanged}
        - Number of Methods Added: ${insights.numMethodsAdded}
        - Number of Methods Deleted: ${insights.numMethodsDeleted}
        - Number of Comments Added in Code: ${insights.numCommentsAdded}
        - Number of Functions Added: ${insights.numFunctionsAdded}
        - Number of Functions Deleted: ${insights.numFunctionsDeleted}
        - Number of Variables Added: ${insights.numVariablesAdded}
        - Number of Variables Deleted: ${insights.numVariablesDeleted}
        - Number of Classes Added: ${insights.numClassesAdded}
        - Number of Classes Deleted: ${insights.numClassesDeleted}
        - Productivity Impact: ${insights.productivityImpact}
        - Risk Assessment: ${insights.riskAssessment}
        - Documentation Impact: ${insights.documentationImpact}
        - Estimated Review Time: ${insights.estimatedReviewTime} minutes
        - Potential Bug Count: ${insights.potentialBugCount}
        - Code Complexity Increase: ${insights.codeComplexityIncrease}
        
        **Comment Analysis Insights for PR#${number}**:
        - Total Comments: ${commentInsights.totalComments}
        - Positive Comments: ${commentInsights.positiveComments}
        - Negative Comments: ${commentInsights.negativeComments}
        - Neutral Comments: ${commentInsights.neutralComments}
        - Comments with Action Items: ${commentInsights.commentsWithActionItems}
        - Comments with Questions: ${commentInsights.commentsWithQuestions}
        - Average Comment Length: ${commentInsights.avgCommentLength} characters

        **Reaction Analysis Insights for PR#${number}**:
        - Total Reactions: ${reactionInsights.totalReactions}
        - Thumbs Up: ${reactionInsights.thumbsUp}
        - Thumbs Down: ${reactionInsights.thumbsDown}
        - Laughs: ${reactionInsights.laughs}
        - Hoorays: ${reactionInsights.hoorays}
        - Confused: ${reactionInsights.confused}
        - Hearts: ${reactionInsights.hearts}
        - Rockets: ${reactionInsights.rockets}
        - Eyes: ${reactionInsights.eyes}

        **Commit Analysis Insights for PR#${number}**:
        - Total Commits: ${commitInsights.totalCommits}
        - Average Commit Message Length: ${commitInsights.avgCommitMessageLength} characters
        - Commit Frequency: ${commitInsights.commitFrequency}
        - Significant Changes: ${commitInsights.significantChanges}

   
        **Business Insights for PR#${number}**:
        - Community Engagement: ${businessInsights.communityEngagement}
        - Overall Sentiment: ${businessInsights.overallSentiment}
        - Development Efficiency: ${businessInsights.developmentEfficiency}
        - Significant Changes Impact: ${businessInsights.significantChangesImpact}
    `;

	await octokit.issues.createComment({
		owner,
		repo,
		issue_number: number,
		body: commentBody,
	});
}


app.get('/data', (req, res) => {
	res.json(latestInsights);
});



app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});

