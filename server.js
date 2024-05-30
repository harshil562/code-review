import express from 'express';
import dotenv from 'dotenv';
import { Webhooks } from '@octokit/webhooks';
import { Octokit } from '@octokit/rest';
import cors from 'cors';
import axios from 'axios';
import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { VertexAI } from '@google-cloud/vertexai';
import { analyzeCodeDiffs, analyzeComments, analyzeReactions, analyzeCommits, deriveBusinessInsights, calculateApproximateReviewTime } from './helper.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const webhooks = new Webhooks({
	secret: process.env.WEBHOOK_SECRET,
});

const octokit = new Octokit({ auth: process.env.GITHUB_ACCESS_TOKEN });
const botOctokit = new Octokit({ auth: process.env.BOT_ACCESS_TOKEN });
const botUsername = 'code-review-x'; // Replace with your bot's username

const vertexAI = new VertexAI({
	project: process.env.GOOGLE_CLOUD_PROJECT_ID,
	location: process.env.GOOGLE_CLOUD_LOCATION,
});
const model = process.env.VERTEX_AI_ENDPOINT_ID;

let latestInsights = {
	codeInsights: {},
	commentInsights: {},
	reactionInsights: {},
	commitInsights: {},
	businessInsights: {},
	approximateReviewTime: 0,
	prName: '',
	prLink: ''
};

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

app.post('/webhooks', async (req, res) => {
	// console.log('Request received:', req.body);
	const payload = req.body;
	if (!payload) {
		return res.status(400).send('No payload received');
	}

	try {
		const { action, pull_request } = payload;
		if (action === 'opened' || action === 'synchronize' || action === 'reopened') {


			if (!pull_request) {
				console.error('No pull_request found in payload:', payload);
				return res.status(400).send('No pull_request found in payload');
			}

			const { number, head, title, html_url, diff_url } = pull_request;
			const owner = head.user.login;
			const repo = head.repo.name;

			console.log(`Checking PR#${number} for ${owner}/${repo}`);

			// const filesResponse = await octokit.pulls.listFiles({
			// 	owner,
			// 	repo,
			// 	pull_number: number,
			// });

			// const codeDiffs = filesResponse.data.map((file) => file.patch).join('\n');
			// // console.log('codeDiffs is', codeDiffs)
			// Fetch the code diffs from the diff_url
			const diffResponse = await axios.get(diff_url);
			const codeDiffs = diffResponse.data;

			const insights = analyzeCodeDiffs(codeDiffs);

			const commentsResponse = await octokit.issues.listComments({
				owner,
				repo,
				issue_number: number,
			});

			const filteredComments = commentsResponse.data.filter(comment => comment.user.login !== botUsername);
			const commentInsights = analyzeComments(filteredComments);

			const reactionsResponse = await octokit.reactions.listForIssue({
				owner,
				repo,
				issue_number: number,
			});

			const filteredReactions = reactionsResponse.data.filter(reaction => reaction.user.login !== botUsername);

			const reviewCommentsResponse = await octokit.pulls.listReviewComments({
				owner,
				repo,
				pull_number: number,
			});

			const reviewComments = reviewCommentsResponse.data.filter(comment => comment.user.login !== botUsername);

			for (const comment of reviewComments) {
				const commentReactionsResponse = await octokit.reactions.listForPullRequestReviewComment({
					owner,
					repo,
					comment_id: comment.id,
				});
				filteredReactions.push(...commentReactionsResponse.data.filter(reaction => reaction.user.login !== botUsername));
			}

			const reactionInsights = analyzeReactions(filteredReactions);

			const commitsResponse = await octokit.pulls.listCommits({
				owner,
				repo,
				pull_number: number,
			});
			const commitInsights = analyzeCommits(commitsResponse.data);

			const businessInsights = deriveBusinessInsights(reactionInsights, commitInsights);

			const approximateReviewTime = calculateApproximateReviewTime(
				insights.codeChurn,
				commentInsights.totalComments,
				commitInsights.totalCommits
			);

			latestInsights = {
				codeInsights: insights,
				commentInsights: commentInsights,
				reactionInsights: reactionInsights,
				commitInsights: commitInsights,
				businessInsights: businessInsights,
				approximateReviewTime: approximateReviewTime,
				prName: title,
				prLink: html_url
			};

			// Perform code quality analysis using Vertex AI
			const codeQualitySuggestions = await performCodeQualityAnalysis(payload, codeDiffs);

			// Add code quality suggestions as comments to the PR
			await addCodeQualityComments(owner, repo, number, codeQualitySuggestions);

			await addInsightsToPullRequest(owner, repo, number, insights, commentInsights, reactionInsights, businessInsights, commitInsights, approximateReviewTime);
			await sendSlackNotification(latestInsights);

			console.log(`Insights added to PR#${number}`);
		}

		res.status(200).send('OK');

	} catch (error) {
		console.error('Error processing webhook:', error.message, error.stack);
		res.status(500).send('Error');
	}
});

