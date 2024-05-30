// Function to analyze code differences and derive insights
export function analyzeCodeDiffs(codeDiffs) {
	// Initialize counters for various metrics
	let linesAdded = 0;
	let linesDeleted = 0;
	let codeChurn = 0;
	let numFilesChanged = 0;
	let numMethodsAdded = 0;
	let numMethodsDeleted = 0;
	let numCommentsAdded = 0;
	let numFunctionsAdded = 0;
	let numFunctionsDeleted = 0;
	let numVariablesAdded = 0;
	let numVariablesDeleted = 0;
	let numClassesAdded = 0;
	let numClassesDeleted = 0;
	let productivityImpact = 0;
	let riskAssessment = 'Low';
	let documentationImpact = 0;
	let estimatedReviewTime = 0;
	let potentialBugCount = 0;
	let codeComplexityIncrease = 0;

	// Perform detailed analysis on the code differences
	const files = codeDiffs.split('diff --git');
	numFilesChanged = files.length - 1;

	for (const file of files) {
		if (!file.trim()) continue; // Skip empty entries

		const lines = file.split('\n');
		let inMethod = false; // Flag to track if inside a method
		let inFunction = false; // Flag to track if inside a function
		let inClass = false; // Flag to track if inside a class
		let inComment = false; // Flag to track if inside a comment

		for (const line of lines) {
			if (line.startsWith('+++')) continue; // Skip file header
			if (line.startsWith('---')) continue; // Skip file header
			if (line.startsWith('@@')) continue; // Skip diff header

			if (line.startsWith('+')) {
				linesAdded++;
				if (!inMethod && !line.startsWith('+++')) {
					numMethodsAdded++;
				}
				if (!inFunction && !line.startsWith('+++')) {
					numFunctionsAdded++;
				}
				if (!inClass && !line.startsWith('+++')) {
					numClassesAdded++;
				}
				if (line.includes('var') || line.includes('let') || line.includes('const')) {
					numVariablesAdded++;
				}
				if (inComment) {
					numCommentsAdded++;
				}
			} else if (line.startsWith('-')) {
				linesDeleted++;
				if (!inMethod && !line.startsWith('---')) {
					numMethodsDeleted++;
				}
				if (!inFunction && !line.startsWith('---')) {
					numFunctionsDeleted++;
				}
				if (!inClass && !line.startsWith('---')) {
					numClassesDeleted++;
				}
				if (line.includes('var') || line.includes('let') || line.includes('const')) {
					numVariablesDeleted++;
				}
			}

			if (line.startsWith('@@')) {
				inMethod = true; // Entering a method
				inFunction = true; // Entering a function
				inClass = true; // Entering a class
			} else if (line.startsWith('+') || line.startsWith('-')) {
				inComment = false; // Reset comment flag
			} else if (line.startsWith('//')) {
				inComment = true; // Inside a comment
			} else if (line.trim() === '}') {
				inMethod = false; // Exiting a method
				inFunction = false; // Exiting a function
				inClass = false; // Exiting a class
			}
		}
	}

	codeChurn = linesAdded + linesDeleted;

	// Calculate additional business metrics
	productivityImpact = calculateProductivityImpact(linesAdded, linesDeleted, numFilesChanged);
	riskAssessment = assessRisk(numMethodsAdded, numMethodsDeleted, numCommentsAdded);
	documentationImpact = calculateDocumentationImpact(numCommentsAdded);
	estimatedReviewTime = calculateEstimatedReviewTime(linesAdded, linesDeleted, numFilesChanged);
	potentialBugCount = calculatePotentialBugCount(linesAdded, numMethodsAdded, numFunctionsAdded);
	codeComplexityIncrease = calculateCodeComplexityIncrease(numMethodsAdded, numFunctionsAdded, numClassesAdded);

	return {
		linesAdded,
		linesDeleted,
		codeChurn,
		numFilesChanged,
		numMethodsAdded,
		numMethodsDeleted,
		numCommentsAdded,
		numFunctionsAdded,
		numFunctionsDeleted,
		numVariablesAdded,
		numVariablesDeleted,
		numClassesAdded,
		numClassesDeleted,
		productivityImpact,
		riskAssessment,
		documentationImpact,
		estimatedReviewTime,
		potentialBugCount,
		codeComplexityIncrease,
	};
}

