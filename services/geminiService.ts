
import { GoogleGenAI, Type } from "@google/genai";
import { TeamState, RaceResult, Driver } from "../types";
import { RIVAL_TEAMS, AVAILABLE_DRIVERS } from "../constants";

const TRACKS = ["Bahrein", "Arabia Saudita", "Australia", "Azerbaiyán", "Miami", "Mónaco", "España", "Canadá", "Austria", "Silverstone"];

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

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
      
      // Aplicar multiplicador de dificultad a los rivales
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
    commentary: difficultyMultiplier > 1.1 
      ? "¡La dificultad es extrema! Los equipos rivales han traído mejoras masivas y están volando en pista."
      : "La telemetría indica que el talento del piloto ha sido clave hoy.",
    events: ["Adelantamiento magistral", "Gestión de neumáticos", "Batalla por el top 10"],
    fullClassification
  };
}

const getPoints = (pos: number) => {
  const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
  return pos >= 1 && pos <= 10 ? points[pos - 1] : 0;
};

export async function simulateRace(teams: TeamState[], currentRaceIndex: number, difficultyMultiplier: number = 1.0): Promise<RaceResult> {
  const trackIndex = currentRaceIndex % TRACKS.length;
  const raceName = TRACKS[trackIndex];

  const teamsContext = teams.map(t => {
    const d1 = t.drivers.find(d => d.id === t.activeDriverIds[0]);
    const d2 = t.drivers.find(d => d.id === t.activeDriverIds[1]);
    const carAvg = (t.car.aerodynamics + t.car.powerUnit + t.car.chassis) / 3;
    
    return `Team "${t.name}": Car Lvl ${carAvg.toFixed(1)}, Drivers: ${d1?.name} (${d1?.pace}), ${d2?.name} (${d2?.pace}), Strategy: ${t.currentStrategy}.`;
  }).join("\n");

  const prompt = `
    Simulate F1 race at ${raceName}. DIFFICULTY MULTIPLIER FOR RIVALS: ${difficultyMultiplier}.
    CLASSYFY 20 DRIVERS. High difficulty means rivals perform significantly better.
    HUMAN TEAMS:
    ${teamsContext}
    Format classification as JSON: [{driverName, teamName, position}].
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

    const teamResults = teams.map(t => {
      const d1 = t.drivers.find(d => d.id === t.activeDriverIds[0]);
      const d2 = t.drivers.find(d => d.id === t.activeDriverIds[1]);
      const findPos = (name?: string) => {
        if (!name) return 18;
        const entry = data.fullClassification.find((c: any) => c.driverName === name);
        return entry?.position || 15;
      };
      const p1 = findPos(d1?.name);
      const p2 = findPos(d2?.name);
      return { teamId: t.id, driver1Position: p1, driver2Position: p2, points: getPoints(p1) + getPoints(p2) };
    });

    return {
      raceName: `${raceName} Grand Prix`,
      teamResults,
      commentary: data.commentary,
      events: data.events,
      fullClassification: data.fullClassification.map((c: any) => ({ ...c, points: getPoints(c.position) }))
    };
  } catch (error) {
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
