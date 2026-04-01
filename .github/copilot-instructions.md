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