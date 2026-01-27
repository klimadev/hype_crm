(function () {
  if (window.top === window.self) return;
  if (window.__HYPE_WA_BRIDGE__) return;
  window.__HYPE_WA_BRIDGE__ = true;

  var lastActiveChatId = null;
  var readySent = false;
  var pollIntervalMs = 1200;
  var pollTimer = null;
  var readyTimer = null;
  var pollInFlight = false;
  var commandPollTimer = null;
  var statusTimer = null;
  var lastCommandId = null;
  var lastCommandPollError = null;

  function safePostMessage(message) {
    try {
      window.parent.postMessage(message, '*');
    } catch (e2) {}
  }

  function post(type, payload, extra) {
    safePostMessage(Object.assign({
      type: type,
      version: 1,
      payload: payload || {},
    }, extra || {}));
  }

  post('wa:bridge-loaded', { timestamp: Date.now() });

  function isWppReady() {
    return typeof WPP !== 'undefined' && typeof WPP.isReady === 'function' && WPP.isReady();
  }

  function canUseChatApi() {
    return !!(typeof WPP !== 'undefined' && WPP.chat && WPP.chat.getActiveChat);
  }

  function canUseLegacyStore() {
    return !!(window.Store && window.Store.Chat && window.Store.Chat.getActive);
  }

  function getActiveChatFromWpp() {
    try {
      if (WPP && WPP.chat && WPP.chat.getActiveChat) {
        return Promise.resolve(WPP.chat.getActiveChat());
      }
      if (WPP && WPP.chat && WPP.chat.getActiveChatId) {
        return Promise.resolve(WPP.chat.getActiveChatId()).then(function (id) {
          if (!id) return null;
          if (WPP.chat.getChatById) {
            return WPP.chat.getChatById(id);
          }
          return { id: id };
        });
      }
      if (WPP && WPP.whatsapp && WPP.whatsapp.ChatStore && WPP.whatsapp.ChatStore.getActive) {
        return Promise.resolve(WPP.whatsapp.ChatStore.getActive());
      }
    } catch (e) {}
    return Promise.resolve(null);
  }

  function getActiveChatFromStore() {
    try {
      if (window.Store && window.Store.Chat && window.Store.Chat.getActive) {
        return Promise.resolve(window.Store.Chat.getActive());
      }
    } catch (e) {}
    return Promise.resolve(null);
  }

  function getActiveChatAsync() {
    return getActiveChatFromWpp()
      .catch(function () { return null; })
      .then(function (chat) {
        if (chat) return chat;
        return getActiveChatFromStore();
      })
      .catch(function () { return null; });
  }

  function normalizeChatId(rawId) {
    if (!rawId) return null;
    if (typeof rawId === 'string') return rawId;
    if (rawId._serialized) return String(rawId._serialized);
    if (rawId.id) return normalizeChatId(rawId.id);
    if (rawId.user && rawId.server) return String(rawId.user + '@' + rawId.server);
    return String(rawId);
  }

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(function () {
      if (pollInFlight) return;
      pollInFlight = true;
      getActiveChatAsync()
        .then(function (chat) {
          var id = normalizeChatId(chat && chat.id ? chat.id : null);
          if (id !== lastActiveChatId) {
            lastActiveChatId = id;
            post('wa:active-chat', {
              chatId: id,
              chatName: chat && (chat.name || chat.formattedTitle || chat.title)
                ? String(chat.name || chat.formattedTitle || chat.title)
                : null,
              timestamp: Date.now(),
            });
          }
        })
        .finally(function () {
          pollInFlight = false;
        });
    }, pollIntervalMs);
  }

  function buildBridgeStatus() {
    var hasWpp = typeof WPP !== 'undefined';
    var hasChat = !!(WPP && WPP.chat);
    var hasGetActiveChat = !!(WPP && WPP.chat && WPP.chat.getActiveChat);
    var hasGetActiveChatId = !!(WPP && WPP.chat && WPP.chat.getActiveChatId);
    var hasGetChatById = !!(WPP && WPP.chat && WPP.chat.getChatById);
    var hasChatStore = !!(WPP && WPP.whatsapp && WPP.whatsapp.ChatStore);
    var hasLegacyStore = !!(window.Store && window.Store.Chat);
    return {
      wppReady: isWppReady() || canUseChatApi() || canUseLegacyStore(),
      hasWpp: hasWpp,
      hasChat: hasChat,
      hasGetActiveChat: hasGetActiveChat,
      hasGetActiveChatId: hasGetActiveChatId,
      hasGetChatById: hasGetChatById,
      hasChatStore: hasChatStore,
      hasLegacyStore: hasLegacyStore,
      lastActiveChatId: lastActiveChatId,
      timestamp: Date.now(),
    };
  }

  function startStatusTicker() {
    if (statusTimer) return;
    statusTimer = setInterval(function () {
      try {
        if (!pollTimer && (isWppReady() || canUseChatApi() || canUseLegacyStore())) {
          startPolling();
        }
        post('wa:bridge-status', buildBridgeStatus());
      } catch (e) {}
    }, 1500);
  }

  function sendCommandResult(id, result, error) {
    try {
      fetch('/api/webproxy/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'result',
          id: id,
          result: result,
          error: error,
        }),
      });
    } catch (e) {}
  }

  function executeCommand(cmd) {
    try {
      var wrappedCode = '(async () => { ' + cmd.code + ' })()';
      Promise.resolve(eval(wrappedCode))
        .then(function (res) {
          var output = res !== undefined ? String(res) : 'undefined';
          sendCommandResult(cmd.id, output, false);
        })
        .catch(function (err) {
          sendCommandResult(cmd.id, String(err), true);
        });
    } catch (e) {
      sendCommandResult(cmd.id, String(e), true);
    }
  }

  function pollCommands() {
    if (commandPollTimer) return;

    var pollOnce = function () {
      try {
        fetch('/api/webproxy/command', { cache: 'no-store' })
          .then(function (res) { return res.json(); })
          .then(function (response) {
            if (response && response.command && response.pending) {
              executeCommand(response.command);
            }
            lastCommandId = response && response.command ? response.command.id : null;
            lastCommandPollError = null;
            post('wa:command-poll', {
              status: 'ok',
              timestamp: Date.now(),
              pending: !!(response && response.pending),
              lastCommandId: lastCommandId,
            });
          })
          .catch(function (err) {
            lastCommandPollError = String(err || 'fetch-error');
            post('wa:command-poll', {
              status: 'error',
              timestamp: Date.now(),
              pending: false,
              error: lastCommandPollError,
              lastCommandId: lastCommandId,
            });
          })
          .finally(function () {
            commandPollTimer = window.setTimeout(pollOnce, 1000);
          });
      } catch (e) {
        lastCommandPollError = String(e || 'poll-error');
        post('wa:command-poll', {
          status: 'error',
          timestamp: Date.now(),
          pending: false,
          error: lastCommandPollError,
          lastCommandId: lastCommandId,
        });
        commandPollTimer = window.setTimeout(pollOnce, 1000);
      }
    };

    pollOnce();
  }

  function waitWppReady() {
    if (readyTimer) return;
    var tries = 0;
    readyTimer = setInterval(function () {
      tries += 1;
      if (isWppReady() || canUseChatApi() || canUseLegacyStore()) {
        clearInterval(readyTimer);
        readyTimer = null;
        if (!readySent) {
          readySent = true;
          post('wa:ready', { timestamp: Date.now() });
        }
        startPolling();
        return;
      }
      if (tries > 120) {
        clearInterval(readyTimer);
        readyTimer = null;
      }
    }, 500);
  }

  var actions = {
    'get-active-chat': function () {
      return getActiveChatAsync().then(function (chat) {
        if (!chat || !chat.id) return null;
        return {
          chatId: normalizeChatId(chat.id),
          chatName: chat.name || chat.formattedTitle || chat.title || null,
        };
      });
    },
  };

  function handleExecMessage(event) {
    try {
      if (event.source !== window.parent) return;
      var data = event.data || {};
      if (data.type !== 'wa:exec' || data.version !== 1) return;
      var requestId = data.requestId;
      var payload = data.payload || {};
      var action = payload.action;
      var args = payload.args || [];

      if (!action || !actions[action]) {
        post('wa:result', {
          error: true,
          message: 'Unknown action: ' + action,
        }, { requestId: requestId });
        return;
      }

      Promise.resolve(actions[action].apply(null, args))
        .then(function (result) {
          post('wa:result', { error: false, result: result }, { requestId: requestId });
        })
        .catch(function (err) {
          post('wa:result', { error: true, message: String(err) }, { requestId: requestId });
        });
    } catch (e) {}
  }

  window.addEventListener('message', handleExecMessage);
  startStatusTicker();
  pollCommands();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitWppReady);
  } else {
    waitWppReady();
  }
})();
