import { Routes } from '@angular/router';
import { SQUARELANTERS } from './squarelanters/squarelanters';
import { RoundPlanters } from './roundplanters/roundplanters';
import { Home } from './home/home';
import { authGuard } from './auth-guard';


export const routes: Routes = [
    {
        path: '',
        component: Home
    },
     {
    path: 'square-planters',
    component: SQUARELANTERS,
    canActivate: [authGuard]
  },
  {
    path: 'round-planters',
    component: RoundPlanters,
    canActivate: [authGuard]
  },

  { path: '**', redirectTo: '' }

];
