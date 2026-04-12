export const AGENT_TOOLS = [
  {
    name: 'read_file',
    description: 'Read the contents of a file. ALWAYS read a file before modifying it to understand its current state and avoid overwriting existing code unintentionally.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path relative to the project root, e.g. "src/App.jsx" or "lib/main.dart"',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write the COMPLETE content of a file. Creates parent directories automatically. You must provide the entire file content — not just the changed part. If modifying an existing file, read it first, then write the full updated version.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path relative to the project root, e.g. "src/components/TodoList.jsx"',
        },
        content: {
          type: 'string',
          description: 'The COMPLETE file content. Must be the entire file, not a diff or partial snippet.',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'run_command',
    description: 'Execute a shell command in the project directory. Use for: installing packages (npm install, flutter pub get), running dev servers, running builds, creating directories, etc. Commands run in /home/user/project by default. For long-running commands like dev servers, they run in the background automatically.',
    input_schema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command, e.g. "npm install axios" or "flutter pub get"',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'list_files',
    description: 'List all files and directories in the project tree. Use this to understand the project structure before making changes. Always call this at the start of a new conversation or when asked to modify an existing project.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Subdirectory to list (relative to project root). Omit for entire project.',
        },
      },
      required: [],
    },
  },
  {
    name: 'search_code',
    description: 'Search for a text pattern across all project files. Returns matching lines with file paths and line numbers. Use this to find where a function, component, variable, or string is used before refactoring or debugging.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search pattern (supports basic regex), e.g. "useState" or "class TodoItem"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'trigger_build',
    description: 'Trigger a production build for the specified platform via Codemagic CI/CD.',
    input_schema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['android', 'ios', 'web'],
          description: 'Target platform',
        },
      },
      required: ['platform'],
    },
  },
  {
    name: 'publish_app',
    description: 'Build and publish the app to an app store via Codemagic CI/CD.',
    input_schema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['android', 'ios'],
          description: 'Target platform',
        },
        track: {
          type: 'string',
          description: 'Release track. Android: internal, alpha, beta, production. iOS: testflight, appstore.',
        },
      },
      required: ['platform', 'track'],
    },
  },
]
