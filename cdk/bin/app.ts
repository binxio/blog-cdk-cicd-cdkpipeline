#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AppInfraStack } from '../lib/app-infra';

const app = new cdk.App();
new AppInfraStack(app, 'PipelineStack');
