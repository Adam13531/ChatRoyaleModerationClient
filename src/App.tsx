import React, { useEffect, useState } from "react";
import _ from "lodash";
import "./App.css";
import Login from "./Login";

enum ModerationStatus {
  Unmodded = 1,
  Approved = 2,
  Rejected = 3,
}

interface MessageToModerate {
  senderDisplayName: string;

  // The client doesn't actually use this, but I'm taking lots of shortcuts.
  userId: string;
  msgId: string;
  message: string;
  moderationStatus: ModerationStatus;
}

function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Array<MessageToModerate>>([]);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [promptRequiresModeration, setPromptRequiresModeration] = useState<
    boolean | null
  >(null);

  const onLogin = (name: string, password: string) => {
    if (ws) {
      ws.removeEventListener("open", onWebsocketOpen);
      ws.removeEventListener("close", onWebsocketClose);

      ws.close();
      setWs(null);
    }

    const params = new URLSearchParams({ name, password });
    const websocket = new WebSocket(`ws://localhost:7897/?${params}`);
    setWs(websocket);
    websocket.onopen = onWebsocketOpen;
    websocket.onclose = onWebsocketClose;
  };

  useEffect(() => {
    if (!ws) return;

    const onWebsocketMessage = (evt: MessageEvent) => {
      try {
        const parsed = JSON.parse(evt.data);
        console.log(`Got a JSON message of type "${parsed.type}": ${evt.data}`);
        if (parsed.type === "STATE") {
          console.log("Set all messages");
          setMessages(parsed.messages);
          setPrompt(parsed.prompt);
          setPromptRequiresModeration(parsed.promptRequiresModeration);
        } else if (parsed.type === "NEW_MESSAGE") {
          console.log("Added message " + parsed.message.msgId);
          setMessages([...messages, parsed.message]);
        } else if (parsed.type === "SET_MOD_STATUS") {
          let messageIndex = null;
          for (let i = 0; i < messages.length; ++i) {
            if (messages[i].msgId === parsed.msgId) {
              messageIndex = i;
              break;
            }
          }
          if (messageIndex != null) {
            console.log("found message: " + messageIndex);
            const clonedMessages = _.cloneDeep(messages);
            clonedMessages[messageIndex] = {
              ...messages[messageIndex],
              moderationStatus: parsed.moderationStatus,
            };
            setMessages(clonedMessages);
          }
        }
      } catch (e) {
        console.log("Got a message that wasn't JSON: " + evt.data);
      }
    };

    ws.removeEventListener("message", onWebsocketMessage);
    ws.onmessage = onWebsocketMessage;
  }, [ws, messages]);

  const onWebsocketOpen = () => {
    console.log("got websocketopen");
  };

  const onWebsocketClose = () => {
    console.log("got websocketclose");
  };

  const approve = (msgId: string) => {
    ws!.send(JSON.stringify({ type: "APPROVE", msgId }));
  };
  const reject = (msgId: string) => {
    ws!.send(JSON.stringify({ type: "REJECT", msgId }));
  };

  return (
    <div className="App">
      {prompt !== null && <div>Prompt: {prompt}</div>}
      {promptRequiresModeration === false && (
        <div style={{ fontSize: "0.75rem" }}>
          This prompt does not require moderation. You can reject
          cheaters/jerks, but there's no need to comb over every message. If you
          accidentally rejected someone, just click "approve".
        </div>
      )}
      {messages.map((message) => {
        let icon: string;
        let bgColor: string;

        switch (message.moderationStatus) {
          case ModerationStatus.Approved:
            icon = "✅";
            bgColor = "#ddffdd";
            break;
          case ModerationStatus.Rejected:
            icon = "❌";
            bgColor = "#ffdddd";
            break;
          case ModerationStatus.Unmodded:
            icon = promptRequiresModeration ? "❓" : "";
            bgColor = promptRequiresModeration ? "#ffffcc" : "transparent";
            break;
        }

        return (
          <div
            style={{ background: bgColor, display: "flex" }}
            key={message.msgId}
          >
            <div style={{ display: "flex", alignSelf: "center" }}>
              <button onClick={() => approve(message.msgId)}>Approve</button>
              <button onClick={() => reject(message.msgId)}>Reject</button>
            </div>
            {icon} {message.senderDisplayName}: {message.message}
          </div>
        );
      })}
      <Login onLogin={onLogin} />
    </div>
  );
}

export default App;