// Function to add code quality suggestions as comments to the PR
async function addCodeQualityComments(owner, repo, pullNumber, suggestions) {
	for (const suggestion of suggestions) {
		await botOctokit.pulls.createReviewComment({
			owner,
			repo,
			pull_number: pullNumber,
			body: suggestion.comment,
			commit_id: suggestion.commit_id,
			path: suggestion.path,
			start_line: suggestion.start_line,
			start_side: suggestion.start_side,
			line: suggestion.start_line === suggestion.line ? suggestion.start_line + 1 : suggestion.line,
			// side: suggestion.side,
			headers: {
				'X-GitHub-Api-Version': '2022-11-28'
			}
			// diff_hunk: "@@ -16,33 +16,40 @@ public class Connection : IConnection...",
		});
	}
}


async function performCodeQualityAnalysis(eventData, diffText) {
	console.log('diffText is', diffText)
	console.log('eventData is', eventData)
	// Instantiate the models
	const generativeModel = vertexAI.preview.getGenerativeModel({
		model: model,
		generationConfig: {
			'maxOutputTokens': 8192,
			'temperature': 1,
			'topP': 0.95,
		},
		systemInstruction: {
			parts: [
				{
					text: `Please look at the code diff provided as "diff" in the prompt and pr event provided as "pr_event" and give me your review comments for code quality. 
    Provide the response in the following JSON format: {"reviews": 
    [body: <review comment>,
    commit_id: <commit_id>,
    path: <path>,
    start_line: <start_line>,
    start_side: <start_side>,
    line: <line>,
    side: <side>
    ]}
    Make sure side is always upper case.
    Make sure you choose the right commit_id from pr_event.
	Make sure path in the response is the entire file path.`
				}
			]
		},
	});

	const prompt = { text: `pr_event - ${JSON.stringify(eventData)} ${diffText}` };
	const req = {
		contents: [
			{ role: 'user', parts: [prompt] }
		],
	};

	const streamingResp = await generativeModel.generateContentStream(req);

	for await (const item of streamingResp.stream) {
		process.stdout.write('stream chunk: ' + JSON.stringify(item) + '\n');
	}

	process.stdout.write('aggregated response: ' + JSON.stringify(await streamingResp.response));
	const responseFinal = JSON.stringify(await streamingResp.response)
	console.log('responseFinal is', responseFinal)

	let reviews = [];
	try {
		const responseJson = JSON.parse(responseFinal);
		if (responseJson.candidates && responseJson.candidates[0] && responseJson.candidates[0].content && responseJson.candidates[0].content.parts) {
			responseJson.candidates[0].content.parts.forEach(part => {
				const partText = part.text;
				const jsonString = partText.match(/```json\n(.*?)\n```/s);
				if (jsonString && jsonString[1]) {
					try {
						const parsedContent = JSON.parse(jsonString[1]);
						if (parsedContent.reviews) {
							parsedContent.reviews.forEach(review => {
								reviews.push({
									body: review.body,
									commit_id: review.commit_id,
									path: review.path,
									start_line: review.start_line,
									start_side: review.start_side,
									line: review.line,
									side: review.side
								});
							});
						}
					} catch (e) {
						console.error('Failed to parse JSON content:', e);
					}
				}
			});
		}
	} catch (e) {
		console.error('Failed to parse aggregated response:', e);
	}

	console.log('Reviews:', reviews);

	const suggestions = reviews.map(review => ({
		comment: review.body,
		commit_id: review.commit_id,
		path: review.path,
		start_line: review.start_line,
		start_side: review.start_side,
		line: review.line,
		side: review.side
	}));
	console.log('suggestions are', suggestions)
	return suggestions;
}


