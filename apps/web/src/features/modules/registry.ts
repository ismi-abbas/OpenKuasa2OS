import type { ComponentType } from 'react';

// Api (reach)
import AssistantScreen from '@/features/modules/reach/assistant';
import AgentsScreen from '@/features/modules/reach/agents';
import AdStudioScreen from '@/features/modules/reach/ad-studio';
import CreativeBankScreen from '@/features/modules/reach/creative-bank';
import ReportsScreen from '@/features/modules/reach/reports';
import ContactsScreen from '@/features/modules/reach/contacts';
import LeadFormsScreen from '@/features/modules/reach/lead-forms';
import AppointmentsScreen from '@/features/modules/reach/appointments';
import AdSettingsScreen from '@/features/modules/reach/ad-settings';

// Air (crm)
import CrmAssistantScreen from '@/features/modules/crm/assistant';
import CrmAgentsScreen from '@/features/modules/crm/agents';
import DealsScreen from '@/features/modules/crm/deals';
import BroadcastScreen from '@/features/modules/crm/broadcast';
import ChatbotScreen from '@/features/modules/crm/chatbot';
import AutomationsScreen from '@/features/modules/crm/automations';
import CrmLandingPageScreen from '@/features/modules/crm/landing-page';
import CalendarScreen from '@/features/modules/crm/calendar';
import BillingsScreen from '@/features/modules/crm/billings';
import PluginsScreen from '@/features/modules/crm/plugins';
import CrmSettingsScreen from '@/features/modules/crm/settings';

// Daun (people / HIRA)
import HrAssistantScreen from '@/features/modules/people/assistant';
import DashboardScreen from '@/features/modules/people/dashboard';
import AnnouncementsScreen from '@/features/modules/people/announcements';
import MyAttendanceScreen from '@/features/modules/people/my-attendance';
import MyGoalsScreen from '@/features/modules/people/my-goals';
import MyDocumentsScreen from '@/features/modules/people/my-documents';
import RecordsScreen from '@/features/modules/people/records';
import LeaveScreen from '@/features/modules/people/leave';
import TimeOffScreen from '@/features/modules/people/time-off';
import ClaimsScreen from '@/features/modules/people/claims';
import OtClaimsScreen from '@/features/modules/people/ot-claims';
import EmployeesScreen from '@/features/modules/people/employees';
import ApproveLeaveScreen from '@/features/modules/people/approve-leave';
import ApproveClaimsScreen from '@/features/modules/people/approve-claims';
import ApproveOvertimeScreen from '@/features/modules/people/approve-overtime';
import ApproveTimeOffScreen from '@/features/modules/people/approve-time-off';
import PublicHolidaysScreen from '@/features/modules/people/public-holidays';
import LettersScreen from '@/features/modules/people/letters';
import TimesheetScreen from '@/features/modules/people/timesheet';
import ShiftCalendarScreen from '@/features/modules/people/shift-calendar';
import OvertimeScreen from '@/features/modules/people/overtime';
import PayrollScreen from '@/features/modules/people/payroll';
import PaymentVouchersScreen from '@/features/modules/people/payment-vouchers';
import ScorecardScreen from '@/features/modules/people/scorecard';
import ReviewScoresScreen from '@/features/modules/people/review-scores';
import TrainingScreen from '@/features/modules/people/training';
import HrSettingsScreen from '@/features/modules/people/settings';

// Taufan (hire / HIRA Recruit)
import HireAssistantScreen from '@/features/modules/hire/assistant';
import RecruitDashboardScreen from '@/features/modules/hire/dashboard';
import JobsScreen from '@/features/modules/hire/jobs';
import CandidatesScreen from '@/features/modules/hire/candidates';
import ApplicationsScreen from '@/features/modules/hire/applications';
import InterviewsScreen from '@/features/modules/hire/interviews';
import TalentPoolScreen from '@/features/modules/hire/talent-pool';
import CareersPageScreen from '@/features/modules/hire/careers-page';
import HireSettingsScreen from '@/features/modules/hire/settings';

// Gempa (finance / Safa)
import FinAssistantScreen from '@/features/modules/finance/assistant';
import FinAgentsScreen from '@/features/modules/finance/agents';
import FinDashboardScreen from '@/features/modules/finance/dashboard';
import CashReceiptsScreen from '@/features/modules/finance/cash-receipts';
import FinPaymentVouchersScreen from '@/features/modules/finance/payment-vouchers';
import InvoicesScreen from '@/features/modules/finance/invoices';
import QuotationsScreen from '@/features/modules/finance/quotations';
import CreditNotesScreen from '@/features/modules/finance/credit-notes';
import PaymentsInScreen from '@/features/modules/finance/payments-in';
import RefundsScreen from '@/features/modules/finance/refunds';
import ExpensesScreen from '@/features/modules/finance/expenses';
import ReceiptsInboxScreen from '@/features/modules/finance/receipts-inbox';
import SupplierBillsScreen from '@/features/modules/finance/supplier-bills';
import PaymentsOutScreen from '@/features/modules/finance/payments-out';
import BankingScreen from '@/features/modules/finance/banking';
import EInvoiceScreen from '@/features/modules/finance/e-invoice';
import SstReportScreen from '@/features/modules/finance/sst-report';
import AuditTrailScreen from '@/features/modules/finance/audit-trail';
import CustomersSuppliersScreen from '@/features/modules/finance/customers-suppliers';
import ProductsScreen from '@/features/modules/finance/products';
import FinReportsScreen from '@/features/modules/finance/reports';
import JournalsScreen from '@/features/modules/finance/journals';
import ChartOfAccountsScreen from '@/features/modules/finance/chart-of-accounts';
import ContraEntriesScreen from '@/features/modules/finance/contra-entries';
import FxRevaluationScreen from '@/features/modules/finance/fx-revaluation';
import FinSettingsScreen from '@/features/modules/finance/settings';

