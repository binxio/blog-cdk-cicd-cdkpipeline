#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CicdInfraStack } from '../lib/cicd-infra';

const app = new cdk.App();
new CicdInfraStack(app, 'CicdInfraStack');

app.synth();
