# CDK CI/CD using CdkPipeline
Example CDK CI/CD pipeline using CdkPipeline and a single AWS account. Read the associated blog for more information: https://binx.io/blog/2020/09/02/implementing-aws-cdk-cicd-with-cdk-pipelines/

## Prepare your account

1. Bootstrap CDK: [cdk bootstrap instructions](https://docs.aws.amazon.com/cdk/latest/guide/cli.html#cli-bootstrap).
2. Configure the source repository access token: [GitHub instructions](https://docs.aws.amazon.com/codepipeline/latest/userguide/action-reference-GitHub.html).

## Deploy the pipeline once and once only

The pipeline will update itself. To do so, however, it needs to exist. Thus run `cdk deploy CicdInfraStack` once.

## Update the application

Change the Hello World app to something else, push your changes and view the new application in AWS in minutes.