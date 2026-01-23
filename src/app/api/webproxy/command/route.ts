import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const COMMAND_FILE = path.join(process.cwd(), 'data', 'hype_commands.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'));
}

interface CommandData {
  commands: Record<string, {
    code: string;
    timestamp: number;
    status: 'pending' | 'running';
  }>;
  results: Record<string, {
    result: string;
    error: boolean;
    timestamp: number;
  }>;
}

function readCommands(): CommandData {
  if (fs.existsSync(COMMAND_FILE)) {
    try {
      const content = fs.readFileSync(COMMAND_FILE, 'utf-8');
      return JSON.parse(content);
    } catch {
      return { commands: {}, results: {} };
    }
  }
  return { commands: {}, results: {} };
}

function writeCommands(data: CommandData) {
  fs.writeFileSync(COMMAND_FILE, JSON.stringify(data, null, 2));
}

function cleanupOld(data: CommandData, maxAge = 300) {
  const now = Math.floor(Date.now() / 1000);
  if (data.commands) {
    Object.keys(data.commands).forEach(id => {
      if (now - data.commands[id].timestamp > maxAge) {
        delete data.commands[id];
      }
    });
  }
  if (data.results) {
    Object.keys(data.results).forEach(id => {
      if (now - data.results[id].timestamp > maxAge) {
        delete data.results[id];
      }
    });
  }
  return data;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const commandId = searchParams.get('command_id');

  let data = readCommands();
  data = cleanupOld(data);

  if (commandId && data.results[commandId]) {
    const result = data.results[commandId];
    delete data.results[commandId];
    writeCommands(data);
    return NextResponse.json({ result });
  }

  let pendingCommand = null;
  if (data.commands) {
    for (const id in data.commands) {
      if (data.commands[id].status === 'pending') {
        pendingCommand = { id, code: data.commands[id].code, timestamp: data.commands[id].timestamp };
        data.commands[id].status = 'running';
        writeCommands(data);
        break;
      }
    }
  }

  if (pendingCommand) {
    return NextResponse.json({ command: pendingCommand, pending: true });
  }

  writeCommands(data);
  return NextResponse.json({ command: null, pending: false });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, code, id, result, error } = body;

  let data = readCommands();
  data = cleanupOld(data);

  if (action === 'execute') {
    const newId = `cmd_${Date.now()}`;
    data.commands[newId] = {
      code,
      timestamp: Math.floor(Date.now() / 1000),
      status: 'pending'
    };
    writeCommands(data);
    return NextResponse.json({ success: true, id: newId });
  }

  if (action === 'result' && id) {
    if (data.commands[id]) {
      data.results[id] = {
        result,
        error,
        timestamp: Math.floor(Date.now() / 1000)
      };
      delete data.commands[id];
      writeCommands(data);
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false }, { status: 400 });
}
