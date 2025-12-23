
import { GoogleGenAI, Type } from "@google/genai";
import { TeamState, RaceResult, Driver } from "../types";
import { RIVAL_TEAMS, AVAILABLE_DRIVERS } from "../constants";

const TRACKS = ["Bahrein", "Arabia Saudita", "Australia", "Azerbaiyán", "Miami", "Mónaco", "España", "Canadá", "Austria", "Silverstone"];

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Simulador de respaldo matemático en caso de que la IA falle.
 * Calcula posiciones realistas basadas en el rendimiento real del equipo.
 */
function fallbackSimulation(teams: TeamState[], raceName: string): RaceResult {
  console.warn("Utilizando simulador de respaldo matemático.");
  
  interface Competitor {
    name: string;
    teamName: string;
    teamId: number | null;
    score: number;
  }

  const competitors: Competitor[] = [];

  // 1. Añadir pilotos humanos
  teams.forEach(t => {
    t.activeDriverIds.forEach(id => {
      const driver = t.drivers.find(d => d.id === id);
      if (driver) {
        const carPower = (t.car.aerodynamics + t.car.powerUnit + t.car.chassis) / 3;
        const strategyBonus = t.currentStrategy === '2-STOP' ? 2 : 0;
        const luck = Math.random() * 15;
        const score = (driver.pace * 0.45) + (carPower * 10 * 0.35) + (driver.experience * 0.1) + strategyBonus + luck;
        competitors.push({ name: driver.name, teamName: t.name, teamId: t.id, score });
      }
    });
  });

  // 2. Añadir rivales de la parrilla
  RIVAL_TEAMS.forEach(rt => {
    rt.drivers.forEach(dn => {
      // Intentar buscar stats reales del piloto si existe en AVAILABLE_DRIVERS, si no, inventar
      const refDriver = AVAILABLE_DRIVERS.find(ad => ad.name === dn);
      const pace = refDriver?.pace || (80 + Math.random() * 15);
      const carPower = 8.5; // Los rivales tienen coches competitivos por defecto
      const score = (pace * 0.45) + (carPower * 10 * 0.35) + (Math.random() * 15);
      competitors.push({ name: dn, teamName: rt.name, teamId: null, score });
    });
  });

  // 3. Ordenar por puntuación y asignar posiciones
  const sorted = competitors.sort((a, b) => b.score - a.score);
  const fullClassification = sorted.map((c, i) => ({
    driverName: c.name,
    teamName: c.teamName,
    position: i + 1,
    points: getPoints(i + 1)
  }));

  const teamResults = teams.map(t => {
    const resDrivers = fullClassification.filter(c => 
      t.activeDriverIds.some(id => t.drivers.find(d => d.id === id)?.name === c.driverName)
    );
    return {
      teamId: t.id,
      driver1Position: resDrivers[0]?.position || 15,
      driver2Position: resDrivers[1]?.position || 18,
      points: (resDrivers[0]?.points || 0) + (resDrivers[1]?.points || 0)
    };
  });

  return {
    raceName: `${raceName} Grand Prix`,
    teamResults,
    commentary: "Simulación técnica completada por el departamento de telemetría. La carrera ha sido extremadamente disputada en todos los sectores.",
    events: ["Duelo intenso en la primera curva", "Gestión crítica de neumáticos", "Estrategia de paradas decisiva"],
    fullClassification
  };
}

const getPoints = (pos: number) => {
  const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
  return pos >= 1 && pos <= 10 ? points[pos - 1] : 0;
};

export async function simulateRace(teams: TeamState[], currentRaceIndex: number): Promise<RaceResult> {
  const trackIndex = currentRaceIndex % TRACKS.length;
  const raceName = TRACKS[trackIndex];

  const teamsContext = teams.map(t => {
    const d1 = t.drivers.find(d => d.id === t.activeDriverIds[0]);
    const d2 = t.drivers.find(d => d.id === t.activeDriverIds[1]);
    const avgStaffRating = t.engineers.length > 0 ? t.engineers.reduce((s,e) => s + e.rating, 0) / t.engineers.length : 0;
    
    return `
      Team "${t.name}": Aero Lvl ${t.car.aerodynamics}, Power Lvl ${t.car.powerUnit}, Chassis Lvl ${t.car.chassis}.
      Drivers: ${d1?.name || 'Unknown'} (Pace: ${d1?.pace}), ${d2?.name || 'Unknown'} (Pace: ${d2?.pace}).
      Staff Rating: ${avgStaffRating.toFixed(0)}. Strategy: ${t.currentStrategy || '1-STOP'}.
    `;
  }).join("\n");

  const rivalsStr = RIVAL_TEAMS.map(r => `${r.name} (${r.drivers.join(", ")})`).join("; ");

  const prompt = `
    Simulate F1 race at ${raceName}. 
    Classify 20 drivers. Human teams:
    ${teamsContext}
    Rivales: ${rivalsStr}.
    Return JSON: { fullClassification: [{driverName, teamName, position}], commentary, events }.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullClassification: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  driverName: { type: Type.STRING },
                  teamName: { type: Type.STRING },
                  position: { type: Type.INTEGER }
                },
                required: ["driverName", "teamName", "position"]
              }
            },
            commentary: { type: Type.STRING },
            events: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["fullClassification", "commentary", "events"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    // Validar datos mínimos
    if (!data.fullClassification || data.fullClassification.length < 5) {
      throw new Error("Respuesta de IA incompleta");
    }

    const teamResults = teams.map(t => {
      const d1 = t.drivers.find(d => d.id === t.activeDriverIds[0]);
      const d2 = t.drivers.find(d => d.id === t.activeDriverIds[1]);
      
      // Emparejamiento flexible de nombres (ignorando mayúsculas/minúsculas y espacios)
      const findPos = (name: string | undefined) => {
        if (!name) return 18;
        const entry = data.fullClassification.find((c: any) => 
          c.driverName.toLowerCase().trim() === name.toLowerCase().trim()
        );
        return entry?.position || 15;
      };

      const p1 = findPos(d1?.name);
      const p2 = findPos(d2?.name);

      return {
        teamId: t.id,
        driver1Position: p1,
        driver2Position: p2,
        points: getPoints(p1) + getPoints(p2)
      };
    });

    return {
      raceName: `${raceName} Grand Prix`,
      teamResults,
      commentary: data.commentary,
      events: data.events,
      fullClassification: data.fullClassification.map((c: any) => ({ ...c, points: getPoints(c.position) }))
    };
  } catch (error) {
    console.error("AI Simulation failed, falling back to math engine.", error);
    return fallbackSimulation(teams, raceName);
  }
}

export async function getEngineerAdvice(team: TeamState): Promise<string> {
  try {
    const ai = getAI();
    const prompt = `Advice for F1 team "${team.name}". Funds: $${(team.funds/1000000).toFixed(1)}M. Aero:${team.car.aerodynamics}. Short and technical.`;
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
    return response.text || "Maximizar el desarrollo del túnel de viento.";
  } catch (e) {
    return "Centrarse en la fiabilidad para evitar abandonos.";
  }
}
