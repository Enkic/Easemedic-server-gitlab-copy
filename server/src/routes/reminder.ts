import { Router } from 'express';

import { getUserFromToken, getSecondaryUserIfExist } from '../middlewares';

import {
    uploadReminder,
    deleteReminder,
    getReminders
} from '../controllers/reminder';

const router = Router();

router.post(
    '/reminder/:id?',
    getUserFromToken,
    getSecondaryUserIfExist,
    uploadReminder
);

router.delete('/reminder/:id', getUserFromToken, deleteReminder);

router.get(
    '/reminder/:id?',
    getUserFromToken,
    getSecondaryUserIfExist,
    getReminders
);

export default router;
