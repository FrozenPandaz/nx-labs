import { joinPathFragments, readProjectConfiguration, Tree } from '@nx/devkit';
import { NormalizedSchema } from '../schema';

export function createOrUpdateConfigFiles(
  tree: Tree,
  options: NormalizedSchema
) {
  const project = readProjectConfiguration(tree, options.projectName);
  const samConfigTomlPath = joinPathFragments(project.root, 'samconfig.toml');
  const templateYamlPath = joinPathFragments(project.root, 'template.yaml');

  if (!tree.exists(samConfigTomlPath)) {
    const samConfigToml = `
# More information about the configuration file can be found here:
# https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-config.html
version = 0.1

[default]
[default.global.parameters]
stack_name = "${options.projectName}"

[default.build.parameters]
cached = true
parallel = true

[default.validate.parameters]
lint = true

[default.deploy.parameters]
capabilities = "CAPABILITY_IAM"
confirm_changeset = true
resolve_s3 = true

[default.package.parameters]
resolve_s3 = true

[default.sync.parameters]
watch = true

[default.local_start_api.parameters]
warm_containers = "EAGER"

[default.local_start_lambda.parameters]
warm_containers = "EAGER"
`;

    tree.write(samConfigTomlPath, samConfigToml);
  }

  const metaContent = tree.exists(templateYamlPath)
    ? tree.read(templateYamlPath).toString('utf-8')
    : `
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: >
  ${options.projectName}
`;

  const fnsContent = `
# More info about Globals: https://github.com/awslabs/serverless-application-model/blob/master/docs/globals.rst
Globals:
  Function:
    Timeout: 3

Resources:
  HelloWorldFunction:
    Type: AWS::Serverless::Function # More info about Function Resource: https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#awsserverlessfunction
    Properties:
      CodeUri: functions/hello-world
      Handler: app.lambdaHandler
      Runtime: nodejs18.x
      Architectures:
        - x86_64
      Events:
        HelloWorld:
          Type: Api # More info about API Event Source: https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#api
          Properties:
            Path: /hello
            Method: get
    Metadata: # Manage esbuild properties
      BuildMethod: esbuild
      BuildProperties:
        Minify: true
        Target: "es2020"
        Sourcemap: false
        EntryPoints:
        - app.ts

Outputs:
  # ServerlessRestApi is an implicit API created out of Events key under Serverless::Function
  # Find out more about other implicit resources you can reference within SAM
  # https://github.com/awslabs/serverless-application-model/blob/master/docs/internals/generated_resources.rst#api
  HelloWorldApi:
    Description: "API Gateway endpoint URL for Prod stage for Hello World function"
    Value: !Sub "https://\${ServerlessRestApi}.execute-api.\${AWS::Region}.amazonaws.com/Prod/hello/"
  HelloWorldFunction:
    Description: "Hello World Lambda Function ARN"
    Value: !GetAtt HelloWorldFunction.Arn
  HelloWorldFunctionIamRole:
    Description: "Implicit IAM Role created for Hello World function"
    Value: !GetAtt HelloWorldFunctionRole.Arn
`;

  tree.write(templateYamlPath, `${metaContent}\n${fnsContent}`);
}
