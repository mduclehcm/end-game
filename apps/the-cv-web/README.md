# The CV Web

Modern resume builder with a powerful template engine. Build your CV in the browser with instant preview, design tokens, and flexible layouts.

## ✨ Features

- 📝 **Visual CV Builder** - Edit your resume with live preview
- 🎨 **Design Tokens** - Consistent styling with customizable themes
- 📄 **Smart Pagination** - Automatic page breaks with content-aware splitting
- ⚡ **Instant Updates** - 40x faster typing performance with smart optimizations
- 🔧 **Template System** - Create custom layouts with data binding and control flow
- 🎯 **Pixel Perfect** - DOM-based measurement for accurate rendering

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## 📚 Documentation

**Start here:** [Complete Documentation Index](./docs/README.md)

### Quick Links

- **[Template Engine Guide](./docs/template-engine.md)** - Create custom CV templates
- **[Engine Architecture](./docs/engine-architecture.md)** - Deep dive into the render engine
- **[Performance Optimization](./docs/performance-optimization.md)** - How we achieved 40x faster typing

## 🏗️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite (Rolldown)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand with subscribeWithSelector
- **Layout Engine**: Custom 6-phase Red-Black tree pipeline
- **Rendering**: DOM-based measurement for pixel-perfect layouts

## 📁 Project Structure

```
apps/the-cv-web/
├── docs/                    # Documentation
├── src/
│   ├── components/cv/       # CV editor and preview components
│   ├── entities/cv/         # Core CV domain logic
│   │   └── engine/          # Layout and pagination engine
│   ├── store/               # Zustand state management
│   ├── pages/               # Application pages
│   └── data/                # Default schemas and templates
└── ...
```

## 🎯 Key Features

### Instant Preview Updates
Thanks to our performance optimizations, typing in the editor updates the preview with <1ms latency:
- Direct store subscriptions for leaf nodes
- Throttled layout engine (150ms)
- Smart layout skip for text-only changes

### Flexible Template System
Create powerful CV templates with:
- Design tokens for consistent styling
- Data binding with dot notation
- Layout nodes (stack, box, text, image, etc.)
- Control flow (repeat, conditional)

### Smart Pagination
Automatic page breaking with:
- Content-aware splitting at optimal boundaries
- Non-breakable containers stay together
- Overflow prevention for long content
- Consistent gap spacing across pages

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test template-engine.test.ts

# Run with coverage
pnpm test --coverage
```

## 🤝 Contributing

See [Documentation Index](./docs/README.md) for development guides and architecture details.

## 📄 License

Part of the algovn monorepo.
