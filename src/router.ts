import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('./app/pages/dashboard/Dashboard.vue')
    },
    {
      path: '/income',
      name: 'income',
      component: () => import('./app/pages/income/Income.vue')
    },
    {
      path: '/expenses',
      name: 'expenses',
      component: () => import('./app/pages/expenses/Expenses.vue')
    },
    {
      path: '/expense-details',
      name: 'expense-details',
      component: () => import('./app/pages/expense-details/ExpenseDetails.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
});
