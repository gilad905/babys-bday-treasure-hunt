# Copilot Instructions for maps-matmon

## Project Overview
This project is a React-based game where players use a map and street view to find clues and treasures. The codebase uses TypeScript and Vite for development.

## General Coding Standards
- Use TypeScript for all React components and logic files.
- Use functional React components and React hooks (e.g., useState, useEffect) for state management.
- Prefer named exports over default exports.
- Use CSS modules or scoped CSS for component styles when possible.
- Keep components small and focused; extract logic into hooks or utility functions if reused.

## File and Folder Structure
- Place React components in `src/components/`.
- Place custom hooks in `src/hooks/`.
- Place type definitions in `src/types/`.
- Place static data (e.g., hunt.json) in `src/data/`.
- Place static assets in `src/assets/` or `public/` as appropriate.

## Comments
- Start code comments with a lowercase letter.
- Use comments to explain non-obvious logic, intent, or workarounds.
- Avoid redundant comments that restate what the code does.

## Naming Conventions
- Use PascalCase for React components (e.g., `GameMap`, `StreetViewPanel`).
- Use camelCase for variables, functions, and hooks (e.g., `useGameState`).
- Use UPPER_CASE for constants.

## Git and Version Control
- Commit messages should be concise and descriptive.
- Do not commit generated files or build outputs.

## Testing
- Place test files alongside the files they test, using the `.test.tsx` or `.test.ts` suffix.

## Accessibility
- Ensure interactive elements (buttons, links) are accessible and have appropriate labels.

## UI/UX
- Keep the UI clean and intuitive.
- Use clear labels for buttons and actions.
- Provide feedback for user actions (e.g., when a compass is used).

## Dependencies
- Use only necessary dependencies; prefer lightweight libraries.
- Keep dependencies up to date.

## Performance
- Avoid unnecessary re-renders by using React.memo or useCallback where appropriate.
- Lazy-load heavy components if needed.

## Code Review
- All code should be reviewed before merging to main.

---

For any questions or clarifications, refer to this document or ask the project maintainer.
