import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns';

export class ServiceStack extends cdk.Stack {
  static readonly ImageTagParameter: string = "ImageTag";

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'MyVpc', {
      cidr: '192.168.0.0/22',
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: 'Private', 
          subnetType: ec2.SubnetType.PRIVATE
        },
      ],
      maxAzs: 2
    });

    const repository = ecr.Repository.fromRepositoryName(this, 'Repository', 'cdk-cicd/app');
    const imageTag = new cdk.CfnParameter(this, ServiceStack.ImageTagParameter, {
      type: 'String',
      default: 'latest',
    });

    const cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: 'cdk-cicd',
      vpc: vpc,
    });

    new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'Service', {
      cluster: cluster,
      cpu: 256,
      memoryLimitMiB: 512,
      desiredCount: 2,
      taskImageOptions: {
        containerName: 'app',
        containerPort: 8080,
        image: ecs.ContainerImage.fromEcrRepository(repository, imageTag.valueAsString),
      },
      publicLoadBalancer: true,
    });
  }
}
