import * as cdk from '@aws-cdk/core';
import * as ecr from '@aws-cdk/aws-ecr'
import { ServiceStack } from './service';

export interface LocalDeploymentStageProps extends cdk.StageProps {

    imageTag: string,
}

export class LocalDeploymentStage extends cdk.Stage {

  constructor(scope: cdk.Construct, id: string, props: LocalDeploymentStageProps) {
    super(scope, id, props);

    const service = new ServiceStack(this, 'Service', {
        imageTag: props.imageTag,
    });
    

  }
}
