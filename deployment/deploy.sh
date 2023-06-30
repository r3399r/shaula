#!/bin/bash
set -e

env=$1
project=shaula
# subDomain=wedding
# domain=celestialstudio.net
s3bucket=y-cf-midway-singapore # line2-cf-midway

echo ====================================================================================
echo env: $env
echo project: $project
# echo domain: $subDomain.$domain
echo ====================================================================================

echo deploy backend AWS...
cd ../backend
npm i
npm run pre:deploy
aws cloudformation package --template-file aws/cloudformation/template.yaml --output-template-file packaged.yaml --s3-bucket $s3bucket
aws cloudformation deploy --template-file packaged.yaml --stack-name $project-$env-stack --parameter-overrides TargetEnvr=$env Project=$project --no-fail-on-empty-changeset --s3-bucket $s3bucket --capabilities CAPABILITY_NAMED_IAM
echo ====================================================================================

echo deploy frontend to S3...
cd ../frontend
npm i
npm run pre:deploy
aws s3 sync ./dist s3://$project-$env-frontend --delete --cache-control no-cache
# http://shaula-dev-frontend.s3-website-ap-southeast-1.amazonaws.com/
echo ====================================================================================
