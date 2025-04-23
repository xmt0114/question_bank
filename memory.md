



















































# Application Overview
- The user wants to develop a Vue+TypeScript question bank application using a pure frontend approach without backend services.
- The application needs to support two modes: explanation and test modes.
- It should support multiple question types with text/image content.
- The user wants to restructure the application with 4 hierarchical levels (Organization, Category, Level, Paper), modify existing types and store, rewrite mock data.

# Exam Structure and Data Model
- The application needs to support a hierarchical exam structure, unifying association certification exams and competition exams into a common structure.
- The question bank should have 4 hierarchical levels: Organization, Category, Level, and Paper.
- The data model should be simplified and include the following entities:
    - Organization: Represents the organizing body (e.g., exam association, competition organizer).
    - Category: Represents the project type.
    - Level: Represents the difficulty level or age group.
    - Paper: Represents the specific exam paper for a given year.

# Data Storage and Retrieval
- The user wants to store data in JSON files located in the public directory, with one file per exam paper.
- Data loading should be encapsulated in functions for easy calling.
- The implementation should consider future extensibility for fetching data from a backend API.

# UI and Navigation
- The user prefers a compact UI for the question bank with auto-selected defaults and all options visible on one screen.
- Card-style organization/category/level selection is preferred.
    - Smaller organization/category cards without descriptions.
    - 5 organizations per row.
    - 6 categories per row.
    - 7 levels per row.
- Text-based paper selection with 5 per row.
- No section headers are desired.
- Larger exam mode buttons are preferred to fit everything on one screen.
- The user wants to redesign the HomeView.vue page with specific UI layout preferences (5 organizations per row, 6 categories per row, 7 levels per row, 5 papers per row).
- The user wants to fix a navigation bug when returning to the home page.
- The user wants 'No data' message when categories/levels/papers are empty.
- The user wants the UI layout optimized to fit on one screen and remove duplicate 'Question Bank System' title text.

# Settings Page
- The user wants a settings page that can perform CRUD operations on organizations, levels, categories, and papers, with support for uploading JSON files for papers, requiring a separate backend service to modify files in the public directory.
- The settings page should modify JSON files in the public directory directly, and may require a separate backend service since the frontend can't write files.
- The settings page may require a separate backend service since the frontend can't write files directly to the public directory.
- The settings page should be accessible only via a separate route without links from the main pages.
- The settings page should include delete/edit buttons for individual questions.
- The settings page should include the ability to add questions to papers.