import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecr from '@aws-cdk/aws-ecr';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns';

export class ServiceStack extends cdk.Stack {

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
    const imageTag = process.env.CODEBUILD_RESOLVED_SOURCE_VERSION || 'local';

    const cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: 'cdk-cicd',
      vpc: vpc,
    });

    const albService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'Service', {
      cluster: cluster,
      cpu: 256,
      memoryLimitMiB: 512,
      taskImageOptions: {
        containerName: 'app',
        containerPort: 8080,
        image: ecs.ContainerImage.fromEcrRepository(repository, imageTag),
      },

      publicLoadBalancer: true,
      healthCheckGracePeriod: cdk.Duration.seconds(10),
    });

    const serviceScaling = albService.service.autoScaleTaskCount({ maxCapacity: 10 });
    serviceScaling.scaleOnCpuUtilization('ScalingCpu', {
      targetUtilizationPercent: 60,
    });

    albService.targetGroup.setAttribute("deregistration_delay.timeout_seconds", "30");

    albService.targetGroup.configureHealthCheck({
      enabled: true,
      path: '/_health',
    })
  }
}
