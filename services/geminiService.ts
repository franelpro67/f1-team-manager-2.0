
import { GoogleGenAI, Type } from "@google/genai";
import { TeamState, RaceResult } from "../types";
import { RIVAL_TEAMS } from "../constants";

const TRACKS = ["Bahrain", "Saudi", "Australia", "Baku", "Miami", "Monaco", "Spain", "Canada", "Austria", "Silverstone"];

// Función para obtener la instancia de AI de forma segura
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function simulateRace(teams: TeamState[], currentRaceIndex: number): Promise<RaceResult> {
  const ai = getAI();
  const trackIndex = currentRaceIndex % TRACKS.length;
  const raceName = TRACKS[trackIndex];

  // Recopilar info de todos los equipos humanos incluyendo su estrategia
  const teamsContext = teams.map(t => {
    const d1 = t.drivers.find(d => d.id === t.activeDriverIds[0]);
    const d2 = t.drivers.find(d => d.id === t.activeDriverIds[1]);
    const avgRating = t.engineers.length > 0 ? t.engineers.reduce((s,e) => s + e.rating, 0) / t.engineers.length : 0;
    const strategyDesc = t.currentStrategy === '1-STOP' 
      ? "Conserving tires, 1 pit stop, consistent but slower pace." 
      : "Aggressive attack, 2 pit stops, maximum pace but higher tire wear.";
    
    return `
      Team "${t.name}": Aero Lvl ${t.car.aerodynamics}, Power Lvl ${t.car.powerUnit}, Chassis Lvl ${t.car.chassis}.
      Drivers: ${d1?.name || 'Unknown'} (Pace: ${d1?.pace}), ${d2?.name || 'Unknown'} (Pace: ${d2?.pace}).
      Staff: ${t.engineers.length} engineers, Tech Rating: ${avgRating.toFixed(0)}.
      Race Strategy: ${strategyDesc}
    `;
  }).join("\n");

  const rivalsStr = RIVAL_TEAMS.map(r => `${r.name} (${r.drivers.join(", ")})`).join("; ");

  const prompt = `
    Simulate an F1 race at ${raceName}.
    Take into account the human teams' strategies (1-stop vs 2-stop). 
    A 1-stop strategy is safer but slower per lap. A 2-stop is aggressive and faster but risks traffic after pits.
    
    Human Teams Context:
    ${teamsContext}
    
    Rival Teams & Drivers: ${rivalsStr}.

    Generate a full classification of all 20 drivers.
    Positions must be 1 to 20 without duplicates.
    Generate a 3-paragraph professional commentary, mentioning how the strategies played out for the human teams.
    List 3 key events (overtakes, pit stop blunders, or strategic masterclasses).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
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
            events: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["fullClassification", "commentary", "events"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    const getPoints = (pos: number) => {
      const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
      return pos >= 1 && pos <= 10 ? points[pos - 1] : 0;
    };

    const teamResults = teams.map(t => {
      const d1 = t.drivers.find(d => d.id === t.activeDriverIds[0]);
      const d2 = t.drivers.find(d => d.id === t.activeDriverIds[1]);
      const resD1 = data.fullClassification.find((c: any) => c.driverName === d1?.name);
      const resD2 = data.fullClassification.find((c: any) => c.driverName === d2?.name);
      const p1 = resD1?.position || 15;
      const p2 = resD2?.position || 18;
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
    console.error("Race simulation failed", error);
    return {
      raceName: `${raceName} Grand Prix`,
      teamResults: teams.map(t => ({ teamId: t.id, driver1Position: 15, driver2Position: 18, points: 0 })),
      commentary: "Simulation error.",
      events: ["Technical glitch"],
      fullClassification: []
    };
  }
}

export async function getEngineerAdvice(team: TeamState): Promise<string> {
  const ai = getAI();
  const prompt = `Advice for F1 team "${team.name}". Funds: $${(team.funds/1000000).toFixed(1)}M. Lvl Aero:${team.car.aerodynamics}. Concise advice.`;
  const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
  return response.text || "Push development.";
}
