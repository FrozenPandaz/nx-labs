import {
  addProjectConfiguration,
  joinPathFragments,
  ProjectConfiguration,
  Tree,
} from '@nx/devkit';
import { NormalizedSchema } from './normalize-options';

export function addProject(host: Tree, options: NormalizedSchema) {
  const targets: Record<string, any> = {};

  targets.build = {
    builder: '@nx/gatsby:build',
    options: {
      outputPath: `${options.projectRoot}/public`,
      uglify: true,
      color: true,
      profile: false,
    },
    configurations: {
      production: {},
    },
  };

  targets.serve = {
    builder: '@nx/gatsby:server',
    options: {
      buildTarget: `${options.projectName}:build`,
    },
    configurations: {
      production: {
        buildTarget: `${options.projectName}:build:production`,
      },
    },
  };

  const project: ProjectConfiguration = {
    root: options.projectRoot,
    sourceRoot: joinPathFragments(options.projectRoot, 'src'),
    projectType: 'application',
    targets,
    tags: options.parsedTags,
  };

  addProjectConfiguration(
    host,
    options.projectName,
    project,
    options.standaloneConfig
  );
}
