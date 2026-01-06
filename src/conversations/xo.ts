import { Conversation, z, Autonomous, context } from "@botpress/runtime";

type Cell = "X" | "O" | " ";

const MoveExit = new Autonomous.Exit({
  name: "make_move",
  description: "The AI chooses a square to play",
  schema: z.object({
    index: z.number().min(1).max(9).describe("The board position 1-9"),
  }),
});

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function getWinner(board: Cell[]) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] !== " " && board[a] === board[b] && board[b] === board[c]) return board[a];
  }
  return board.includes(" ") ? null : "draw";
}

function renderBoard(board: Cell[]) {
  const cell = (i: number) => (board[i] === " " ? `${i + 1}` : board[i]);
  return `\n${cell(0)} | ${cell(1)} | ${cell(2)}\n---------\n${cell(3)} | ${cell(4)} | ${cell(5)}\n---------\n${cell(6)} | ${cell(7)} | ${cell(8)}`.trim();
}

export const xoHandler = async (props: any) => {
  const { client, conversation, message, execute } = props;
  const botId = context.get("botId");
  const text = (message?.payload?.text ?? "").trim().toLowerCase();

  // 1. Handle New Game
  if (text === "new" || text === "start") {
    await client.updateConversation({
      id: conversation.id,
      tags: {
        type: "game",
        status: "playing",
        turn: "player",
        board: JSON.stringify(Array(9).fill(" ")),
      }
    });
    
    await client.createMessage({
      conversationId: conversation.id,
      userId: botId,
      type: "text",
      payload: { text: "🎮 New Game! You are X. Pick a position (1-9).\n```\n" + renderBoard(Array(9).fill(" ")) + "\n```" },
      tags: {} 
    });
    return { handled: true, continue: false };
  }

  // 2. Logic Protection
  if (conversation.tags.status !== "playing") return { handled: false };

  let board: Cell[] = JSON.parse(conversation.tags.board || "[]");

  // --- PLAYER TURN ---
  if (conversation.tags.turn === "player") {
    const move = parseInt(text);
    if (isNaN(move) || move < 1 || move > 9 || board[move - 1] !== " ") {
      await client.createMessage({
        conversationId: conversation.id,
        userId: botId,
        type: "text",
        payload: { text: "⚠️ Invalid move. Pick an empty spot (1-9)." },
        tags: {}
      });
      return { handled: true, continue: false };
    }

    board[move - 1] = "X";
    
    const result = getWinner(board);
    if (result) return finishGame(props, board, result);

    // Update tags for AI turn
    await client.updateConversation({
      id: conversation.id,
      tags: { 
        board: JSON.stringify(board), 
        turn: "bot" 
      }
    });
  }

  // --- BOT TURN ---
  // Re-check tags after potential player update
  const { conversation: updatedConv } = await client.getConversation({ id: conversation.id });
  
  if (updatedConv.tags.turn === "bot") {
    const available = board.map((v, i) => v === " " ? i + 1 : null).filter((v): v is number => v !== null);
    
    const aiResponse = await execute({
    instructions: `
        You are a competitive Tic-Tac-Toe Grandmaster playing as 'O'.
        CURRENT BOARD: ${JSON.stringify(board)}
        AVAILABLE POSITIONS: [${available.join(", ")}]

        PLAY TO WIN using this priority logic:
        1. WIN: If you have two 'O's in a row and the third spot is available, TAKE IT.
        2. BLOCK: If the human ('X') has two in a row, you MUST play in the third spot to block them.
        3. CENTER: If position 5 is available, take it.
        4. CORNERS: If a corner (1, 3, 7, 9) is available, take it.
        5. EDGES: Take any remaining available spot.

        STRICT RULES:
        - You MUST choose exactly ONE number from the AVAILABLE POSITIONS.
        - Use the 'make_move' exit only.
    `.trim(),
    exits: [MoveExit],
    mode: "autonomous",
    temperature: 0 // Keep at 0 for logic and strategy
    });

    let botMove = available[0]; 
    let moveSource = "fallback"; // Default source

    if (aiResponse.is(MoveExit) && available.includes(aiResponse.output.index)) {
      botMove = aiResponse.output.index;
      moveSource = "AI"; // Update source
    }

    board[botMove - 1] = "O";
    
    const result = getWinner(board);
    if (result) return finishGame(props, board, result);

    await client.updateConversation({
      id: conversation.id,
      tags: { 
        board: JSON.stringify(board), 
        turn: "player" 
      }
    });

    await client.createMessage({
      conversationId: conversation.id,
      userId: botId,
      type: "text",
      payload: { text: `🤖 I played ${botMove} (Source: ${moveSource}). Your turn:\n\`\`\`\n${renderBoard(board)}\n\`\`\`` },
      tags: {}
    });
  }

  return { handled: true, continue: false };
};

async function finishGame(props: any, board: Cell[], winner: string) {
  const { client, conversation } = props;
  const botId = context.get("botId");
  
  await client.updateConversation({
    id: conversation.id,
    tags: { status: "ended" }
  });

  const msg = winner === "draw" ? "🤝 It's a draw!" : (winner === "X" ? "🎉 You win!" : "😈 I win!");
  
  await client.createMessage({
    conversationId: conversation.id,
    userId: botId,
    type: "text",
    payload: { text: `${msg}\n\`\`\`\n${renderBoard(board)}\n\`\`\`\nType 'new' to play again.` },
    tags: {}
  });
  return { handled: true, continue: false };
}