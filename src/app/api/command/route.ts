import { NextRequest } from 'next/server';

// Temporary storage for commands (in a real app, use Redis or DB)
let commands: Record<string, any> = {};
let results: Record<string, any> = {};

// Cleanup function to remove old commands
function cleanupOld(maxAge = 300) {
  const now = Math.floor(Date.now() / 1000);
  
  // Remove old commands
  Object.keys(commands).forEach(id => {
    if (now - commands[id].timestamp > maxAge) {
      delete commands[id];
    }
  });
  
  // Remove old results
  Object.keys(results).forEach(id => {
    if (now - results[id].timestamp > maxAge) {
      delete results[id];
    }
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const commandId = searchParams.get('command_id');

  // Cleanup old entries
  cleanupOld();

  // Look for pending commands
  let pendingCommand = null;
  for (const id in commands) {
    if (commands[id].status === 'pending') {
      pendingCommand = { id, ...commands[id] };
      commands[id].status = 'running';
      break;
    }
  }

  if (pendingCommand) {
    return new Response(JSON.stringify({ command: pendingCommand, pending: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  // Return specific result if commandId is provided
  if (commandId && results[commandId]) {
    const result = results[commandId];
    delete results[commandId]; // Remove after retrieval
    
    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  return new Response(JSON.stringify({ command: null, pending: false }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  
  if (data.action === 'execute') {
    const code = data.code || '';
    const id = 'cmd_' + Date.now();
    
    commands[id] = {
      code,
      timestamp: Math.floor(Date.now() / 1000),
      status: 'pending'
    };
    
    return new Response(JSON.stringify({ success: true, id }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
  
  if (data.action === 'result') {
    const id = data.id || '';
    const result = data.result || '';
    const error = data.error || false;
    
    if (commands[id]) {
      results[id] = {
        result,
        error,
        timestamp: Math.floor(Date.now() / 1000)
      };
      delete commands[id];
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
  
  return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), {
    status: 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

export function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}