// Function to calculate productivity impact based on code changes
export function calculateProductivityImpact(linesAdded, linesDeleted, numFilesChanged) {
	const impact = (linesAdded - linesDeleted) * numFilesChanged;
	return impact;
}

// Function to assess risk based on code changes
export function assessRisk(numMethodsAdded, numMethodsDeleted, numCommentsAdded) {
	let risk = 'Low';
	if (numMethodsAdded > 5 || numMethodsDeleted > 5 || numCommentsAdded > 10) {
		risk = 'Medium';
	}
	if (numMethodsAdded > 10 || numMethodsDeleted > 10 || numCommentsAdded > 20) {
		risk = 'High';
	}
	return risk;
}

// Function to calculate documentation impact based on code changes
export function calculateDocumentationImpact(numCommentsAdded) {
	const impact = numCommentsAdded * 5; // Arbitrary formula
	return impact;
}

// Function to calculate estimated review time based on code changes
export function calculateEstimatedReviewTime(linesAdded, linesDeleted, numFilesChanged) {
	const reviewTime = (linesAdded + linesDeleted) / 50 + numFilesChanged * 2; // Simple heuristic formula
	return reviewTime;
}

// Function to calculate potential bug count based on code changes
export function calculatePotentialBugCount(linesAdded, numMethodsAdded, numFunctionsAdded) {
	const bugCount = (linesAdded / 100) + numMethodsAdded + numFunctionsAdded; // Simple heuristic formula
	return bugCount;
}

// Function to calculate code complexity increase based on code changes
export function calculateCodeComplexityIncrease(numMethodsAdded, numFunctionsAdded, numClassesAdded) {
	const complexityIncrease = numMethodsAdded * 1.5 + numFunctionsAdded * 2 + numClassesAdded * 3; // Simple heuristic formula
	return complexityIncrease;
}

// Function to calculate approximate review time based on code changes
export function calculateApproximateReviewTime(codeChurn, totalComments, totalCommits) {
	const averageReviewSpeed = 20; // Lines per minute
	const averageCommentReviewSpeed = 5; // Comments per minute
	const averageCommitReviewSpeed = 2; // Commits per minute
	const baseReviewTime = 15; // Base review time in minutes

	const approximateReviewTime = (codeChurn / averageReviewSpeed) +
		(totalComments / averageCommentReviewSpeed) +
		(totalCommits / averageCommitReviewSpeed) +
		baseReviewTime;
	return approximateReviewTime;
}

// Function to analyze comments and derive insights
export function analyzeComments(comments) {
	let totalComments = 0;
	let positiveComments = 0;
	let negativeComments = 0;
	let neutralComments = 0;
	let commentsWithActionItems = 0;
	let commentsWithQuestions = 0;
	let avgCommentLength = 0;

	comments.forEach(comment => {
		totalComments++;
		const commentBody = comment.body.toLowerCase();

		// Analyze sentiment of the comment
		const sentiment = analyzeSentiment(commentBody);
		if (sentiment === 'positive') {
			positiveComments++;
		} else if (sentiment === 'negative') {
			negativeComments++;
		} else {
			neutralComments++;
		}

		// Check for action items in the comment
		if (commentBody.includes('todo') || commentBody.includes('fix') || commentBody.includes('action')) {
			commentsWithActionItems++;
		}

		// Check for questions in the comment
		if (commentBody.includes('?')) {
			commentsWithQuestions++;
		}

		// Calculate average comment length
		avgCommentLength += commentBody.length;
	});

	avgCommentLength = totalComments ? avgCommentLength / totalComments : 0;

	return {
		totalComments,
		positiveComments,
		negativeComments,
		neutralComments,
		commentsWithActionItems,
		commentsWithQuestions,
		avgCommentLength,
	};
}

