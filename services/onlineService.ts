
import { GameState } from "../types";

const API_BASE = "https://api.keyvalue.xyz";
const APP_TOKEN = "f1_tycoon_v7"; 
const PADDOCK_KEY = "f1_global_paddock_v7"; 

export interface PaddockMember {
  id: string;
  roomCode: string;
  timestamp: number;
}

export async function syncGameState(roomCode: string, state: any): Promise<boolean> {
  try {
    const key = `${APP_TOKEN}_${roomCode}`;
    const response = await fetch(`${API_BASE}/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...state, _updated: Date.now() })
    });
    return response.ok;
  } catch (e) {
    return false;
  }
}

export async function fetchGameState(roomCode: string): Promise<any> {
  try {
    const key = `${APP_TOKEN}_${roomCode}`;
    const res = await fetch(`${API_BASE}/${key}?cb=${Date.now()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) return await res.json();
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Actualiza la presencia en el paddock y devuelve la lista de miembros activos.
 */
export async function updatePaddockPresence(id: string, roomCode: string): Promise<PaddockMember[]> {
  try {
    // 1. Obtener lista actual
    const res = await fetch(`${API_BASE}/${PADDOCK_KEY}?cb=${Date.now()}`, { method: 'GET' });
    let members: PaddockMember[] = [];
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) members = data;
    }

    // 2. Limpiar miembros antiguos (> 10 seg) y añadirnos
    const now = Date.now();
    const activeMembers = members.filter(m => (now - m.timestamp < 10000) && m.id !== id);
    activeMembers.push({ id, roomCode, timestamp: now });

    // 3. Guardar lista
    await fetch(`${API_BASE}/${PADDOCK_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activeMembers)
    });

    return activeMembers;
  } catch (e) {
    return [];
  }
}

/**
 * Elimina nuestra presencia del paddock
 */
export async function leavePaddock(id: string) {
  try {
    const res = await fetch(`${API_BASE}/${PADDOCK_KEY}?cb=${Date.now()}`, { method: 'GET' });
    if (res.ok) {
      const data: PaddockMember[] = await res.json();
      const filtered = data.filter(m => m.id !== id);
      await fetch(`${API_BASE}/${PADDOCK_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filtered)
      });
    }
  } catch (e) {}
}
