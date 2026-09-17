import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { EditionProvider, getUpcomingEdition } from "@/editions";
import Index from "./pages/Index";
import ArchivePage from "./pages/ArchivePage";
import EditionPage from "./pages/EditionPage";
import Registration from "./pages/Registration";
import RegistrationStatusPage from "./pages/RegistrationStatusPage";
import OrganizersPage from "./pages/OrganizersPage";
import OrganizerPrintListsPage from "./pages/OrganizerPrintListsPage";
import RegistrationStatsPage from "./pages/RegistrationStatsPage";
import ResultsPage, { ResultsRedirect } from "./pages/ResultsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Analytics />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <EditionProvider edition={getUpcomingEdition()} mode="live">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/fest/:slug" element={<EditionPage />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/status/:id" element={<RegistrationStatusPage />} />
            <Route path="/organizers" element={<OrganizersPage />} />
            <Route path="/organizers/print-lists" element={<OrganizerPrintListsPage />} />
            <Route path="/stats" element={<RegistrationStatsPage />} />
            <Route path="/results" element={<ResultsRedirect />} />
            <Route path="/results/:slug" element={<ResultsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </EditionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
