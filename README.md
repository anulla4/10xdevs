# Nature Log

> A simple and elegant web application for logging your nature observations.

---

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

Nature Log is designed for nature enthusiasts who want a straightforward way to document their observations of plants, animals, and interesting locations. It solves the problem of scattered notes and context-less photos by providing an organized, map-based journal for all your findings. The MVP focuses on the core experience of creating, viewing, and managing your personal observation log.

## Tech Stack

The project is built with a modern, performant, and scalable tech stack:

- **Frontend**: [Astro](https://astro.build/) (for static site generation) with [React](https://react.dev/) (for interactive UI components, or "islands").
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for a utility-first styling workflow.
- **Language**: [TypeScript](https://www.typescriptlang.org/) for type safety and improved developer experience.
- **Mapping**: [Leaflet](https://leafletjs.com/) for an interactive and lightweight map experience.
- **Backend (BaaS)**: [Supabase](https://supabase.com/) for the PostgreSQL database, user authentication, and instant APIs.
- **CI/CD & Hosting**: [GitHub Actions](https://github.com/features/actions) for continuous integration and deployment, with the application containerized using [Docker](https://www.docker.com/) and hosted on [DigitalOcean](https://www.digitalocean.com/).
- **Testing**: [Vitest](https://vitest.dev/) for unit/integration tests and [Playwright](https://playwright.dev/) for end-to-end tests.

## Getting Started Locally

To run a local copy of this project, follow these steps.

### Prerequisites

- **Node.js**: It's recommended to use the latest LTS version. If a `.nvmrc` file is present, use `nvm use`.
- **Package Manager**: This project uses `pnpm`. You can install it via `npm install -g pnpm`.
- **Supabase Account**: You will need a free Supabase account to get your own database and API keys.

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/your-username/nature-log.git](https://github.com/your-username/nature-log.git)
    cd nature-log
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:

    ```bash
    cp .env.example .env
    ```

    Then, fill in the required Supabase URL and Anon Key from your Supabase project dashboard.

    ```env
    PUBLIC_SUPABASE_URL="your-supabase-url"
    PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
    ```

4.  **Run the development server:**

    ```bash
    pnpm dev
    ```

    The application should now be running on `http://localhost:4321`.

## Available Scripts

In the project directory, you can run the following commands:

- `pnpm dev`: Runs the app in development mode.
- `pnpm build`: Builds the app for production to the `dist/` folder.
- `pnpm preview`: Serves the production build locally for previewing.
- `pnpm test`: Runs the test suite (if configured).
- `pnpm lint`: Lints the codebase for errors and style issues.

## Project Scope

### In Scope (MVP)

- User registration and authentication (email/password).
- Full CRUD (Create, Read, Update, Delete) functionality for personal observations.
- Adding an observation via a form, including name, description, date, and location selected from a map.
- Viewing all personal observations on an interactive map and in a paginated list.
- Simple filtering and sorting of the observation list.

### Out of Scope (Future Features)

- Uploading photos or other media.
- Real-time GPS tracking.
- Social features like sharing, commenting, or public profiles.
- Expert verification of observations or AI-based species identification.
- Native mobile application or offline functionality.

## Project Status

**Status:** In Development 🏗️

This project is currently in the development phase for the Minimum Viable Product (MVP).

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
