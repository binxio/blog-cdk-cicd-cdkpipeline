import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as ecr from '@aws-cdk/aws-ecr'
import * as iam from '@aws-cdk/aws-iam';
import * as pipelines from '@aws-cdk/pipelines';

import { LocalDeploymentStage } from './local-deployment';

// NOTE: Create the pipeline and CI/CD infra such as ECR/S3
export class CicdInfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repository = new ecr.Repository(this, 'Repository', {
      repositoryName: 'cdk-cicd/app',
    });

    const sourceArtifact = new codepipeline.Artifact('github');
    const cdkOutputArtifact = new codepipeline.Artifact('templates');

    const pipeline = new pipelines.CdkPipeline(this, 'CdkPipeline', {
      pipelineName: 'cdk-cdkpipeline',
      cloudAssemblyArtifact: cdkOutputArtifact,

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

      synthAction: pipelines.SimpleSynthAction.standardNpmSynth({
        sourceArtifact: sourceArtifact,
        cloudAssemblyArtifact: cdkOutputArtifact,
        subdirectory: 'cdk',
      }),
    });

    // Build and Publish application artifacts
    const buildStage = pipeline.addStage('Build')

    const buildRole = new iam.Role(this, 'DockerBuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
    });
    repository.grantPullPush(buildRole);

    const build = new codebuild.Project(this, 'DockerBuild', {
      role: buildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
        privileged: true,
      },
      buildSpec: this.getDockerBuildSpec(repository.repositoryUri),
    });

    buildStage.addActions(new codepipeline_actions.CodeBuildAction({
      actionName: 'DockerBuild',
      project: build,
      input: sourceArtifact,
    }));

    // Deploy - Local
    const localStage = new LocalDeploymentStage(this, 'DeployLocal');
    pipeline.addApplicationStage(localStage);
  }

  getDockerBuildSpec(repositoryUri: string): codebuild.BuildSpec {
    return codebuild.BuildSpec.fromObject({
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
            `docker build -t ${repositoryUri}:$CODEBUILD_RESOLVED_SOURCE_VERSION .`,
          ]
        },
        post_build: {
          commands: [
            'echo Build completed on `date`',
            'echo Pushing the Docker image...',
            `docker push ${repositoryUri}:$CODEBUILD_RESOLVED_SOURCE_VERSION`,
          ]
        },
      },
    });
  }

  getStackArtifactTemplatePath(stage: cdk.Stage, artifactId: string): string {
    const stageAssembly = stage.synth();
    const stageStackArtifact = stageAssembly.getStackArtifact(artifactId);

    const fullTemplatePath = path.join(stageAssembly.directory, stageStackArtifact.templateFile);
    const artifactTemplatePath = path.relative('cdk.out/', fullTemplatePath);
    return artifactTemplatePath;
  }
}