// Simple sentiment analysis function
function analyzeSentiment(comment) {
	// Basic sentiment analysis based on keywords
	const positiveKeywords = ['good', 'great', 'excellent', 'nice', 'well done', 'thanks'];
	const negativeKeywords = ['bad', 'poor', 'terrible', 'awful', 'needs improvement', 'fix'];
	let sentiment = 'neutral';

	for (const keyword of positiveKeywords) {
		if (comment.includes(keyword)) {
			sentiment = 'positive';
			break;
		}
	}

	for (const keyword of negativeKeywords) {
		if (comment.includes(keyword)) {
			sentiment = 'negative';
			break;
		}
	}

	return sentiment;
}

// Function to analyze reactions and derive insights
export function analyzeReactions(reactions) {
	let totalReactions = 0;
	let thumbsUp = 0;
	let thumbsDown = 0;
	let laughs = 0;
	let hoorays = 0;
	let confused = 0;
	let hearts = 0;
	let rockets = 0;
	let eyes = 0;

	reactions.forEach(reaction => {
		totalReactions++;
		switch (reaction.content) {
			case 'thumbs_up':
			case '+1':
				thumbsUp++;
				break;
			case 'thumbs_down':
			case '-1':
				thumbsDown++;
				break;
			case 'laugh':
				laughs++;
				break;
			case 'hooray':
				hoorays++;
				break;
			case 'confused':
				confused++;
				break;
			case 'heart':
				hearts++;
				break;
			case 'rocket':
				rockets++;
				break;
			case 'eyes':
				eyes++;
				break;
		}
	});

	return {
		totalReactions,
		thumbsUp,
		thumbsDown,
		laughs,
		hoorays,
		confused,
		hearts,
		rockets,
		eyes,
	};
}


// Function to analyze commits and derive insights
export function analyzeCommits(commits) {
	let totalCommits = 0;
	let avgCommitMessageLength = 0;
	let commitMessageLength = 0;
	let commitFrequency = 0;
	let significantChanges = 0;

	commits.forEach(commit => {
		totalCommits++;
		const messageLength = commit.commit.message.length;
		commitMessageLength += messageLength;

		if (messageLength > 50) { // Assuming a significant commit message length is > 50
			significantChanges++;
		}
	});

	avgCommitMessageLength = totalCommits ? commitMessageLength / totalCommits : 0;
	commitFrequency = totalCommits; // Assuming each commit is made at regular intervals

	return {
		totalCommits,
		avgCommitMessageLength,
		commitFrequency,
		significantChanges,
	};
}

// Function to derive meaningful business insights from reactions and commits
export function deriveBusinessInsights(reactionInsights, commitInsights) {
	let communityEngagement = 'Low';
	let overallSentiment = 'Neutral';
	let developmentEfficiency = 'Average';
	let significantChangesImpact = 'Low';

	if (reactionInsights.totalReactions > 10) {
		communityEngagement = 'High';
	} else if (reactionInsights.totalReactions > 5) {
		communityEngagement = 'Medium';
	}

	const positiveReactions = reactionInsights.thumbsUp + reactionInsights.hoorays + reactionInsights.hearts;
	const negativeReactions = reactionInsights.thumbsDown + reactionInsights.confused;

	if (positiveReactions > negativeReactions) {
		overallSentiment = 'Positive';
	} else if (negativeReactions > positiveReactions) {
		overallSentiment = 'Negative';
	}

	if (commitInsights.avgCommitMessageLength > 50 && commitInsights.significantChanges > 5) {
		significantChangesImpact = 'High';
	} else if (commitInsights.avgCommitMessageLength > 25) {
		significantChangesImpact = 'Medium';
	}

	developmentEfficiency = commitInsights.commitFrequency > 10 ? 'High' : 'Average';

	return {
		communityEngagement,
		overallSentiment,
		developmentEfficiency,
		significantChangesImpact,
	};
}
