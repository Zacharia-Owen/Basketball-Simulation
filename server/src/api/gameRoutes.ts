import { Router } from 'express';
import { simulateGameController } from './gameControllers';

const router = Router();

// route to simulate a game
router.post('/simulate', simulateGameController);

export default router;