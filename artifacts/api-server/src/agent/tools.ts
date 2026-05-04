export const AGENT_TOOLS = [
  {
    name: 'read_file',
    description: 'Read the contents of a file. ALWAYS read a file before modifying it.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to project root, e.g. "src/App.jsx"' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write the COMPLETE content of a file. Creates parent dirs automatically. Always read first, then write the full updated version.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to project root' },
        content: { type: 'string', description: 'The COMPLETE file content — never a partial snippet.' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'run_command',
    description: 'Execute a shell command in the project directory. Use for installing packages, running builds, creating dirs, etc.',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command, e.g. "npm install axios"' },
      },
      required: ['command'],
    },
  },
  {
    name: 'list_files',
    description: 'List all files and directories in the project tree. Use at the start of conversations to understand structure.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Subdirectory to list (relative to project root). Omit for entire project.' },
      },
      required: [],
    },
  },
  {
    name: 'search_code',
    description: 'Search for a text pattern across all project files. Use before refactoring to find usages.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search pattern (supports basic regex), e.g. "useState"' },
      },
      required: ['query'],
    },
  },
]
