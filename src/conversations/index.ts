import { Conversation, context } from "@botpress/runtime"; 
import { xoHandler } from "./xo";

export default new Conversation({
  channel: ["chat.channel", "webchat.channel"],
  handler: async (props) => {
    const { client, conversation } = props;
    const botId = context.get("botId");

    const result = await xoHandler(props);
    if (result.handled) return;

    await client.createMessage({
      conversationId: conversation.id,
      userId: botId, 
      type: "text",
      payload: { text: "Welcome! Type 'new' to start Tic-Tac-Toe." },
      tags: {}
    });
  },
});