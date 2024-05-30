const { VertexAI } = require('@google-cloud/vertexai');

// Initialize Vertex with your Cloud project and location
const vertex_ai = new VertexAI({ project: 'levelops-dev', location: 'us-central1' });
const model = 'gemini-1.5-pro-001';


// Instantiate the models
const generativeModel = vertex_ai.preview.getGenerativeModel({
    model: model,
    generationConfig: {
        'maxOutputTokens': 8192,
        'temperature': 1,
        'topP': 0.95,
    },
    systemInstruction: {
        parts: [
            {
                text: `Please look at the code diff provided  as "diff" in the prompt and pr event provided as "pr_event" and give me your review comments for code quality 
    Provide the response in the following JSON format: {"reviews": 
    [body: <review comment>,
    commit_id: <commit_id>,
    path: <path>,
    start_line: <start_line>,
    start_side: <start_side>,
    line: <line>,
    side: <side>
    } 
    ]}
    Make sure side is always upper case
    Make sure you choose the right commit_id from pr_event`}]
    },
});


// JSON string
const eventData = {
    action: 'reopened',
    number: 4,
    pull_request: {
        url: 'https://api.github.com/repos/harshil562/harshil562.github.io/pulls/4',
        id: 1891820174,
        node_id: 'PR_kwDOA9ZxJ85wwuKO',
        html_url: 'https://github.com/harshil562/harshil562.github.io/pull/4',
        diff_url: 'https://github.com/harshil562/harshil562.github.io/pull/4.diff',
        patch_url: 'https://github.com/harshil562/harshil562.github.io/pull/4.patch',
        issue_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/issues/4',
        number: 4,
        state: 'open',
        locked: false,
        title: 'Sample pr 4',
        user: {
            login: 'harshil562',
            id: 13053442,
            node_id: 'MDQ6VXNlcjEzMDUzNDQy',
            avatar_url: 'https://avatars.githubusercontent.com/u/13053442?v=4',
            gravatar_id: '',
            url: 'https://api.github.com/users/harshil562',
            html_url: 'https://github.com/harshil562',
            followers_url: 'https://api.github.com/users/harshil562/followers',
            following_url: 'https://api.github.com/users/harshil562/following{/other_user}',
            gists_url: 'https://api.github.com/users/harshil562/gists{/gist_id}',
            starred_url: 'https://api.github.com/users/harshil562/starred{/owner}{/repo}',
            subscriptions_url: 'https://api.github.com/users/harshil562/subscriptions',
            organizations_url: 'https://api.github.com/users/harshil562/orgs',
            repos_url: 'https://api.github.com/users/harshil562/repos',
            events_url: 'https://api.github.com/users/harshil562/events{/privacy}',
            received_events_url: 'https://api.github.com/users/harshil562/received_events',
            type: 'User',
            site_admin: false
        },
        body: null,
        created_at: '2024-05-28T12:50:20Z',
        updated_at: '2024-05-29T14:57:27Z',
        closed_at: null,
        merged_at: null,
        merge_commit_sha: '03104532aebe4cfbeafc1f4681709b093e6fe1b1',
        assignee: null,
        assignees: [],
        requested_reviewers: [],
        requested_teams: [],
        labels: [],
        milestone: null,
        draft: false,
        commits_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/pulls/4/commits',
        review_comments_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/pulls/4/comments',
        review_comment_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/pulls/comments{/number}',
        comments_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/issues/4/comments',
        statuses_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/statuses/2cbf3852881e07cb0f8e483f68f5edc1ed5c24a1',
        head: {
            label: 'harshil562:sample-pr-4',
            ref: 'sample-pr-4',
            sha: '2cbf3852881e07cb0f8e483f68f5edc1ed5c24a1',
            user: [Object],
            repo: [Object]
        },
        base: {
            label: 'harshil562:master',
            ref: 'master',
            sha: 'b6226ce46e64da8efc7224987c621eb78db9cfee',
            user: [Object],
            repo: [Object]
        },
        _links: {
            self: [Object],
            html: [Object],
            issue: [Object],
            comments: [Object],
            review_comments: [Object],
            review_comment: [Object],
            commits: [Object],
            statuses: [Object]
        },
        author_association: 'OWNER',
        auto_merge: null,
        active_lock_reason: null,
        merged: false,
        mergeable: null,
        rebaseable: null,
        mergeable_state: 'unknown',
        merged_by: null,
        comments: 97,
        review_comments: 15,
        maintainer_can_modify: false,
        commits: 5,
        additions: 61,
        deletions: 69,
        changed_files: 2
    },
    repository: {
        id: 64385319,
        node_id: 'MDEwOlJlcG9zaXRvcnk2NDM4NTMxOQ==',
        name: 'harshil562.github.io',
        full_name: 'harshil562/harshil562.github.io',
        private: false,
        owner: {
            login: 'harshil562',
            id: 13053442,
            node_id: 'MDQ6VXNlcjEzMDUzNDQy',
            avatar_url: 'https://avatars.githubusercontent.com/u/13053442?v=4',
            gravatar_id: '',
            url: 'https://api.github.com/users/harshil562',
            html_url: 'https://github.com/harshil562',
            followers_url: 'https://api.github.com/users/harshil562/followers',
            following_url: 'https://api.github.com/users/harshil562/following{/other_user}',
            gists_url: 'https://api.github.com/users/harshil562/gists{/gist_id}',
            starred_url: 'https://api.github.com/users/harshil562/starred{/owner}{/repo}',
            subscriptions_url: 'https://api.github.com/users/harshil562/subscriptions',
            organizations_url: 'https://api.github.com/users/harshil562/orgs',
            repos_url: 'https://api.github.com/users/harshil562/repos',
            events_url: 'https://api.github.com/users/harshil562/events{/privacy}',
            received_events_url: 'https://api.github.com/users/harshil562/received_events',
            type: 'User',
            site_admin: false
        },
        html_url: 'https://github.com/harshil562/harshil562.github.io',
        description: null,
        fork: false,
        url: 'https://api.github.com/repos/harshil562/harshil562.github.io',
        forks_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/forks',
        keys_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/keys{/key_id}',
        collaborators_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/collaborators{/collaborator}',
        teams_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/teams',
        hooks_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/hooks',
        issue_events_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/issues/events{/number}',
        events_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/events',
        assignees_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/assignees{/user}',
        branches_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/branches{/branch}',
        tags_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/tags',
        blobs_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/git/blobs{/sha}',
        git_tags_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/git/tags{/sha}',
        git_refs_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/git/refs{/sha}',
        trees_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/git/trees{/sha}',
        statuses_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/statuses/{sha}',
        languages_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/languages',
        stargazers_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/stargazers',
        contributors_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/contributors',
        subscribers_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/subscribers',
        subscription_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/subscription',
        commits_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/commits{/sha}',
        git_commits_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/git/commits{/sha}',
        comments_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/comments{/number}',
        issue_comment_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/issues/comments{/number}',
        contents_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/contents/{+path}',
        compare_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/compare/{base}...{head}',
        merges_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/merges',
        archive_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/{archive_format}{/ref}',
        downloads_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/downloads',
        issues_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/issues{/number}',
        pulls_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/pulls{/number}',
        milestones_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/milestones{/number}',
        notifications_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/notifications{?since,all,participating}',
        labels_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/labels{/name}',
        releases_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/releases{/id}',
        deployments_url: 'https://api.github.com/repos/harshil562/harshil562.github.io/deployments',
        created_at: '2016-07-28T10:11:53Z',
        updated_at: '2018-08-04T15:19:56Z',
        pushed_at: '2024-05-28T12:50:21Z',
        git_url: 'git://github.com/harshil562/harshil562.github.io.git',
        ssh_url: 'git@github.com:harshil562/harshil562.github.io.git',
        clone_url: 'https://github.com/harshil562/harshil562.github.io.git',
        svn_url: 'https://github.com/harshil562/harshil562.github.io',
        homepage: null,
        size: 24994,
        stargazers_count: 0,
        watchers_count: 0,
        language: 'JavaScript',
        has_issues: true,
        has_projects: true,
        has_downloads: true,
        has_wiki: true,
        has_pages: true,
        has_discussions: false,
        forks_count: 0,
        mirror_url: null,
        archived: false,
        disabled: false,
        open_issues_count: 2,
        license: null,
        allow_forking: true,
        is_template: false,
        web_commit_signoff_required: false,
        topics: [],
        visibility: 'public',
        forks: 0,
        open_issues: 2,
        watchers: 0,
        default_branch: 'master'
    },
    sender: {
        login: 'harshil562',
        id: 13053442,
        node_id: 'MDQ6VXNlcjEzMDUzNDQy',
        avatar_url: 'https://avatars.githubusercontent.com/u/13053442?v=4',
        gravatar_id: '',
        url: 'https://api.github.com/users/harshil562',
        html_url: 'https://github.com/harshil562',
        followers_url: 'https://api.github.com/users/harshil562/followers',
        following_url: 'https://api.github.com/users/harshil562/following{/other_user}',
        gists_url: 'https://api.github.com/users/harshil562/gists{/gist_id}',
        starred_url: 'https://api.github.com/users/harshil562/starred{/owner}{/repo}',
        subscriptions_url: 'https://api.github.com/users/harshil562/subscriptions',
        organizations_url: 'https://api.github.com/users/harshil562/orgs',
        repos_url: 'https://api.github.com/users/harshil562/repos',
        events_url: 'https://api.github.com/users/harshil562/events{/privacy}',
        received_events_url: 'https://api.github.com/users/harshil562/received_events',
        type: 'User',
        site_admin: false
    }
}
const diffText = `diff --git a/mygithub/src/components/github/Profile.js b/mygithub/src/components/github/Profile.js
index 2ac34c46..fdecbdd1 100644
--- a/mygithub/src/components/github/Profile.js
+++ b/mygithub/src/components/github/Profile.js
@@ -1,58 +1,59 @@
-import React,{Component} from 'react';
+import React, { Component } from 'react';
 import RepoList from './RepoList.js';
-class Profile extends Component{
-	
-	render(){
-// Nesting profile component in App component
-		return(
+class Profile extends Component {
+
+	render() {
+		// Nesting profile component in App component
+		return (
 			<div>
 				<div className="panel panel-default">
-					  <div className="panel-heading"></div>
-					  <div className="panel-body">
-					    <h1> Name :{this.props.userData.name} </h1>
-					  </div>
+					<div className="panel-heading"></div>
+					<div className="panel-body">
+						<h1> Name :{this.props.userData.name} </h1>
+					</div>
 				</div>
 
 				<div className="panel panel-default">
-					  <div className="panel-heading">
-					  <h3 className="panel-title">Github Profile</h3>
-					  </div>
-					  <div className="panel-body">
-					    <div className ="row">
-						    <div className="col-md-4">
-						    <img src ={this.props.userData.avatar_url} className ="thumbnail" style ={{width:"50%"}}/>
+					<div className="panel-heading">
+						<h3 className="panel-title">Github Profile</h3>
+						<h3 className="panel-title"> Profile</h3>
+					</div>
+					<div className="panel-body">
+						<div className="row">
+							<div className="col-md-4">
+								<img src={this.props.userData.avatar_url} className="thumbnail" style={{ width: "50%" }} />
 
-						    </div>
-						    <div className ="col-md-8">
-				    			<div className="row">
-			    					<div className="col-md-12">
-			    						<span className="label label-primary">{this.props.userData.public_repos} Repos</span>
-			    						<span className="label label-success">{this.props.userData.public_gists} Public Gists</span>
-			    						<span className="label label-info">{this.props.userData.followers} Followers</span>
-			    						<span className="label label-danger">{this.props.userData.following} Following</span>
-		    						</div>
-	    						</div>
-	    						<hr/>
-	    						<div className="row">
-	    							<div className ="col-md-12">
-	    								<ul className="list-group">
-    										<li className="list-group-item"><strong>Username: </strong>{this.props.userData.login}</li>
-    										<li className="list-group-item"><strong>Location: </strong>{this.props.userData.location}</li>
-    										<li className="list-group-item"><strong>Email: </strong>{this.props.userData.email}</li>
+							</div>
+							<div className="col-md-8">
+								<div className="row">
+									<div className="col-md-12">
+										<span className="label label-primary">{this.props.userData.public_repos} Repos</span>
+										<span className="label label-success">{this.props.userData.public_gists} Public Gists</span>
+										<span className="label label-info">{this.props.userData.followers} Followers</span>
+										<span className="label label-danger">{this.props.userData.following} Following</span>
+									</div>
+								</div>
+								<hr />
+								<div className="row">
+									<div className="col-md-12">
+										<ul className="list-group">
+											<li className="list-group-item"><strong>Username: </strong>{this.props.userData.login}</li>
+											<li className="list-group-item"><strong>Location: </strong>{this.props.userData.location}</li>
+											<li className="list-group-item"><strong>Email: </strong>{this.props.userData.email}</li>
 										</ul>
 
-	    							</div>
-	    						</div>
-	    						<br/>
-	    						<a className ="btn btn-primary" target="_blank" href={this.props.userData.html_url}>Visit Profile </a>
-    						</div>
+									</div>
+								</div>
+								<br />
+								<a className="btn btn-primary" target="_blank" href={this.props.userData.html_url}>Visit Profile </a>
+							</div>
 						</div>
-					  </div>
-					  <hr/>
-			  		<div className="container">
-				  				<h3> User Repositories</h3>
-		  			</div>
-					<RepoList userRepos ={this.props.userRepos}/>
+					</div>
+					<hr />
+					<div className="container">
+						<h3> User Repositories</h3>
+					</div>
+					<RepoList userRepos={this.props.userRepos} />
 				</div>
 			</div>
 		)
diff --git a/reactquiz/src/components/quiz/Results.js b/reactquiz/src/components/quiz/Results.js
index b2be1827..1fb7f901 100644
--- a/reactquiz/src/components/quiz/Results.js
+++ b/reactquiz/src/components/quiz/Results.js
@@ -1,34 +1,25 @@
-import React,{Component} from 'react';
-
-
-class Results extends Component{
-
+import React, { Component } from 'react';
 
+class Results extends Component {
 	render() {
-
-		var percent =(this.props.score / this.props.questions.length*100);
-		if (percent > 80){
-
-			var message ='Awesome Job!';
-		} else if(percent < 80 && percent >60)
-		{
-			var message = 'You did Ok !';
-		}
-		else {
-
-			var message ='Not satisfactory. Should try once again !';
+		const percent = (this.props.score / this.props.questions.length * 100 * 100);
+		let message;
+		if (percent > 80) {
+			message = 'Awesome Job!!';
+		} else if (percent > 60) {
+			message = 'You did Ok!';
+		} else {
+			message = 'Not satisfactory. Should try once again!!!';
 		}
-		return(
+		return (
 			<div className="well">
-				<h4> You got {this.props.score} out of {this.props.questions.length} Correct</h4>
+				<h4>You got {this.props.score} out of {this.props.questions.length} Correct</h4>
 				<h1>{percent}% - {message}</h1>
 				<hr />
-				<a href ="https://harshil562.github.io/reactquiz/app/"> Take again </a>
-
+				<a href="https://harshil562.github.io/reactquiz/app/">Take again</a>
 			</div>
-		)
+		);
 	}
 }
 
-//some apis will going to expose it's json code to us , then only we can get the database access
-export default Results
+export default Results;`;


async function generateContent(eventData, diffText) {
    const prompt = { text: `pr_event - ${JSON.stringify(eventData)} ${diffText}` };
    console.log('prompt is', prompt)
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
}

generateContent();

