import { z, defineConfig } from "@botpress/runtime";

export default defineConfig({
  name: "Tic-Tac-Toe Pro",
  description: "A robust Tic-Tac-Toe game using state-managed handlers.",
  bot: { state: z.object({}) },
  user: { state: z.object({}) },
  conversation: {
    tags: {
      type: { title: "Conversation Type" }, // 'game'
      status: { title: "Game Status" },     // 'playing', 'ended'
      turn: { title: "Turn" },              // 'player', 'bot'
      board: { title: "Board State" }       // Stringified array
    },
  },
  dependencies: {
    integrations: {
      chat: { version: "chat@0.7.4", enabled: true },
      webchat: { version: "webchat@0.4.0", enabled: true },
    },
  },
  defaultModels: {
    autonomous: "openai:gpt-4o",
    zai: "openai:gpt-4o",
  },
});