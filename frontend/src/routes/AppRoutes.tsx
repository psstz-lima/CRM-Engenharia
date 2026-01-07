import { Routes, Route } from 'react-router-dom';
import { MeasurementContracts } from '../pages/MeasurementContracts';
import { Measurements } from '../pages/Measurements';
import { MeasurementDetails } from '../pages/MeasurementDetails';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '../components/layout/MainLayout';
import { Login } from '../pages/Login';
import { ForgotPassword } from '../pages/ForgotPassword';
import { TermsOfUse } from '../pages/TermsOfUse';
import { Dashboard } from '../pages/Dashboard';
import { Profile } from '../pages/Profile';
import { Notifications } from '../pages/Notifications';
import { Users } from '../pages/Users';
import { Companies } from '../pages/Companies';
import { Roles } from '../pages/Roles';
import { ApprovalLevels } from '../pages/ApprovalLevels';
import { MeasurementUnits } from '../pages/MeasurementUnits';
import { AuditLogs } from '../pages/AuditLogs';
import { AdminDashboard } from '../pages/AdminDashboard';
import { Contracts } from '../pages/Contracts';
import { ContractDetails } from '../pages/ContractDetails';
import { Import } from '../pages/Import';

export function AppRoutes() {
    return (
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
                <Route path="/admin" element={<ProtectedRoute masterOnly><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute masterOnly><Users /></ProtectedRoute>} />
                <Route path="/admin/companies" element={<ProtectedRoute masterOnly><Companies /></ProtectedRoute>} />
                <Route path="/admin/roles" element={<ProtectedRoute masterOnly><Roles /></ProtectedRoute>} />
                <Route path="/admin/approval-levels" element={<ProtectedRoute masterOnly><ApprovalLevels /></ProtectedRoute>} />
                <Route path="/admin/units" element={<ProtectedRoute masterOnly><MeasurementUnits /></ProtectedRoute>} />
                <Route path="/admin/audit-logs" element={<ProtectedRoute masterOnly><AuditLogs /></ProtectedRoute>} />
                <Route path="/contracts" element={<Contracts />} />
                <Route path="/contracts/:id" element={<ContractDetails />} />
                <Route path="/measurements" element={<MeasurementContracts />} />
                <Route path="/contracts/:id/measurements" element={<Measurements />} />
                <Route path="/measurements/:id" element={<MeasurementDetails />} />

                <Route path="/companies" element={<Companies />} />
                <Route path="/import" element={<Import />} />
            </Route>
        </Routes>
    );
}
