export const AGENT_TOOLS = [
  {
    name: 'read_file',
    description: 'Read the contents of a file at the given path in the project.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The file path relative to the project root (e.g., "src/App.jsx")',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write content to a file at the given path. Creates the file and any parent directories if they do not exist. Overwrites existing content.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The file path relative to the project root (e.g., "src/components/Header.jsx")',
        },
        content: {
          type: 'string',
          description: 'The full content to write to the file',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'run_command',
    description: 'Run a shell command in the project sandbox. Use for installing packages, running builds, starting dev servers, etc.',
    input_schema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to run (e.g., "npm install axios")',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'list_files',
    description: 'List all files and directories in the project, optionally from a specific path.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Optional subdirectory to list (defaults to project root)',
        },
      },
      required: [],
    },
  },
  {
    name: 'search_code',
    description: 'Search for a pattern across all project files. Returns matching lines with file paths.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search pattern (supports basic regex)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'trigger_build',
    description: 'Trigger a build for the specified platform.',
    input_schema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['android', 'ios', 'web'],
          description: 'The target platform to build for',
        },
      },
      required: ['platform'],
    },
  },
  {
    name: 'publish_app',
    description: 'Publish the built app to an app store.',
    input_schema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['android', 'ios'],
          description: 'The target platform',
        },
        track: {
          type: 'string',
          description: 'Release track (android: internal/alpha/beta/production, ios: testflight/appstore)',
        },
      },
      required: ['platform', 'track'],
    },
  },
]
