import * as cdk from '@aws-cdk/core';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as ecr from '@aws-cdk/aws-ecr'
import * as iam from '@aws-cdk/aws-iam';
import { CdkPipeline, SimpleSynthAction } from '@aws-cdk/pipelines';

// NOTE: Create the pipeline and CI/CD infra such as ECR/S3
export class CicdInfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repository = new ecr.Repository(this, 'Repository', {
      repositoryName: 'cdk-cicd/app',
    });

    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();
    const containerArtifact = new codepipeline.Artifact();

    const pipeline = new CdkPipeline(this, 'CdkPipeline', {
      pipelineName: 'cdk-cdkpipeline',
      cloudAssemblyArtifact: cloudAssemblyArtifact,

      sourceAction: new codepipeline_actions.GitHubSourceAction({
        actionName: 'DownloadSources',

        // NOTE: Specify your source repository here.
        owner: 'binxio',
        repo: 'blog-cdk-cicd-cdkpipeline',
        oauthToken: cdk.SecretValue.secretsManager('/github.com/binxio', {
          jsonField: 'token'
        }),
        output: sourceArtifact,
      }),

      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact: sourceArtifact,
        cloudAssemblyArtifact: cloudAssemblyArtifact,
        subdirectory: 'cdk',
      }),
    });

    const buildRole = new iam.Role(this, 'DockerBuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
    });
    repository.grantPullPush(buildRole);

    const build = new codebuild.Project(this, 'DockerBuild', {
      role: buildRole,
      environment: {
        environmentVariables: {
          'REPOSITORY_URI': { value: repository.repositoryUri },
        },
        privileged: true,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              '$(aws ecr get-login --no-include-email --region $AWS_DEFAULT_REGION)',
            ]
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building the Docker image...',
              'docker build -t $REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION .',
            ]
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Pushing the Docker image...',
              'docker push $REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION',
            ]
          }
        }
      }),
    });

    const buildStage = pipeline.addStage('BuildApp')
    buildStage.addActions(new codepipeline_actions.CodeBuildAction({
      actionName: 'DockerBuild',
      project: build,
      input: sourceArtifact,
    }));

  }
}
