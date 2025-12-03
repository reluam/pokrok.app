# Coding Standards

## File Size Limits

**Maximum file length: 2000 lines**

All source files should be kept under 2000 lines. If a file exceeds this limit, it should be refactored by:

1. Extracting components into separate files
2. Moving utility functions to dedicated utility files
3. Splitting large components into smaller, focused components
4. Moving type definitions to separate type files

If you have a legitimate reason why a file needs to exceed 2000 lines, please discuss it with the team first.

## Component Organization

- Each component should have its own file
- Related components can be grouped in subdirectories
- Shared utilities should be in the `lib/` or `utils/` directories
- Types and interfaces should be in separate files when they're shared across multiple components

