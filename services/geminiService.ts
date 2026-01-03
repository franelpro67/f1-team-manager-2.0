
import { GoogleGenAI, Type } from "@google/genai";
import { TeamState, RaceResult, Driver } from "../types";
import { RIVAL_TEAMS, AVAILABLE_DRIVERS } from "../constants";

const TRACKS = ["Bahrein", "Arabia Saudita", "Australia", "Azerbaiyán", "Miami", "Mónaco", "España", "Canadá", "Austria", "Silverstone"];

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const getPoints = (pos: number) => {
  const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
  return pos >= 1 && pos <= 10 ? points[pos - 1] : 0;
};

/**
 * Busca una posición en los resultados de la IA de forma robusta
 */
function findDriverPosition(classification: any[], targetName: string): number {
  const normalizedTarget = targetName.toLowerCase().trim();
  
  // 1. Intento: Coincidencia exacta
  let match = classification.find(c => c.driverName.toLowerCase().trim() === normalizedTarget);
  
  // 2. Intento: El nombre del objetivo contiene el nombre de la IA (ej: "Lewis Hamilton" contiene "Hamilton")
  if (!match) {
    match = classification.find(c => {
      const name = c.driverName.toLowerCase().trim();
      return normalizedTarget.includes(name) || name.includes(normalizedTarget);
    });
  }

  return match ? parseInt(match.position) : 15;
}

function fallbackSimulation(teams: TeamState[], raceName: string, difficultyMultiplier: number = 1.0): RaceResult {
  console.warn("Utilizando simulador de respaldo con dificultad:", difficultyMultiplier);
  
  interface Competitor {
    name: string;
    teamName: string;
    teamId: number | null;
    score: number;
  }

  const competitors: Competitor[] = [];

  teams.forEach(t => {
    t.activeDriverIds.forEach(id => {
      const driver = t.drivers.find(d => d.id === id);
      if (driver) {
        const carLevel = (t.car.aerodynamics + t.car.powerUnit + t.car.chassis) / 3;
        const carPerformance = 60 + (carLevel * 2.5);
        const driverPerformance = driver.pace;
        const strategyBonus = t.currentStrategy === '2-STOP' ? 3 : 0;
        const randomness = Math.random() * 12;
        
        const score = (driverPerformance * 0.6) + (carPerformance * 0.4) + strategyBonus + randomness;
        competitors.push({ name: driver.name, teamName: t.name, teamId: t.id, score });
      }
    });
  });

  RIVAL_TEAMS.forEach((rt) => {
    rt.drivers.forEach(dn => {
      const refDriver = AVAILABLE_DRIVERS.find(ad => ad.name === dn);
      const pace = refDriver?.pace || (82 + Math.random() * 10);
      
      let rivalCarPower = 78;
      if (rt.name.includes("Red Bull") || rt.name.includes("Ferrari")) rivalCarPower = 88;
      if (rt.name.includes("Haas") || rt.name.includes("Williams")) rivalCarPower = 68;
      
      const score = ((pace * 0.55) + (rivalCarPower * 0.45)) * difficultyMultiplier + (Math.random() * 10);
      competitors.push({ name: dn, teamName: rt.name, teamId: null, score });
    });
  });

  const sorted = competitors.sort((a, b) => b.score - a.score);
  const fullClassification = sorted.map((c, i) => ({
    driverName: c.name,
    teamName: c.teamName,
    position: i + 1,
    points: getPoints(i + 1)
  }));

  const teamResults = teams.map(t => {
    const d1 = t.drivers.find(d => d.id === t.activeDriverIds[0]);
    const d2 = t.drivers.find(d => d.id === t.activeDriverIds[1]);
    
    const p1 = findDriverPosition(fullClassification, d1?.name || "");
    const p2 = findDriverPosition(fullClassification, d2?.name || "");

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
    commentary: "La telemetría indica que el talento del piloto ha sido clave hoy.",
    events: ["Adelantamiento magistral", "Gestión de neumáticos", "Batalla por el top 10"],
    fullClassification
  };
}

export async function simulateRace(teams: TeamState[], currentRaceIndex: number, difficultyMultiplier: number = 1.0): Promise<RaceResult> {
  const trackIndex = currentRaceIndex % TRACKS.length;
  const raceName = TRACKS[trackIndex];

  // Recopilamos todos los nombres de los pilotos para que la IA los use EXACTAMENTE igual
  const allDriversInGrid = [
    ...teams.flatMap(t => t.activeDriverIds.map(id => t.drivers.find(d => d.id === id)?.name).filter(Boolean)),
    ...RIVAL_TEAMS.flatMap(rt => rt.drivers)
  ];

  const teamsContext = teams.map(t => {
    const d1 = t.drivers.find(d => d.id === t.activeDriverIds[0]);
    const d2 = t.drivers.find(d => d.id === t.activeDriverIds[1]);
    const carAvg = (t.car.aerodynamics + t.car.powerUnit + t.car.chassis) / 3;
    
    return `Team "${t.name}": Car Lvl ${carAvg.toFixed(1)}, Drivers: ${d1?.name} (${d1?.pace}), ${d2?.name} (${d2?.pace}), Strategy: ${t.currentStrategy}.`;
  }).join("\n");

  const prompt = `
    Simulate F1 race at ${raceName}. DIFFICULTY MULTIPLIER FOR RIVALS: ${difficultyMultiplier}.
    YOU MUST CLASSIFY EXACTLY THESE 20 DRIVERS (no more, no less):
    ${allDriversInGrid.join(", ")}

    RULES:
    1. Higher driver pace and car level means better position.
    2. Strategy "2-STOP" is faster but riskier.
    3. Results must be unpredictable but logical.
    
    HUMAN TEAMS DATA:
    ${teamsContext}

    Format classification as JSON: [{driverName, teamName, position}].
    Use the EXACT names provided in the list above for the driverName field.
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
    if (!data.fullClassification) throw new Error("IA Incomplete");

    // Procesamos la clasificación para añadir puntos basados en la posición
    const finalClassification = data.fullClassification.map((c: any) => ({
      ...c,
      points: getPoints(parseInt(c.position))
    }));

    const teamResults = teams.map(t => {
      const d1 = t.drivers.find(d => d.id === t.activeDriverIds[0]);
      const d2 = t.drivers.find(d => d.id === t.activeDriverIds[1]);
      
      const p1 = findDriverPosition(finalClassification, d1?.name || "");
      const p2 = findDriverPosition(finalClassification, d2?.name || "");
      
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
      fullClassification: finalClassification
    };
  } catch (error) {
    console.error("Gemini Error, falling back...", error);
    return fallbackSimulation(teams, raceName, difficultyMultiplier);
  }
}

export async function getEngineerAdvice(team: TeamState): Promise<string> {
  try {
    const ai = getAI();
    const prompt = `Short technical advice for F1 team ${team.name} with car levels Aero:${team.car.aerodynamics}, Engine:${team.car.powerUnit}.`;
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
    return response.text || "Centrarse en la aerodinámica.";
  } catch (e) {
    return "Optimizar la entrega de potencia.";
  }
}