/**
 * Built-out screens, keyed by `${productKey}/${itemSlug}`.
 * Anything not here falls back to a generic placeholder.
 */
export const SCREENS: Record<string, ComponentType> = {
  // Api (ARA Get)
  'reach/assistant': AssistantScreen,
  'reach/agents': AgentsScreen,
  'reach/ad-studio': AdStudioScreen,
  'reach/creative-bank': CreativeBankScreen,
  'reach/reports': ReportsScreen,
  'reach/contacts': ContactsScreen,
  'reach/lead-forms': LeadFormsScreen,
  'reach/appointments': AppointmentsScreen,
  'reach/ad-settings': AdSettingsScreen,

  // Air (ARA Manage)
  'crm/assistant': CrmAssistantScreen,
  'crm/agents': CrmAgentsScreen,
  'crm/contacts': ContactsScreen,
  'crm/deals': DealsScreen,
  'crm/lead-forms': LeadFormsScreen,
  'crm/broadcast': BroadcastScreen,
  'crm/chatbot': ChatbotScreen,
  'crm/automations': AutomationsScreen,
  'crm/landing-page': CrmLandingPageScreen,
  'crm/appointments': AppointmentsScreen,
  'crm/calendar': CalendarScreen,
  'crm/billings': BillingsScreen,
  'crm/reports': ReportsScreen,
  'crm/plugins': PluginsScreen,
  'crm/settings': CrmSettingsScreen,

  // Daun (HIRA Team)
  'people/assistant': HrAssistantScreen,
  'people/dashboard': DashboardScreen,
  'people/calendar': CalendarScreen,
  'people/announcements': AnnouncementsScreen,
  'people/my-attendance': MyAttendanceScreen,
  'people/my-goals': MyGoalsScreen,
  'people/my-documents': MyDocumentsScreen,
  'people/records': RecordsScreen,
  'people/leave': LeaveScreen,
  'people/time-off': TimeOffScreen,
  'people/claims': ClaimsScreen,
  'people/ot-claims': OtClaimsScreen,
  'people/employees': EmployeesScreen,
  'people/approve-leave': ApproveLeaveScreen,
  'people/approve-claims': ApproveClaimsScreen,
  'people/approve-overtime': ApproveOvertimeScreen,
  'people/approve-time-off': ApproveTimeOffScreen,
  'people/public-holidays': PublicHolidaysScreen,
  'people/letters': LettersScreen,
  'people/timesheet': TimesheetScreen,
  'people/shift-calendar': ShiftCalendarScreen,
  'people/overtime': OvertimeScreen,
  'people/payroll': PayrollScreen,
  'people/payment-vouchers': PaymentVouchersScreen,
  'people/scorecard': ScorecardScreen,
  'people/review-scores': ReviewScoresScreen,
  'people/training': TrainingScreen,
  'people/settings': HrSettingsScreen,

  // Taufan (HIRA Recruit)
  'hire/assistant': HireAssistantScreen,
  'hire/dashboard': RecruitDashboardScreen,
  'hire/jobs': JobsScreen,
  'hire/candidates': CandidatesScreen,
  'hire/applications': ApplicationsScreen,
  'hire/interviews': InterviewsScreen,
  'hire/talent-pool': TalentPoolScreen,
  'hire/careers-page': CareersPageScreen,
  'hire/settings': HireSettingsScreen,

  // Gempa (Safa — Accounting & e-Invois)
  'finance/assistant': FinAssistantScreen,
  'finance/agents': FinAgentsScreen,
  'finance/dashboard': FinDashboardScreen,
  'finance/cash-receipts': CashReceiptsScreen,
  'finance/payment-vouchers': FinPaymentVouchersScreen,
  'finance/invoices': InvoicesScreen,
  'finance/quotations': QuotationsScreen,
  'finance/credit-notes': CreditNotesScreen,
  'finance/payments-in': PaymentsInScreen,
  'finance/refunds': RefundsScreen,
  'finance/expenses': ExpensesScreen,
  'finance/receipts-inbox': ReceiptsInboxScreen,
  'finance/supplier-bills': SupplierBillsScreen,
  'finance/payments-out': PaymentsOutScreen,
  'finance/banking': BankingScreen,
  'finance/e-invoice': EInvoiceScreen,
  'finance/sst-report': SstReportScreen,
  'finance/audit-trail': AuditTrailScreen,
  'finance/customers-suppliers': CustomersSuppliersScreen,
  'finance/products': ProductsScreen,
  'finance/reports': FinReportsScreen,
  'finance/journals': JournalsScreen,
  'finance/chart-of-accounts': ChartOfAccountsScreen,
  'finance/contra-entries': ContraEntriesScreen,
  'finance/fx-revaluation': FxRevaluationScreen,
  'finance/settings': FinSettingsScreen,
};
