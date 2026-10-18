import { configureStore } from "@reduxjs/toolkit";
import appContextReducer from "./appContextSlice";
import aiChatReducer from "./aiChatSlice";

export const store = configureStore({
  reducer: {
    appContext: appContextReducer,
    aiChat: aiChatReducer,
  },
});

let lastPersistedChat = "";
store.subscribe(() => {
  const state = store.getState();
  const identity = state.appContext.user?._id || state.appContext.user?.email || "guest";
  const serialized = JSON.stringify({
    sessionId: state.aiChat.sessionId,
    messages: state.aiChat.messages,
    sessions: state.aiChat.sessions,
    prOutreachWorkspace: state.aiChat.prOutreachWorkspace,
    alumniWorkspace: state.aiChat.alumniWorkspace,
    journey: state.aiChat.journey,
  });
  if (serialized !== lastPersistedChat) {
    lastPersistedChat = serialized;
    localStorage.setItem(`placement-ai-chat-history:${identity}`, serialized);
  }
});
