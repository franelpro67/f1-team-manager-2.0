
import { GoogleGenAI, Type } from "@google/genai";
import { TeamState, RaceResult, Driver } from "../types";
import { RIVAL_TEAMS, AVAILABLE_DRIVERS } from "../constants";

const TRACKS = ["Bahrein", "Arabia Saudita", "Australia", "Azerbaiyán", "Miami", "Mónaco", "España", "Canadá", "Austria", "Silverstone"];

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Simulador de respaldo matemático optimizado.
 * Ahora permite que un gran piloto destaque incluso con un coche poco desarrollado.
 */
function fallbackSimulation(teams: TeamState[], raceName: string): RaceResult {
  console.warn("Utilizando simulador de respaldo optimizado.");
  
  interface Competitor {
    name: string;
    teamName: string;
    teamId: number | null;
    score: number;
  }

  const competitors: Competitor[] = [];

  // 1. Añadir pilotos del jugador(es) con nueva fórmula de balanceo
  teams.forEach(t => {
    t.activeDriverIds.forEach(id => {
      const driver = t.drivers.find(d => d.id === id);
      if (driver) {
        // Promedio de piezas (1-15)
        const carLevel = (t.car.aerodynamics + t.car.powerUnit + t.car.chassis) / 3;
        
        // FÓRMULA DE RENDIMIENTO MEJORADA:
        // - Base de coche: Un nivel 1 ahora da 60 puntos de base (en lugar de casi 0)
        // - Peso del piloto: El talento del piloto (Pace) ahora influye un 60% en el resultado final
        // - Suerte/Estrategia: Un factor aleatorio que permite sorpresas
        const carPerformance = 60 + (carLevel * 2.5); // Nivel 1 = 62.5, Nivel 10 = 85
        const driverPerformance = driver.pace; // Ej: Vettel = 92
        
        const strategyBonus = t.currentStrategy === '2-STOP' ? 3 : 0;
        const randomness = Math.random() * 12;
        
        const score = (driverPerformance * 0.6) + (carPerformance * 0.4) + strategyBonus + randomness;
        competitors.push({ name: driver.name, teamName: t.name, teamId: t.id, score });
      }
    });
  });

  // 2. Añadir rivales con variabilidad (No todos son Red Bull)
  RIVAL_TEAMS.forEach((rt, index) => {
    rt.drivers.forEach(dn => {
      const refDriver = AVAILABLE_DRIVERS.find(ad => ad.name === dn);
      const pace = refDriver?.pace || (82 + Math.random() * 10);
      
      // Los equipos rivales tienen diferentes potencias de coche para crear una parrilla realista
      // Equipos top (Red Bull, Ferrari) vs Equipos fondo (Haas, Williams)
      let rivalCarPower = 78; // Base media
      if (rt.name.includes("Red Bull") || rt.name.includes("Ferrari")) rivalCarPower = 88;
      if (rt.name.includes("Haas") || rt.name.includes("Williams")) rivalCarPower = 68;
      
      const score = (pace * 0.55) + (rivalCarPower * 0.45) + (Math.random() * 10);
      competitors.push({ name: dn, teamName: rt.name, teamId: null, score });
    });
  });

  // 3. Ordenar y clasificar
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
    commentary: "La telemetría indica que el talento del piloto ha sido clave hoy para mantener el ritmo frente a escuderías más veteranas.",
    events: ["Adelantamiento magistral en el sector 2", "Gestión de neumáticos impecable", "Batalla rueda a rueda por el top 10"],
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
    const carAvg = (t.car.aerodynamics + t.car.powerUnit + t.car.chassis) / 3;
    
    return `
      Team "${t.name}": Car Level ${carAvg.toFixed(1)}/15 (1 is beginner, 10 is elite).
      Driver 1: ${d1?.name} (Pace: ${d1?.pace}), Driver 2: ${d2?.name} (Pace: ${d2?.pace}).
      Strategy: ${t.currentStrategy}. 
      NOTE: If a driver has high pace (90+), they should be able to fight for Top 10 even if the car is Level 1-2.
    `;
  }).join("\n");

  const prompt = `
    Simulate a realistic F1 race at ${raceName}.
    CLASSYFY 20 DRIVERS. Use logic where world-class drivers can overperform in mediocre cars.
    
    HUMAN TEAMS:
    ${teamsContext}
    
    RIVALS: Red Bull, Ferrari, Mercedes, McLaren, Aston Martin, Alpine, Williams, RB, Haas.
    
    Format classification: [{driverName, teamName, position}].
    Include commentary about how the drivers' skill influenced the result.
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
    
    if (!data.fullClassification || data.fullClassification.length < 10) throw new Error("IA Incomplete");

    const teamResults = teams.map(t => {
      const d1 = t.drivers.find(d => d.id === t.activeDriverIds[0]);
      const d2 = t.drivers.find(d => d.id === t.activeDriverIds[1]);
      
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
    return fallbackSimulation(teams, raceName);
  }
}

export async function getEngineerAdvice(team: TeamState): Promise<string> {
  try {
    const ai = getAI();
    const prompt = `Short technical advice for F1 team ${team.name} with car levels Aero:${team.car.aerodynamics}, Engine:${team.car.powerUnit}.`;
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
    return response.text || "Centrarse en la aerodinámica para las próximas curvas rápidas.";
  } catch (e) {
    return "Optimizar la entrega de potencia en bajas revoluciones.";
  }
}
