import {
  convertNxGenerator,
  extractLayoutDirectory,
  GeneratorCallback,
  names,
  runTasksInSerial,
  Tree,
} from '@nx/devkit';
import { Linter } from '@nx/eslint';
import { applicationGenerator } from '@nx/node';
import { setupFunctionsGenerator } from '../setup-functions/setup-functions';
import { Schema } from './schema';

function normalizeOptions(options: Schema): Schema {
  const { projectDirectory } = extractLayoutDirectory(options.directory);
  const appDirectory = projectDirectory
    ? `${names(projectDirectory).fileName}/${names(options.name).fileName}`
    : names(options.name).fileName;

  const appProjectName = appDirectory.replace(new RegExp('/', 'g'), '-');
  return {
    ...options,
    name: names(appProjectName).fileName,
    lintTarget: options.lintTarget ?? 'lint',
    linter: options.linter ?? Linter.EsLint,
    unitTestRunner: options.unitTestRunner ?? 'jest',
  };
}

export async function serverlessGenerator(tree: Tree, schema: Schema) {
  const options = normalizeOptions(schema);
  const tasks: GeneratorCallback[] = [];

  const init = await applicationGenerator(tree, {
    ...options,
    framework: 'none',
    e2eTestRunner: 'none',
    rootProject: true,
  });

  tasks.push(init);

  const addAwsLamdaTask = await setupFunctionsGenerator(tree, options);

  tasks.push(addAwsLamdaTask);

  tree.delete('tools');
  tree.delete('src');

  return runTasksInSerial(...tasks);
}

export default serverlessGenerator;
export const serverlessGeneratorSchematic =
  convertNxGenerator(serverlessGenerator);
