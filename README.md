# Tic-Tac-Toe game using Botpress ADK

A robust, state-managed Tic-Tac-Toe game built using the Botpress ADK. This bot uses conversation tags to maintain game state and features an AI opponent powered by LLMs with deterministic fallbacks.

## 🚀 Features
- State-Managed Logic: Uses conversation tags (status, turn, board) to persist game data across restarts.
- Smart AI Opponent: Leverages Autonomous.Exit for strategic move selection with a prioritized logic (Win > Block > Center).
- Safe Execution: Built-in validation ensures the AI never picks a taken spot; if it fails, a deterministic fallback move is made.
- Multi-Channel: Compatible with both Webchat and Chat integrations.
## 🎮 Commands
- `new`	Starts a fresh game and renders the board.
- `1-9`	During your turn, type a number to place your X.
- `quit`	Ends the current game session.

## 📂 Structure
- `agent.config.ts`: Defines the conversation tags and dependencies.
- `src/xo.ts`: Contains the game handler, win-condition logic, and AI prompt strategy
- `src/index.ts`: The main entry point that routes messages to the game handler.

## Learn More

- [ADK Documentation](https://botpress.com/docs/adk)
- [Botpress Platform](https://botpress.com)