// Function to add insights as comments to the pull request
async function addInsightsToPullRequest(owner, repo, number, insights, commentInsights, reactionInsights, businessInsights, commitInsights, approximateReviewTime) {
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
        - Average Comment Length: ${commentInsights.avgCommentLength.toFixed(2)} characters

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

        **Approximate Review Time for PR#${number}**:
        - Approximate Review Time: ${approximateReviewTime.toFixed(2)} minutes
    `;

	await botOctokit.issues.createComment({
		owner,
		repo,
		issue_number: number,
		body: commentBody,
	});
}

// Function to send a Slack notification
async function sendSlackNotification(insights) {
	const message = {
		text: `*PR Analysis for ${insights.prName}*\n\n
        *Code Analysis Insights*:\n
        - Lines Added: ${insights.codeInsights.linesAdded}
        - Lines Deleted: ${insights.codeInsights.linesDeleted}
        - Code Churn: ${insights.codeInsights.codeChurn}
        - Number of Files Changed: ${insights.codeInsights.numFilesChanged}
        - Number of Methods Added: ${insights.codeInsights.numMethodsAdded}
        - Number of Methods Deleted: ${insights.codeInsights.numMethodsDeleted}
        - Number of Comments Added in Code: ${insights.codeInsights.numCommentsAdded}
        - Number of Functions Added: ${insights.codeInsights.numFunctionsAdded}
        - Number of Functions Deleted: ${insights.codeInsights.numFunctionsDeleted}
        - Number of Variables Added: ${insights.codeInsights.numVariablesAdded}
        - Number of Variables Deleted: ${insights.codeInsights.numVariablesDeleted}
        - Number of Classes Added: ${insights.codeInsights.numClassesAdded}
        - Number of Classes Deleted: ${insights.codeInsights.numClassesDeleted}
        - Productivity Impact: ${insights.codeInsights.productivityImpact}
        - Risk Assessment: ${insights.codeInsights.riskAssessment}
        - Documentation Impact: ${insights.codeInsights.documentationImpact}
        - Estimated Review Time: ${insights.codeInsights.estimatedReviewTime} minutes
        - Potential Bug Count: ${insights.codeInsights.potentialBugCount}
        - Code Complexity Increase: ${insights.codeInsights.codeComplexityIncrease}\n
        *Comment Analysis Insights*:\n
        - Total Comments: ${insights.commentInsights.totalComments}
        - Positive Comments: ${insights.commentInsights.positiveComments}
        - Negative Comments: ${insights.commentInsights.negativeComments}
        - Neutral Comments: ${insights.commentInsights.neutralComments}
        - Comments with Action Items: ${insights.commentInsights.commentsWithActionItems}
        - Comments with Questions: ${insights.commentInsights.commentsWithQuestions}
        - Average Comment Length: ${insights.commentInsights.avgCommentLength.toFixed(2)} characters\n
        *Reaction Analysis Insights*:\n
        - Total Reactions: ${insights.reactionInsights.totalReactions}
        - Thumbs Up: ${insights.reactionInsights.thumbsUp}
        - Thumbs Down: ${insights.reactionInsights.thumbsDown}
        - Laughs: ${insights.reactionInsights.laughs}
        - Hoorays: ${insights.reactionInsights.hoorays}
        - Confused: ${insights.reactionInsights.confused}
        - Hearts: ${insights.reactionInsights.hearts}
        - Rockets: ${insights.reactionInsights.rockets}
        - Eyes: ${insights.reactionInsights.eyes}\n
        *Commit Analysis Insights*:\n
        - Total Commits: ${insights.commitInsights.totalCommits}
        - Average Commit Message Length: ${insights.commitInsights.avgCommitMessageLength} characters
        - Commit Frequency: ${insights.commitInsights.commitFrequency}
        - Significant Changes: ${insights.commitInsights.significantChanges}\n
        *Business Insights*:\n
        - Community Engagement: ${insights.businessInsights.communityEngagement}
        - Overall Sentiment: ${insights.businessInsights.overallSentiment}
        - Development Efficiency: ${insights.businessInsights.developmentEfficiency}
        - Significant Changes Impact: ${insights.businessInsights.significantChangesImpact}\n
        *Approximate Review Time*:\n
        - Approximate Review Time: ${insights.approximateReviewTime.toFixed(2)} minutes\n
        *PR Link*: ${insights.prLink}`
	};

	try {
		await axios.post(SLACK_WEBHOOK_URL, message);
		console.log('Slack notification sent successfully.');
	} catch (error) {
		console.error('Error sending Slack notification:', error);
	}
}

app.get('/data', (req, res) => {
	res.json(latestInsights);
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
