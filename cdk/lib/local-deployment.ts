import * as cdk from '@aws-cdk/core';
import { ServiceStack } from './service';

export class LocalDeploymentStage extends cdk.Stage {
    
  public readonly serviceStack: ServiceStack;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    this.serviceStack = new ServiceStack(this, 'Service');
    
  }
}
