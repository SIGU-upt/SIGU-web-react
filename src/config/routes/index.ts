import { LoginPage } from "../../pages/auth/login-page";
import { DashboardPage } from "../../pages/dashboard";
import { ProfessorsPage } from "../../pages/professors";
import { StudentsPage } from "../../pages/students";
import { CurriculumUnitsPage } from "../../pages/curriculum-units";

const title: string = 'SIGU';

export interface RouteConfig {
  path: string;
  title: string;
  breadTitle: string;
  component: React.ComponentType<any>;
  isPublic?: boolean;
}

const routesPages: RouteConfig[] = [
  {
    path: '/login',
    title: title,
    breadTitle: 'Iniciar Sesión',
    component: LoginPage,
    isPublic: true,
  },
  {
    path: '/',
    title: title,
    breadTitle: 'Panel de Control',
    component: DashboardPage,
  },
  {
    path: '/dashboard',
    title: title,
    breadTitle: 'Panel de Control',
    component: DashboardPage,
  },
  {
    path: '/docentes',
    title: title,
    breadTitle: 'Gestión de Docentes',
    component: ProfessorsPage,
  },
  {
    path: '/estudiantes',
    title: title,
    breadTitle: 'Gestión de Estudiantes',
    component: StudentsPage,
  },
  {
    path: '/unidades',
    title: title,
    breadTitle: 'Gestión de U.Cs',
    component: CurriculumUnitsPage,
  },
];

export default routesPages;
