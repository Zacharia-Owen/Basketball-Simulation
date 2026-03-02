import { request, response } from 'express';
import { runGameSimulation } from "../simulation/runGameSim";
import { getGameById, getTeamWithPlayers, saveGameResult } from "../db/game.repository";

export async function simulateGameController(req: Request, res: response) {
    try {
        const { gameId } = req.body;

        // validating request
        if (!gameId) {
            res.status(400).json({ error: 'gameId is required' });
            return;
        }

        // fetching game from database
        const game = await getGameById(gameId);
        if (!game) {
            res.status(404).json({ error: 'Game not found' });
            return;
        }
        // fetching both teams and player rosters
        const homeTeam = await getTeamWithPlayers(game.homeTeamId);
        const awayTeam = await getTeamWithPlayers(game.awayTeamId);

        if (!homeTeam || !awayTeam) {
            res.status(404).json({ error: 'One or both teams not found' });
            return;
        }

        // running the game simulation
        const simulationResult = runGameSimulation(homeTeam, awayTeam);

        // saving the result to the database
        await saveGameResult(gameId, simulationResult);

        // returning the result to the client
        res.json({
            gameId,
            finalscore: simulationResult.score,
            boxscore: simulationResult.boxscore,
            quaters: simulationResult.quarters,
        });
        
    } catch (error) {
        console.error('Simulation error:', error);
        res.status(500).json({ error: 'Simulation failed' });
    }
}