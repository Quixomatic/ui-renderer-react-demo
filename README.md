# @turboforge/tf-form-v2

A web component for TurboForge forms in Next Experience that demonstrates React 18 integration with ServiceNow components.

## Features

- **Hybrid Architecture**: Snabbdom parent component with React child components
- **React 18 Support**: Full React 18 hooks and features via `@quixomatic/ui-renderer-react-simple`
- **Form Components**: Example form components with validation and state management
- **ServiceNow Integration**: Seamless integration with ServiceNow's component system

## Project Structure

```
src/
├── index.js                                    # Main component export
└── x-312987-tf-form-v-2/                      # Main component
    ├── index.js                               # Component definition (Snabbdom)
    ├── styles.scss                            # Component styles
    └── components/                            # Sub-components
        └── test-react-component/              # React component example
            ├── index.js                       # React component registration
            ├── view.js                        # React component implementation
            ├── styles.scss                    # React component styles
            └── FormExample.js                 # Form example component
```

## Setup

### Automated Setup (Recommended)

Run the complete automated setup:

```bash
# One command setup - handles everything automatically
node setup-react.js
```

This script will:
- Install React 18 and the renderer
- Set up the fake `@servicenow/ui-renderer-react` package
- Automatically patch the ServiceNow babel plugin
- Verify everything works correctly

### Manual Setup

If you prefer manual setup:

```bash
# Install the React renderer and React 18
npm install @quixomatic/ui-renderer-react-simple react@18 react-dom@18

# Run the setup script
npx setup-servicenow-react

# Complete the setup
npm install

# Patch the babel plugin
node patch-babel-plugin.js
```

### Restore Original Babel Plugin

If you need to restore the original ServiceNow babel plugin:

```bash
node patch-babel-plugin.js restore
```

## Usage

The main component demonstrates:
- **Snabbdom parent** with standard ServiceNow component features
- **React child components** with full React 18 capabilities
- **State communication** between Snabbdom and React components
- **Form handling** with validation and submission

## Development

```bash
# Start development server
snc ui-component develop

# Build for production
snc ui-component build
```

## React Integration

This project showcases how to integrate React 18 components within ServiceNow's component system:

- **Main component**: Uses Snabbdom renderer for ServiceNow compatibility
- **Sub-components**: Use React renderer for modern React features
- **Communication**: Uses ServiceNow's dispatch/action system for component communication

## License

MIT