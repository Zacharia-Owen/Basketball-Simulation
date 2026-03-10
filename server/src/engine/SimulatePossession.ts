import { GameState } from "../domain/GameState";
import { SeededRNG } from "./rng/SeedRNG";
import { chooseAction } from "./actions/ChooseActions";
import { resolvePossession } from "./resolution/ResolvePossession";
import { STAMINA } from "../config/constants";

export function simulatePossession(
    state: GameState,
    rng: SeededRNG
): GameState {

    // determining who has the ball
    const offense = state.possession;
    const defense = offense === "home" ? "away" : "home";

    // deciding which action the offense takes
    const action = chooseAction(state, offense, rng);

    // resolving the action and getting the result
    const result = resolvePossession(state, action, offense, defense, rng);

    // updating the game state based on the result
    const updatedScore = { 
        ...state.score,
        [offense]: state.score[offense] + result.pointsScored,
    };

    // updating the time remaining
    const updateClock = Math.max(0, state.clock - result.timeElapsed);

    // update box score
    const updatedBoxScore = { ...state.boxScore };

    // find the active player with the highest shooting rating as scorer
    const activePlayers = state[offense].players.filter(p =>
        state[offense].activePlayers.includes(p.id.toString())
    );
    const scorer = activePlayers.reduce((best, p) => 
        p.ratings.shooting > best.ratings.shooting ? p : best, activePlayers[0]
    ); 
    const scorerID = scorer.id.toString();

    if (result.pointsScored > 0) {
        updatedBoxScore[scorerID] = {
            ...updatedBoxScore[scorerID],
            points: updatedBoxScore[scorerID]?.points + result.pointsScored,
            fieldGoalsMade: action !== "free_throw_trip"
                ? updatedBoxScore[scorerID]?.fieldGoalsMade + 1
                : updatedBoxScore[scorerID]?.fieldGoalsMade,
            fieldGoalsAttempted: action !== "free_throw_trip"
                ? updatedBoxScore[scorerID]?.fieldGoalsAttempted + 1
                : updatedBoxScore[scorerID]?.fieldGoalsAttempted,
        };
    } else if (action !== "turnover" && action !== "free_throw_trip") {
        // missed shot still counting as an attempt
        updatedBoxScore[scorerID] = {
            ...updatedBoxScore[scorerID],
            fieldGoalsAttempted: updatedBoxScore[scorerID]?.fieldGoalsAttempted + 1,
        };
    }

    // record turn overs
    if (action === "turnover") {
        updatedBoxScore[scorerID] = {
            ...updatedBoxScore[scorerID],
            turnovers: updatedBoxScore[scorerID]?.turnovers + 1,
        };
    }

    // update stamina for active players
    const updatedHome = { ...state.home };
    const updatedAway = { ...state.away };

    [updatedHome, updatedAway].forEach(team => {
        team.players = team.players.map(p => {
            if (!team.activePlayers.includes(p.id.toString())) return p; // only updating active players

            const newStamina = Math.max(0, p.ratings.stamina - STAMINA.FATIGUE_PER_POSSESSION);
            return {
                ...p,
                ratings: { ...p.ratings, stamina: newStamina }
            };
        });
    });

    // switching possession to the other team
    const nextPossession = result.offensiveRebound ? offense : defense;

    // checking quarter transitions
    const quarterLength = 720 // 12 mins in seconds
    const updatedQuarter = state.quarter + Math.floor((state.clock - updateClock) / quarterLength);

    // return to fully updated state of the game
    return {
        ...state,
        clock: updateClock,
        quarter: Math.min(updatedQuarter, 4), // only 4 quarters
        score: updatedScore,
        possession: nextPossession,
        boxScore: updatedBoxScore,
        home: updatedHome,
        away: updatedAway
    };
}