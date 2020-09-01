import * as cdk from '@aws-cdk/core';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import { CdkPipeline, SimpleSynthAction } from '@aws-cdk/pipelines';

export class AppInfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();

    const pipeline = new CdkPipeline(this, 'CdkPipeline', {
      pipelineName: 'cdk-cdkpipeline',
      cloudAssemblyArtifact: cloudAssemblyArtifact,

      sourceAction: new codepipeline_actions.GitHubSourceAction({
        actionName: 'Download Sources',

        // NOTE: Specify your source repository here.
        owner: 'binxio',
        repo: 'blog-cdk-cicd-cdkpipeline',
        oauthToken: cdk.SecretValue.ssmSecure('/github.com/binxio', '1'),
        output: sourceArtifact,
      }),

      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact: sourceArtifact,
        cloudAssemblyArtifact: cloudAssemblyArtifact,
        subdirectory: 'cdk',
      }),
    });
  }
}
