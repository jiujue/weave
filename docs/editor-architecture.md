# Weave Editor Architecture

## Overview

The Weave Editor is designed with a **Main Thread Controller** pattern. The state of the scene is maintained in the Main Thread (React App) and synchronized to the Worker Thread for rendering.

### Components

1.  **@jiujue/weave-builder-react**: The main editor application.
    - Manages `EditorState` (Selection, Scene Tree).
    - Renders the UI (Layer Tree, Inspector, Canvas Overlay).
    - Handles user interactions (Click, Drag).
2.  **@jiujue/weave-editor-core**: Framework-agnostic logic.
    - `EditorState`: Observable state container.
    - `Registry`: Component definitions and property schemas.
    - `CodeGen`: Scene to JSX serialization.
3.  **@jiujue/weave-adapter-offscreen**: Communication layer.
    - Handles RPC (HitTest) and patches.
4.  **Worker**: Rendering engine.
    - Pure view layer.
    - Performs layout and hit testing.

## Data Flow

### 1. Initialization

React App -> `sceneFromJSX` -> `EditorState` -> `adapter.setScene` -> Worker

### 2. Interaction (Selection)

User Click -> `adapter.hitTest(x,y)` -> Worker -> Result(ID) -> `EditorState.setSelection(ID)` -> UI Updates

### 3. Editing (Property Change)

Inspector -> `EditorState.updateScene` -> `adapter.setScene` (or patch) -> Worker

## Extension Mechanism

The editor is **Configuration Driven**. New components are added via the `Registry`.
See [Extension Guide](./extension-guide.md) for details.
