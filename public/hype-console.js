(function() {
    // Only initialize if we're in an iframe context (inside WhatsApp)
    if (window.top === window.self) {
        // We're not in an iframe, don't initialize
        return;
    }

    if (window.__HYPE_CONSOLE__) return;
    window.__HYPE_CONSOLE__ = true;

    var commandId = null;
    var polling = false;
    var consoleHistory = JSON.parse(localStorage.getItem('hype_console_history') || '[]');
    var consoleOpen = false;

    function saveHistory() {
        localStorage.setItem('hype_console_history', JSON.stringify(consoleHistory.slice(-100)));
    }

    function addToHistory(type, content, commandId, error) {
        var entry = {
            type: type,
            content: content,
            timestamp: Date.now(),
            id: commandId,
            error: error || false
        };
        consoleHistory.push(entry);
        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        var output = document.getElementById('hype-console-output');
        if (!output) return;

        if (consoleHistory.length === 0) {
            output.innerHTML = '<span style="color: #64748b; font-style: italic;">Nenhum comando executado ainda...</span>';
            return;
        }

        var html = '';
        consoleHistory.slice().reverse().forEach(function(entry) {
            var time = new Date(entry.timestamp).toLocaleTimeString('pt-BR');
            var content = entry.content.replace(/</g, '&lt;').replace(/>/g, '&gt;');

            if (entry.type === 'command') {
                html += '<div style="border-left: 3px solid #6366f1; padding: 8px 12px; margin: 8px 0; background: rgba(99, 102, 241, 0.1); border-radius: 0 8px 8px 0;"><span style="font-size: 10px; color: #64748b; font-family: monospace;">' + time + '</span> <span style="font-size: 10px; font-weight: 600; text-transform: uppercase; color: #64748b;">COMANDO:</span><pre style="margin: 4px 0 0 0; font-family: Monaco, Menlo, Ubuntu Mono, monospace; font-size: 11px; white-space: pre-wrap; word-break: break-all; color: #f8fafc;">' + content + '</pre></div>';
            } else if (entry.type === 'result') {
                var color = entry.error ? '#ef4444' : '#10b981';
                var bgColor = entry.error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)';
                html += '<div style="border-left: 3px solid ' + color + '; padding: 8px 12px; margin: 8px 0; background: ' + bgColor + '; border-radius: 0 8px 8px 0;"><span style="font-size: 10px; color: #64748b; font-family: monospace;">' + time + '</span> <span style="font-size: 10px; font-weight: 600; text-transform: uppercase; color: #64748b;">RESULTADO:</span><pre style="margin: 4px 0 0 0; font-family: Monaco, Menlo, Ubuntu Mono, monospace; font-size: 11px; white-space: pre-wrap; word-break: break-all; color: ' + (entry.error ? '#ff6b6b' : '#f8fafc') + ';">' + content + '</pre></div>';
            }
        });
        output.innerHTML = html;
        output.scrollTop = output.scrollHeight;
    }

    function clearConsoleHistory() {
        consoleHistory = [];
        saveHistory();
        renderHistory();
    }

    function toggleConsole() {
        var modal = document.getElementById('hype-console-modal');
        if (!modal) return;

        consoleOpen = !consoleOpen;
        if (consoleOpen) {
            modal.style.display = 'block';
            setTimeout(function() {
                modal.classList.add('show');
            }, 10);
            renderHistory();
            var input = document.getElementById('hype-console-input');
            if (input) input.focus();

            // Close on outside click for mobile
            setTimeout(function() {
                document.addEventListener('click', function closeOnOutside(e) {
                    if (!modal.contains(e.target) && e.target.id !== 'hype-console-float-btn') {
                        toggleConsole();
                        document.removeEventListener('click', closeOnOutside);
                    }
                });
            }, 100);
        } else {
            modal.classList.remove('show');
            setTimeout(function() {
                modal.style.display = 'none';
            }, 200);
        }
    }

    function runConsoleCode() {
        var input = document.getElementById('hype-console-input');
        var btn = document.getElementById('hype-console-run-btn');
        var output = document.getElementById('hype-console-output');
        var code = input.value.trim();

        if (!code) {
            output.innerHTML = '<div style="color: #ef4444;">Digite algum código JavaScript para executar.</div>';
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Executando...';

        var cmdId = 'cmd_' + Date.now();
        addToHistory('command', code, cmdId);

        try {
            var logs = [];
            var originalLog = console.log;
            var originalError = console.error;
            var originalWarn = console.warn;

            console.log = function() {
                var args = Array.prototype.slice.call(arguments);
                logs.push('[LOG] ' + args.map(function(a) { return String(a); }).join(' '));
                originalLog.apply(console, arguments);
            };
            console.error = function() {
                var args = Array.prototype.slice.call(arguments);
                logs.push('[ERROR] ' + args.map(function(a) { return String(a); }).join(' '));
                originalError.apply(console, arguments);
            };
            console.warn = function() {
                var args = Array.prototype.slice.call(arguments);
                logs.push('[WARN] ' + args.map(function(a) { return String(a); }).join(' '));
                originalWarn.apply(console, arguments);
            };

            var wrappedCode = '(async () => { ' + code + ' })()';
            var result = eval(wrappedCode);
            if (result && typeof result.then === 'function') {
                result.then(function(res) {
                    var outputText = logs.length > 0 ? logs.join('\\n') : (res !== undefined ? String(res) : 'undefined');
                    addToHistory('result', outputText, cmdId, false);
                    input.value = '';
                    btn.disabled = false;
                    btn.textContent = 'Executar';
                }).catch(function(e) {
                    addToHistory('result', e.toString(), cmdId, true);
                    input.value = '';
                    btn.disabled = false;
                    btn.textContent = 'Executar';
                });
            } else {
                var outputText = logs.length > 0 ? logs.join('\\n') : (result !== undefined ? String(result) : 'undefined');
                addToHistory('result', outputText, cmdId, false);
                input.value = '';
                btn.disabled = false;
                btn.textContent = 'Executar';
            }
        } catch (e) {
            addToHistory('result', e.toString(), cmdId, true);
            input.value = '';
            btn.disabled = false;
            btn.textContent = 'Executar';
        }
    }

    function createConsoleUI() {
        if (document.getElementById('hype-console-float-btn')) return;

        // Create styles
        var style = document.createElement('style');
        style.textContent = `
            #hype-console-float-btn {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 48px;
                height: 48px;
                background: #6366f1;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
                transition: all 0.2s ease;
                z-index: 10000;
                touch-action: manipulation;
            }
            #hype-console-float-btn:hover {
                background: #4f46e5;
                transform: scale(1.05);
            }
            #hype-console-float-btn:active {
                transform: scale(0.95);
            }
            #hype-console-float-btn svg {
                color: white;
                width: 20px;
                height: 20px;
            }
            #hype-console-modal {
                position: fixed;
                bottom: 80px;
                right: 20px;
                width: min(400px, calc(100vw - 40px));
                max-width: 400px;
                background: #1e293b;
                border: 1px solid #334155;
                border-radius: 16px;
                padding: 16px;
                display: none;
                z-index: 10001;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: #f8fafc;
                max-height: calc(100vh - 120px);
                overflow: hidden;
                opacity: 0;
                transform: translateY(20px) scale(0.95);
                transition: all 0.2s ease-out;
            }
            #hype-console-modal.show {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            #hype-console-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
            #hype-console-modal-header h3 {
                font-size: 16px;
                font-weight: 600;
                margin: 0;
            }
            #hype-console-input {
                width: 100%;
                height: 80px;
                background: #0f172a;
                border: 1px solid #334155;
                border-radius: 8px;
                padding: 12px;
                color: #f8fafc;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 12px;
                resize: vertical;
                margin-bottom: 12px;
                box-sizing: border-box;
            }
            #hype-console-input:focus {
                outline: none;
                border-color: #6366f1;
            }
            #hype-console-input::placeholder {
                color: #64748b;
            }
            #hype-console-controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                flex-wrap: wrap;
                gap: 8px;
            }
            #hype-console-status {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                color: #64748b;
                min-width: 0;
                flex: 1;
            }
            #hype-console-status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #64748b;
                flex-shrink: 0;
            }
            #hype-console-status-dot.active {
                background: #10b981;
            }
            #hype-console-run-btn, #hype-console-clear-btn {
                background: #6366f1;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                touch-action: manipulation;
                flex-shrink: 0;
            }
            #hype-console-run-btn:hover, #hype-console-clear-btn:hover {
                background: #4f46e5;
            }
            #hype-console-run-btn:active, #hype-console-clear-btn:active {
                transform: scale(0.95);
            }
            #hype-console-run-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            #hype-console-clear-btn {
                background: #1e293b;
                border: 1px solid #334155;
                margin-left: 0;
            }
            #hype-console-output {
                background: #0f172a;
                border: 1px solid #334155;
                border-radius: 8px;
                padding: 12px;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 12px;
                color: #00ff00;
                min-height: 120px;
                max-height: 200px;
                overflow-y: auto;
                white-space: pre-wrap;
                word-break: break-all;
                box-sizing: border-box;
            }
            .hype-icon-btn {
                width: 36px;
                height: 36px;
                border-radius: 8px;
                border: 1px solid #334155;
                background: #0f172a;
                color: #94a3b8;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
                touch-action: manipulation;
                flex-shrink: 0;
            }
            .hype-icon-btn:hover {
                background: #334155;
                color: #f8fafc;
            }
            .hype-icon-btn:active {
                transform: scale(0.95);
            }
            .hype-icon-btn svg {
                width: 18px;
                height: 18px;
            }

            /* Mobile Responsiveness */
            @media (max-width: 768px) {
                #hype-console-float-btn {
                    bottom: 16px;
                    right: 16px;
                    width: 44px;
                    height: 44px;
                }
                #hype-console-float-btn svg {
                    width: 18px;
                    height: 18px;
                }
                #hype-console-modal {
                    bottom: 70px;
                    right: 16px;
                    left: 16px;
                    width: auto;
                    max-width: none;
                    padding: 12px;
                    border-radius: 12px;
                }
                #hype-console-modal-header h3 {
                    font-size: 14px;
                }
                #hype-console-input {
                    height: 70px;
                    font-size: 11px;
                    padding: 10px;
                }
                #hype-console-controls {
                    flex-direction: column;
                    align-items: stretch;
                    gap: 8px;
                }
                #hype-console-status {
                    justify-content: center;
                }
                #hype-console-run-btn, #hype-console-clear-btn {
                    padding: 10px 16px;
                    font-size: 14px;
                    width: 100%;
                }
                #hype-console-clear-btn {
                    margin-left: 0;
                }
                #hype-console-output {
                    min-height: 100px;
                    max-height: 150px;
                    font-size: 11px;
                    padding: 10px;
                }
            }

            @media (max-width: 480px) {
                #hype-console-modal {
                    bottom: 60px;
                    left: 12px;
                    right: 12px;
                    padding: 10px;
                }
                #hype-console-modal-header {
                    margin-bottom: 8px;
                }
                #hype-console-modal-header h3 {
                    font-size: 13px;
                }
                #hype-console-input {
                    height: 60px;
                    padding: 8px;
                    margin-bottom: 8px;
                }
                #hype-console-controls {
                    margin-bottom: 8px;
                }
                #hype-console-output {
                    padding: 8px;
                    min-height: 80px;
                    max-height: 120px;
                }
            }

            /* Touch device improvements */
            @media (pointer: coarse) {
                #hype-console-run-btn, #hype-console-clear-btn, .hype-icon-btn {
                    min-height: 44px;
                    padding: 12px 16px;
                }
                #hype-console-float-btn {
                    width: 52px;
                    height: 52px;
                }
            }
        `;
        document.head.appendChild(style);

        // Create float button
        var floatBtn = document.createElement('button');
        floatBtn.id = 'hype-console-float-btn';
        floatBtn.onclick = toggleConsole;
        floatBtn.title = 'Console JavaScript';
        floatBtn.setAttribute('aria-label', 'Abrir console JavaScript');
        floatBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>';
        document.body.appendChild(floatBtn);

        // Create modal
        var modal = document.createElement('div');
        modal.id = 'hype-console-modal';
        modal.innerHTML = `
            <div id="hype-console-modal-header">
                <h3>Console JavaScript</h3>
                <button class="hype-icon-btn" onclick="toggleConsole()" aria-label="Fechar console">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <p style="font-size: 12px; color: #64748b; margin-bottom: 12px; line-height: 1.4;">
                Execute JavaScript no WhatsApp em tempo real. Use <code>console.log()</code> para output.
            </p>
            <textarea id="hype-console-input" placeholder="Digite seu código JavaScript aqui...&#10;Exemplo: document.title" spellcheck="false"></textarea>
            <div id="hype-console-controls">
                <div id="hype-console-status">
                    <div id="hype-console-status-dot"></div>
                    <span id="hype-console-status-text">Pronto para executar!</span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button id="hype-console-run-btn" onclick="runConsoleCode()">Executar</button>
                    <button id="hype-console-clear-btn" onclick="clearConsoleHistory()">Limpar</button>
                </div>
            </div>
            <div id="hype-console-output"></div>
        `;
        document.body.appendChild(modal);
    }

    function poll() {
        try {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', '/command.php', true);
            xhr.onreadystatechange = async function() {
                if (xhr.readyState === 4) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        if (response.command && response.pending) {
                            var cmd = response.command;
                            commandId = cmd.id;

                                try {
                                    var logs = [];
                                    var originalLog = console.log;
                                    var originalError = console.error;
                                    var originalWarn = console.warn;

                                    console.log = function() {
                                        var args = Array.prototype.slice.call(arguments);
                                        logs.push('[LOG] ' + args.map(function(a) { return String(a); }).join(' '));
                                        originalLog.apply(console, arguments);
                                    };
                                    console.error = function() {
                                        var args = Array.prototype.slice.call(arguments);
                                        logs.push('[ERROR] ' + args.map(function(a) { return String(a); }).join(' '));
                                        originalError.apply(console, arguments);
                                    };
                                    console.warn = function() {
                                        var args = Array.prototype.slice.call(arguments);
                                        logs.push('[WARN] ' + args.map(function(a) { return String(a); }).join(' '));
                                        originalWarn.apply(console, arguments);
                                    };

                                    var wrappedCode = '(async () => { ' + cmd.code + ' })()';
                                    var result = eval(wrappedCode);
                                    if (result && typeof result.then === 'function') {
                                        result = await result;
                                    }
                                    var output = logs.length > 0 ? logs.join('\\n') : (result !== undefined ? String(result) : 'undefined');
                                    sendResult(commandId, output, false);
                                } catch (e) {
                                    sendResult(commandId, e.toString(), true);
                                }
                        }
                    } catch (e) {}
                    setTimeout(poll, 1000);
                }
            };
            xhr.send();
        } catch (e) {
            setTimeout(poll, 1000);
        }
    }

    function sendResult(id, result, error) {
        try {
            window.parent.postMessage({type: "command-result", id: id, result: result, error: error}, "*");
        } catch (e) {
            console.error("Error sending result via postMessage: " + e.message);
        }
    }

    // Wait for DOM ready then create UI
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createConsoleUI);
    } else {
        setTimeout(createConsoleUI, 1000);
    }

    setTimeout(poll, 2000);

    if (window.parent !== window) {
        setInterval(function() {
            try {
                window.parent.postMessage({type: "hype-ping"}, "*");
            } catch (e) {}
        }, 5000);
    }

    // Make functions global for onclick handlers
    window.toggleConsole = toggleConsole;
    window.runConsoleCode = runConsoleCode;
    window.clearConsoleHistory = clearConsoleHistory;
})();