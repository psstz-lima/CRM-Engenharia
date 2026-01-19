import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/ui/Card';

const Loading = () => (
    <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
        <Card className="max-w-md w-full text-center">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 50 50" aria-hidden="true">
                    <circle
                        cx="25"
                        cy="25"
                        r="20"
                        fill="none"
                        stroke="rgba(59,130,246,0.9)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray="31.4 31.4"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 25 25"
                            to="360 25 25"
                            dur="1s"
                            repeatCount="indefinite"
                        />
                    </circle>
                </svg>
                <div>Carregando...</div>
            </div>
        </Card>
    </div>
);

const MeasurementContracts = lazy(() => import('../pages/MeasurementContracts').then(m => ({ default: m.MeasurementContracts })));
const Measurements = lazy(() => import('../pages/Measurements').then(m => ({ default: m.Measurements })));
const MeasurementDetails = lazy(() => import('../pages/MeasurementDetails').then(m => ({ default: m.MeasurementDetails })));
const Login = lazy(() => import('../pages/Login').then(m => ({ default: m.Login })));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const TermsOfUse = lazy(() => import('../pages/TermsOfUse').then(m => ({ default: m.TermsOfUse })));
const Dashboard = lazy(() => import('../pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Profile = lazy(() => import('../pages/Profile').then(m => ({ default: m.Profile })));
const Notifications = lazy(() => import('../pages/Notifications').then(m => ({ default: m.Notifications })));
const Users = lazy(() => import('../pages/Users').then(m => ({ default: m.Users })));
const Companies = lazy(() => import('../pages/Companies').then(m => ({ default: m.Companies })));
const Roles = lazy(() => import('../pages/Roles').then(m => ({ default: m.Roles })));
const ApprovalLevels = lazy(() => import('../pages/ApprovalLevels').then(m => ({ default: m.ApprovalLevels })));
const MeasurementUnits = lazy(() => import('../pages/MeasurementUnits').then(m => ({ default: m.MeasurementUnits })));
const AuditLogs = lazy(() => import('../pages/AuditLogs').then(m => ({ default: m.AuditLogs })));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Contracts = lazy(() => import('../pages/Contracts').then(m => ({ default: m.Contracts })));
const ContractDetails = lazy(() => import('../pages/ContractDetails').then(m => ({ default: m.ContractDetails })));
const Import = lazy(() => import('../pages/Import').then(m => ({ default: m.Import })));
const Documents = lazy(() => import('../pages/Documents'));
const DocumentDetails = lazy(() => import('../pages/DocumentDetails'));
const GRDList = lazy(() => import('../pages/GRDList'));
const GRDDetails = lazy(() => import('../pages/GRDDetails'));
const Projects = lazy(() => import('../pages/Projects'));
const CriticalAnalysis = lazy(() => import('../pages/CriticalAnalysis'));
const DocumentSLADashboard = lazy(() => import('../pages/DocumentSLADashboard'));

export function AppRoutes() {
    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/terms" element={
                    <ProtectedRoute>
                        <TermsOfUse />
                    </ProtectedRoute>
                } />
                <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<Users />} />
                    <Route path="/admin/companies" element={<Companies />} />
                    <Route path="/admin/roles" element={<Roles />} />
                    <Route path="/admin/approval-levels" element={<ApprovalLevels />} />
                    <Route path="/admin/units" element={<MeasurementUnits />} />
                    <Route path="/admin/audit-logs" element={<AuditLogs />} />
                    <Route path="/contracts" element={<Contracts />} />
                    <Route path="/contracts/:id" element={<ContractDetails />} />
                    <Route path="/measurements" element={<MeasurementContracts />} />
                    <Route path="/contracts/:id/measurements" element={<Measurements />} />
                    <Route path="/measurements/:id" element={<MeasurementDetails />} />

                    {/* Projetos */}
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/sla" element={<DocumentSLADashboard />} />
                    <Route path="/analysis" element={<CriticalAnalysis />} />

                    {/* Documentos */}
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/contracts/:contractId/documents" element={<Documents />} />
                    <Route path="/documents/:id" element={<DocumentDetails />} />

                    {/* GRD */}
                    <Route path="/grd" element={<GRDList />} />
                    <Route path="/grd/:id" element={<GRDDetails />} />

                    <Route path="/companies" element={<Companies />} />
                    <Route path="/import" element={<Import />} />
                </Route>
            </Routes>
        </Suspense>
    );
}
